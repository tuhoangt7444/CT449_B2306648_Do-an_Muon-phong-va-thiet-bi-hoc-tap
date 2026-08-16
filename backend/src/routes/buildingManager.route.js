const express = require('express');
const router = express.Router();
const buildingManagerController = require('../controllers/buildingManager.controller');
const { requireStaff, requireSuperAdmin } = require('../middlewares/auth.middleware');
// Bảo vệ tất cả các route bằng middleware requireStaff và requireSuperAdmin
router.use(requireStaff);
router.use(requireSuperAdmin);
// Router lấy danh sách các quản lý tòa nhà
router.get('/', buildingManagerController.getBuildingManagers);
router.get('/:id', buildingManagerController.getBuildingManagerById);
router.post('/', buildingManagerController.createBuildingManager);
router.patch('/:id', buildingManagerController.updateBuildingManager);

module.exports = router;
