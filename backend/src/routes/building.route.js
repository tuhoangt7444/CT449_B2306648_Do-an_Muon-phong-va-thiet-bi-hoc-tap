const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/building.controller');
const { requireStaff, requireSuperAdmin } = require('../middlewares/auth.middleware');
// Router lấy ds các tòa nhà 
router.get('/', buildingController.getBuildings);
// Router lấy thông tin chi tiết của một tòa nhà dựa trên ID
router.get('/:id', buildingController.getBuildingById);

router.post('/', requireStaff, requireSuperAdmin, buildingController.createBuilding);
router.patch('/:id', requireStaff, requireSuperAdmin, buildingController.updateBuilding);
router.delete('/:id', requireStaff, requireSuperAdmin, buildingController.deleteBuilding);

module.exports = router;
