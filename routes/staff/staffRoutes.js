const express = require("express");

const {addStaff,updateStaff,deleteStaff,getAllStaff} = require("../../controllers/staff/staffController");

const router = express.Router();

router.post("/addStaff",addStaff);
router.put("/updateStaff",updateStaff);
router.delete("/deleteStaff",deleteStaff);
router.get("/getAllStaff",getAllStaff)

module.exports = router;