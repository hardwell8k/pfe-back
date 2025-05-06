const express = require('express');
//missing update
const {addClient,deleteClient,getAllClients} = require('../../controllers/client/clientController');

const router = express.Router();

router.post('/addClient',addClient);
router.delete('/deleteClient',deleteClient);
router.get('/getAllClients',getAllClients);

module.exports = router;