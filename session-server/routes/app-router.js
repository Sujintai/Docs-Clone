const express = require('express')
const AppController = require('../controllers/app-controller')
const UserController = require('../controllers/user-controller')
const CollectionController = require('../controllers/collection-controller')

const auth = require('../auth')
const router = express.Router()
const path = require('path');

router.post('/collection/create', CollectionController.createDoc) // TODO 
router.post('/collection/delete', CollectionController.deleteDoc) // TODO
router.get('/collection/list', CollectionController.listDocs) // TODO

router.get('/doc/connect/:docid/:uid', AppController.connect) // Needs modification
router.post('/doc/op/:docid/:uid', AppController.op) // Implement presence, list of users and cursor locations
router.post('/doc/presence/:docid/:uid', AppController.presence) // TODO
router.get('/doc/get/:docid/:uid', AppController.getDoc) // Needs modification

// logged in users, links to /doc/edit/DOCID for the most-recently modified 10 documents along with "delete" links for them, a form field to create new documents (via the /collection/create call), and a Logout button.





module.exports = router
