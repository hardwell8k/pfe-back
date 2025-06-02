const express = require('express');

const {addTransport,updateTransport,deleteTransport,getAllTransports,getEventtransport,addStaffToTransport,removeStaffFromTransport,addCarToTransport,removeCarFromTransport} = require('../../controllers/transport/transportController');

const router = express.Router();

router.post('/addTransport',addTransport);
router.post('/addStaffToTransport',addStaffToTransport);
router.post('/addCarToTransport',addCarToTransport)

router.put('/updateTransport',updateTransport);

router.delete('/deleteTransport',deleteTransport);
router.delete('/removeStaffFromTransport/:ID_staff/:ID_event',removeStaffFromTransport);
router.delete('/removeCarFromTransport',removeCarFromTransport);

router.get('/getAllTransports',getAllTransports);
router.get("/getEventtransport/:ID",getEventtransport);


module.exports = router;