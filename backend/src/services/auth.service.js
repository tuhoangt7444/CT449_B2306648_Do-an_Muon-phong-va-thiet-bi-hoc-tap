const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../config/db');
const collections = require('../config/collections');
const AppError = require('../utils/appError');

async function loginStudent({ identifier, password }) {
  const db = getDatabase();
  const cleanIdentifier = identifier.trim();
  const lowerIdentifier = cleanIdentifier.toLowerCase();

  const student = await db.collection(collections.STUDENTS).findOne({
    $or: [
      { studentCode: cleanIdentifier },
      { studentCode: cleanIdentifier.toUpperCase() },
      { email: lowerIdentifier }
    ]
  });

  if (!student) {
    throw new AppError('Thông tin đăng nhập không chính xác', 401);
  }

  if (student.status === 'inactive') {
    throw new AppError('Tài khoản của bạn đã bị khóa hoặc ngưng hoạt động', 403);
  }

  const isMatch = await bcrypt.compare(password, student.password);
  if (!isMatch) {
    throw new AppError('Thông tin đăng nhập không chính xác', 401);
  }

  delete student.password;
  return student;
}

async function loginStaff({ identifier, password }) {
  const db = getDatabase();
  const cleanIdentifier = identifier.trim();
  const lowerIdentifier = cleanIdentifier.toLowerCase();

  const staff = await db.collection(collections.STAFF).findOne({
    $or: [
      { staffCode: cleanIdentifier },
      { staffCode: cleanIdentifier.toUpperCase() },
      { email: lowerIdentifier }
    ]
  });

  if (!staff) {
    throw new AppError('Thông tin đăng nhập không chính xác', 401);
  }

  if (staff.status === 'inactive') {
    throw new AppError('Tài khoản của bạn đã bị khóa hoặc ngưng hoạt động', 403);
  }

  const isMatch = await bcrypt.compare(password, staff.password);
  if (!isMatch) {
    throw new AppError('Thông tin đăng nhập không chính xác', 401);
  }

  delete staff.password;
  return staff;
}

async function getCurrentUser(userId, userType) {
  if (!ObjectId.isValid(userId)) {
    throw new AppError('Mã người dùng không hợp lệ', 400);
  }

  const db = getDatabase();
  const collectionName = userType === 'student' ? collections.STUDENTS : collections.STAFF;
  const user = await db.collection(collectionName).findOne({ _id: new ObjectId(userId) });

  if (!user) {
    throw new AppError('Phiên làm việc hết hạn hoặc tài khoản không tồn tại', 401);
  }

  if (user.status === 'inactive') {
    throw new AppError('Tài khoản của bạn đã bị khóa hoặc ngưng hoạt động', 403);
  }

  delete user.password;
  return user;
}

module.exports = {
  loginStudent,
  loginStaff,
  getCurrentUser
};
