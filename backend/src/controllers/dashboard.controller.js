const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');

const getEffectiveBuildingId = (req) => {
  if (req.session && req.session.userType === 'staff') {
    if (req.session.role === 'building_manager') {
      return req.session.buildingId;
    }
  }
  return req.query.buildingId || null;
};

const getSummary = asyncHandler(async (req, res) => {
  const buildingId = getEffectiveBuildingId(req);
  const summary = await dashboardService.getDashboardSummary(buildingId);
  res.status(200).json({
    data: summary,
    message: 'Lấy dữ liệu tổng quan dashboard thành công'
  });
});

const getBookingsByStatus = asyncHandler(async (req, res) => {
  const query = { ...req.query };
  const buildingId = getEffectiveBuildingId(req);
  if (buildingId) query.buildingId = buildingId;

  const result = await dashboardService.getBookingsByStatus(query);
  res.status(200).json({
    data: result,
    message: 'Thống kê yêu cầu mượn phòng theo trạng thái thành công'
  });
});

const getBookingsByDay = asyncHandler(async (req, res) => {
  const query = { ...req.query };
  const buildingId = getEffectiveBuildingId(req);
  if (buildingId) query.buildingId = buildingId;

  const result = await dashboardService.getBookingsByDay(query);
  res.status(200).json({
    data: result,
    message: 'Thống kê yêu cầu mượn phòng theo ngày thành công'
  });
});

const getPopularRooms = asyncHandler(async (req, res) => {
  const query = { ...req.query };
  const buildingId = getEffectiveBuildingId(req);
  if (buildingId) query.buildingId = buildingId;

  const popularRooms = await dashboardService.getPopularRooms(query);
  res.status(200).json({
    data: popularRooms,
    message: 'Lấy danh sách phòng học được sử dụng nhiều thành công'
  });
});

const getEquipmentAlerts = asyncHandler(async (req, res) => {
  const buildingId = getEffectiveBuildingId(req);
  const alerts = await dashboardService.getEquipmentAlerts(buildingId);
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
