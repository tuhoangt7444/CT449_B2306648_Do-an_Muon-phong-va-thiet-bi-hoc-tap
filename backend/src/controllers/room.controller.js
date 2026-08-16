const roomService = require('../services/room.service');
const reviewService = require('../services/review.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { assertBuildingAccess } = require('../middlewares/auth.middleware');
// lay danh sach cac phong
const getRooms = asyncHandler(async (req, res) => {
  const query = { ...req.query };
  if (req.session && req.session.userType === 'staff') {
    if (req.session.role === 'building_manager') {
      query.buildingId = req.session.buildingId; // chỉ lấy phòng thuộc tòa họ ql
    }
  }

  const result = await roomService.getAllRooms(query);
  res.status(200).json({
    data: result.rooms,
    pagination: result.pagination
  });
});
// lay thong tin phong theo id
const getRoomById = asyncHandler(async (req, res) => {
  const room = await roomService.getRoomById(req.params.id);
  if (req.session && req.session.userType === 'staff') {
    assertBuildingAccess(req, room.buildingId);
  }

  res.status(200).json({
    data: room,
    message: 'Lấy thông tin phòng thành công'
  });
});
// lay danh sach review cua phong
const getRoomReviews = asyncHandler(async (req, res) => {
  const room = await roomService.getRoomById(req.params.id);
  if (req.session && req.session.userType === 'staff') {
    assertBuildingAccess(req, room.buildingId);
  }

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
// tạo phòng mới
const createRoom = asyncHandler(async (req, res) => {
  const { roomCode, name, description, location, buildingId, capacity, capacitySource, observedMinimumCapacity, facilities, images, status } = req.body || {};

  if (!roomCode || typeof roomCode !== 'string' || roomCode.trim() === '') {
    throw new AppError('Mã phòng là bắt buộc và không được để rỗng', 400);
  }
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new AppError('Tên phòng là bắt buộc và không được để rỗng', 400);
  }
  if (!location || typeof location !== 'string' || location.trim() === '') {
    throw new AppError('Vị trí phòng là bắt buộc và không được để rỗng', 400);
  }
  // Xác định buildingId dựa trên quyền của người dùng
  let targetBuildingId = buildingId;
  if (req.session && req.session.userType === 'staff') {
    if (req.session.role === 'building_manager') {
      targetBuildingId = req.session.buildingId;
    }
  }

  if (!targetBuildingId) {
    throw new AppError('Vui lòng chọn tòa nhà cho phòng học mới', 400);
  }
  // Kiểm tra quyền truy cập của nhân viên đối với tòa nhà được chỉ định
  let cleanStatus = 'available';
  if (status) {
    if (!['available', 'maintenance', 'inactive'].includes(status)) {
      throw new AppError('Trạng thái phòng không hợp lệ', 400);
    }
    cleanStatus = status;
  }
  // sức chứa
  let parsedCapacity = null;
  if (capacity !== undefined && capacity !== null && capacity !== '') {
    const num = Number(capacity);
    if (!Number.isInteger(num) || num <= 0) {
      throw new AppError('Sức chứa phòng phải là số nguyên dương', 400);
    }
    parsedCapacity = num;
  }

  if (cleanStatus === 'available' && (!parsedCapacity || parsedCapacity <= 0)) {
    throw new AppError('Phòng khả dụng bắt buộc phải có sức chứa chính thức là số nguyên dương', 400);
  }
  // Nguồn sức chứa
  let cleanCapacitySource = capacitySource;
  if (!cleanCapacitySource) {
    cleanCapacitySource = parsedCapacity ? 'official' : 'unverified';
  }
  // tối thiểu sức chứa quan sát
  let parsedObservedMin = null;
  if (observedMinimumCapacity !== undefined && observedMinimumCapacity !== null && observedMinimumCapacity !== '') {
    const numObs = Number(observedMinimumCapacity);
    if (Number.isInteger(numObs) && numObs > 0) {
      parsedObservedMin = numObs;
    }
  }

  const cleanRoomCode = roomCode.trim();
  const cleanName = name.trim();
  const cleanLocation = location.trim();
  const cleanDescription = description && typeof description === 'string' ? description.trim() : '';
  // Làm sạch danh sách tiện nghi và loại bỏ các giá trị không hợp lệ
  let cleanFacilities = [];
  if (Array.isArray(facilities)) {
    cleanFacilities = [...new Set(facilities.filter(item => typeof item === 'string' && item.trim() !== '').map(item => item.trim()))];
  }
  // Làm sạch danh sách hình ảnh và loại bỏ các giá trị không hợp lệ
  let cleanImages = [];
  if (Array.isArray(images)) {
    cleanImages = images.filter(item => typeof item === 'string' && item.trim() !== '').map(item => item.trim());
  }
  //
  const payload = {
    roomCode: cleanRoomCode,
    name: cleanName,
    description: cleanDescription,
    location: cleanLocation,
    buildingId: targetBuildingId,
    capacity: parsedCapacity,
    capacitySource: cleanCapacitySource,
    observedMinimumCapacity: parsedObservedMin,
    facilities: cleanFacilities,
    images: cleanImages,
    status: cleanStatus,
    dataVerification: 'official_source'
  };
  // tạo phòng mới bằng roomService
  const newRoom = await roomService.createRoom(payload);
  res.status(201).json({
    data: newRoom,
    message: 'Tạo phòng học thành công'
  });
});
// cập nhật thông tin phòng
  const updateRoom = asyncHandler(async (req, res) => {
  const existingRoom = await roomService.getRoomById(req.params.id);
  if (req.session && req.session.userType === 'staff') {
    assertBuildingAccess(req, existingRoom.buildingId);
  }

  const body = req.body || {};
  const allowedKeys = ['roomCode', 'name', 'description', 'location', 'buildingId', 'capacity', 'capacitySource', 'observedMinimumCapacity', 'facilities', 'images', 'status'];
  const updateKeys = Object.keys(body).filter(key => allowedKeys.includes(key));

  if (updateKeys.length === 0) {
    throw new AppError('Dữ liệu cập nhật không hợp lệ hoặc không chứa trường được phép', 400);
  }

  const payload = {};

  if ('buildingId' in body) {
    if (req.session.role === 'building_manager') {
      if (body.buildingId && body.buildingId.toString() !== req.session.buildingId.toString()) {
        throw new AppError('Quản lý tòa nhà không có quyền chuyển phòng sang tòa nhà khác', 403);
      }
    } else {
      payload.buildingId = body.buildingId;
    }
  }

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
    if (body.capacity === null || body.capacity === '') {
      payload.capacity = null;
    } else {
      const numCap = Number(body.capacity);
      if (!Number.isInteger(numCap) || numCap <= 0) {
        throw new AppError('Sức chứa phòng phải là số nguyên dương', 400);
      }
      payload.capacity = numCap;
    }
  }

  if ('capacitySource' in body) {
    if (['official', 'observed_minimum', 'unverified'].includes(body.capacitySource)) {
      payload.capacitySource = body.capacitySource;
    }
  }

  if ('observedMinimumCapacity' in body) {
    if (body.observedMinimumCapacity === null || body.observedMinimumCapacity === '') {
      payload.observedMinimumCapacity = null;
    } else {
      const numObs = Number(body.observedMinimumCapacity);
      if (Number.isInteger(numObs) && numObs > 0) {
        payload.observedMinimumCapacity = numObs;
      }
    }
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
  //
  const updatedRoom = await roomService.updateRoom(req.params.id, payload);
  res.status(200).json({
    data: updatedRoom,
    message: 'Cập nhật thông tin phòng thành công'
  });
});
  // xóa phòng
  const deleteRoom = asyncHandler(async (req, res) => {
  const existingRoom = await roomService.getRoomById(req.params.id);
  if (req.session && req.session.userType === 'staff') {
    assertBuildingAccess(req, existingRoom.buildingId);
  }

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
