const express = require('express');

const {addEquipment,getAllEquipment} = require('../../controllers/equipement/equipementController');

const router = express.Router();

router.post('/addEquipment',addEquipment);
router.post('/getAllEquipment',getAllEquipment)

module.exports = router;