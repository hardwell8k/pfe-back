const express = require('express');
const router = express.Router();
const {addCar, updateCar, deleteCar, getAllCars, getCarById} = require('../controllers/transport/car/carController');
const {
    addTransport,
    updateTransport,
    deleteTransport,
    getAllTransports,
    getEventTransport,
    addStaffToTransport,
    removeStaffFromTransport,
    addTransportStaff
} = require('../controllers/transport/transportController');

// Car routes
router.post('/addCar', addCar);
router.put('/updateCar', updateCar);
router.delete('/deleteCar', deleteCar);
router.get('/getAllCars', getAllCars);
router.get('/getCarById/:ID', getCarById);

// Transport routes
router.post('/addTransport', addTransport);
router.put('/updateTransport', updateTransport);
router.delete('/deleteTransport', deleteTransport);
router.get('/getAllTransports', getAllTransports);
router.get('/getEventTransport/:ID', getEventTransport);
router.post('/addStaffToTransport', addStaffToTransport);
router.delete('/removeStaffFromTransport', removeStaffFromTransport);
router.post('/transport/addTransportStaff', addTransportStaff);

module.exports = router; 