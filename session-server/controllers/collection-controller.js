const mongoose = require('mongoose');
const Doc = require('../models/doc-model');
const Docname = require('../models/docname-model');
const sharedb = require('sharedb/lib/client');
const richText = require('rich-text');
const WebSocket = require('ws');
sharedb.types.register(richText.type);

//  { name } { docid } Create a new document.
createDoc = async (req,res) => {
    res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
    if (!req.body || !req.body.name) {
        return res.status(200).json({
            error: true,
            message: "Bad input"
        })
    }
    let name = req.body.name;

    console.log("Create Doc:")
    
    /*
    // Create initial doc in mongo
    let newDoc = await Doc.create({ name:name });
    let docid = newDoc._id;
    //console.log(newDoc);
    */

    // Create doc in sharedb using mongo docid
    let docid = mongoose.Types.ObjectId().toString(); // Generate docid as STRING
    console.log("Doc id %s", docid)
    let hash = Number("0x" + docid.slice(-2)) % process.env.NUMBER_OF_SERVERS_SHAREDB; // Number between 0 to Number_of_servers-1 inclusive
    let shareDBport = parseInt(process.env.SHAREDB_PORT) + hash;
    let shareDBLocation = process.env.SHAREDB_SERVER + shareDBport;
    console.log(shareDBLocation);
    let socket = new WebSocket(shareDBLocation);
    let connection = new sharedb.Connection(socket);
    let doc = connection.get('docs', docid);
    doc.fetch(initializeDoc);
    async function initializeDoc() {
        // Doc is fetched, initial value should be present
        console.log(`Doc fetched, initializing doc...`);
        if (!doc.type) {
          // Doc doesn't already exist on server, create new one
          console.log(`Doc doesn't already exist, Creating new one...`);
          doc.create([{insert: ''}], 'http://sharejs.org/types/rich-text/v1', async () => {
            let savedDoc = await Doc.findOne({ _id: docid });
            if (!savedDoc) {
                return res.status(200).json({
                    error: true,
                    message: "Doc created, but not found in db for some reason."
                })
            }
            // Add docname to mongo docname pairs
            let docnamepair = new Docname({ name, id: docid , content:""});
            let savedDocnamepair = await docnamepair.save();
            if (!savedDocnamepair) {
                return res.status(200).json({
                    error: true,
                    message: "Doc created in sharedb, but not saved in docnames."
                })
            }
            console.log("Doc created.");
            console.log(doc.data.ops);
            //doc.submitOp([{retain: 5}, {insert: ' ipsum'}])
            return res.status(200).json({
                message: "Doc created.",
                docid: savedDoc._id
            });
          })
          
        } else {
          // Doc already exists on server
          console.log(`Doc already exists on server. This shouldnt happen at all.`);
          console.log(doc.data.ops);
          return res.status(200).json({
            error: true,
            message: "Doc already exists. This shouldnt happen at all."
          })
        }
        //activeDocuments[id].doc = doc; // Save doc for later, doc is now initialized
      }
}   

//  { docid } {} Delete an existing document.
deleteDoc = async (req,res) => {
    res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
    if (!req.body || !req.body.docid) {
        return res.status(200).json({
            error: true,
            message: "Bad input"
        })
    }
    let docid = req.body.docid;
    console.log("Delete Doc:")
    try {
        // Get Doc from Mongo
        let docToDelete = await Doc.findOne({ _id: docid });
        if (!docToDelete) {
            // Doc not found in mongo
            return res.status(200).json({
                error: true,
                message: "Bad input"
            })
        }
        // Doc exists in mongo

        // Delete doc from sharedb
        let hash = Number("0x" + docid.slice(-2)) % process.env.NUMBER_OF_SERVERS_SHAREDB; // Number between 0 to Number_of_servers-1 inclusive
        let shareDBport = parseInt(process.env.SHAREDB_PORT) + hash;
        let shareDBLocation = process.env.SHAREDB_SERVER + shareDBport;
        console.log(shareDBLocation);
        let socket = new WebSocket(shareDBLocation);
        let connection = new sharedb.Connection(socket);
        console.log(docToDelete._id)
        let doc = connection.get('docs', docid);
        //console.log(doc);
        doc.destroy(async function(error) {
            if (error) {
                // Error deleting doc in sharedb
                console.log("doc.del callback contains error")
                return res.status(200).json({
                    error: true,
                    message: error
                })
            } else {
                // Successfully deleted in sharedb
                // Delete from mongo
                deleted = await Doc.deleteOne({ _id: docid}); // Delete actual doc
                deletedname = await Docname.deleteOne({ id: docid}); // Delete namepair
                //console.log(deleted)
                if (!deleted || !deletedname) {
                    console.log("Error deleting doc from mongo.")
                    return res.status(200).json({
                        error: true,
                        message: "Error deleting doc from mongo."
                    })
                } else {
                    console.log("Doc deleted")
                    return res.status(200).json({
                        message: "Doc deleted"
                    })
                }
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(200).json({
            error: true,
            message: "Bad input"
        })
    }
    
    
    
    
}   

//  {}    [{ id, name }, ...]
// Return a list of the most-recently modified 10 documents sorted in reverse chronological order.
listDocs = async (req,res) => {
    res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
    console.log("List Docs:")
    
    // Find 10 most recent docs sorted by most recent
    let docs = await Doc.find({}, "_id").sort({ "_m.mtime": 'desc' }).limit(10);
    let docsArr = [];
    for(var i = 0; i < docs.length; i++) {
        // Find and append each docname pair
        let docnamepair = await Docname.findOne({ id: docs[i]._id }, "id name");
        docsArr.push(docnamepair);
    } 
    return res.status(200).json(
        docsArr
    )
  }   

module.exports = {
    createDoc,
    deleteDoc,
    listDocs
}
