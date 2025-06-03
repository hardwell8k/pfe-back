const express = require("express");

const {addPrestataire,updatePrestataire,deletePrestataire,getAllPrestataires} = require("../../controllers/prestataire/prestataireController");

const router = express.Router();

router.post("/addPrestataire", addPrestataire);

router.put("/updatePrestataire", updatePrestataire);

router.delete("/deletePrestataire/:ID", deletePrestataire);

router.get("/getAllPrestataires", getAllPrestataires);

module.exports = router;