const express = require('express');

const {addEquipment,updateEquipment,getAllEquipment} = require('../../controllers/equipement/equipementController');

const router = express.Router();

router.post('/addEquipment',addEquipment);
router.put('/updateEquipment',updateEquipment);
router.get('/getAllEquipment',getAllEquipment);

module.exports = router;