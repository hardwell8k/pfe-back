const express = require('express');
const {getUPcomingEvents,addEvent, updateEvent, deleteEvent,getEventsHistory,getRestOfEventsHistoryData} = require("../../controllers/event/eventController");
const {getEventTypes, addEventType} = require("../../controllers/event/eventTypes/eventTypesController");
const {addPause,updatePause,deletePause,getAllPausesForEvent}= require('../../controllers/event/pause/pauseController');

const router = express.Router();
router.post("/addEvent",addEvent);
router.post("/addEventType",addEventType);
router.post("/addPause",addPause)

router.get("/getEventTypes",getEventTypes);
router.get("/getUPcomingEvents",getUPcomingEvents);
router.get("/getEventsHistory",getEventsHistory);
router.get("/getAllPausesForEvent/:ID",getAllPausesForEvent);
router.get("/getRestOfEventsHistoryData/:ID",getRestOfEventsHistoryData);


router.put("/updateEvent",updateEvent);
router.put("/updatePause",updatePause);


router.delete("/deleteEvent",deleteEvent);
router.delete("/deletePause",deletePause);


module.exports = router;