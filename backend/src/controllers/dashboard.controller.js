const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');

const getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary();
  res.status(200).json({
    data: summary,
    message: 'Lấy dữ liệu tổng quan dashboard thành công'
  });
});

const getBookingsByStatus = asyncHandler(async (req, res) => {
  const result = await dashboardService.getBookingsByStatus(req.query);
  res.status(200).json({
    data: result,
    message: 'Thống kê yêu cầu mượn phòng theo trạng thái thành công'
  });
});

const getBookingsByDay = asyncHandler(async (req, res) => {
  const result = await dashboardService.getBookingsByDay(req.query);
  res.status(200).json({
    data: result,
    message: 'Thống kê yêu cầu mượn phòng theo ngày thành công'
  });
});

const getPopularRooms = asyncHandler(async (req, res) => {
  const popularRooms = await dashboardService.getPopularRooms(req.query);
  res.status(200).json({
    data: popularRooms,
    message: 'Lấy danh sách phòng học được sử dụng nhiều thành công'
  });
});

const getEquipmentAlerts = asyncHandler(async (req, res) => {
  const alerts = await dashboardService.getEquipmentAlerts();
  res.status(200).json({
    data: alerts,
    message: 'Lấy danh sách cảnh báo thiết bị thành công'
  });
});

module.exports = {
  getSummary,
  getBookingsByStatus,
  getBookingsByDay,
  getPopularRooms,
  getEquipmentAlerts
};
