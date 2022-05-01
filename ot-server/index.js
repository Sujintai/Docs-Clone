var http = require('http');
var express = require('express');

var Backend = require('sharedb');
var WebSocket = require('ws');
var WebSocketJSONStream = require('@teamwork/websocket-json-stream');
const richText = require('rich-text')

Backend.types.register(richText.type)
require('dotenv').config()
//console.log(process.env.DB_CONNECT)
const db = require('sharedb-mongo')(process.env.DB_CONNECT);
//const db = require('sharedb-mongo')('mongodb+srv://tatakae:tatakae@cluster0.sra41.mongodb.net/docsclone?retryWrites=true&w=majority');
/*
var redis = require('redis');
const redisClient = redis.createClient();
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();
var redisPubsub = require('sharedb-redis-pubsub')({client: redisClient});
*/
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  var pidToPort = {}; 
  var worker, port;
  for (var i = 1; i < numCPUs; i++) { // Start at 1 because master process is 4000
    port = 8080 + i;
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

var backend = new Backend({db, presence: true, doNotForwardSendPresenceErrorsToClient: true});
var connection = backend.connect();

// Create a web server to serve files and listen to WebSocket connections
var app = express();
app.use(express.static('static'));
var server = http.createServer(app);

// Connect any incoming WebSocket connection to ShareDB
var wss = new WebSocket.Server({server: server});
wss.on('connection', function(ws) {
  var stream = new WebSocketJSONStream(ws);
  backend.listen(stream);
});
port = process.env.port || 8080;
server.listen(port);
console.log('Listening on http://localhost:' + port);
