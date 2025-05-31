const express = require('express');
const {addDepartment,getClientDepartments,UpdateDepartment,deleteDepartment} = require('../../../controllers/client/department/departmentController');

const router = express.Router();

router.post('/addDepartment',addDepartment);

router.get('/getClientDepartments/:client_id',getClientDepartments);

router.put('/UpdateDepartment',UpdateDepartment);

router.delete('/deleteDepartment',deleteDepartment);

module.exports = router;