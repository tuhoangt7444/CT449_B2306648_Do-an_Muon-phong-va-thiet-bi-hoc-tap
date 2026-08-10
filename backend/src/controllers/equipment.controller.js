const equipmentService = require('../services/equipment.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const getEquipment = asyncHandler(async (req, res) => {
  const result = await equipmentService.getAllEquipment(req.query);
  res.status(200).json({
    data: result.equipment,
    pagination: result.pagination
  });
});

const getLowStockAlerts = asyncHandler(async (req, res) => {
  const alerts = await equipmentService.getLowStockAlerts();
  res.status(200).json({
    data: alerts,
    totalAlerts: alerts.length,
    message: 'Lấy danh sách cảnh báo thiết bị sắp hết thành công'
  });
});

const getEquipmentById = asyncHandler(async (req, res) => {
  const equipment = await equipmentService.getEquipmentById(req.params.id);
  res.status(200).json({
    data: equipment,
    message: 'Lấy thông tin chi tiết thiết bị thành công'
  });
});

const createEquipment = asyncHandler(async (req, res) => {
  const { equipmentCode, name, description, totalQuantity, damagedQuantity, lowStockThreshold, status } = req.body || {};

  if (!equipmentCode || typeof equipmentCode !== 'string' || equipmentCode.trim() === '') {
    throw new AppError('Mã thiết bị là bắt buộc và không được để rỗng', 400);
  }
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new AppError('Tên thiết bị là bắt buộc và không được để rỗng', 400);
  }

  const totalQtyNum = Number(totalQuantity);
  if (totalQuantity === undefined || totalQuantity === null || !Number.isInteger(totalQtyNum) || totalQtyNum < 0) {
    throw new AppError('Tổng số lượng thiết bị phải là số nguyên không âm', 400);
  }

  let damagedQtyNum = 0;
  if (damagedQuantity !== undefined && damagedQuantity !== null && damagedQuantity !== '') {
    damagedQtyNum = Number(damagedQuantity);
    if (!Number.isInteger(damagedQtyNum) || damagedQtyNum < 0) {
      throw new AppError('Số lượng hư hỏng phải là số nguyên không âm', 400);
    }
  }

  if (damagedQtyNum > totalQtyNum) {
    throw new AppError('Số lượng hư hỏng không được vượt quá tổng số lượng', 400);
  }

  let thresholdNum = 0;
  if (lowStockThreshold !== undefined && lowStockThreshold !== null && lowStockThreshold !== '') {
    thresholdNum = Number(lowStockThreshold);
    if (!Number.isInteger(thresholdNum) || thresholdNum < 0) {
      throw new AppError('Ngưỡng cảnh báo sắp hết phải là số nguyên không âm', 400);
    }
  }

  let cleanStatus = 'available';
  if (status) {
    if (!['available', 'maintenance', 'inactive'].includes(status)) {
      throw new AppError('Trạng thái thiết bị không hợp lệ', 400);
    }
    cleanStatus = status;
  }

  const payload = {
    equipmentCode: equipmentCode.trim(),
    name: name.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    totalQuantity: totalQtyNum,
    damagedQuantity: damagedQtyNum,
    lowStockThreshold: thresholdNum,
    status: cleanStatus
  };

  const newEquipment = await equipmentService.createEquipment(payload);
  res.status(201).json({
    data: newEquipment,
    message: 'Thêm thiết bị thành công'
  });
});

const updateEquipment = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const allowedKeys = ['equipmentCode', 'name', 'description', 'totalQuantity', 'damagedQuantity', 'lowStockThreshold', 'status'];
  const updateKeys = Object.keys(body).filter(key => allowedKeys.includes(key));

  if (updateKeys.length === 0) {
    throw new AppError('Dữ liệu cập nhật không hợp lệ hoặc không chứa trường được phép', 400);
  }

  const payload = {};

  if ('equipmentCode' in body) {
    if (typeof body.equipmentCode !== 'string' || body.equipmentCode.trim() === '') {
      throw new AppError('Mã thiết bị không được để rỗng', 400);
    }
    payload.equipmentCode = body.equipmentCode.trim();
  }

  if ('name' in body) {
    if (typeof body.name !== 'string' || body.name.trim() === '') {
      throw new AppError('Tên thiết bị không được để rỗng', 400);
    }
    payload.name = body.name.trim();
  }

  if ('description' in body) {
    payload.description = typeof body.description === 'string' ? body.description.trim() : '';
  }

  if ('totalQuantity' in body) {
    const val = Number(body.totalQuantity);
    if (body.totalQuantity === null || !Number.isInteger(val) || val < 0) {
      throw new AppError('Tổng số lượng thiết bị phải là số nguyên không âm', 400);
    }
    payload.totalQuantity = val;
  }

  if ('damagedQuantity' in body) {
    const val = Number(body.damagedQuantity);
    if (body.damagedQuantity === null || !Number.isInteger(val) || val < 0) {
      throw new AppError('Số lượng hư hỏng phải là số nguyên không âm', 400);
    }
    payload.damagedQuantity = val;
  }

  if ('lowStockThreshold' in body) {
    const val = Number(body.lowStockThreshold);
    if (body.lowStockThreshold === null || !Number.isInteger(val) || val < 0) {
      throw new AppError('Ngưỡng cảnh báo sắp hết phải là số nguyên không âm', 400);
    }
    payload.lowStockThreshold = val;
  }

  if ('status' in body) {
    if (!['available', 'maintenance', 'inactive'].includes(body.status)) {
      throw new AppError('Trạng thái thiết bị không hợp lệ', 400);
    }
    payload.status = body.status;
  }

  const updatedEquipment = await equipmentService.updateEquipment(req.params.id, payload);
  res.status(200).json({
    data: updatedEquipment,
    message: 'Cập nhật thông tin thiết bị thành công'
  });
});

const deleteEquipment = asyncHandler(async (req, res) => {
  await equipmentService.deleteEquipment(req.params.id);
  res.status(204).send();
});

module.exports = {
  getEquipment,
  getLowStockAlerts,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment
};
