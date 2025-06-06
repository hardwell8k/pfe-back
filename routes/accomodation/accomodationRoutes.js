const express = require('express');

const {addAccomodation,updateAccomodation,deleteAccomodation,getAllAccomodations,getEventAccomodation} = require('../../controllers/accomodation/accomodationController');

const router = express.Router();

router.post('/addAccomodation',addAccomodation);

router.put('/updateAccomodation',updateAccomodation);

router.delete('/deleteAccomodation',deleteAccomodation);

router.get('/getAllAccomodations',getAllAccomodations);
router.get('/getEventAccomodation/:ID',getEventAccomodation);

module.exports = router;