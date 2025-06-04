const express = require('express');
const router = express.Router();
const {addTransport, updateTransport, deleteTransport, getAllTransports, getEventTransport, addStaffToTransport, removeStaffFromTransport} = require('../../controllers/transport/transportController');

router.post('/addTransport', addTransport);
router.put('/updateTransport', updateTransport);
router.delete('/deleteTransport', deleteTransport);
router.get('/getAllTransports', getAllTransports);
router.get('/getEventTransport/:ID', getEventTransport);
router.post('/addStaffToTransport', addStaffToTransport);
router.delete('/removeStaffFromTransport', removeStaffFromTransport);

module.exports = router;