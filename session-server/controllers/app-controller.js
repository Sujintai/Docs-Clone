const Doc = require('../models/doc-model');
const Docname = require("../models/docname-model");
const User = require("../models/user-model");
const Media = require("../models/media-model");
const path = require('path');
const util = require('util');
const cycle = require('../cycle/cycle.js');
const { convert } = require('html-to-text');
const axios = require('axios');

const WebSocket = require('ws');
var sharedb = require('sharedb/lib/client');
const richText = require('rich-text')
sharedb.types.register(richText.type)
QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;
/*
// CONNECT REDIS
const redis = require('redis');
const redisClient = redis.createClient();
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', function() {
  console.log('Connected to Redis!');
});
redisClient.connect();
*/
opcount = 0;
hash = 0;
clients = [];
activeDocuments = sessionManager[hash].activeDocuments; // activeDocuments[docid] = clients[]
//  ...   (Delta event stream)
// Start Delta event stream connection to server (GET request).
connect = async (req,res) => {
    res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
    const { docid, uid } = req.params;
    console.log(`Start Connect: ${docid} ${uid}`);

    

    // SETUP OT Connection for user
    // Open WebSocket connection to ShareDB server
    //var socket = new ReconnectingWebSocket('ws://' + window.location.host);
    let hash = Number("0x" + docid.slice(-2)) % process.env.NUMBER_OF_SERVERS_SHAREDB; // Number between 0 to Number_of_servers-1 inclusive
    let shareDBport = parseInt(process.env.SHAREDB_PORT) + hash;
    let shareDBLocation = process.env.SHAREDB_SERVER + shareDBport;
    console.log(shareDBLocation);
    let socket = new WebSocket(shareDBLocation);
    let connection = new sharedb.Connection(socket);
    let doc = connection.get('docs', docid);
    let presence = connection.getDocPresence('docs', docid);
    let localPresence = presence.create(uid);
    //console.log(`subscribing ${docid} ${uid}`);
    doc.subscribe(initializePresence);
    

    // When document changes (by this client or any other, or the server),
    // update the oplist
    doc.on('op', function (op, source) {
      
      if (source) { // if op was users own op
        // Return ack
        //opcount += 1;
        //console.log(`Own Op detected: version:${doc.version} opcount:${opcount}`);
        //console.log(op);
        const data = `data: {"ack": ${JSON.stringify(op)}}\n\n`;
        //console.log(data);

        res.write(data); // Return ack data to client
        return;
      }
      //console.log(`External Op detected: version:${doc.version}`);
      //console.log(op);
      //console.log(doc.data);
      if (op.ops) { // If for some reason op isnt in the form [{ retain:100 }, {insert:'t'}] and it is in the form {ops: [{ retain:100 }, {instert:'t'}]}
        op = op.ops;
      }
      const data = `data: ${JSON.stringify(op)}\n\n`;
      res.write(data); // Return updated data to client
      //console.log(data);
    });
    
    function initializePresence() {
      // Doc is subscribed, initial value should be present
      console.log(`Doc subscribed, initializing presence...`);
      initializeConnection();
      //presence.subscribe(initializeConnection);

      // When presence changes
      presence.on('receive', function(id, value) { 
        console.log(`id:${id} value:${JSON.stringify(value)}`)
        let presence = {
          id,
          cursor: value
        };
        const data = `data: {"presence": ${JSON.stringify(presence)}}\n\n`;
        res.write(data); // Return presence data to client
      });
    }

    async function initializeConnection() {
      // Doc is subscribed, initial value should be present
      console.log(`Presence subscribed, initializing doc...`);
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
        
        console.log("Setup client tracking")
        activeDocuments[docid] = []; // setup client tracking
        activeDocuments[docid].version = doc.version; // setup version tracking
        activeDocuments[docid].doc = doc; // setup version tracking
        let docname = await Docname.findOne({ id:doc.id});
        console.log(`docname: ${docname}`)
        activeDocuments[docid].Docname = docname; // Setup search index tracking
        //opcount = doc.version;
      }
      //activeDocuments[docid].doc = doc; // Save doc for later, doc is now initialized
      createStream();
    }

    async function createStream() {
      // Create HTTP Event Stream
      const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      };
      res.writeHead(200, headers);
      
      // Track new client
      //let currentUser = await User.findOne({ _id: req.userId });
      let name = req.name;
      //console.log(`User's name: ${name}`); // Get user's name
      const client = {
        connection,
        doc,
        presence,
        localPresence,
        name,
        res
      };
      activeDocuments[docid][uid] = client;
      //console.log(activeDocuments);

      // REDIS
      /*
      let rediskey = docid + "," + uid;
      let decycled = JSON.decycle(doc);
      console.log(doc);
      await redisClient.set(rediskey, JSON.stringify(JSON.decycle(doc)));
      const value = await redisClient.get(rediskey);
      //let newClient = JSON.retrocycle(JSON.parse(doc));
      //return client.res.write();
      //console.log(JSON.retrocycle(JSON.parse(value)));
      */
      console.log(`Connected new client: docid:${docid} uid:${uid}`);
      console.log(doc.data.ops);
      // Send initial oplist (CORRECT)
      let data = `data: {"content": ${JSON.stringify(doc.data.ops)}, "version": ${activeDocuments[docid].doc.version}}\n\n`;
      res.write(data);
      console.log(data);

      // Manage client close connection
      req.on('close', () => {
          console.log(`Connection closed: docid:${docid} uid:${uid}`);
          if (activeDocuments[docid][uid]) {
            res.end();
            //clients[id].socket.close();
            //clients[id].res.send();
            // TODO
            //activeDocuments[docid][uid].doc.unsubscribe();
            //activeDocuments[docid][uid].doc.connection.close();
            //activeDocuments[docid][uid].res.send();
            //activeDocuments[docid][uid] = null;
          }

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
op = (req,res) => { // NOT ASYNC, if problems occur make it async again, //max 1.6pts without async // async might be too fast and cause issues with version
    res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
    try {
      const { docid, uid } = req.params;
      console.log(`Function: Op received: by ${uid}` )
      // REDIS
      /*
      let rediskey = docid + "," + uid;
      let value = await redisClient.get(rediskey);
      //console.log(value);
      let redisDoc = JSON.parse(JSON.retrocycle(value));
      console.log(redisDoc);
      redisDoc.submitOp(req.body.op)
      */

      if (!activeDocuments[docid] || !activeDocuments[docid][uid] || !req.body) { // Check if valid id
        console.log(`activeDocuments[docid]:${activeDocuments[docid]}`);
        //console.log(`activeDocuments[docid][uid]:${activeDocuments[docid][uid]}`);
        return res.json({
          error: true,
          message: `Invalid inputs for Op function`
        });
      }
      //activeDocuments[docid][uid].doc.submitOp([{retain: 5}, {insert: ' ipsum'}]);
      /*ops = [
        [{'retain': 5}, {'insert': 'a'}],
        [{'retain': 4}, {'delete': 10}],
        [{'insert': 'Hello', 'attributes': {'bold': true}}]
      ];*/
      const { version, op } = req.body;
      if (!version || !op) {
        return res.status(200).json({ error:true, message:"bad input. no version or op"})
      }
      docVersion = activeDocuments[docid][uid].doc.version;
      serverVersion = activeDocuments[docid].version;
      // Check if version is synced
      console.log(`versions: doc.version:${docVersion} server.version:${serverVersion}`)
      if ((serverVersion == docVersion) && (version == docVersion)) { // make sure doc and server are same version, AND user version matches doc version
        activeDocuments[docid].version = activeDocuments[docid].version + 1; // increment server version
        activeDocuments[docid][uid].doc.submitOp(op, async function(err) {
          // Check for id to see if id is being watched
          let cached = activeDocuments[docid].watched;
          console.log(`cached: ${cached}`)
          activeDocuments[docid].mostRecentOps = activeDocuments[docid][uid].doc.data.ops;
          console.log(`Most recent ops stored: ${activeDocuments[docid].mostRecentOps}`);
          if (cached == "T") { // T if being watched, F if not being watched
            // Doc already being watched
            console.log("already being watched")
          } else {
            console.log("set up watching")
            // Let other processes know that this docid is being tracked
            activeDocuments[docid].watched = "T";
            // Set timer
            setTimeout(() => {
              console.log("Delayed for 10 seconds.");
              // Stopped tracking docid, let other process handle new reqs
              activeDocuments[docid].watched = "F";
              // Index
              // Update search index

              axios({
                method: 'post',
                url: process.env.SEARCH_SERVER + '/index/index',
                headers: {'Content-Type': 'application/json'},
                data: { 
                  docid,
                  ops: activeDocuments[docid].mostRecentOps
                }
              }).catch(function (error) {
                console.log(error);
              });
            }, 5000);
          }
          /*let converter = new QuillDeltaToHtmlConverter(activeDocuments[docid][uid].doc.data.ops, {});
          let html = converter.convert(); // Convert ops to html 
          activeDocuments[docid].Docname.content = convert(html, {wordwrap: false });
          try {
            activeDocuments[docid].Docname.save(function(err) {
              if (err) {
                  console.log(err);
              }
              console.log("Saved docname") 
            });    
          } catch(err) {
            console.log("Error saving docname")
          } 
          */
        }); // submitop to specific user's doc
      } else {
        /*while (activeDocuments[docid][uid].doc.version !== activeDocuments[docid].version) {
          console.log(`stalling version:${version} docversion:${activeDocuments[docid][uid].doc.version} serverVersion:${activeDocuments[docid].version} op:${JSON.stringify(op)}`)
          await new Promise(resolve => setTimeout(resolve, 10)); // stall time to let doc versions match before asking them to retry
        }*/
        console.log(`Op not Submitted, invalid version, retry. version:${version} docversion:${docVersion} serverVersion:${serverVersion} op:${JSON.stringify(op)}`);
        return res.status(200).json({
          status: "retry"
        });
      }

      // Version in sync, submit op and update version
      console.log(op);
      //console.log(`Submitting Op version:${activeDocuments[docid].version}` )
      //activeDocuments[docid].version += 1;
      //activeDocuments[docid][uid].doc.submitOp(op);

      console.log(`Op submitted: NEW version:${activeDocuments[docid].version}`)
      //doc.submitOp(); //.res.write(`content: ${JSON.stringify({num: 1})}\n\n`); // res.write() instead of res.send()
      //doc.submitOp([{retain: 5}, {insert: ' ipsum'}]); //.res.write(`content: ${JSON.stringify({num: 1})}\n\n`); // res.write() instead of res.send()
      return res.status(200).json({
        status: "ok"
      });
    } catch (err) {
      console.log(err)
      return res.status(200).json({
        error: true,
        message: `Invalid inputs for Op function`
      });
    }
    
}    

//   { index, length }   {} 
// Submit a new cursor location index and selection length.
// The presence object is of the form { id, cursor } where cursor is of the form 
// { index, length, name }, corresponding to the UID of the document session that
// sent the cursor, the cursor index, selection length, and name of the user of the
// corresponding document session.
presence = async (req,res) => {
  res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
  const { docid, uid } = req.params;
  console.log("Function: Presence received:" )
    if (!activeDocuments[docid] || !activeDocuments[docid][uid] || !req.body) { // Check if valid id
      console.log(`activeDocuments[docid]:${activeDocuments[docid]}`);
      //console.log(`activeDocuments[docid][uid]:${activeDocuments[docid][uid]}`);
      return res.status(200).json({
        error: true,
        message: `Invalid inputs for Presence: docid:${docid} id:${uid}`
      });
    }

  if (isNaN(req.body.index) || isNaN(req.body.length)) {
    console.log(`Invalid input body index:${req.body.index} length:${req.body.length}`)
    return res.status(200).json({
      error: true,
      message: "Invalid input body"
    });
  }

  // Valid inputs
  const { index, length } = req.body;
  let name = activeDocuments[docid][uid].name;
  console.log("Submitting Presence" )
  activeDocuments[docid][uid].localPresence.submit({ index, length, name });
  
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

//  (file)     { mediaid }
// Save uploaded file and its mime type and return its ID.
mediaUpload = async (req,res) => {
  res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
  console.log("Uploading file:")
  //console.log(req.files)
  /*
  [
  {
    fieldname: '',
    originalname: 'blue.PNG',
    encoding: '7bit',
    mimetype: 'image/png',
    destination: './uploads',
    filename: 'blue.PNG',
    path: 'uploads\\blue.PNG',
    size: 957973
  }
  ]
  */
  if (!req.files[0]) {
    return res.status(200).json({
      error:true,
      message:"Only images allowed"
    })
  }

  let { filename, mimetype, path } = req.files[0];
  // Save media data to mongo
  let newMedia = new Media({
    filename, mimetype, path
  });
  let savedMedia = await newMedia.save();
  return res.status(200).json({
    mediaid: savedMedia.filename
  });
} 

//  Return the contents of a previously uploaded media file (GET request).
mediaAccess = async (req,res) => {
  res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
  const mediaid = req.params.mediaid;
  console.log("Accessing file:")
  
  // Get image data
  let media = await Media.findOne({ _id: mediaid });
  if (!media) {
    return res.status(200).json({
      error: true,
      message: "Invalid id"
    });
  }
  console.log(media);
  res.contentType(media.mimetype);
  res.sendFile(path.join(__dirname, '..', 'uploads', media.filename));
} 

module.exports = {
    connect,
    op,
    getDoc,
    presence,
    mediaUpload,
    mediaAccess
}
