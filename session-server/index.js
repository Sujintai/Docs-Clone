// THESE ARE NODE APIs WE WISH TO USE
const express = require('express')  // Web Server
const cors = require('cors')  // Cross origin resource sharing, Security policy
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
const multer  = require('multer'); // image upload
const path = require('path');

const WebSocket = require('ws');
const sharedb = require('sharedb/lib/client');
const richText = require('rich-text')
sharedb.types.register(richText.type)
//const ReconnectingWebSocket = require('reconnecting-websocket');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  var pidToPort = {}; 
  var worker, port;
  for (var i = 1; i < (numCPUs * 2); i++) { // Start at 1 because master process is 4000
    port = 4000 + i;
    worker = cluster.fork({port: port});
    pidToPort[worker.process.pid] = port;
  }

  console.log(pidToPort);

  cluster.on('exit', function(worker, code, signal) {
    // Use `worker.process.pid` and `pidToPort` to spin up a new worker with
    // the port that's now missing.  If you do so, don't forget to delete the
    // old `pidToPort` mapping and add the new one.
    console.log('worker ' + worker.process.pid + ' died');
  }); 
} else {
  // Start listening on `process.env.port` - but first, remember that it has
  // been cast to a string, so you'll need to parse it.
  console.log(process.env.port);
}

// CREATE OUR SERVER
dotenv.config();
const PORT = process.env.port || 4000;
const app = express();

app.use(express.urlencoded({ extended: true, limit: '1mb'}))
app.use(express.json({limit: '1mb'}));
app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true
}))
app.use(cookieParser())


// SETUP OT SOCKETS
// Open WebSocket connection to ShareDB server
//var socket = new ReconnectingWebSocket('ws://' + window.location.host);
socket = new WebSocket('ws://209.151.151.54:8080');
//connection = new sharedb.Connection(socket);

// SETUP SESSION MANAGER
sessionManager = [];
let hash = 0; // TODO: Change 0 into hash function for docid
sessionManager[hash] = { 
  URL: 'ws://209.151.151.54:8080',
  socket,
  activeDocuments: []
}


// SETUP FILE UPLOADER
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/var/www/html/media/access')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + Date.now() + path.extname(file.originalname))
  }
})
upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname).toLowerCase();
    if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
        return callback(null, false)
    }
    callback(null, true)
  },
  limits:{
      fileSize: 1024 * 1024
  }
});
app.use(express.static(__dirname + '/public'));
app.use('/uploads', express.static('uploads'));

// SETUP OUR OWN ROUTERS AS MIDDLEWARE
const appRouter = require('./routes/app-router');
app.use('/', appRouter)

// INITIALIZE OUR DATABASE OBJECT
const db = require('./db')
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

// PUT THE SERVER IN LISTENING MODE

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))


