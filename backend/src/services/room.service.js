const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/db');
const collections = require('../config/collections');
const AppError = require('../utils/appError');
const reviewService = require('./review.service');
// lấy ds các phòng
async function getAllRooms(queryOptions = {}) {
  const db = getDatabase();
  const {
    search,
    status,
    minCapacity,
    facility,
    buildingId,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = queryOptions;
  // xây dựng bộ lọc dựa trên các tham số truy vấn
  const filter = {};
  // lọc theo buildingId nếu có và hợp lệ
  if (buildingId && ObjectId.isValid(buildingId)) {
    filter.buildingId = new ObjectId(buildingId);
  }
  // lọc theo search (roomCode, name, location)
  if (search && typeof search === 'string' && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { roomCode: searchRegex },
      { name: searchRegex },
      { location: searchRegex }
    ];
  }
  // lọc theo status nếu có và hợp lệ
  if (status && ['available', 'maintenance', 'inactive'].includes(status)) {
    filter.status = status;
  }
  // lọc theo minCapacity nếu có và hợp lệ
  if (minCapacity !== undefined && minCapacity !== null && minCapacity !== '') {
    const capNum = parseInt(minCapacity, 10);
    if (!isNaN(capNum) && capNum >= 0) {
      filter.capacity = { $gte: capNum };
    }
  }
  // lọc theo tiện nghi nếu có và hợp lệ
  if (facility && typeof facility === 'string' && facility.trim() !== '') {
    filter.facilities = { $regex: new RegExp(facility.trim(), 'i') };
  }
  // phân trang và sắp xếp
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;
  // xác định trường sắp xếp cho phép
  const allowedSortFields = ['roomCode', 'name', 'capacity', 'createdAt', 'updatedAt'];
  // xác định trường sắp xếp và hướng sắp xếp
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  // xác định hướng sắp xếp
  const sortDir = sortOrder === 'asc' ? 1 : -1;
  // xây dựng đối tượng sắp xếp
  const sort = { [sortField]: sortDir };
  // truy vấn cơ sở dữ liệu để lấy danh sách phòng và tổng số lượng
  const totalItems = await db.collection(collections.ROOMS).countDocuments(filter);
  // truy vấn cơ sở dữ liệu để lấy danh sách phòng
  const rawRooms = await db.collection(collections.ROOMS)
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .toArray();
  // bô sung thông tin tòa nhà và thống kê đánh giá cho từng phòng
  const enrichedRooms = await Promise.all(rawRooms.map(async r => {
    const stats = await reviewService.getRoomRatingStats(r._id);
    let building = null;
    if (r.buildingId) {
      building = await db.collection(collections.BUILDINGS).findOne(
        { _id: r.buildingId },
        { projection: { buildingCode: 1, name: 1, location: 1 } }
      );
    }
    return {
      ...r,
      building,
      averageRating: stats.averageRating,
      reviewCount: stats.reviewCount
    };
  }));
  // tính toán tổng số trang dựa trên tổng số lượng và giới hạn
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
// lấy thông tin phòng theo id
async function getRoomById(id) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã phòng (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const room = await db.collection(collections.ROOMS).findOne({ _id: new ObjectId(id) });

  if (!room) {
    throw new AppError('Không tìm thấy phòng học', 404);
  }

  let building = null;
  if (room.buildingId) {
    building = await db.collection(collections.BUILDINGS).findOne(
      { _id: room.buildingId },
      { projection: { buildingCode: 1, name: 1, location: 1 } }
    );
  }
  // lấy thống kê đánh giá cho phòng
  const stats = await reviewService.getRoomRatingStats(room._id);

  return {
    ...room,
    building,
    averageRating: stats.averageRating,
    reviewCount: stats.reviewCount
  };
}
// tạo phòng mới
async function createRoom(roomData) {
  const db = getDatabase();

  if (!roomData.buildingId || !ObjectId.isValid(roomData.buildingId)) {
    throw new AppError('Phòng học bắt buộc phải thuộc một tòa nhà hợp lệ', 400);
  }

  const buildingObjectId = new ObjectId(roomData.buildingId);
  const building = await db.collection(collections.BUILDINGS).findOne({ _id: buildingObjectId });
  if (!building) {
    throw new AppError('Tòa nhà được chọn không tồn tại', 404);
  }
  // kiểm tra trạng thái của tòa nhà trước khi tạo phòng
  if (building.status === 'inactive') {
    throw new AppError('Không thể tạo phòng cho tòa nhà đang ở trạng thái ngưng hoạt động', 400);
  }
  // kiểm tra xem mã phòng đã tồn tại chưa
  const existing = await db.collection(collections.ROOMS).findOne({ roomCode: roomData.roomCode });
  if (existing) {
    throw new AppError('Mã phòng đã tồn tại', 409);
  }
  // kiểm tra trạng thái và sức chứa của phòng trước khi tạo
  const now = new Date();
  const newRoom = {
    roomCode: roomData.roomCode,
    name: roomData.name,
    description: roomData.description || '',
    location: roomData.location,
    buildingId: buildingObjectId,
    capacity: roomData.capacity !== undefined ? roomData.capacity : null,
    capacitySource: roomData.capacitySource || (roomData.capacity ? 'official' : 'unverified'),
    observedMinimumCapacity: roomData.observedMinimumCapacity || null,
    facilities: roomData.facilities || [],
    images: roomData.images || [],
    status: roomData.status || 'available',
    dataVerification: roomData.dataVerification || 'official_source',
    createdAt: now,
    updatedAt: now
  };
  // kiểm tra trạng thái và sức chứa của phòng trước khi tạo
  const result = await db.collection(collections.ROOMS).insertOne(newRoom);
  return getRoomById(result.insertedId);
}
// cập nhật thông tin phòng
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

  if (updateData.buildingId) {
    const newBuildingId = new ObjectId(updateData.buildingId);
    if (!newBuildingId.equals(existing.buildingId)) {
      const hasBooking = await db.collection(collections.BOOKINGS).findOne({ roomId: targetId });
      if (hasBooking) {
        throw new AppError('Không thể chuyển phòng sang tòa nhà khác khi đã có lịch sử phiếu mượn.', 409);
      }
      updateData.buildingId = newBuildingId;
    }
  }

  const resultingStatus = updateData.status !== undefined ? updateData.status : existing.status;
  const resultingCap = updateData.capacity !== undefined ? updateData.capacity : existing.capacity;

  if (resultingStatus === 'available' && (!resultingCap || resultingCap <= 0)) {
    throw new AppError('Không thể chuyển phòng sang trạng thái Khả dụng khi chưa có sức chứa chính thức', 400);
  }
  // kiểm tra xem có thay đổi nào được phép không
  const setPayload = { ...updateData, updatedAt: new Date() };
  delete setPayload._id;
  delete setPayload.createdAt;

  await db.collection(collections.ROOMS).updateOne(
    { _id: targetId },
    { $set: setPayload }
  );

  return getRoomById(targetId);
}
// xóa phòng
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
