const express = require('express');
const {addDepartment,getClientDepartments} = require('../controllers/departmentController');

const router = express.Router();

router.post('/addDepartment',addDepartment);
router.post('/getClientDepartments',getClientDepartments);

module.exports = router;