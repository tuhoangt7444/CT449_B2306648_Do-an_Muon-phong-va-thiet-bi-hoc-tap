const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../config/db');
const collections = require('../config/collections');
const AppError = require('../utils/appError');

async function loginUnified({ identifier, password }) {
  const db = getDatabase();
  const cleanCode = identifier.trim();
  // có phải nhân viên trước hay không
  const staff = await db.collection(collections.STAFF).findOne({
    $or: [
      { staffCode: cleanCode },
      { staffCode: cleanCode.toUpperCase() } // Kt chữ hoa thường
    ]
  });
  // Nếu tìm thấy nhân viên, kiểm tra trạng thái và mật khẩu
  if (staff) {
    if (staff.status === 'inactive') {
      throw new AppError('Tài khoản của bạn đã bị khóa hoặc ngưng hoạt động', 403);
    }
    const isMatch = await bcrypt.compare(password, staff.password);
    if (isMatch) {
      delete staff.password; //Xóa mk trên bộ nhớ trước khi trả về để tránh lộ mk
      if (staff.buildingId) {
        const building = await db.collection(collections.BUILDINGS).findOne(
          { _id: staff.buildingId },
          { projection: { buildingCode: 1, name: 1, location: 1 } }
        );
        staff.building = building;
      } else {
        staff.building = null;
      }
      // Trả về thông tin người dùng, loại người dùng, vai trò và buildingId
      return { user: staff, userType: 'staff', role: staff.role, buildingId: staff.buildingId };
    }
  }
  //Kiểm tra xem có phải sinh viên không
  const student = await db.collection(collections.STUDENTS).findOne({
    $or: [
      { studentCode: cleanCode },
      { studentCode: cleanCode.toUpperCase() }
    ]
  });

  if (student) {
    if (student.status === 'inactive') {
      throw new AppError('Tài khoản của bạn đã bị khóa hoặc ngưng hoạt động', 403);
    }
    const isMatch = await bcrypt.compare(password, student.password);
    if (isMatch) {
      delete student.password;
      return { user: student, userType: 'student', role: null, buildingId: null };
    }
  }

  throw new AppError('Mã số hoặc mật khẩu không chính xác', 401);
}
// Lấy thông tin người dùng hiện tại dựa trên userId và userType
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

  if (userType === 'staff') {
    if (user.buildingId) {
      const building = await db.collection(collections.BUILDINGS).findOne(
        { _id: user.buildingId },
        { projection: { buildingCode: 1, name: 1, location: 1 } }
      );
      user.building = building;
    } else {
      user.building = null;
    }
  }

  return user;
}

module.exports = {
  loginUnified,
  getCurrentUser
};
