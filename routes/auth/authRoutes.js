const express = require('express');

const {signUp, logIn, getAcounts} = require('../../controllers/auth/authController');

const router = express.Router();

router.post('/signUp',signUp);
router.post('/logIn',logIn);
router.post('/getAcounts',getAcounts);

module.exports = router;