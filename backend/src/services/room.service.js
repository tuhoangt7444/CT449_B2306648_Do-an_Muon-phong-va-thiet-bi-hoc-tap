const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/db');
const collections = require('../config/collections');
const AppError = require('../utils/appError');
const reviewService = require('./review.service');

async function getAllRooms(queryOptions = {}) {
  const db = getDatabase();
  const {
    search,
    status,
    minCapacity,
    facility,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = queryOptions;

  const filter = {};

  if (search && typeof search === 'string' && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { roomCode: searchRegex },
      { name: searchRegex },
      { location: searchRegex }
    ];
  }

  if (status && ['available', 'maintenance', 'inactive'].includes(status)) {
    filter.status = status;
  }

  if (minCapacity !== undefined && minCapacity !== null && minCapacity !== '') {
    const capNum = parseInt(minCapacity, 10);
    if (!isNaN(capNum) && capNum >= 0) {
      filter.capacity = { $gte: capNum };
    }
  }

  if (facility && typeof facility === 'string' && facility.trim() !== '') {
    filter.facilities = { $regex: new RegExp(facility.trim(), 'i') };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const allowedSortFields = ['roomCode', 'name', 'capacity', 'createdAt', 'updatedAt'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDir = sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortDir };

  const totalItems = await db.collection(collections.ROOMS).countDocuments(filter);
  const rawRooms = await db.collection(collections.ROOMS)
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .toArray();

  const enrichedRooms = await Promise.all(rawRooms.map(async r => {
    const stats = await reviewService.getRoomRatingStats(r._id);
    return {
      ...r,
      averageRating: stats.averageRating,
      reviewCount: stats.reviewCount
    };
  }));

  const totalPages = Math.ceil(totalItems / limitNum) || 0;

  return {
    rooms: enrichedRooms,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages
    }
  };
}

async function getRoomById(id) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã phòng (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const room = await db.collection(collections.ROOMS).findOne({ _id: new ObjectId(id) });

  if (!room) {
    throw new AppError('Không tìm thấy phòng học', 404);
  }

  const stats = await reviewService.getRoomRatingStats(room._id);

  return {
    ...room,
    averageRating: stats.averageRating,
    reviewCount: stats.reviewCount
  };
}

async function createRoom(roomData) {
  const db = getDatabase();

  const existing = await db.collection(collections.ROOMS).findOne({ roomCode: roomData.roomCode });
  if (existing) {
    throw new AppError('Mã phòng đã tồn tại', 409);
  }

  const now = new Date();
  const newRoom = {
    roomCode: roomData.roomCode,
    name: roomData.name,
    description: roomData.description || '',
    location: roomData.location,
    capacity: roomData.capacity,
    facilities: roomData.facilities || [],
    images: roomData.images || [],
    status: roomData.status || 'available',
    createdAt: now,
    updatedAt: now
  };

  const result = await db.collection(collections.ROOMS).insertOne(newRoom);
  return { _id: result.insertedId, ...newRoom, averageRating: 0, reviewCount: 0 };
}

async function updateRoom(id, updateData) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã phòng (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const targetId = new ObjectId(id);

  const existing = await db.collection(collections.ROOMS).findOne({ _id: targetId });
  if (!existing) {
    throw new AppError('Không tìm thấy phòng học', 404);
  }

  if (updateData.roomCode && updateData.roomCode !== existing.roomCode) {
    const duplicate = await db.collection(collections.ROOMS).findOne({
      roomCode: updateData.roomCode,
      _id: { $ne: targetId }
    });
    if (duplicate) {
      throw new AppError('Mã phòng đã tồn tại', 409);
    }
  }

  const setPayload = { ...updateData, updatedAt: new Date() };
  delete setPayload._id;
  delete setPayload.createdAt;

  await db.collection(collections.ROOMS).updateOne(
    { _id: targetId },
    { $set: setPayload }
  );

  const updatedRoom = await db.collection(collections.ROOMS).findOne({ _id: targetId });
  const stats = await reviewService.getRoomRatingStats(targetId);

  return {
    ...updatedRoom,
    averageRating: stats.averageRating,
    reviewCount: stats.reviewCount
  };
}

async function deleteRoom(id) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã phòng (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const targetId = new ObjectId(id);

  const existing = await db.collection(collections.ROOMS).findOne({ _id: targetId });
  if (!existing) {
    throw new AppError('Không tìm thấy phòng học', 404);
  }

  const hasBooking = await db.collection(collections.BOOKINGS).findOne({ roomId: targetId });
  if (hasBooking) {
    throw new AppError('Không thể xóa phòng đã có lịch mượn tham chiếu. Vui lòng chuyển trạng thái phòng sang \'inactive\' (ngưng hoạt động).', 409);
  }

  await db.collection(collections.ROOMS).deleteOne({ _id: targetId });
  return true;
}

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
};
