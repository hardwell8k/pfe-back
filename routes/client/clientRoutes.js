const express = require('express');
//missing update
const {addClient,updateClient,deleteClient,getAllClients} = require('../../controllers/client/clientController');

const router = express.Router();

router.post('/addClient',addClient);
router.put('/updateClient',updateClient)
router.delete('/deleteClient',deleteClient);
router.get('/getAllClients',getAllClients);

module.exports = router;