const studentService = require('../services/student.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getStudents = asyncHandler(async (req, res) => {
  const result = await studentService.getAllStudents(req.query);
  res.status(200).json({
    data: result.students,
    pagination: result.pagination
  });
});

const getStudentById = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentById(req.params.id);
  res.status(200).json({
    data: student,
    message: 'Lấy thông tin sinh viên thành công'
  });
});

const createStudent = asyncHandler(async (req, res) => {
  const { studentCode, fullName, email, phone, faculty, password, status } = req.body || {};

  if (!studentCode || typeof studentCode !== 'string' || studentCode.trim() === '') {
    throw new AppError('Mã sinh viên là bắt buộc và không được để rỗng', 400);
  }
  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    throw new AppError('Họ tên sinh viên là bắt buộc và không được để rỗng', 400);
  }
  if (!email || typeof email !== 'string' || email.trim() === '' || !emailRegex.test(email.trim())) {
    throw new AppError('Email không hợp lệ', 400);
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new AppError('Mật khẩu là bắt buộc và phải có ít nhất 6 ký tự', 400);
  }

  let cleanStatus = 'active';
  if (status) {
    if (!['active', 'inactive'].includes(status)) {
      throw new AppError('Trạng thái tài khoản không hợp lệ', 400);
    }
    cleanStatus = status;
  }

  const payload = {
    studentCode: studentCode.trim(),
    fullName: fullName.trim(),
    email: email.trim(),
    phone: typeof phone === 'string' ? phone.trim() : '',
    faculty: typeof faculty === 'string' ? faculty.trim() : '',
    password,
    status: cleanStatus
  };

  const newStudent = await studentService.createStudent(payload);
  res.status(201).json({
    data: newStudent,
    message: 'Tạo tài khoản sinh viên thành công'
  });
});

const updateStudent = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const allowedKeys = ['studentCode', 'fullName', 'email', 'phone', 'faculty', 'password', 'status'];
  const updateKeys = Object.keys(body).filter(key => allowedKeys.includes(key));

  if (updateKeys.length === 0) {
    throw new AppError('Dữ liệu cập nhật không hợp lệ hoặc không chứa trường được phép', 400);
  }

  const payload = {};

  if ('studentCode' in body) {
    if (typeof body.studentCode !== 'string' || body.studentCode.trim() === '') {
      throw new AppError('Mã sinh viên không được để rỗng', 400);
    }
    payload.studentCode = body.studentCode.trim();
  }

  if ('fullName' in body) {
    if (typeof body.fullName !== 'string' || body.fullName.trim() === '') {
      throw new AppError('Họ tên sinh viên không được để rỗng', 400);
    }
    payload.fullName = body.fullName.trim();
  }

  if ('email' in body) {
    if (typeof body.email !== 'string' || body.email.trim() === '' || !emailRegex.test(body.email.trim())) {
      throw new AppError('Email không hợp lệ', 400);
    }
    payload.email = body.email.trim();
  }

  if ('phone' in body) {
    payload.phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  }

  if ('faculty' in body) {
    payload.faculty = typeof body.faculty === 'string' ? body.faculty.trim() : '';
  }

  if ('password' in body) {
    if (typeof body.password !== 'string' || body.password.length < 6) {
      throw new AppError('Mật khẩu mới phải có ít nhất 6 ký tự', 400);
    }
    payload.password = body.password;
  }

  if ('status' in body) {
    if (!['active', 'inactive'].includes(body.status)) {
      throw new AppError('Trạng thái tài khoản không hợp lệ', 400);
    }
    payload.status = body.status;
  }

  const updatedStudent = await studentService.updateStudent(req.params.id, payload);
  res.status(200).json({
    data: updatedStudent,
    message: 'Cập nhật thông tin sinh viên thành công'
  });
});

const deleteStudent = asyncHandler(async (req, res) => {
  await studentService.deleteStudent(req.params.id);
  res.status(204).send();
});

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
