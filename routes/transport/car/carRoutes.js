const express = require('express');

const {addCar,updateCar,deleteCar,getAllCars,getCarById} = require('../../../controllers/transport/car/carController');

const router = express.Router();

router.post('/addCar',addCar);
router.put('/updateCar',updateCar);
router.delete('/deleteCar',deleteCar);
router.get('/getAllCars',getAllCars);
router.get('/getCarById/:ID',getCarById);

module.exports = router;