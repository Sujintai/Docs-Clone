const Doc = require('../models/doc-model');
const Docname = require("../models/docname-model");
const WebSocket = require('ws');
var sharedb = require('sharedb/lib/client');
const richText = require('rich-text')
sharedb.types.register(richText.type)
QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;

hash = 0;
clients = [];
activeDocuments = sessionManager[hash].activeDocuments; // activeDocuments[docid] = clients[]
//  ...   (Delta event stream)
// Start Delta event stream connection to server (GET request).
connect = async (req,res) => {
    res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
    const { docid, uid } = req.params;

    // Add user to session manager
    // SETUP OT Connection for user
    // Open WebSocket connection to ShareDB server
    //var socket = new ReconnectingWebSocket('ws://' + window.location.host);
    //let socket = new WebSocket('ws://localhost:8080');
    let connection = new sharedb.Connection(socket);
    let doc = connection.get('docs', docid);
    let presence = connection.getDocPresence('docs', docid);

    doc.subscribe(initializeConnection);
    

    // When document changes (by this client or any other, or the server),
    // update the oplist
    doc.on('op', function (op, source) {
      if (source) { // if op was users own op
        // Return ack
        console.log("Own Op detected: ");
        //console.log(source);
        const data = `data: { ack: ${JSON.stringify(op)}}\n\n`;
        res.write(data); // Return ack data to client
        return;
      }
      console.log("External Op detected: ");
      console.log(op);
      //console.log(doc.data);
      const data = `data: ${JSON.stringify(op)}\n\n`;
      res.write(data); // Return updated data to client
      console.log(data);
    });
    
    function initializePresence() {
      // Doc is subscribed, initial value should be present
      console.log(`Doc subscribed, initializing doc...`);
      if (!doc.type) {
        console.log("Doc doesnt exist for some reason. Error.")
        return res.status(200).json({
          error: true,
          message: "Doc doesnt exist for some reason."
        });
      }
      console.log(`Doc exists on server`);
      //console.log(doc.data.ops);
      //console.log(doc);
      if (!activeDocuments[docid]) { // if doc was inactive
        activeDocuments[docid] = []; // setup client tracking
        activeDocuments[docid].version = doc.version; // setup version tracking
      }
      //activeDocuments[docid].doc = doc; // Save doc for later, doc is now initialized
      createStream();
    }

    function initializeConnection() {
      // Doc is subscribed, initial value should be present
      console.log(`Doc subscribed, initializing doc...`);
      if (!doc.type) {
        console.log("Doc doesnt exist for some reason. Error.")
        return res.status(200).json({
          error: true,
          message: "Doc doesnt exist for some reason."
        });
      }
      console.log(`Doc exists on server`);
      //console.log(doc.data.ops);
      //console.log(doc);
      if (!activeDocuments[docid]) { // if doc was inactive
        activeDocuments[docid] = []; // setup client tracking
        activeDocuments[docid].version = doc.version; // setup version tracking
      }
      //activeDocuments[docid].doc = doc; // Save doc for later, doc is now initialized
      createStream();
    }

    function createStream() {
      // Create HTTP Event Stream
      const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      };
      res.writeHead(200, headers);
      
      // Track new client
      //clientId = Math.random().toString(36).substring(2);
      //clientId = id;
      //console.log(socket);
      //console.log(connection);
      //console.log(doc);
      const client = {
        connection,
        doc,
        res
      };
      activeDocuments[docid][uid] = client;
      console.log(`Connected new client: docid:${docid} uid:${uid}`);
      console.log(doc.data.ops);
      // Send initial oplist (CORRECT)
      let data = `data: {"content": ${JSON.stringify(doc.data.ops)}, "version": ${doc.version}}\n\n`;
      res.write(data);
      console.log(data);

      // Manage client close connection
      req.on('close', () => {
          console.log(`Connection closed: docid:${docid} uid:${uid}`);
          if (activeDocuments[docid][uid]) {
            //clients[id].socket.close();
            //clients[id].res.send();
            // TODO
            //activeDocuments[docid][uid].doc.unsubscribe();
            //activeDocuments[docid][uid].connection.close();
            //activeDocuments[docid][uid].res.send();
            //activeDocuments[docid][uid] = null;
          }
          
          //delete clients[id];
          // TODO: if no more active clients, remove doc?
          // Store doc in mongo
          // doc.destroy([callback]) // Destroys doc
          // TODO: Check and remove OT connection too , jk maybe dont have to
      });
    }
  
  
    //return res.status(200)
}

// { version, op }  { status }
// Submit a new Delta op for document with given version.
op = (req,res) => { // NOT ASYNC, if problems occur make it async again
    res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
    const { docid, uid } = req.params;
    console.log("Function: Op received:" )
    if (!activeDocuments[docid] || !activeDocuments[docid][uid] || !req.body) { // Check if valid id
      console.log(`activeDocuments[docid]:${activeDocuments[docid]}`);
      //console.log(`activeDocuments[docid][uid]:${activeDocuments[docid][uid]}`);
      return res.status(200).json({
        error: true,
        message: `Invalid inputs for Op: docid:${docid} id:${uid}`
      });
    }
    //activeDocuments[docid][uid].doc.submitOp([{retain: 5}, {insert: ' ipsum'}]);
    /*ops = [
      [{'retain': 5}, {'insert': 'a'}],
      [{'retain': 4}, {'delete': 10}],
      [{'insert': 'Hello', 'attributes': {'bold': true}}]
    ];*/
    const { version, op } = req.body;

    // Check if version is synced
    if (version !== activeDocuments[docid].version) {
      console.log(`Op not Submitted, invalid version, retry. version:${version} docversion: ${activeDocuments[docid].version}`);
      return res.status(200).json({
        status: "retry"
      });
    }

    // Version in sync, submit op and update version
    console.log(op);
    activeDocuments[docid][uid].doc.submitOp(op);
    activeDocuments[docid].version += 1;
    console.log("Op Submitted" )
    //doc.submitOp(); //.res.write(`content: ${JSON.stringify({num: 1})}\n\n`); // res.write() instead of res.send()
    //doc.submitOp([{retain: 5}, {insert: ' ipsum'}]); //.res.write(`content: ${JSON.stringify({num: 1})}\n\n`); // res.write() instead of res.send()
    return res.status(200).json({
      status: "ok"
    });
}    

// ...          (html)
// Return the HTML of the current document.
getDoc = async (req,res) => {
    res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
    const { docid, uid } = req.params;
    console.log("Get Doc")
    //console.log(clients[id])
    if (!activeDocuments[docid] || !activeDocuments[docid][uid]) { // Check if valid id
      console.log(`activeDocuments[docid]: ${activeDocuments[docid]}`)
      console.log("invalid input")
      return res.status(200).json({
        error: true,
        message: "Invalid input"
      });
    }

    var cfg = {};

    var converter = new QuillDeltaToHtmlConverter(activeDocuments[docid][uid].doc.data.ops, cfg);

    html = converter.convert(); 
    return res.status(200).send(html);
}   

//   { index, length }   {} 
// Submit a new cursor location index and selection length.
presence = async (req,res) => {
  res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
  const id = req.params.id;
  console.log("Get Doc")
  //console.log(clients[id])
  if (!clients[id]) { // Check if valid id
    console.log(clients[id])
    console.log("invalid id")
    return res.status(400).send();
  }

  var cfg = {};

  var converter = new QuillDeltaToHtmlConverter(clients[id].doc.data.ops, cfg);

  html = converter.convert(); 
  return res.status(200).send(html);
}   

//  (file)     { mediaid }
// Save uploaded file and its mime type and return its ID.
mediaUpload = async (req,res) => {
  res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
  const id = req.params.id;
  console.log("Get Doc")
  //console.log(clients[id])
  if (!clients[id]) { // Check if valid id
    console.log(clients[id])
    console.log("invalid id")
    return res.status(400).send();
  }

  var cfg = {};

  var converter = new QuillDeltaToHtmlConverter(clients[id].doc.data.ops, cfg);

  html = converter.convert(); 
  return res.status(200).send(html);
} 

//  Return the contents of a previously uploaded media file (GET request).
mediaAccess = async (req,res) => {
  res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
  const id = req.params.id;
  console.log("Get Doc")
  //console.log(clients[id])
  if (!clients[id]) { // Check if valid id
    console.log(clients[id])
    console.log("invalid id")
    return res.status(400).send();
  }

  var cfg = {};

  var converter = new QuillDeltaToHtmlConverter(clients[id].doc.data.ops, cfg);

  html = converter.convert(); 
  return res.status(200).send(html);
} 

module.exports = {
    connect,
    op,
    getDoc,
    presence,
    mediaUpload,
    mediaAccess
}
