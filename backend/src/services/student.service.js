const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../config/db');
const collections = require('../config/collections');
const AppError = require('../utils/appError');

async function getAllStudents(queryOptions = {}) {
  const db = getDatabase();
  const {
    search,
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
      { studentCode: searchRegex },
      { fullName: searchRegex },
      { email: searchRegex },
      { faculty: searchRegex }
    ];
  }

  if (status && ['active', 'inactive'].includes(status)) {
    filter.status = status;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const allowedSortFields = ['studentCode', 'fullName', 'email', 'faculty', 'status', 'createdAt', 'updatedAt'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDir = sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortDir };

  const totalItems = await db.collection(collections.STUDENTS).countDocuments(filter);
  const students = await db.collection(collections.STUDENTS)
    .find(filter, { projection: { password: 0 } })
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .toArray();

  const totalPages = Math.ceil(totalItems / limitNum) || 0;

  return {
    students,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages
    }
  };
}

async function getStudentById(id) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã sinh viên (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const student = await db.collection(collections.STUDENTS).findOne(
    { _id: new ObjectId(id) },
    { projection: { password: 0 } }
  );

  if (!student) {
    throw new AppError('Không tìm thấy sinh viên', 404);
  }

  return student;
}

async function createStudent(data) {
  const db = getDatabase();
  const cleanCode = data.studentCode.trim();
  const cleanEmail = data.email.trim().toLowerCase();

  const existing = await db.collection(collections.STUDENTS).findOne({
    $or: [
      { studentCode: cleanCode },
      { email: cleanEmail }
    ]
  });

  if (existing) {
    throw new AppError('Mã sinh viên hoặc Email đã tồn tại', 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const now = new Date();

  const newStudent = {
    studentCode: cleanCode,
    fullName: data.fullName.trim(),
    email: cleanEmail,
    phone: data.phone ? data.phone.trim() : '',
    faculty: data.faculty ? data.faculty.trim() : '',
    password: hashedPassword,
    status: data.status || 'active',
    createdAt: now,
    updatedAt: now
  };

  const result = await db.collection(collections.STUDENTS).insertOne(newStudent);
  const created = { _id: result.insertedId, ...newStudent };
  delete created.password;
  return created;
}

async function updateStudent(id, updateData) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã sinh viên (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const targetId = new ObjectId(id);

  const existing = await db.collection(collections.STUDENTS).findOne({ _id: targetId });
  if (!existing) {
    throw new AppError('Không tìm thấy sinh viên', 404);
  }

  const checkOr = [];
  if (updateData.studentCode && updateData.studentCode !== existing.studentCode) {
    checkOr.push({ studentCode: updateData.studentCode });
  }
  if (updateData.email && updateData.email.toLowerCase() !== existing.email) {
    checkOr.push({ email: updateData.email.toLowerCase() });
  }

  if (checkOr.length > 0) {
    const duplicate = await db.collection(collections.STUDENTS).findOne({
      $or: checkOr,
      _id: { $ne: targetId }
    });
    if (duplicate) {
      throw new AppError('Mã sinh viên hoặc Email đã tồn tại', 409);
    }
  }

  const setPayload = { ...updateData, updatedAt: new Date() };
  if (updateData.email) {
    setPayload.email = updateData.email.toLowerCase();
  }
  if (updateData.password) {
    setPayload.password = await bcrypt.hash(updateData.password, 10);
  }

  delete setPayload._id;
  delete setPayload.createdAt;

  await db.collection(collections.STUDENTS).updateOne(
    { _id: targetId },
    { $set: setPayload }
  );

  const updatedStudent = await db.collection(collections.STUDENTS).findOne(
    { _id: targetId },
    { projection: { password: 0 } }
  );
  return updatedStudent;
}

async function deleteStudent(id) {
  if (!ObjectId.isValid(id)) {
    throw new AppError('Mã sinh viên (ID) không hợp lệ', 400);
  }

  const db = getDatabase();
  const targetId = new ObjectId(id);

  const existing = await db.collection(collections.STUDENTS).findOne({ _id: targetId });
  if (!existing) {
    throw new AppError('Không tìm thấy sinh viên', 404);
  }

  const hasBooking = await db.collection(collections.BOOKINGS).findOne({ studentId: targetId });
  if (hasBooking) {
    throw new AppError('Không thể xóa sinh viên đã có lịch mượn tham chiếu. Vui lòng chuyển trạng thái tài khoản sang \'inactive\' (ngưng hoạt động).', 409);
  }

  await db.collection(collections.STUDENTS).deleteOne({ _id: targetId });
  return true;
}

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
