// THESE ARE NODE APIs WE WISH TO USE
const express = require('express')  // Web Server
//const cors = require('cors')  // Cross origin resource sharing, Security policy
const dotenv = require('dotenv')
const path = require('path');

// CREATE OUR SERVER
dotenv.config();
const PORT = process.env.PORT || 4000;
const app = express();

app.use(express.urlencoded({ extended: true, limit: '1mb'}))
app.use(express.json({limit: '1mb'}));
/*app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true
}))*/

// SETUP OUR OWN ROUTERS AS MIDDLEWARE
const appRouter = require('./routes/app-router');
app.use('/', appRouter)

// INITIALIZE OUR DATABASE OBJECT
const db = require('./db')
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

// PUT THE SERVER IN LISTENING MODE

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))


