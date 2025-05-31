const express = require('express');

const {addEntreprise,updateEntreprise,deleteEntreprise,getAllEntreprises} = require('../../controllers/auth/entreprise/entrepriseController');

const router = express.Router();

router.post('/addEntreprise',addEntreprise);
router.put('/updateEntreprise',updateEntreprise)
router.delete('/deleteEntreprise',deleteEntreprise);
router.get('/getAllEntreprises',getAllEntreprises);

module.exports = router;