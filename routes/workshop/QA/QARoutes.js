const express = require('express');

const {addQA,updateQA,deleteQA,getAllQAs} = require('../../../controllers/workshop/QA/QAController');

const router = express.Router();

router.post('/addQA',addQA);
router.put('/updateQA',updateQA);
router.delete('/deleteQA',deleteQA);
router.get('/getAllQAs',getAllQAs);

module.exports = router;