const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/db');
const collections = require('../config/collections');
const AppError = require('../utils/appError');

async function getAllStaff(queryOptions = {}) {
  const db = getDatabase();
  const {
    search,
    role,
    status,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = queryOptions;

  const filter = {};

  if (search && typeof search === 'string' && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { staffCode: searchRegex },
      { fullName: searchRegex },
      { email: searchRegex }
    ];
  }

  if (role && ['manager', 'staff'].includes(role)) {
    filter.role = role;
  }

  if (status && ['active', 'inactive'].includes(status)) {
    filter.status = status;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const allowedSortFields = ['staffCode', 'fullName', 'email', 'role', 'status', 'createdAt', 'updatedAt'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDir = sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortDir };

  const totalItems = await db.collection(collections.STAFF).countDocuments(filter);
  const staffList = await db.collection(collections.STAFF)
    .find(filter, { projection: { password: 0 } })
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .toArray();

  const totalPages = Math.ceil(totalItems / limitNum) || 0;

  return {
    staff: staffList,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages
    }
  };
}

async function getStaffById(id) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã nhân viên (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const staff = await db.collection(collections.STAFF).findOne(
    { _id: new ObjectId(id) },
    { projection: { password: 0 } }
  );

  if (!staff) {
    throw new AppError('Không tìm thấy nhân viên', 404);
  }

  return staff;
}

module.exports = {
  getAllStaff,
  getStaffById
};
