const bookingService = require('../services/booking.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
// Lấy danh sách các yêu cầu đặt phòng
const getBookings = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType,
    role: req.session.role,
    buildingId: req.session.buildingId
  };
  const result = await bookingService.getAllBookings(req.query, currentUser);
  res.status(200).json({
    data: result.bookings,
    pagination: result.pagination
  });
});
// Lấy chi tiết yêu cầu đặt phòng theo id
const getBookingById = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType,
    role: req.session.role,
    buildingId: req.session.buildingId
  };
  const booking = await bookingService.getBookingById(req.params.id, currentUser);
  res.status(200).json({
    data: booking,
    message: 'Lấy thông tin chi tiết phiếu mượn thành công'
  });
});
// Lấy lịch mượn phòng theo ngày
const getRoomSchedule = asyncHandler(async (req, res) => {
  const schedule = await bookingService.getRoomSchedule(req.params.id, req.query.date);
  res.status(200).json({
    data: schedule,
    message: 'Lấy lịch mượn phòng thành công'
  });
});
// Sinh viên tạo yêu cầu đặt phòng
const createBooking = asyncHandler(async (req, res) => {
  const { roomId, startTime, endTime, purpose, numberOfPeople } = req.body || {};

  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    throw new AppError('Mã phòng (roomId) là bắt buộc', 400);
  }
  if (!startTime || !endTime) {
    throw new AppError('Thời gian bắt đầu và kết thúc là bắt buộc', 400);
  }
  if (!purpose || typeof purpose !== 'string' || purpose.trim() === '') {
    throw new AppError('Mục đích mượn phòng là bắt buộc', 400);
  }

  const numPeople = Number(numberOfPeople);
  if (numberOfPeople === undefined || numberOfPeople === null || !Number.isInteger(numPeople) || numPeople < 1) {
    throw new AppError('Số lượng người tham gia phải là số nguyên dương', 400);
  }

  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType,
    role: req.session.role,
    buildingId: req.session.buildingId
  };

  const newBooking = await bookingService.createBooking(req.body, currentUser);
  res.status(201).json({
    data: newBooking,
    message: 'Đăng ký mượn phòng thành công'
  });
});
// Sinh viên cập nhật yêu cầu đặt phòng
const updateBooking = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType,
    role: req.session.role,
    buildingId: req.session.buildingId
  };

  const updatedBooking = await bookingService.updateBooking(req.params.id, req.body || {}, currentUser);
  res.status(200).json({
    data: updatedBooking,
    message: 'Cập nhật phiếu mượn thành công'
  });
});
// Sinh viên xóa yêu cầu đặt phòng
const deleteBooking = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType,
    role: req.session.role,
    buildingId: req.session.buildingId
  };

  await bookingService.deleteBooking(req.params.id, currentUser);
  res.status(204).send();
});
// Nhân viên duyệt yêu cầu đặt phòng  
const approveBooking = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType,
    role: req.session.role,
    buildingId: req.session.buildingId
  };
  const { staffNote } = req.body || {};
  const booking = await bookingService.approveBooking(req.params.id, staffNote, currentUser);
  res.status(200).json({
    data: booking,
    message: 'Duyệt yêu cầu mượn phòng thành công'
  });
});
// Nhân viên từ chối yêu cầu đặt phòng
const rejectBooking = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType,
    role: req.session.role,
    buildingId: req.session.buildingId
  };
  const { rejectionReason, staffNote } = req.body || {};
  const booking = await bookingService.rejectBooking(req.params.id, rejectionReason, staffNote, currentUser);
  res.status(200).json({
    data: booking,
    message: 'Từ chối yêu cầu mượn phòng thành công'
  });
});
// Sinh viên hủy yêu cầu đặt phòng
const cancelBooking = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType,
    role: req.session.role,
    buildingId: req.session.buildingId
  };
  const { studentNote } = req.body || {};
  const booking = await bookingService.cancelBooking(req.params.id, studentNote, currentUser);
  res.status(200).json({
    data: booking,
    message: 'Hủy phiếu mượn phòng thành công'
  });
});
// Nhân viên check-in
const checkInBooking = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType,
    role: req.session.role,
    buildingId: req.session.buildingId
  };
  const { staffNote } = req.body || {};
  const booking = await bookingService.checkInBooking(req.params.id, staffNote, currentUser);
  res.status(200).json({
    data: booking,
    message: 'Xác nhận nhận phòng (check-in) thành công'
  });
});
// Nhân viên hoàn thành yêu cầu đặt phòng
const completeBooking = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType,
    role: req.session.role,
    buildingId: req.session.buildingId
  };
  const booking = await bookingService.completeBooking(req.params.id, req.body || {}, currentUser);
  res.status(200).json({
    data: booking,
    message: 'Hoàn thành lượt sử dụng phòng thành công'
  });
});
//
const returnBookingEarly = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType,
    role: req.session.role,
    buildingId: req.session.buildingId
  };
  const booking = await bookingService.returnBookingEarly(req.params.id, currentUser);
  res.status(200).json({
    data: booking,
    message: 'Trả phòng học sớm thành công'
  });
});

module.exports = {
  getBookings,
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
