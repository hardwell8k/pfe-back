const express = require('express');

const {addTransport,updateTransport,deleteTransport,getAllTransports,getEventtransport} = require('../../controllers/transport/transportController');

const router = express.Router();

router.post('/addTransport',addTransport);

router.put('/updateTransport',updateTransport);

router.delete('/deleteTransport',deleteTransport);

router.get('/getAllTransports',getAllTransports);
router.get("/getEventtransport/:ID",getEventtransport);


module.exports = router;