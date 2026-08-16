const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/db');
const collections = require('../config/collections');
const AppError = require('../utils/appError');
const equipmentService = require('./equipment.service');
const reviewService = require('./review.service');
// Lấy thông tin tổng quan cho dashboard, có thể lọc theo buildingId
async function getDashboardSummary(buildingIdStr = null) {
  const db = getDatabase();

  const roomFilter = { status: 'available' };
  const bookingPendingFilter = { status: 'pending' };
  const bookingInUseFilter = { status: 'in_use' };
  const recentBookingFilter = {};

  if (buildingIdStr && ObjectId.isValid(buildingIdStr)) {
    const bId = new ObjectId(buildingIdStr);
    roomFilter.buildingId = bId;
    bookingPendingFilter.buildingId = bId;
    bookingInUseFilter.buildingId = bId;
    recentBookingFilter.buildingId = bId;
  }

  const [activeRooms, pendingBookings, inUseBookings, allEquipmentAlerts, recentRawBookings] = await Promise.all([
    db.collection(collections.ROOMS).countDocuments(roomFilter),
    db.collection(collections.BOOKINGS).countDocuments(bookingPendingFilter),
    db.collection(collections.BOOKINGS).countDocuments(bookingInUseFilter),
    equipmentService.getLowStockAlerts(buildingIdStr),
    db.collection(collections.BOOKINGS)
      .find(recentBookingFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()
  ]);

  const eqOptions = { limit: 1000 };
  if (buildingIdStr) eqOptions.buildingId = buildingIdStr;

  const allActiveEquipment = await equipmentService.getAllEquipment(eqOptions);
  let availableEquipmentSum = 0;
  if (allActiveEquipment && Array.isArray(allActiveEquipment.equipment)) {
    allActiveEquipment.equipment.forEach(item => {
      if (item.status === 'available') {
        availableEquipmentSum += (Number(item.availableQuantity) || 0);
      }
    });
  }

  const lowStockEquipmentCount = Array.isArray(allEquipmentAlerts) ? allEquipmentAlerts.length : 0;

  const populatedRecentBookings = await Promise.all(
    recentRawBookings.map(async b => {
      const [student, room] = await Promise.all([
        db.collection(collections.STUDENTS).findOne(
          { _id: b.studentId },
          { projection: { studentCode: 1, fullName: 1, phone: 1, email: 1 } }
        ),
        db.collection(collections.ROOMS).findOne(
          { _id: b.roomId }
        )
      ]);
      return {
        _id: b._id,
        purpose: b.purpose,
        status: b.status,
        startTime: b.startTime,
        endTime: b.endTime,
        createdAt: b.createdAt,
        student: student || null,
        room: room || null
      };
    })
  );

  let buildingInfo = null;
  if (buildingIdStr && ObjectId.isValid(buildingIdStr)) {
    buildingInfo = await db.collection(collections.BUILDINGS).findOne(
      { _id: new ObjectId(buildingIdStr) },
      { projection: { buildingCode: 1, name: 1, location: 1 } }
    );
  }

  return {
    building: buildingInfo,
    activeRooms,
    availableEquipment: availableEquipmentSum,
    pendingBookings,
    inUseBookings,
    lowStockEquipment: lowStockEquipmentCount,
    recentBookings: populatedRecentBookings
  };
}
// Lấy danh sách các phòng học, có thể lọc theo buildingId, và bổ sung thông tin tòa nhà và thống kê đánh giá
async function getBookingsByStatus(queryOptions = {}) {
  const db = getDatabase();
  const { from, to, buildingId } = queryOptions;

  const filter = {};
  if (buildingId && ObjectId.isValid(buildingId)) {
    filter.buildingId = new ObjectId(buildingId);
  }

  if (from || to) {
    const timeFilter = {};
    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) throw new AppError('Thời gian bắt đầu (from) không hợp lệ', 400);
      timeFilter.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate.getTime())) throw new AppError('Thời gian kết thúc (to) không hợp lệ', 400);
      timeFilter.$lte = toDate;
    }
    if (from && to && new Date(from) > new Date(to)) {
      throw new AppError('Thời gian bắt đầu (from) không được lớn hơn thời gian kết thúc (to)', 400);
    }
    filter.createdAt = timeFilter;
  }

  const allStatuses = ['pending', 'approved', 'rejected', 'cancelled', 'in_use', 'completed'];
  const agg = await db.collection(collections.BOOKINGS).aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]).toArray();

  const statusMap = {};
  allStatuses.forEach(st => {
    statusMap[st] = 0;
  });
  agg.forEach(item => {
    if (item._id && statusMap[item._id] !== undefined) {
      statusMap[item._id] = item.count;
    }
  });

  return statusMap;
}

async function getBookingsByDay(queryOptions = {}) {
  const { from, to, buildingId } = queryOptions;

  if (!from || !to) {
    throw new AppError('Tham số từ ngày (from) và đến ngày (to) là bắt buộc', 400);
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw new AppError('Khoảng thời gian (from, to) không hợp lệ', 400);
  }

  if (fromDate > toDate) {
    throw new AppError('Thời gian bắt đầu (from) không được lớn hơn thời gian kết thúc (to)', 400);
  }

  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 90) {
    throw new AppError('Khoảng thời gian thống kê theo ngày tối đa là 90 ngày', 400);
  }

  const db = getDatabase();

  const rangeStart = new Date(`${from.split('T')[0]}T00:00:00.000Z`);
  const rangeEnd = new Date(`${to.split('T')[0]}T23:59:59.999Z`);

  const matchFilter = {
    createdAt: { $gte: rangeStart, $lte: rangeEnd }
  };

  if (buildingId && ObjectId.isValid(buildingId)) {
    matchFilter.buildingId = new ObjectId(buildingId);
  }

  const agg = await db.collection(collections.BOOKINGS).aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    }
  ]).toArray();

  const countMap = {};
  agg.forEach(item => {
    countMap[item._id] = item.count;
  });

  const dailyResult = [];
  const curr = new Date(rangeStart);
  while (curr <= rangeEnd) {
    const dayStr = curr.toISOString().split('T')[0];
    dailyResult.push({
      date: dayStr,
      count: countMap[dayStr] || 0
    });
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return dailyResult;
}

async function getPopularRooms(queryOptions = {}) {
  const db = getDatabase();
  const { from, to, buildingId, limit = 5 } = queryOptions;

  const limitNum = Math.min(20, Math.max(1, parseInt(limit, 10) || 5));

  const filter = {
    status: { $in: ['approved', 'in_use', 'completed'] }
  };

  if (buildingId && ObjectId.isValid(buildingId)) {
    filter.buildingId = new ObjectId(buildingId);
  }

  if (from || to) {
    const timeFilter = {};
    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) throw new AppError('Thời gian bắt đầu (from) không hợp lệ', 400);
      timeFilter.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate.getTime())) throw new AppError('Thời gian kết thúc (to) không hợp lệ', 400);
      timeFilter.$lte = toDate;
    }
    if (from && to && new Date(from) > new Date(to)) {
      throw new AppError('Thời gian bắt đầu (from) không được lớn hơn thời gian kết thúc (to)', 400);
    }
    filter.createdAt = timeFilter;
  }

  const agg = await db.collection(collections.BOOKINGS).aggregate([
    { $match: filter },
    { $group: { _id: '$roomId', usageCount: { $sum: 1 } } },
    { $sort: { usageCount: -1 } },
    { $limit: limitNum }
  ]).toArray();

  const popularRooms = await Promise.all(agg.map(async item => {
    const room = await db.collection(collections.ROOMS).findOne({ _id: item._id });
    const stats = await reviewService.getRoomRatingStats(item._id);
    return {
      _id: item._id,
      roomCode: room ? room.roomCode : '',
      name: room ? room.name : 'Phòng học',
      location: room ? room.location : '',
      usageCount: item.usageCount,
      averageRating: stats.averageRating,
      reviewCount: stats.reviewCount
    };
  }));

  popularRooms.sort((a, b) => {
    if (b.usageCount !== a.usageCount) {
      return b.usageCount - a.usageCount;
    }
    return a.name.localeCompare(b.name);
  });

  return popularRooms;
}

async function getEquipmentAlerts(buildingId = null) {
  return await equipmentService.getLowStockAlerts(buildingId);
}

module.exports = {
  getDashboardSummary,
  getBookingsByStatus,
  getBookingsByDay,
  getPopularRooms,
  getEquipmentAlerts
};
