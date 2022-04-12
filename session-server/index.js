// THESE ARE NODE APIs WE WISH TO USE
const express = require('express')  // Web Server
const cors = require('cors')  // Cross origin resource sharing, Security policy
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')


const WebSocket = require('ws');
const sharedb = require('sharedb/lib/client');
const richText = require('rich-text')
sharedb.types.register(richText.type)
//const ReconnectingWebSocket = require('reconnecting-websocket');

// CREATE OUR SERVER
dotenv.config();
const PORT = process.env.PORT || 4000;
const app = express();

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true
}))
app.use(cookieParser())


// SETUP OT SOCKETS
// Open WebSocket connection to ShareDB server
//var socket = new ReconnectingWebSocket('ws://' + window.location.host);
socket = new WebSocket('ws://localhost:8080');
//connection = new sharedb.Connection(socket);

// SETUP SESSION MANAGER
sessionManager = [];
let hash = 0; // TODO: Change 0 into hash function for docid
sessionManager[hash] = { 
  URL: 'ws://localhost:8080',
  socket,
  activeDocuments: []
}

// SETUP OUR OWN ROUTERS AS MIDDLEWARE
const appRouter = require('./routes/app-router');
app.use('/', appRouter)

// INITIALIZE OUR DATABASE OBJECT
const db = require('./db')
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

// PUT THE SERVER IN LISTENING MODE
const apiPort = 4000
app.listen(apiPort, () => console.log(`Server running on port ${apiPort}`))


