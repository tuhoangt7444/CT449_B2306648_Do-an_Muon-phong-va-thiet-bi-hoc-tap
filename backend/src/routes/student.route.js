const express = require('express');
const studentController = require('../controllers/student.controller');
const { requireStaff } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(requireStaff);

router.get('/', studentController.getStudents);
router.get('/:id', studentController.getStudentById);
router.post('/', studentController.createStudent);
router.patch('/:id', studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

module.exports = router;
