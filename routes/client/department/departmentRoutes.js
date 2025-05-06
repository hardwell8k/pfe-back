const express = require('express');
const {addDepartment,getClientDepartments} = require('../../../controllers/client/department/departmentController');

const router = express.Router();

router.post('/addDepartment',addDepartment);
router.post('/getClientDepartments',getClientDepartments);

module.exports = router;