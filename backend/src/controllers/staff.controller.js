const staffService = require('../services/staff.service');
const asyncHandler = require('../utils/asyncHandler');

const getStaff = asyncHandler(async (req, res) => {
  const result = await staffService.getAllStaff(req.query);
  res.status(200).json({
    data: result.staff,
    pagination: result.pagination
  });
});

const getStaffById = asyncHandler(async (req, res) => {
  const staff = await staffService.getStaffById(req.params.id);
  res.status(200).json({
    data: staff,
    message: 'Lấy thông tin nhân viên thành công'
  });
});

module.exports = {
  getStaff,
  getStaffById
};
