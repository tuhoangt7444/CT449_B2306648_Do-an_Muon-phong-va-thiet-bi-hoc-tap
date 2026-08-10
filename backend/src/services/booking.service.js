const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/db');
const collections = require('../config/collections');
const AppError = require('../utils/appError');

async function populateBookingDetails(booking) {
  if (!booking) return null;
  const db = getDatabase();

  const [student, room] = await Promise.all([
    db.collection(collections.STUDENTS).findOne(
      { _id: booking.studentId },
      { projection: { password: 0 } }
    ),
    db.collection(collections.ROOMS).findOne(
      { _id: booking.roomId }
    )
  ]);

  let enrichedEquipmentItems = [];
  if (Array.isArray(booking.equipmentItems) && booking.equipmentItems.length > 0) {
    const eqIds = booking.equipmentItems.map(item => item.equipmentId);
    const eqDocs = await db.collection(collections.EQUIPMENT).find({
      _id: { $in: eqIds }
    }).toArray();

    const eqMap = {};
    eqDocs.forEach(doc => {
      eqMap[doc._id.toString()] = doc;
    });

    enrichedEquipmentItems = booking.equipmentItems.map(item => {
      const eqDoc = eqMap[item.equipmentId.toString()];
      return {
        equipmentId: item.equipmentId,
        equipmentCode: eqDoc ? eqDoc.equipmentCode : '',
        name: eqDoc ? eqDoc.name : 'Thiết bị',
        quantity: item.quantity,
        damagedQuantity: item.damagedQuantity || 0
      };
    });
  }

  return {
    ...booking,
    student: student || null,
    room: room || null,
    equipmentItems: enrichedEquipmentItems
  };
}

async function checkEquipmentAvailability(equipmentItems, startTime, endTime, excludeBookingId = null) {
  if (!Array.isArray(equipmentItems) || equipmentItems.length === 0) return;
  const db = getDatabase();

  for (const item of equipmentItems) {
    if (!item.equipmentId || !ObjectId.isValid(item.equipmentId)) {
      throw new AppError('Mã thiết bị không hợp lệ', 400);
    }
    const eqId = new ObjectId(item.equipmentId);
    const qty = Number(item.quantity) || 0;
    if (qty <= 0) {
      throw new AppError('Số lượng thiết bị mượn phải lớn hơn 0', 400);
    }

    const eqDoc = await db.collection(collections.EQUIPMENT).findOne({ _id: eqId });
    if (!eqDoc) {
      throw new AppError('Thiết bị không tồn tại trong hệ thống', 404);
    }
    if (eqDoc.status === 'inactive') {
      throw new AppError(`Thiết bị ${eqDoc.name} đã ngưng hoạt động`, 400);
    }

    const filter = {
      status: { $in: ['approved', 'in_use'] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
      'equipmentItems.equipmentId': eqId
    };
    if (excludeBookingId) {
      filter._id = { $ne: new ObjectId(excludeBookingId) };
    }

    const overlappingBookings = await db.collection(collections.BOOKINGS).find(filter).toArray();

    let reservedInSlot = 0;
    for (const b of overlappingBookings) {
      if (Array.isArray(b.equipmentItems)) {
        for (const eqItem of b.equipmentItems) {
          if (eqItem.equipmentId.toString() === eqId.toString()) {
            reservedInSlot += (Number(eqItem.quantity) || 0);
          }
        }
      }
    }

    const totalQty = Number(eqDoc.totalQuantity) || 0;
    const damagedQty = Number(eqDoc.damagedQuantity) || 0;
    const availableInSlot = Math.max(totalQty - damagedQty - reservedInSlot, 0);

    if (qty > availableInSlot) {
      throw new AppError(`Thiết bị "${eqDoc.name}" không đủ số lượng khả dụng trong khung giờ này (Khả dụng: ${availableInSlot}, Đăng ký: ${qty})`, 409);
    }
  }
}

async function checkRoomOverlap(roomId, startTime, endTime, excludeBookingId = null) {
  const db = getDatabase();
  const filter = {
    roomId: new ObjectId(roomId),
    status: { $in: ['approved', 'in_use'] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  };

  if (excludeBookingId) {
    filter._id = { $ne: new ObjectId(excludeBookingId) };
  }

  const overlap = await db.collection(collections.BOOKINGS).findOne(filter);
  if (overlap) {
    throw new AppError('Khung giờ này phòng đã được duyệt hoặc đang sử dụng', 409);
  }
}

async function getAllBookings(queryOptions = {}, currentUser = null) {
  const db = getDatabase();
  const {
    date,
    from,
    to,
    status,
    studentId,
    roomId,
    search,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = queryOptions;

  const filter = {};

  if (currentUser && currentUser.userType === 'student') {
    filter.studentId = new ObjectId(currentUser.userId);
  } else if (studentId && ObjectId.isValid(studentId)) {
    filter.studentId = new ObjectId(studentId);
  }

  if (roomId && ObjectId.isValid(roomId)) {
    filter.roomId = new ObjectId(roomId);
  }

  if (status && ['pending', 'approved', 'rejected', 'cancelled', 'in_use', 'completed'].includes(status)) {
    filter.status = status;
  }

  if (date && typeof date === 'string') {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    if (!isNaN(dayStart.getTime())) {
      filter.startTime = { $lt: dayEnd };
      filter.endTime = { $gt: dayStart };
    }
  } else if (from || to) {
    const timeFilter = {};
    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) timeFilter.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate.getTime())) timeFilter.$lte = toDate;
    }
    if (Object.keys(timeFilter).length > 0) {
      filter.startTime = timeFilter;
    }
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { purpose: searchRegex },
      { studentNote: searchRegex },
      { staffNote: searchRegex },
      { rejectionReason: searchRegex }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const allowedSortFields = ['startTime', 'endTime', 'status', 'createdAt', 'updatedAt'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDir = sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortDir };

  const totalItems = await db.collection(collections.BOOKINGS).countDocuments(filter);
  const rawBookings = await db.collection(collections.BOOKINGS)
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .toArray();

  const populatedBookings = await Promise.all(rawBookings.map(b => populateBookingDetails(b)));
  const totalPages = Math.ceil(totalItems / limitNum) || 0;

  return {
    bookings: populatedBookings,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages
    }
  };
}

async function getBookingById(id, currentUser = null) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã phiếu mượn (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const booking = await db.collection(collections.BOOKINGS).findOne({ _id: new ObjectId(id) });

  if (!booking) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (currentUser && currentUser.userType === 'student' && booking.studentId.toString() !== currentUser.userId) {
    throw new AppError('Bạn không có quyền truy cập phiếu mượn này', 403);
  }

  return await populateBookingDetails(booking);
}

async function getRoomSchedule(roomId, dateStr) {
  if (!ObjectId.isValid(roomId)) {
    throw new AppError('Mã phòng (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const room = await db.collection(collections.ROOMS).findOne({ _id: new ObjectId(roomId) });
  if (!room) {
    throw new AppError('Không tìm thấy phòng học', 404);
  }

  let dayStart, dayEnd;
  if (dateStr) {
    dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    dayEnd = new Date(`${dateStr}T23:59:59.999Z`);
  } else {
    const today = new Date();
    dayStart = new Date(today.setHours(0, 0, 0, 0));
    dayEnd = new Date(today.setHours(23, 59, 59, 999));
  }

  const bookings = await db.collection(collections.BOOKINGS).find({
    roomId: new ObjectId(roomId),
    status: { $in: ['pending', 'approved', 'in_use', 'completed'] },
    startTime: { $lt: dayEnd },
    endTime: { $gt: dayStart }
  }).sort({ startTime: 1 }).toArray();

  const schedule = bookings.map(b => ({
    bookingId: b._id,
    startTime: b.startTime,
    endTime: b.endTime,
    purpose: b.purpose,
    status: b.status,
    numberOfPeople: b.numberOfPeople
  }));

  return {
    room: {
      _id: room._id,
      roomCode: room.roomCode,
      name: room.name,
      capacity: room.capacity,
      status: room.status
    },
    date: dateStr || new Date().toISOString().split('T')[0],
    schedule
  };
}

async function createBooking(data, currentUser) {
  if (!currentUser || currentUser.userType !== 'student') {
    throw new AppError('Chỉ sinh viên mới được quyền tạo yêu cầu mượn phòng', 403);
  }

  const db = getDatabase();
  const studentId = new ObjectId(currentUser.userId);

  const studentDoc = await db.collection(collections.STUDENTS).findOne({ _id: studentId });
  if (!studentDoc) {
    throw new AppError('Sinh viên không tồn tại', 404);
  }
  if (studentDoc.status === 'inactive') {
    throw new AppError('Tài khoản sinh viên đã bị ngưng hoạt động', 403);
  }

  if (!data.roomId || !ObjectId.isValid(data.roomId)) {
    throw new AppError('Mã phòng học không hợp lệ', 400);
  }

  const roomId = new ObjectId(data.roomId);
  const roomDoc = await db.collection(collections.ROOMS).findOne({ _id: roomId });
  if (!roomDoc) {
    throw new AppError('Phòng học không tồn tại', 404);
  }
  if (roomDoc.status !== 'available') {
    throw new AppError('Phòng học hiện đang bảo trì hoặc ngưng hoạt động', 400);
  }

  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new AppError('Thời gian bắt đầu và kết thúc không hợp lệ', 400);
  }
  if (startTime >= endTime) {
    throw new AppError('Thời gian bắt đầu phải trước thời gian kết thúc', 400);
  }

  const numPeople = Number(data.numberOfPeople);
  if (data.numberOfPeople === undefined || data.numberOfPeople === null || !Number.isInteger(numPeople) || numPeople < 1) {
    throw new AppError('Số lượng người tham gia phải là số nguyên dương', 400);
  }
  if (numPeople > roomDoc.capacity) {
    throw new AppError(`Số lượng người tham gia (${numPeople}) vượt quá sức chứa của phòng (${roomDoc.capacity})`, 400);
  }

  await checkRoomOverlap(roomId, startTime, endTime);

  const cleanEquipmentItems = [];
  if (Array.isArray(data.equipmentItems) && data.equipmentItems.length > 0) {
    for (const item of data.equipmentItems) {
      cleanEquipmentItems.push({
        equipmentId: new ObjectId(item.equipmentId),
        quantity: Number(item.quantity) || 1,
        damagedQuantity: 0
      });
    }
    await checkEquipmentAvailability(cleanEquipmentItems, startTime, endTime);
  }

  const now = new Date();
  const newBooking = {
    studentId,
    roomId,
    startTime,
    endTime,
    purpose: data.purpose.trim(),
    numberOfPeople: numPeople,
    equipmentItems: cleanEquipmentItems,
    status: 'pending',
    rejectionReason: '',
    studentNote: data.studentNote ? data.studentNote.trim() : '',
    staffNote: '',
    approvedBy: null,
    approvedAt: null,
    checkedInAt: null,
    completedAt: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now
  };

  const result = await db.collection(collections.BOOKINGS).insertOne(newBooking);
  const createdDoc = { _id: result.insertedId, ...newBooking };
  return await populateBookingDetails(createdDoc);
}

async function updateBooking(id, updateData, currentUser) {
  if (!currentUser || currentUser.userType !== 'student') {
    throw new AppError('Nhân viên không được sửa nội dung phiếu mượn bằng API này', 403);
  }

  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã phiếu mượn (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const targetId = new ObjectId(id);

  const existing = await db.collection(collections.BOOKINGS).findOne({ _id: targetId });
  if (!existing) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (existing.studentId.toString() !== currentUser.userId) {
    throw new AppError('Bạn không có quyền sửa phiếu mượn này', 403);
  }

  if (existing.status !== 'pending') {
    throw new AppError('Chỉ có thể sửa phiếu mượn ở trạng thái chờ duyệt (pending)', 409);
  }

  const mergedStartTime = updateData.startTime ? new Date(updateData.startTime) : existing.startTime;
  const mergedEndTime = updateData.endTime ? new Date(updateData.endTime) : existing.endTime;

  if (mergedStartTime >= mergedEndTime) {
    throw new AppError('Thời gian bắt đầu phải trước thời gian kết thúc', 400);
  }

  const mergedRoomId = updateData.roomId ? new ObjectId(updateData.roomId) : existing.roomId;
  const roomDoc = await db.collection(collections.ROOMS).findOne({ _id: mergedRoomId });
  if (!roomDoc) {
    throw new AppError('Phòng học không tồn tại', 404);
  }

  const mergedNumPeople = updateData.numberOfPeople !== undefined ? Number(updateData.numberOfPeople) : existing.numberOfPeople;
  if (mergedNumPeople > roomDoc.capacity) {
    throw new AppError(`Số lượng người tham gia (${mergedNumPeople}) vượt quá sức chứa của phòng (${roomDoc.capacity})`, 400);
  }

  await checkRoomOverlap(mergedRoomId, mergedStartTime, mergedEndTime, targetId);

  let mergedEquipmentItems = existing.equipmentItems;
  if (Array.isArray(updateData.equipmentItems)) {
    mergedEquipmentItems = updateData.equipmentItems.map(item => ({
      equipmentId: new ObjectId(item.equipmentId),
      quantity: Number(item.quantity) || 1,
      damagedQuantity: 0
    }));
    await checkEquipmentAvailability(mergedEquipmentItems, mergedStartTime, mergedEndTime, targetId);
  } else if (updateData.startTime || updateData.endTime) {
    await checkEquipmentAvailability(existing.equipmentItems, mergedStartTime, mergedEndTime, targetId);
  }

  const setPayload = { updatedAt: new Date() };
  if (updateData.startTime) setPayload.startTime = mergedStartTime;
  if (updateData.endTime) setPayload.endTime = mergedEndTime;
  if (updateData.roomId) setPayload.roomId = mergedRoomId;
  if (updateData.purpose) setPayload.purpose = updateData.purpose.trim();
  if (updateData.numberOfPeople !== undefined) setPayload.numberOfPeople = mergedNumPeople;
  if (Array.isArray(updateData.equipmentItems)) setPayload.equipmentItems = mergedEquipmentItems;
  if (updateData.studentNote !== undefined) setPayload.studentNote = updateData.studentNote.trim();

  await db.collection(collections.BOOKINGS).updateOne(
    { _id: targetId },
    { $set: setPayload }
  );

  const updatedDoc = await db.collection(collections.BOOKINGS).findOne({ _id: targetId });
  return await populateBookingDetails(updatedDoc);
}

async function approveBooking(id, staffNote, currentUser) {
  if (!currentUser || currentUser.userType !== 'staff') {
    throw new AppError('Chỉ nhân viên mới được quyền duyệt yêu cầu mượn phòng', 403);
  }

  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã phiếu mượn (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const targetId = new ObjectId(id);

  const existing = await db.collection(collections.BOOKINGS).findOne({ _id: targetId });
  if (!existing) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (existing.status !== 'pending') {
    throw new AppError('Chỉ có thể duyệt phiếu mượn ở trạng thái chờ duyệt (pending)', 409);
  }

  const now = new Date();
  if (existing.endTime <= now) {
    throw new AppError('Phiên mượn phòng đã hết hạn', 409);
  }

  const studentDoc = await db.collection(collections.STUDENTS).findOne({ _id: existing.studentId });
  if (!studentDoc || studentDoc.status === 'inactive') {
    throw new AppError('Tài khoản sinh viên đã bị ngưng hoạt động hoặc không tồn tại', 409);
  }

  const roomDoc = await db.collection(collections.ROOMS).findOne({ _id: existing.roomId });
  if (!roomDoc || roomDoc.status !== 'available') {
    throw new AppError('Phòng học hiện không khả dụng hoặc đang bảo trì', 409);
  }

  if (existing.numberOfPeople > roomDoc.capacity) {
    throw new AppError('Số lượng người tham gia vượt quá sức chứa của phòng', 409);
  }

  await checkRoomOverlap(existing.roomId, existing.startTime, existing.endTime, targetId);
  await checkEquipmentAvailability(existing.equipmentItems, existing.startTime, existing.endTime, targetId);

  const setPayload = {
    status: 'approved',
    approvedBy: new ObjectId(currentUser.userId),
    approvedAt: now,
    updatedAt: now
  };

  if (typeof staffNote === 'string' && staffNote.trim() !== '') {
    setPayload.staffNote = staffNote.trim();
  }

  await db.collection(collections.BOOKINGS).updateOne(
    { _id: targetId },
    { $set: setPayload }
  );

  const updatedDoc = await db.collection(collections.BOOKINGS).findOne({ _id: targetId });
  return await populateBookingDetails(updatedDoc);
}

async function rejectBooking(id, rejectionReason, staffNote, currentUser) {
  if (!currentUser || currentUser.userType !== 'staff') {
    throw new AppError('Chỉ nhân viên mới được quyền từ chối phiếu mượn', 403);
  }

  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã phiếu mượn (ID) không hợp lệ', 400);
  }

  if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim() === '') {
    throw new AppError('Lý do từ chối là bắt buộc và không được để rỗng', 400);
  }

  const db = getDatabase();
  const targetId = new ObjectId(id);

  const existing = await db.collection(collections.BOOKINGS).findOne({ _id: targetId });
  if (!existing) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (existing.status !== 'pending') {
    throw new AppError('Chỉ có thể từ chối phiếu mượn ở trạng thái chờ duyệt (pending)', 409);
  }

  const now = new Date();
  const setPayload = {
    status: 'rejected',
    rejectionReason: rejectionReason.trim(),
    updatedAt: now
  };

  if (typeof staffNote === 'string' && staffNote.trim() !== '') {
    setPayload.staffNote = staffNote.trim();
  }

  await db.collection(collections.BOOKINGS).updateOne(
    { _id: targetId },
    { $set: setPayload }
  );

  const updatedDoc = await db.collection(collections.BOOKINGS).findOne({ _id: targetId });
  return await populateBookingDetails(updatedDoc);
}

async function cancelBooking(id, studentNote, currentUser) {
  if (!currentUser || currentUser.userType !== 'student') {
    throw new AppError('Nhân viên không được hủy phiếu mượn bằng API này', 403);
  }

  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã phiếu mượn (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const targetId = new ObjectId(id);

  const existing = await db.collection(collections.BOOKINGS).findOne({ _id: targetId });
  if (!existing) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (existing.studentId.toString() !== currentUser.userId) {
    throw new AppError('Bạn không có quyền hủy phiếu mượn này', 403);
  }

  if (!['pending', 'approved'].includes(existing.status)) {
    throw new AppError('Chỉ có thể hủy phiếu mượn ở trạng thái chờ duyệt (pending) hoặc đã duyệt (approved)', 409);
  }

  const now = new Date();
  if (now >= existing.startTime) {
    throw new AppError('Không thể hủy phiếu mượn đã đến hoặc qua thời gian bắt đầu', 409);
  }

  const setPayload = {
    status: 'cancelled',
    cancelledAt: now,
    updatedAt: now
  };

  if (typeof studentNote === 'string' && studentNote.trim() !== '') {
    setPayload.studentNote = studentNote.trim();
  }

  await db.collection(collections.BOOKINGS).updateOne(
    { _id: targetId },
    { $set: setPayload }
  );

  const updatedDoc = await db.collection(collections.BOOKINGS).findOne({ _id: targetId });
  return await populateBookingDetails(updatedDoc);
}

async function checkInBooking(id, staffNote, currentUser) {
  if (!currentUser || currentUser.userType !== 'staff') {
    throw new AppError('Chỉ nhân viên mới được quyền xác nhận nhận phòng (check-in)', 403);
  }

  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã phiếu mượn (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const targetId = new ObjectId(id);

  const existing = await db.collection(collections.BOOKINGS).findOne({ _id: targetId });
  if (!existing) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (existing.status !== 'approved') {
    throw new AppError('Chỉ có thể check-in phiếu mượn ở trạng thái đã duyệt (approved)', 409);
  }

  const now = new Date();
  if (now >= existing.endTime) {
    throw new AppError('Phiên mượn phòng đã kết thúc, không thể check-in', 409);
  }

  const setPayload = {
    status: 'in_use',
    checkedInAt: now,
    updatedAt: now
  };

  if (typeof staffNote === 'string' && staffNote.trim() !== '') {
    setPayload.staffNote = staffNote.trim();
  }

  await db.collection(collections.BOOKINGS).updateOne(
    { _id: targetId },
    { $set: setPayload }
  );

  const updatedDoc = await db.collection(collections.BOOKINGS).findOne({ _id: targetId });
  return await populateBookingDetails(updatedDoc);
}

async function completeBooking(id, payload, currentUser) {
  if (!currentUser || currentUser.userType !== 'staff') {
    throw new AppError('Chỉ nhân viên mới được quyền hoàn thành phiếu mượn', 403);
  }

  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã phiếu mượn (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const targetId = new ObjectId(id);

  const existing = await db.collection(collections.BOOKINGS).findOne({ _id: targetId });
  if (!existing) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (existing.status !== 'in_use') {
    throw new AppError('Chỉ có thể hoàn thành phiếu mượn ở trạng thái đang sử dụng (in_use)', 409);
  }

  const { staffNote, equipmentItems } = payload || {};
  const updatedBookingEquipmentItems = (existing.equipmentItems || []).map(item => ({ ...item }));

  const equipmentUpdates = [];

  if (Array.isArray(equipmentItems) && equipmentItems.length > 0) {
    const seenEqIds = new Set();

    for (const reportItem of equipmentItems) {
      if (!reportItem.equipmentId || !ObjectId.isValid(reportItem.equipmentId)) {
        throw new AppError('Mã thiết bị báo hư hỏng không hợp lệ', 400);
      }
      const eqIdStr = reportItem.equipmentId.toString();
      if (seenEqIds.has(eqIdStr)) {
        throw new AppError('Danh sách thiết bị báo hư hỏng không được chứa mã trùng lặp', 400);
      }
      seenEqIds.add(eqIdStr);

      const targetBookingItem = updatedBookingEquipmentItems.find(item => item.equipmentId.toString() === eqIdStr);
      if (!targetBookingItem) {
        throw new AppError('Thiết bị báo hư hỏng không thuộc danh sách mượn của phiếu này', 400);
      }

      if (typeof reportItem.damagedQuantity !== 'number' || !Number.isInteger(reportItem.damagedQuantity) || reportItem.damagedQuantity < 0) {
        throw new AppError('Số lượng hư hỏng phải là số nguyên không âm', 400);
      }
      const damagedQty = reportItem.damagedQuantity;
      if (damagedQty > targetBookingItem.quantity) {
        throw new AppError(`Số lượng hư hỏng (${damagedQty}) không được vượt quá số lượng mượn (${targetBookingItem.quantity})`, 400);
      }

      if (damagedQty > 0) {
        const eqDoc = await db.collection(collections.EQUIPMENT).findOne({ _id: targetBookingItem.equipmentId });
        if (!eqDoc) {
          throw new AppError('Không tìm thấy thiết bị trong hệ thống', 404);
        }

        const currentTotalQty = Number(eqDoc.totalQuantity) || 0;
        const currentDamagedQty = Number(eqDoc.damagedQuantity) || 0;

        if (currentDamagedQty + damagedQty > currentTotalQty) {
          throw new AppError(`Tổng số lượng hư hỏng sau cập nhật vượt quá tổng số lượng của thiết bị "${eqDoc.name}"`, 409);
        }

        equipmentUpdates.push({
          equipmentId: targetBookingItem.equipmentId,
          addDamagedQty: damagedQty
        });
      }

      targetBookingItem.damagedQuantity = damagedQty;
    }
  }

  const now = new Date();

  for (const update of equipmentUpdates) {
    await db.collection(collections.EQUIPMENT).updateOne(
      { _id: update.equipmentId },
      {
        $inc: { damagedQuantity: update.addDamagedQty },
        $set: { updatedAt: now }
      }
    );
  }

  const setPayload = {
    status: 'completed',
    equipmentItems: updatedBookingEquipmentItems,
    completedAt: now,
    updatedAt: now
  };

  if (typeof staffNote === 'string' && staffNote.trim() !== '') {
    setPayload.staffNote = staffNote.trim();
  }

  await db.collection(collections.BOOKINGS).updateOne(
    { _id: targetId },
    { $set: setPayload }
  );

  const updatedDoc = await db.collection(collections.BOOKINGS).findOne({ _id: targetId });
  return await populateBookingDetails(updatedDoc);
}

async function deleteBooking(id, currentUser) {
  if (!currentUser || currentUser.userType !== 'student') {
    throw new AppError('Nhân viên không được xóa phiếu mượn bằng API này', 403);
  }

  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã phiếu mượn (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const targetId = new ObjectId(id);

  const existing = await db.collection(collections.BOOKINGS).findOne({ _id: targetId });
  if (!existing) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (existing.studentId.toString() !== currentUser.userId) {
    throw new AppError('Bạn không có quyền xóa phiếu mượn này', 403);
  }

  if (existing.status !== 'pending') {
    throw new AppError('Chỉ có thể xóa phiếu mượn ở trạng thái chờ duyệt (pending)', 409);
  }

  await db.collection(collections.BOOKINGS).deleteOne({ _id: targetId });
  return true;
}

module.exports = {
  getAllBookings,
  getBookingById,
  getRoomSchedule,
  createBooking,
  updateBooking,
  approveBooking,
  rejectBooking,
  cancelBooking,
  checkInBooking,
  completeBooking,
  deleteBooking
};
