const express = require('express');
const staffController = require('../controllers/staff.controller');
const { requireStaff } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(requireStaff);

router.get('/', staffController.getStaff);
router.get('/:id', staffController.getStaffById);

module.exports = router;
