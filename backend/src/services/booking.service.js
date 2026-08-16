const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/db');
const collections = require('../config/collections');
const AppError = require('../utils/appError');

async function populateBookingDetails(booking) {
  if (!booking) return null;
  const db = getDatabase();

  const [student, room, building] = await Promise.all([
    db.collection(collections.STUDENTS).findOne(
      { _id: booking.studentId },
      { projection: { studentCode: 1, fullName: 1, phone: 1, email: 1 } }
    ),
    db.collection(collections.ROOMS).findOne(
      { _id: booking.roomId }
    ),
    booking.buildingId ? db.collection(collections.BUILDINGS).findOne(
      { _id: booking.buildingId },
      { projection: { buildingCode: 1, name: 1, location: 1 } }
    ) : Promise.resolve(null)
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
    student: student || { studentCode: '', fullName: 'Không còn thông tin sinh viên', phone: '', email: '' },
    room: room || null,
    building: building || null,
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
    throw new AppError('Phòng học đã có lịch mượn hoặc đang được sử dụng trong khung giờ này', 409);
  }
}

async function getAllBookings(queryOptions = {}, currentUser = {}) {
  const db = getDatabase();
  const {
    status,
    roomId,
    buildingId,
    studentId,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = queryOptions;

  const filter = {};

  if (currentUser.userType === 'student') {
    filter.studentId = new ObjectId(currentUser.userId);
  } else if (currentUser.userType === 'staff') {
    if (currentUser.role === 'building_manager') {
      filter.buildingId = new ObjectId(currentUser.buildingId);
    } else if (buildingId && ObjectId.isValid(buildingId)) {
      filter.buildingId = new ObjectId(buildingId);
    }
  }

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (roomId && ObjectId.isValid(roomId)) {
    filter.roomId = new ObjectId(roomId);
  }

  if (studentId && ObjectId.isValid(studentId) && currentUser.userType !== 'student') {
    filter.studentId = new ObjectId(studentId);
  }

  if (startDate || endDate) {
    filter.startTime = {};
    if (startDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);
      filter.startTime.$gte = sDate;
    }
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      filter.startTime.$lte = eDate;
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const sortDir = sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortDir };

  let rawBookings = await db.collection(collections.BOOKINGS).find(filter).sort(sort).toArray();

  let enrichedList = await Promise.all(rawBookings.map(populateBookingDetails));

  if (search && typeof search === 'string' && search.trim() !== '') {
    const sRegex = new RegExp(search.trim(), 'i');
    enrichedList = enrichedList.filter(b => {
      const matchPurpose = b.purpose && sRegex.test(b.purpose);
      const matchRoomCode = b.room && b.room.roomCode && sRegex.test(b.room.roomCode);
      const matchStudentName = b.student && b.student.fullName && sRegex.test(b.student.fullName);
      const matchStudentCode = b.student && b.student.studentCode && sRegex.test(b.student.studentCode);
      return matchPurpose || matchRoomCode || matchStudentName || matchStudentCode;
    });
  }

  const totalItems = enrichedList.length;
  const totalPages = Math.ceil(totalItems / limitNum) || 0;
  const paginatedData = enrichedList.slice(skip, skip + limitNum);

  return {
    bookings: paginatedData,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages
    }
  };
}

async function getBookingById(id, currentUser = {}) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã phiếu mượn (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const booking = await db.collection(collections.BOOKINGS).findOne({ _id: new ObjectId(id) });
  if (!booking) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (currentUser.userType === 'student' && booking.studentId.toString() !== currentUser.userId.toString()) {
    throw new AppError('Bạn không có quyền xem phiếu mượn của sinh viên khác', 403);
  }

  if (currentUser.userType === 'staff' && currentUser.role === 'building_manager') {
    if (!booking.buildingId || booking.buildingId.toString() !== currentUser.buildingId.toString()) {
      throw new AppError('Truy cập bị từ chối. Phiếu mượn này thuộc tòa nhà khác.', 403);
    }
  }

  return populateBookingDetails(booking);
}

async function createBooking(data, currentUser = {}) {
  const db = getDatabase();
  const { roomId, startTime, endTime, purpose, numberOfPeople, equipmentItems = [], studentNote = '' } = data;

  if (!ObjectId.isValid(roomId)) {
    throw new AppError('Mã phòng (roomId) không hợp lệ', 400);
  }
  const rId = new ObjectId(roomId);
  const room = await db.collection(collections.ROOMS).findOne({ _id: rId });

  if (!room) {
    throw new AppError('Phòng học không tồn tại', 404);
  }

  if (room.status === 'inactive') {
    throw new AppError('Phòng học hiện đang ngưng hoạt động', 400);
  }
  if (room.status === 'maintenance') {
    throw new AppError('Phòng học hiện đang bảo trì', 400);
  }

  if (!room.buildingId) {
    throw new AppError('Phòng học chưa được gán tòa nhà', 400);
  }

  const building = await db.collection(collections.BUILDINGS).findOne({ _id: room.buildingId });
  if (!building || building.status === 'inactive') {
    throw new AppError('Tòa nhà của phòng học này đang ngưng hoạt động', 400);
  }

  const numPeople = Number(numberOfPeople);
  if (room.capacity && numPeople > room.capacity) {
    throw new AppError(`Số lượng người đăng ký (${numPeople}) vượt quá sức chứa tối đa của phòng (${room.capacity})`, 400);
  }

  const sTime = new Date(startTime);
  const eTime = new Date(endTime);
  const now = new Date();

  if (isNaN(sTime.getTime()) || isNaN(eTime.getTime())) {
    throw new AppError('Thời gian không hợp lệ', 400);
  }

  if (sTime < now) {
    throw new AppError('Thời gian bắt đầu mượn phòng không thể trong quá khứ', 400);
  }

  if (sTime >= eTime) {
    throw new AppError('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc', 400);
  }

  await checkRoomOverlap(roomId, sTime, eTime);

  const cleanEquipmentItems = [];
  if (Array.isArray(equipmentItems) && equipmentItems.length > 0) {
    for (const item of equipmentItems) {
      if (!item.equipmentId || !ObjectId.isValid(item.equipmentId)) {
        throw new AppError('Mã thiết bị không hợp lệ', 400);
      }
      const eqId = new ObjectId(item.equipmentId);
      const eqDoc = await db.collection(collections.EQUIPMENT).findOne({ _id: eqId });
      if (!eqDoc) {
        throw new AppError('Thiết bị không tồn tại', 404);
      }

      if (!eqDoc.buildingId || !eqDoc.buildingId.equals(room.buildingId)) {
        throw new AppError(`Thiết bị "${eqDoc.name}" không thuộc tòa nhà của phòng học ${room.roomCode}. Vui lòng chỉ chọn thiết bị thuộc cùng tòa nhà.`, 400);
      }

      cleanEquipmentItems.push({
        equipmentId: eqId,
        quantity: Number(item.quantity) || 1,
        damagedQuantity: 0
      });
    }

    await checkEquipmentAvailability(cleanEquipmentItems, sTime, eTime);
  }

  const newBooking = {
    studentId: new ObjectId(currentUser.userId),
    roomId: rId,
    buildingId: room.buildingId,
    startTime: sTime,
    endTime: eTime,
    purpose: purpose.trim(),
    numberOfPeople: numPeople,
    equipmentItems: cleanEquipmentItems,
    status: 'pending',
    rejectionReason: '',
    studentNote: studentNote ? studentNote.trim() : '',
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
  return populateBookingDetails({ _id: result.insertedId, ...newBooking });
}

async function updateBooking(id, updateData, currentUser = {}) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã phiếu mượn không hợp lệ', 400);
  }

  const db = getDatabase();
  const bId = new ObjectId(id);
  const booking = await db.collection(collections.BOOKINGS).findOne({ _id: bId });

  if (!booking) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (currentUser.userType === 'student' && booking.studentId.toString() !== currentUser.userId.toString()) {
    throw new AppError('Bạn chỉ có thể chỉnh sửa phiếu mượn của chính mình', 403);
  }

  if (booking.status !== 'pending') {
    throw new AppError('Chỉ có thể chỉnh sửa phiếu mượn khi ở trạng thái Chờ duyệt', 400);
  }

  const setPayload = { updatedAt: new Date() };
  if (updateData.purpose) setPayload.purpose = updateData.purpose.trim();
  if (updateData.studentNote !== undefined) setPayload.studentNote = updateData.studentNote.trim();

  await db.collection(collections.BOOKINGS).updateOne(
    { _id: bId },
    { $set: setPayload }
  );

  return populateBookingDetails({ ...booking, ...setPayload });
}

async function deleteBooking(id, currentUser = {}) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã phiếu mượn không hợp lệ', 400);
  }

  const db = getDatabase();
  const bId = new ObjectId(id);
  const booking = await db.collection(collections.BOOKINGS).findOne({ _id: bId });

  if (!booking) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (currentUser.userType === 'student') {
    if (booking.studentId.toString() !== currentUser.userId.toString()) {
      throw new AppError('Bạn chỉ có thể xóa phiếu mượn của chính mình', 403);
    }
    if (booking.status !== 'pending' && booking.status !== 'cancelled') {
      throw new AppError('Chỉ có thể xóa phiếu mượn ở trạng thái Chờ duyệt hoặc Đã hủy', 400);
    }
  }

  await db.collection(collections.BOOKINGS).deleteOne({ _id: bId });
  return true;
}

async function approveBooking(bookingId, staffNote = '', currentUser = {}) {
  if (!ObjectId.isValid(bookingId)) {
    throw new AppError('Mã phiếu mượn không hợp lệ', 400);
  }

  const db = getDatabase();
  const bId = new ObjectId(bookingId);
  const booking = await db.collection(collections.BOOKINGS).findOne({ _id: bId });

  if (!booking) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (currentUser.userType === 'staff' && currentUser.role === 'building_manager') {
    if (!booking.buildingId || booking.buildingId.toString() !== currentUser.buildingId.toString()) {
      throw new AppError('Bạn không có quyền duyệt phiếu mượn của tòa nhà khác', 403);
    }
  }

  if (booking.status !== 'pending') {
    throw new AppError('Chỉ có thể duyệt yêu cầu mượn phòng ở trạng thái Chờ duyệt (pending)', 400);
  }

  await checkRoomOverlap(booking.roomId, booking.startTime, booking.endTime, bookingId);
  if (Array.isArray(booking.equipmentItems) && booking.equipmentItems.length > 0) {
    await checkEquipmentAvailability(booking.equipmentItems, booking.startTime, booking.endTime, bookingId);
  }

  const now = new Date();
  const setFields = {
    status: 'approved',
    approvedBy: new ObjectId(currentUser.userId),
    approvedAt: now,
    updatedAt: now
  };
  if (staffNote) {
    setFields.staffNote = staffNote.trim();
  }

  await db.collection(collections.BOOKINGS).updateOne(
    { _id: bId },
    { $set: setFields }
  );

  return populateBookingDetails({ ...booking, ...setFields });
}

async function rejectBooking(bookingId, rejectionReason = '', staffNote = '', currentUser = {}) {
  if (!ObjectId.isValid(bookingId)) {
    throw new AppError('Mã phiếu mượn không hợp lệ', 400);
  }

  const db = getDatabase();
  const bId = new ObjectId(bookingId);
  const booking = await db.collection(collections.BOOKINGS).findOne({ _id: bId });

  if (!booking) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (currentUser.userType === 'staff' && currentUser.role === 'building_manager') {
    if (!booking.buildingId || booking.buildingId.toString() !== currentUser.buildingId.toString()) {
      throw new AppError('Bạn không có quyền từ chối phiếu mượn của tòa nhà khác', 403);
    }
  }

  if (booking.status !== 'pending') {
    throw new AppError('Chỉ có thể từ chối yêu cầu mượn phòng ở trạng thái Chờ duyệt (pending)', 400);
  }

  const now = new Date();
  const setFields = {
    status: 'rejected',
    rejectionReason: rejectionReason ? rejectionReason.trim() : 'Lý do khác',
    staffNote: staffNote ? staffNote.trim() : '',
    approvedBy: new ObjectId(currentUser.userId),
    updatedAt: now
  };

  await db.collection(collections.BOOKINGS).updateOne(
    { _id: bId },
    { $set: setFields }
  );

  return populateBookingDetails({ ...booking, ...setFields });
}

async function cancelBooking(bookingId, studentNote = '', currentUser = {}) {
  if (!ObjectId.isValid(bookingId)) {
    throw new AppError('Mã phiếu mượn không hợp lệ', 400);
  }

  const db = getDatabase();
  const bId = new ObjectId(bookingId);
  const booking = await db.collection(collections.BOOKINGS).findOne({ _id: bId });

  if (!booking) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (currentUser.userType === 'student' && booking.studentId.toString() !== currentUser.userId.toString()) {
    throw new AppError('Bạn chỉ có thể hủy phiếu mượn của chính mình', 403);
  }

  if (currentUser.userType === 'staff' && currentUser.role === 'building_manager') {
    if (!booking.buildingId || booking.buildingId.toString() !== currentUser.buildingId.toString()) {
      throw new AppError('Bạn không có quyền hủy phiếu mượn của tòa nhà khác', 403);
    }
  }

  if (!['pending', 'approved'].includes(booking.status)) {
    throw new AppError('Chỉ có thể hủy phiếu mượn khi ở trạng thái Chờ duyệt hoặc Đã duyệt', 400);
  }

  const now = new Date();
  const setFields = {
    status: 'cancelled',
    cancelledAt: now,
    updatedAt: now
  };
  if (studentNote) {
    setFields.studentNote = studentNote.trim();
  }

  await db.collection(collections.BOOKINGS).updateOne(
    { _id: bId },
    { $set: setFields }
  );

  return populateBookingDetails({ ...booking, ...setFields });
}

async function checkInBooking(bookingId, staffNote = '', currentUser = {}) {
  if (!ObjectId.isValid(bookingId)) {
    throw new AppError('Mã phiếu mượn không hợp lệ', 400);
  }

  const db = getDatabase();
  const bId = new ObjectId(bookingId);
  const booking = await db.collection(collections.BOOKINGS).findOne({ _id: bId });

  if (!booking) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (currentUser.userType === 'staff' && currentUser.role === 'building_manager') {
    if (!booking.buildingId || booking.buildingId.toString() !== currentUser.buildingId.toString()) {
      throw new AppError('Bạn không thể nhận phòng (check-in) cho phiếu mượn thuộc tòa nhà khác', 403);
    }
  }

  if (booking.status !== 'approved') {
    throw new AppError('Chỉ có thể xác nhận nhận phòng khi phiếu mượn ở trạng thái Đã duyệt (approved)', 400);
  }

  const now = new Date();
  const setFields = {
    status: 'in_use',
    checkedInAt: now,
    updatedAt: now
  };
  if (staffNote) {
    setFields.staffNote = staffNote.trim();
  }

  await db.collection(collections.BOOKINGS).updateOne(
    { _id: bId },
    { $set: setFields }
  );

  return populateBookingDetails({ ...booking, ...setFields });
}

async function completeBooking(bookingId, data = {}, currentUser = {}) {
  if (!ObjectId.isValid(bookingId)) {
    throw new AppError('Mã phiếu mượn không hợp lệ', 400);
  }

  const db = getDatabase();
  const bId = new ObjectId(bookingId);
  const booking = await db.collection(collections.BOOKINGS).findOne({ _id: bId });

  if (!booking) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (currentUser.userType === 'staff' && currentUser.role === 'building_manager') {
    if (!booking.buildingId || booking.buildingId.toString() !== currentUser.buildingId.toString()) {
      throw new AppError('Bạn không thể hoàn thành phiếu mượn thuộc tòa nhà khác', 403);
    }
  }

  if (booking.status !== 'in_use') {
    throw new AppError('Chỉ có thể xác nhận hoàn thành khi phòng đang ở trạng thái Đang sử dụng (in_use)', 400);
  }

  const now = new Date();
  const setFields = {
    status: 'completed',
    completedAt: now,
    updatedAt: now
  };

  if (now < booking.endTime) {
    setFields.endTime = now;
  }

  if (data.staffNote) {
    setFields.staffNote = data.staffNote.trim();
  }

  if (Array.isArray(data.equipmentItems) && Array.isArray(booking.equipmentItems)) {
    const updatedItems = [...booking.equipmentItems];
    for (const itemDamaged of data.equipmentItems) {
      if (itemDamaged && itemDamaged.equipmentId) {
        const eqId = new ObjectId(itemDamaged.equipmentId);
        const damagedCount = Math.max(0, Number(itemDamaged.damagedQuantity) || 0);

        const targetIdx = updatedItems.findIndex(e => e.equipmentId.toString() === eqId.toString());
        if (targetIdx !== -1) {
          const prevDamagedInBooking = updatedItems[targetIdx].damagedQuantity || 0;
          const diffDamaged = damagedCount - prevDamagedInBooking;
          updatedItems[targetIdx].damagedQuantity = damagedCount;

          if (diffDamaged !== 0) {
            await db.collection(collections.EQUIPMENT).updateOne(
              { _id: eqId },
              { $inc: { damagedQuantity: diffDamaged } }
            );
          }
        }
      }
    }
    setFields.equipmentItems = updatedItems;
  }

  await db.collection(collections.BOOKINGS).updateOne(
    { _id: bId },
    { $set: setFields }
  );

  return populateBookingDetails({ ...booking, ...setFields });
}

async function returnBookingEarly(bookingId, currentUser = {}) {
  if (!ObjectId.isValid(bookingId)) {
    throw new AppError('Mã phiếu mượn không hợp lệ', 400);
  }

  const db = getDatabase();
  const bId = new ObjectId(bookingId);
  const booking = await db.collection(collections.BOOKINGS).findOne({ _id: bId });

  if (!booking) {
    throw new AppError('Không tìm thấy phiếu mượn', 404);
  }

  if (currentUser.userType === 'student' && booking.studentId.toString() !== currentUser.userId.toString()) {
    throw new AppError('Bạn chỉ có thể trả phòng sớm cho lượt mượn của chính mình', 403);
  }

  const now = new Date();
  if (booking.status === 'in_use' || (booking.status === 'approved' && now >= booking.startTime)) {
    const setFields = {
      status: 'completed',
      endTime: now,
      completedAt: now,
      updatedAt: now,
      studentNote: (booking.studentNote ? booking.studentNote + ' ' : '') + '(Sinh viên trả phòng sớm)'
    };

    await db.collection(collections.BOOKINGS).updateOne(
      { _id: bId },
      { $set: setFields }
    );

    return populateBookingDetails({ ...booking, ...setFields });
  } else {
    throw new AppError('Chỉ có thể trả phòng sớm khi đang trong khung giờ mượn hoặc phòng đang sử dụng', 400);
  }
}

async function getRoomSchedule(roomId, dateStr) {
  if (!ObjectId.isValid(roomId)) {
    throw new AppError('Mã phòng không hợp lệ', 400);
  }

  const db = getDatabase();
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(targetDate.getTime())) {
    throw new AppError('Ngày không hợp lệ', 400);
  }

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const bookings = await db.collection(collections.BOOKINGS).find({
    roomId: new ObjectId(roomId),
    status: { $in: ['pending', 'approved', 'in_use', 'completed'] },
    startTime: { $lt: endOfDay },
    endTime: { $gt: startOfDay }
  }).sort({ startTime: 1 }).toArray();

  return bookings.map(b => ({
    _id: b._id,
    startTime: b.startTime,
    endTime: b.endTime,
    status: b.status,
    purpose: b.purpose
  }));
}

module.exports = {
  getAllBookings,
  getBookingById,
  getRoomSchedule,
  createBooking,
  updateBooking,
  deleteBooking,
  approveBooking,
  rejectBooking,
  cancelBooking,
  returnBookingEarly,
  checkInBooking,
  completeBooking
};
