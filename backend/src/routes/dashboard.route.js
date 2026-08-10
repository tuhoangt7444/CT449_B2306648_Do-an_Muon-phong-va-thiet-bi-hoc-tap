const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { requireStaff } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(requireStaff);

router.get('/summary', dashboardController.getSummary);
router.get('/bookings-by-status', dashboardController.getBookingsByStatus);
router.get('/bookings-by-day', dashboardController.getBookingsByDay);
router.get('/popular-rooms', dashboardController.getPopularRooms);
router.get('/equipment-alerts', dashboardController.getEquipmentAlerts);

module.exports = router;
