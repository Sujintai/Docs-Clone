

connect = async (req,res) => {
    const id = req.params.id;
    // Decide which OT Server to use based on id
    /**
     * TODO
     */
    const idHash = 0;
    let activeDocuments = sessionManager[idHash].activeDocuments;
    if (!activeDocuments[id]) {
      activeDocuments[id] = {
        clients: []
      }
    }
    let clients = activeDocuments[id].clients;
    
    // Initialize Doc
    // Create local Doc instance mapped to 'documents' collection document with id 'id'
    if (!activeDocuments[id].doc) {
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
    clientId = Math.random().toString(36).substring(2);
    const client = {
      uid: clientId,
      res
    };
    clients.push(client);
    console.log("Connected new client: " + client.uid);
    
    // Send initial oplist
    let data = `data: ${[doc.data]}\n\n`;
    res.write(data);

    // Manage client close connection
    req.on('close', () => {
        console.log(`Connection closed: ${client.uid}`);
        clients = clients.filter(client => client.uid !== clientId);
        // TODO: if no more active clients, remove doc?
        // Store doc in mongo
        // doc.destroy([callback]) // Destroys doc
        // TODO: Check and remove OT connection too , jk maybe dont have to
    });
  }
  
    //return res.status(200)
}

op = async (req,res) => {
    const id = req.params.id;
    const idHash = 0; // TODO: Implement idHash
    if (sessionManager[idHash].activeDocuments[id] && sessionManager[idHash].activeDocuments[id].doc) {
      //doc.submitOp([{p: ['numClicks'], na: 1}]);
      sessionManager[idHash].activeDocuments[id].doc.submitOp([{retain: 5}, {insert: ' ipsum'}]); //.res.write(`content: ${JSON.stringify({num: 1})}\n\n`); // res.write() instead of res.send()
      return res.status(200).send();
    } else {
      return res.status(400).send();
    }
    
}    

doc = async (req,res) => {
    const id = req.params.id;
    
}   
// ...

function test(req, res, next) {
    const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);
  
    sessionManager[id] = res;
    console.log("Connected new client: " + newClient.id);

    req.on('close', () => {
      console.log(`${clientId} Connection closed`);
      clients = clients.filter(client => client.id !== clientId);
    });
    next();
  }
  
  //app.get('/events', eventsHandler);

module.exports = {
    connect,
    op,
    doc,
    test
}
