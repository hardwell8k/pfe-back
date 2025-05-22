const express = require("express");

const {addStaff,updateStaff,deleteStaff,getAllStaff,getParticipation,addStaffToEvent,getStaffEvents} = require("../../controllers/staff/staffController");

const router = express.Router();

router.post("/addStaff",addStaff);
router.post("/addStaffToEvent",addStaffToEvent);

router.get("/getStaffEvents/:id",getStaffEvents);

router.put("/updateStaff",updateStaff);

router.delete("/deleteStaff",deleteStaff);

router.get("/getAllStaff",getAllStaff)
router.get("/getParticipation",getParticipation)

module.exports = router;