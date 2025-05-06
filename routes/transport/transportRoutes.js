const express = require('express');

const {addTransport,updateTransport,deleteTransport,getAllTransports} = require('../../controllers/transport/transportController');

const router = express.Router();

router.post('/addTransport',addTransport);
router.put('/updateTransport',updateTransport);
router.delete('/deleteTransport',deleteTransport);
router.get('/getAllTransports',getAllTransports);

module.exports = router;