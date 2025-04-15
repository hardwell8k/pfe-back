const express = require('express');
const {getUPcomingEvents,addEvent, updateEvent, deleteEvent} = require("../controllers/eventController");
const {getEventTypes, addEventType} = require("../controllers/eventTypesController")

const router = express.Router();
router.post("/addEvent",addEvent);
router.post("/addEventType",addEventType);

router.post("/getEventTypes",getEventTypes);
router.post("/getUPcomingEvents",getUPcomingEvents);

router.post("/updateEvent",updateEvent);
router.post("/deleteEvent",deleteEvent);


module.exports = router;