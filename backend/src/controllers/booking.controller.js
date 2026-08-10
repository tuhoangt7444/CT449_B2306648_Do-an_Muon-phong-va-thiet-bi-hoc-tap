const bookingService = require('../services/booking.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const getBookings = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType
  };
  const result = await bookingService.getAllBookings(req.query, currentUser);
  res.status(200).json({
    data: result.bookings,
    pagination: result.pagination
  });
});

const getBookingById = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType
  };
  const booking = await bookingService.getBookingById(req.params.id, currentUser);
  res.status(200).json({
    data: booking,
    message: 'Lấy thông tin chi tiết phiếu mượn thành công'
  });
});

const getRoomSchedule = asyncHandler(async (req, res) => {
  const schedule = await bookingService.getRoomSchedule(req.params.id, req.query.date);
  res.status(200).json({
    data: schedule,
    message: 'Lấy lịch mượn phòng thành công'
  });
});

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
    userType: req.session.userType
  };

  const newBooking = await bookingService.createBooking(req.body, currentUser);
  res.status(201).json({
    data: newBooking,
    message: 'Đăng ký mượn phòng thành công'
  });
});

const updateBooking = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType
  };

  const updatedBooking = await bookingService.updateBooking(req.params.id, req.body || {}, currentUser);
  res.status(200).json({
    data: updatedBooking,
    message: 'Cập nhật phiếu mượn thành công'
  });
});

const deleteBooking = asyncHandler(async (req, res) => {
  const currentUser = {
    userId: req.session.userId,
    userType: req.session.userType
  };

  await bookingService.deleteBooking(req.params.id, currentUser);
  res.status(204).send();
});

module.exports = {
  getBookings,
  getBookingById,
  getRoomSchedule,
  createBooking,
  updateBooking,
  deleteBooking
};
