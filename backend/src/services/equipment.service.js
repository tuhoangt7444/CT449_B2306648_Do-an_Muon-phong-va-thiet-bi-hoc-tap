const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/db');
const collections = require('../config/collections');
const AppError = require('../utils/appError');
// hàm lấy danh sách các thiết bị đang được đặt mượn bởi các booking đang hoạt động
async function getActiveEquipmentReservations(startTime, endTime) {
  const db = getDatabase();
  let filter = {};

  if (startTime && endTime) {
    filter = {
      status: { $in: ['approved', 'in_use'] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    };
  } else {
    const now = new Date();
    filter = {
      status: { $in: ['approved', 'in_use'] },
      startTime: { $lte: now },
      endTime: { $gt: now }
    };
  }
  // Lấy tất cả các booking đang hoạt động trong khoảng thời gian đã cho
  const activeBookings = await db.collection(collections.BOOKINGS).find(filter).toArray();

  const reservedMap = {};
  // Duyệt qua từng booking và tính tổng số lượng thiết bị đã được đặt mượn
  for (const booking of activeBookings) {
    if (Array.isArray(booking.equipmentItems)) {
      for (const item of booking.equipmentItems) {
        if (item && item.equipmentId) {
          const eqIdStr = item.equipmentId.toString();
          const qty = Number(item.quantity) || 0;
          reservedMap[eqIdStr] = (reservedMap[eqIdStr] || 0) + qty;
        }
      }
    }
  }

  return reservedMap;
}
// Hàm này bổ sung thông tin tính toán vào một document thiết bị.
async function enrichEquipment(doc, reservedMap) {
  const db = getDatabase();
  const eqIdStr = doc._id.toString(); 
  const reservedQuantity = reservedMap[eqIdStr] || 0; //lấy sl đang mượn
  const totalQty = Number(doc.totalQuantity) || 0;
  const damagedQty = Number(doc.damagedQuantity) || 0;
  const availableQuantity = Math.max(totalQty - damagedQty - reservedQuantity, 0);

  let building = null;
  if (doc.buildingId) {
    building = await db.collection(collections.BUILDINGS).findOne(
      { _id: doc.buildingId },
      { projection: { buildingCode: 1, name: 1, location: 1 } }
    );
  }

  return {
    ...doc,
    building,
    reservedQuantity,
    availableQuantity
  };
}
// Lấy danh sách thiết bị với các tùy chọn lọc, phân trang và sắp xếp
async function getAllEquipment(queryOptions = {}) {
  const db = getDatabase();
  const {
    search,
    status,
    lowStock,
    buildingId,
    startTime,
    endTime,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = queryOptions;

  if ((startTime && !endTime) || (!startTime && endTime)) {
    throw new AppError('Cả startTime và endTime phải cùng được cung cấp', 400);
  }

  let reqStart = null;
  let reqEnd = null;

  if (startTime && endTime) {
    reqStart = new Date(startTime);
    reqEnd = new Date(endTime);
    if (isNaN(reqStart.getTime()) || isNaN(reqEnd.getTime()) || reqStart >= reqEnd) {
      throw new AppError('startTime và endTime không hợp lệ hoặc startTime phải nhỏ hơn endTime', 400);
    }
  }

  const filter = {};

  if (buildingId && ObjectId.isValid(buildingId)) {
    filter.buildingId = new ObjectId(buildingId);
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { equipmentCode: searchRegex },
      { name: searchRegex },
      { description: searchRegex }
    ];
  }

  if (status && ['available', 'maintenance', 'inactive'].includes(status)) {
    filter.status = status;
  }

  if (lowStock !== undefined && lowStock !== null && lowStock !== '') {
    if (lowStock !== 'true' && lowStock !== 'false' && typeof lowStock !== 'boolean') {
      throw new AppError('Tham số lowStock không hợp lệ (chỉ nhận true hoặc false)', 400);
    }
  }

  const allowedSortFields = ['equipmentCode', 'name', 'totalQuantity', 'damagedQuantity', 'lowStockThreshold', 'status', 'createdAt', 'updatedAt'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDir = sortOrder === 'asc' ? 1 : -1;

  const allMatchingDocs = await db.collection(collections.EQUIPMENT)
    .find(filter)
    .sort({ [sortField]: sortDir })
    .toArray();

  const reservedMap = await getActiveEquipmentReservations(reqStart, reqEnd);
  let enrichedList = await Promise.all(allMatchingDocs.map(doc => enrichEquipment(doc, reservedMap)));

  if (lowStock !== undefined && lowStock !== null && lowStock !== '') {
    const isLowStockBool = lowStock === 'true' || lowStock === true;
    enrichedList = enrichedList.filter(item => {
      const isLow = item.availableQuantity <= item.lowStockThreshold;
      return isLowStockBool ? isLow : !isLow;
    });
  }
  // Sắp xếp lại danh sách đã lọc theo tên thiết bị (name) theo thứ tự tăng dần
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const totalItems = enrichedList.length;
  const totalPages = Math.ceil(totalItems / limitNum) || 0;
  const skip = (pageNum - 1) * limitNum;

  const paginatedList = enrichedList.slice(skip, skip + limitNum);

  return {
    equipment: paginatedList,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages
    }
  };
}
// Lấy danh sách cảnh báo thiết bị sắp hết hàng (low stock) cho một tòa nhà cụ thể
async function getLowStockAlerts(buildingId) {
  const db = getDatabase();

  const filter = { status: { $ne: 'inactive' } };
  if (buildingId && ObjectId.isValid(buildingId)) {
    filter.buildingId = new ObjectId(buildingId);
  }

  const matchingDocs = await db.collection(collections.EQUIPMENT)
    .find(filter)
    .toArray();

  const reservedMap = await getActiveEquipmentReservations();
  const enrichedList = await Promise.all(matchingDocs.map(doc => enrichEquipment(doc, reservedMap)));

  const alertItems = enrichedList.filter(item => item.availableQuantity <= item.lowStockThreshold);

  alertItems.sort((a, b) => {
    if (a.availableQuantity !== b.availableQuantity) {
      return a.availableQuantity - b.availableQuantity;
    }
    return a.name.localeCompare(b.name, 'vi');
  });

  return alertItems;
}
// Lấy thông tin chi tiết của một thiết bị theo ID
async function getEquipmentById(id) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã thiết bị (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const equipment = await db.collection(collections.EQUIPMENT).findOne({ _id: new ObjectId(id) });

  if (!equipment) {
    throw new AppError('Không tìm thấy thiết bị', 404);
  }

  const reservedMap = await getActiveEquipmentReservations();
  return enrichEquipment(equipment, reservedMap);
}
// Tạo một thiết bị mới
async function createEquipment(equipmentData) {
  const db = getDatabase();

  if (!equipmentData.buildingId || !ObjectId.isValid(equipmentData.buildingId)) {
    throw new AppError('Thiết bị bắt buộc phải thuộc một tòa nhà hợp lệ', 400);
  }

  const bId = new ObjectId(equipmentData.buildingId);
  const building = await db.collection(collections.BUILDINGS).findOne({ _id: bId });
  if (!building) {
    throw new AppError('Tòa nhà được chọn không tồn tại', 404);
  }

  const existing = await db.collection(collections.EQUIPMENT).findOne({ equipmentCode: equipmentData.equipmentCode });
  if (existing) {
    throw new AppError('Mã thiết bị đã tồn tại', 409);
  }
  // Kiểm tra số lượng hư hỏng không vượt quá tổng số lượng
  const now = new Date();
  const newEquipment = {
    equipmentCode: equipmentData.equipmentCode,
    name: equipmentData.name,
    description: equipmentData.description || '',
    buildingId: bId,
    totalQuantity: equipmentData.totalQuantity,
    damagedQuantity: equipmentData.damagedQuantity || 0,
    lowStockThreshold: equipmentData.lowStockThreshold || 0,
    status: equipmentData.status || 'available',
    createdAt: now,
    updatedAt: now
  };

  const result = await db.collection(collections.EQUIPMENT).insertOne(newEquipment);
  return getEquipmentById(result.insertedId);
}
// Cập nhật thông tin của một thiết bị theo ID
async function updateEquipment(id, updateData) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã thiết bị (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const targetId = new ObjectId(id);

  const existing = await db.collection(collections.EQUIPMENT).findOne({ _id: targetId });
  if (!existing) {
    throw new AppError('Không tìm thấy thiết bị', 404);
  }

  if (updateData.equipmentCode && updateData.equipmentCode !== existing.equipmentCode) {
    const duplicate = await db.collection(collections.EQUIPMENT).findOne({
      equipmentCode: updateData.equipmentCode,
      _id: { $ne: targetId }
    });
    if (duplicate) {
      throw new AppError('Mã thiết bị đã tồn tại', 409);
    }
  }

  if (updateData.buildingId) {
    const newBuildingId = new ObjectId(updateData.buildingId);
    if (!newBuildingId.equals(existing.buildingId)) {
      const hasBooking = await db.collection(collections.BOOKINGS).findOne({
        'equipmentItems.equipmentId': targetId
      });
      if (hasBooking) {
        throw new AppError('Không thể chuyển thiết bị sang tòa nhà khác khi đã có lịch sử phiếu mượn.', 409);
      }
      updateData.buildingId = newBuildingId;
    }
  }

  const mergedTotal = updateData.totalQuantity !== undefined ? updateData.totalQuantity : existing.totalQuantity;
  const mergedDamaged = updateData.damagedQuantity !== undefined ? updateData.damagedQuantity : existing.damagedQuantity;

  if (mergedDamaged > mergedTotal) {
    throw new AppError('Số lượng hư hỏng không được vượt quá tổng số lượng', 400);
  }

  const setPayload = { ...updateData, updatedAt: new Date() };
  delete setPayload._id;
  delete setPayload.createdAt;

  await db.collection(collections.EQUIPMENT).updateOne(
    { _id: targetId },
    { $set: setPayload }
  );

  return getEquipmentById(targetId);
}
// Xóa một thiết bị theo ID, kiểm tra xem thiết bị có đang được tham chiếu trong các phiếu mượn hay không
async function deleteEquipment(id) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã thiết bị (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const targetId = new ObjectId(id);

  const existing = await db.collection(collections.EQUIPMENT).findOne({ _id: targetId });
  if (!existing) {
    throw new AppError('Không tìm thấy thiết bị', 404);
  }

  const hasBooking = await db.collection(collections.BOOKINGS).findOne({
    'equipmentItems.equipmentId': targetId
  });

  if (hasBooking) {
    throw new AppError('Không thể xóa thiết bị đã được tham chiếu trong phiếu mượn. Vui lòng chuyển trạng thái thiết bị sang \'inactive\' (ngưng hoạt động).', 409);
  }

  await db.collection(collections.EQUIPMENT).deleteOne({ _id: targetId });
  return true;
}

module.exports = {
  getAllEquipment,
  getLowStockAlerts,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment
};
