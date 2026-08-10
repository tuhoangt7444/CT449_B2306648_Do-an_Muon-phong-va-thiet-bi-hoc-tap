const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/db');
const collections = require('../config/collections');
const AppError = require('../utils/appError');

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

  const activeBookings = await db.collection(collections.BOOKINGS).find(filter).toArray();

  const reservedMap = {};

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

function enrichEquipment(doc, reservedMap) {
  const eqIdStr = doc._id.toString();
  const reservedQuantity = reservedMap[eqIdStr] || 0;
  const totalQty = Number(doc.totalQuantity) || 0;
  const damagedQty = Number(doc.damagedQuantity) || 0;
  const availableQuantity = Math.max(totalQty - damagedQty - reservedQuantity, 0);

  return {
    ...doc,
    reservedQuantity,
    availableQuantity
  };
}

async function getAllEquipment(queryOptions = {}) {
  const db = getDatabase();
  const {
    search,
    status,
    lowStock,
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
  let enrichedList = allMatchingDocs.map(doc => enrichEquipment(doc, reservedMap));

  if (lowStock !== undefined && lowStock !== null && lowStock !== '') {
    const isLowStockBool = lowStock === 'true' || lowStock === true;
    enrichedList = enrichedList.filter(item => {
      const isLow = item.availableQuantity <= item.lowStockThreshold;
      return isLowStockBool ? isLow : !isLow;
    });
  }

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

async function getLowStockAlerts() {
  const db = getDatabase();

  const matchingDocs = await db.collection(collections.EQUIPMENT)
    .find({ status: { $ne: 'inactive' } })
    .toArray();

  const reservedMap = await getActiveEquipmentReservations();
  const enrichedList = matchingDocs.map(doc => enrichEquipment(doc, reservedMap));

  const alertItems = enrichedList.filter(item => item.availableQuantity <= item.lowStockThreshold);

  alertItems.sort((a, b) => {
    if (a.availableQuantity !== b.availableQuantity) {
      return a.availableQuantity - b.availableQuantity;
    }
    return a.name.localeCompare(b.name, 'vi');
  });

  return alertItems;
}

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

async function createEquipment(equipmentData) {
  const db = getDatabase();

  const existing = await db.collection(collections.EQUIPMENT).findOne({ equipmentCode: equipmentData.equipmentCode });
  if (existing) {
    throw new AppError('Mã thiết bị đã tồn tại', 409);
  }

  const now = new Date();
  const newEquipment = {
    equipmentCode: equipmentData.equipmentCode,
    name: equipmentData.name,
    description: equipmentData.description || '',
    totalQuantity: equipmentData.totalQuantity,
    damagedQuantity: equipmentData.damagedQuantity || 0,
    lowStockThreshold: equipmentData.lowStockThreshold || 0,
    status: equipmentData.status || 'available',
    createdAt: now,
    updatedAt: now
  };

  const result = await db.collection(collections.EQUIPMENT).insertOne(newEquipment);
  const createdDoc = { _id: result.insertedId, ...newEquipment };

  const reservedMap = await getActiveEquipmentReservations();
  return enrichEquipment(createdDoc, reservedMap);
}

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

  const updatedDoc = await db.collection(collections.EQUIPMENT).findOne({ _id: targetId });
  const reservedMap = await getActiveEquipmentReservations();
  return enrichEquipment(updatedDoc, reservedMap);
}

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
