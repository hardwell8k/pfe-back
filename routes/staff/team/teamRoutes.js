const express = require("express");

const {addTeam,updateTeam,deleteTeam,getAllTeams,getAllStaffForTeams} = require("../../../controllers/staff/team/teamController");

const router = express.Router();

router.post("/addTeam",addTeam);
router.put("/updateTeam",updateTeam);
router.delete("/deleteTeam",deleteTeam);
router.get("/getAllTeams",getAllTeams)
router.get("/getAllStaffForTeams",getAllStaffForTeams)

module.exports = router;    