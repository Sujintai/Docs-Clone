const express = require('express')
const AppController = require('../controllers/app-controller')
const UserController = require('../controllers/user-controller')
const CollectionController = require('../controllers/collection-controller')

const auth = require('../auth')
const router = express.Router()
const path = require('path');

router.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, 'static/home.html'));
});
router.get("/dist/bundle.js", function(req, res) {
  res.sendFile(path.join(__dirname, 'static/dist/bundle.js'));
});


router.post('/users/login', UserController.loginUser)
router.post('/users/logout', UserController.logoutUser)
router.post('/users/signup', UserController.registerUser)
router.get('/users/verify', UserController.verifyEmail)

router.post('/collection/create', auth.verify, CollectionController.createDoc) // TODO 
router.post('/collection/delete', auth.verify, CollectionController.deleteDoc) // TODO
router.get('/collection/list', auth.verify, CollectionController.listDocs) // TODO

router.post('/media/upload', auth.verify, upload.any(), AppController.mediaUpload) // TODO
router.get('/media/access/:mediaid', auth.verify, AppController.mediaAccess) // TODO

router.get('/doc/edit/:docid', auth.verify, function(req,res) {
  res.sendFile(path.join(__dirname, 'static/index.html'));
});
router.get('/doc/connect/:docid/:uid', auth.verify, AppController.connect) // Needs modification
router.post('/doc/op/:docid/:uid', auth.verify, AppController.op) // Implement presence, list of users and cursor locations
router.post('/doc/presence/:docid/:uid', auth.verify, AppController.presence) // TODO
router.get('/doc/get/:docid/:uid', auth.verify, AppController.getDoc) // Needs modification
router.get('/home', auth.verify, function(req,res) {
  res.sendFile(path.join(__dirname, 'static/home.html'));
});
// logged in users, links to /doc/edit/DOCID for the most-recently modified 10 documents along with "delete" links for them, a form field to create new documents (via the /collection/create call), and a Logout button.





module.exports = router
