const express = require("express");

const {addStaff,updateStaff,deleteStaff,getAllStaff,getParticipation,addStaffToEvent,getStaffEvents,getEventStaff,getAvailabeEventStaff,removeStaffFromEvent} = require("../../controllers/staff/staffController");

const router = express.Router();

router.post("/addStaff",addStaff);
router.post("/addStaffToEvent",addStaffToEvent);

router.get("/getStaffEvents/:id",getStaffEvents);
router.get("/getAllStaff",getAllStaff)
router.get("/getParticipation",getParticipation);
router.get("/getEventStaff/:ID",getEventStaff);
router.get("/getAvailabeEventStaff/:start_date/:end_date",getAvailabeEventStaff);

router.put("/updateStaff",updateStaff);

router.delete("/deleteStaff",deleteStaff);
router.delete("/removeStaffFromEvent/:ID_staff/:ID_event",removeStaffFromEvent);


module.exports = router;