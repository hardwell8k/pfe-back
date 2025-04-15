const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const cookieparser = require('cookie-parser');

const eventRoutes = require("./routes/eventRoutes");
const clientRoutes = require('./routes/clientRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const equipmentRoutes = require('./routes/equipement/equipmentRoutes');
const authRoutes = require('./routes/auth/authRoutes');

const app = express();

app.use(cors({origin: 'http://localhost:5173',credentials: true}));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieparser());

app.use('/api',eventRoutes);
app.use('/api',clientRoutes);
app.use('/api',departmentRoutes);
app.use('/api',equipmentRoutes);
app.use('/api',authRoutes);



module.exports = app ; 