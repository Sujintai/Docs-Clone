var http = require('http');
var express = require('express');

var Backend = require('sharedb');
var WebSocket = require('ws');
var WebSocketJSONStream = require('@teamwork/websocket-json-stream');
const richText = require('rich-text')

Backend.types.register(richText.type)
const db = require('sharedb-mongo')('mongodb://localhost:27017/docsclone');
//const db = require('sharedb-mongo')('mongodb+srv://tatakae:tatakae@cluster0.sra41.mongodb.net/docsclone?retryWrites=true&w=majority');

var backend = new Backend({db, presence: true});
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

server.listen(8080);
console.log('Listening on http://localhost:8080');
