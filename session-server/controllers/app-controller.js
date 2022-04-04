const WebSocket = require('ws');
var sharedb = require('sharedb/lib/client');
const richText = require('rich-text')
sharedb.types.register(richText.type)

QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;
clients = [];


connect = async (req,res) => {
    res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
    const id = req.params.id;

    // SETUP OT SOCKETS
    // Open WebSocket connection to ShareDB server
    //var socket = new ReconnectingWebSocket('ws://' + window.location.host);
    let socket = new WebSocket('ws://localhost:8080');
    let connection = new sharedb.Connection(socket);
    let doc = connection.get('documents', 'dog');
    doc.subscribe(initializeDoc);

    // When document changes (by this client or any other, or the server),
    // update the oplist
    doc.on('op', function (op, source) {
      console.log("Op detected: ");
      console.log(op);
      //console.log(doc.data); 
      let array_of_oplists = [];
      array_of_oplists[0] = op;
      const data = `data: ${JSON.stringify(array_of_oplists)}\n\n`;
      
      if (clients[id]){
        clients[id].res.write(data); // Return updated data to client
      }
      
      
    });
    
    function initializeDoc() {
      // Doc is subscribed, initial value should be present
      console.log(`Doc subscribed, initializing doc...`);
      //console.log(doc.data); 
      if (!doc.data) {
        // Doc doesn't already exist on server, create new one
        console.log(`Doc doesn't already exist, Creating new one...`);
        doc.create([{insert: ''}], 'http://sharejs.org/types/rich-text/v1')
        console.log("Doc created.");
        console.log(doc.data);
        //doc.submitOp([{retain: 5}, {insert: ' ipsum'}])
      } else {
        // Doc already exists on server
        console.log(`Doc already exists on server`);
        console.log(doc.data);
      }
      //activeDocuments[id].doc = doc; // Save doc for later, doc is now initialized
      createStream();
    }

    

    /*
    // Initialize Doc
    // Create local Doc instance mapped to 'documents' collection document with id 'id'
    if (!doc) {
      // Doc doesn't already exist locally, create new local doc
      let connection = sessionManager[idHash].connection;
      let doc = connection.get('documents', id);
      //activeDocuments[id].doc = doc; // save doc for later
      // Get initial value of document and subscribe to changes
      doc.subscribe(initializeDoc);
      doc.on('op', updateClients);

      function initializeDoc() {
        // Doc is subscribed, initial value should be present
        console.log(`Doc subscribed, initializing doc...`);
        console.log(doc.data); 
        if (!doc.data) {
          // Doc doesn't already exist on server, create new one
          console.log(`Doc doesn't already exist, Creating new one...`);
          doc.create([{insert: 'Lorem'}], 'http://sharejs.org/types/rich-text/v1')
          console.log("Doc created.");
          console.log(doc.data);
          //doc.submitOp([{retain: 5}, {insert: ' ipsum'}])
        } else {
          // Doc already exists on server
          console.log(`Doc already exists on server`);
          console.log(doc.data);
        }
        activeDocuments[id].doc = doc; // Save doc for later, doc is now initialized
        createStream();
      }

      // When document changes (by this client or any other, or the server),
      // update the oplist
      function updateClients() {
          console.log(doc.data); 
          const data = `data: ${doc.data}\n\n`;
          // Loop through all clients and write to each
          clients.forEach(client => {
            res.write(data); // Return updated data to client
          });
          
          //doc.submitOp([{p: ['numClicks'], na: 1}]);
      };
    } else {
      // Doc already exists locally, use existing doc
      let doc = activeDocuments[id].doc
      createStream();
    }*/

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
        socket,
        connection,
        doc,
        res
      };
      clients[id] = client;
      console.log("Connected new client: " + id);
      
      // Send initial oplist
      let data = `data: {"content": ${JSON.stringify(doc.data)}}\n\n`;
      res.write(data);

      // Manage client close connection
      req.on('close', () => {
          console.log(`Connection closed: ${id}`);
          if (clients[id]) {
            clients[id].socket.close();
            clients[id].res.send();
          }
          
          delete clients[id];
          // TODO: if no more active clients, remove doc?
          // Store doc in mongo
          // doc.destroy([callback]) // Destroys doc
          // TODO: Check and remove OT connection too , jk maybe dont have to
      });
    }
  
  
    //return res.status(200)
}

op = async (req,res) => {
    res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
    const id = req.params.id;
    console.log("Function: Op received:" )
    if (!clients[id]) { // Check if valid id
      console.log("Invalid Id for Op")
      return res.status(400).send();
    }
    //console.log(req.body)
    if (req.body) {
      //doc.submitOp([{p: ['numClicks'], na: 1}]);
      /*ops = [
        [{'retain': 5}, {'insert': 'a'}],
        [{'retain': 4}, {'delete': 10}],
        [{'insert': 'Hello', 'attributes': {'bold': true}}]
      ];*/
      ops = req.body;
      newops = [].concat(...ops);
      clients[id].doc.submitOp(newops);
      console.log(ops);
      console.log("Op Submitted" )
      //console.log(JSON.stringify(ops));
      /*ops.forEach(op => {
        doc.submitOp(op);
      });*/
      //doc.submitOp(); //.res.write(`content: ${JSON.stringify({num: 1})}\n\n`); // res.write() instead of res.send()
      //doc.submitOp([{retain: 5}, {insert: ' ipsum'}]); //.res.write(`content: ${JSON.stringify({num: 1})}\n\n`); // res.write() instead of res.send()
      return res.status(200).send();
    } else {
      return res.status(400).send();
    }
    
}    

getDoc = async (req,res) => {
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
    getDoc
}
