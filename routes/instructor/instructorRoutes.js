const express = require('express');

const {addInstructor,updateInstructor,deleteInstructor,getAllInstructors,getInstructorsForWorkshop} = require('../../controllers/instructor/instructorController');

const router = express.Router();

router.post('/addInstructor',addInstructor);
router.put('/updateInstructor',updateInstructor);
router.delete('/deleteInstructor',deleteInstructor);
router.get('/getAllInstructors',getAllInstructors);
router.get('/getInstructorsForWorkshop',getInstructorsForWorkshop);

module.exports = router;