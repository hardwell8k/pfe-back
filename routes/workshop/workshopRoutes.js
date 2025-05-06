const express = require('express');

const {addWorkshop,updateWorkshop,deleteWorkshop,getAllWorkshops} = require('../../controllers/workshop/workshopControllers');

const router = express.Router();

router.post('/addWorkshop',addWorkshop);
router.put('/updateWorkshop',updateWorkshop);
router.delete('/deleteWorkshop',deleteWorkshop);
router.get('/getAllWorkshops',getAllWorkshops);

module.exports = router;