const express = require('express');
const equipmentController = require('../controllers/equipment.controller');

const router = express.Router();

router.get('/', equipmentController.getEquipment);
router.get('/alerts/low-stock', equipmentController.getLowStockAlerts);
router.get('/:id', equipmentController.getEquipmentById);
router.post('/', equipmentController.createEquipment);
router.patch('/:id', equipmentController.updateEquipment);
router.delete('/:id', equipmentController.deleteEquipment);

module.exports = router;
