const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const cookieparser = require('cookie-parser');
const PORT = process.env.PORT || 3000;

const eventRoutes = require("./routes/event/eventRoutes");
const clientRoutes = require('./routes/client/clientRoutes');
const departmentRoutes = require('./routes/client/department/departmentRoutes');
const equipmentRoutes = require('./routes/equipement/equipmentRoutes');
const authRoutes = require('./routes/auth/authRoutes');
const staffRoutes = require('./routes/staff/staffRoutes');
const teamRoutes = require('./routes/staff/team/teamRoutes');
const workshopRoutes = require('./routes/workshop/workshopRoutes');
const soireeRoutes = require('./routes/soiree/soireeRoutes'); 
const accomodationRoutes = require('./routes/accomodation/accomodationRoutes'); 
const entrepriseRoutes = require('./routes/client/entreprise/entrepriseRoutes');
const carRoutes = require('./routes/transport/car/carRoutes');
const transportRoutes = require('./routes/transport/transportRoutes');
const instructorRoutes = require('./routes/instructor/instructorRoutes');
const QARoutes = require('./routes/workshop/QA/QARoutes');

const authMiddleware = require('./middlewares/authMiddleware');

const app = express();

app.listen(PORT, '0.0.0.0');
app.use(cors({origin: 'http://10.0.0.203:5173',credentials: true}));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieparser());

app.use('/api',authRoutes);

app.use('/api',authMiddleware,eventRoutes);
app.use('/api',authMiddleware,clientRoutes);
app.use('/api',authMiddleware,departmentRoutes);
app.use('/api',authMiddleware,equipmentRoutes);

app.use('/api',authMiddleware,staffRoutes);
app.use('/api',authMiddleware,teamRoutes);
app.use('/api',authMiddleware,workshopRoutes);
app.use('/api',authMiddleware,soireeRoutes);
app.use('/api',authMiddleware,accomodationRoutes);
app.use('/api',authMiddleware,entrepriseRoutes);
app.use('/api',authMiddleware,carRoutes);
app.use('/api',authMiddleware,transportRoutes);
app.use('/api',authMiddleware,instructorRoutes);
app.use('/api',authMiddleware,QARoutes);

module.exports = app ; 