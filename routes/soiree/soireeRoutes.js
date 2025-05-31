const express = require('express');

const {addSoiree,updateSoiree,deleteSoiree,getAllSoirees,getEventSoiree} = require('../../controllers/soiree/soireeController');

const router = express.Router();

router.post('/addSoiree',addSoiree);

router.put('/updateSoiree',updateSoiree);

router.delete('/deleteSoiree',deleteSoiree);

router.get('/getAllSoirees',getAllSoirees);
router.get('/getEventSoiree/:ID',getEventSoiree);

module.exports = router;