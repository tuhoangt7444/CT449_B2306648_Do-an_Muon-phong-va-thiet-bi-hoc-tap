const roomService = require('../services/room.service');
const reviewService = require('../services/review.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const getRooms = asyncHandler(async (req, res) => {
  const result = await roomService.getAllRooms(req.query);
  res.status(200).json({
    data: result.rooms,
    pagination: result.pagination
  });
});

const getRoomById = asyncHandler(async (req, res) => {
  const room = await roomService.getRoomById(req.params.id);
  res.status(200).json({
    data: room,
    message: 'Lấy thông tin phòng thành công'
  });
});

const getRoomReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getRoomReviews(req.params.id, req.query);
  res.status(200).json({
    data: {
      room: result.room,
      averageRating: result.averageRating,
      reviewCount: result.reviewCount,
      reviews: result.reviews
    },
    pagination: result.pagination
  });
});

const createRoom = asyncHandler(async (req, res) => {
  const { roomCode, name, description, location, capacity, facilities, images, status } = req.body || {};

  if (!roomCode || typeof roomCode !== 'string' || roomCode.trim() === '') {
    throw new AppError('Mã phòng là bắt buộc và không được để rỗng', 400);
  }
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new AppError('Tên phòng là bắt buộc và không được để rỗng', 400);
  }
  if (!location || typeof location !== 'string' || location.trim() === '') {
    throw new AppError('Vị trí phòng là bắt buộc và không được để rỗng', 400);
  }
  if (capacity === undefined || capacity === null || !Number.isInteger(Number(capacity)) || Number(capacity) <= 0) {
    throw new AppError('Sức chứa phòng phải là số nguyên dương', 400);
  }

  const cleanRoomCode = roomCode.trim();
  const cleanName = name.trim();
  const cleanLocation = location.trim();
  const cleanDescription = description && typeof description === 'string' ? description.trim() : '';

  let cleanFacilities = [];
  if (Array.isArray(facilities)) {
    cleanFacilities = [...new Set(facilities.filter(item => typeof item === 'string' && item.trim() !== '').map(item => item.trim()))];
  }

  let cleanImages = [];
  if (Array.isArray(images)) {
    cleanImages = images.filter(item => typeof item === 'string' && item.trim() !== '').map(item => item.trim());
  }

  let cleanStatus = 'available';
  if (status) {
    if (!['available', 'maintenance', 'inactive'].includes(status)) {
      throw new AppError('Trạng thái phòng không hợp lệ', 400);
    }
    cleanStatus = status;
  }

  const payload = {
    roomCode: cleanRoomCode,
    name: cleanName,
    description: cleanDescription,
    location: cleanLocation,
    capacity: Number(capacity),
    facilities: cleanFacilities,
    images: cleanImages,
    status: cleanStatus
  };

  const newRoom = await roomService.createRoom(payload);
  res.status(201).json({
    data: newRoom,
    message: 'Tạo phòng học thành công'
  });
});

const updateRoom = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const allowedKeys = ['roomCode', 'name', 'description', 'location', 'capacity', 'facilities', 'images', 'status'];
  const updateKeys = Object.keys(body).filter(key => allowedKeys.includes(key));

  if (updateKeys.length === 0) {
    throw new AppError('Dữ liệu cập nhật không hợp lệ hoặc không chứa trường được phép', 400);
  }

  const payload = {};

  if ('roomCode' in body) {
    if (typeof body.roomCode !== 'string' || body.roomCode.trim() === '') {
      throw new AppError('Mã phòng không được để rỗng', 400);
    }
    payload.roomCode = body.roomCode.trim();
  }

  if ('name' in body) {
    if (typeof body.name !== 'string' || body.name.trim() === '') {
      throw new AppError('Tên phòng không được để rỗng', 400);
    }
    payload.name = body.name.trim();
  }

  if ('description' in body) {
    payload.description = typeof body.description === 'string' ? body.description.trim() : '';
  }

  if ('location' in body) {
    if (typeof body.location !== 'string' || body.location.trim() === '') {
      throw new AppError('Vị trí phòng không được để rỗng', 400);
    }
    payload.location = body.location.trim();
  }

  if ('capacity' in body) {
    if (body.capacity === null || !Number.isInteger(Number(body.capacity)) || Number(body.capacity) <= 0) {
      throw new AppError('Sức chứa phòng phải là số nguyên dương', 400);
    }
    payload.capacity = Number(body.capacity);
  }

  if ('facilities' in body) {
    if (!Array.isArray(body.facilities)) {
      throw new AppError('Danh sách tiện nghi phải là một mảng', 400);
    }
    payload.facilities = [...new Set(body.facilities.filter(item => typeof item === 'string' && item.trim() !== '').map(item => item.trim()))];
  }

  if ('images' in body) {
    if (!Array.isArray(body.images)) {
      throw new AppError('Danh sách hình ảnh phải là một mảng', 400);
    }
    payload.images = body.images.filter(item => typeof item === 'string' && item.trim() !== '').map(item => item.trim());
  }

  if ('status' in body) {
    if (!['available', 'maintenance', 'inactive'].includes(body.status)) {
      throw new AppError('Trạng thái phòng không hợp lệ', 400);
    }
    payload.status = body.status;
  }

  const updatedRoom = await roomService.updateRoom(req.params.id, payload);
  res.status(200).json({
    data: updatedRoom,
    message: 'Cập nhật thông tin phòng thành công'
  });
});

const deleteRoom = asyncHandler(async (req, res) => {
  await roomService.deleteRoom(req.params.id);
  res.status(204).send();
});

module.exports = {
  getRooms,
  getRoomById,
  getRoomReviews,
  createRoom,
  updateRoom,
  deleteRoom
};
