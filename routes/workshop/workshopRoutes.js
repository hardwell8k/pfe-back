const express = require('express');

const {addWorkshop,updateWorkshop,deleteWorkshop,getAllWorkshops,getEventWorkshops} = require('../../controllers/workshop/workshopControllers');

const router = express.Router();

router.post('/addWorkshop',addWorkshop);

router.put('/updateWorkshop',updateWorkshop);

router.delete('/deleteWorkshop',deleteWorkshop);

router.post('/getAllWorkshops',getAllWorkshops);
router.get("/getEventWorkshops/:ID",getEventWorkshops);


module.exports = router;