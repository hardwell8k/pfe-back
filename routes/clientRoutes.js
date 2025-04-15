const express = require('express');

const {addClient,getAllClients} = require('../controllers/clientController');

const router = express.Router();

router.post('/addClient',addClient);
router.post('/getAllClients',getAllClients);

module.exports = router;