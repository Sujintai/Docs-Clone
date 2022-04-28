const express = require('express')
const AppController = require('../controllers/app-controller')
const UserController = require('../controllers/user-controller')
//const CollectionController = require('../controllers/collection-controller')

const auth = require('../auth')
const router = express.Router()
const path = require('path');

router.post('/users/login', UserController.loginUser)
router.post('/users/logout', UserController.logoutUser)
router.post('/users/signup', UserController.registerUser)
router.get('/users/verify', UserController.verifyEmail)
/*
router.post('/collection/create', auth.verify, CollectionController.createDoc) 
router.post('/collection/delete', auth.verify, CollectionController.deleteDoc)
router.get('/collection/list', auth.verify, CollectionController.listDocs)
*/
router.post('/media/upload', auth.verify, upload.any(), AppController.mediaUpload)
router.get('/media/access/:mediaid', auth.verify, AppController.mediaAccess)
/*
router.get('/doc/connect/:docid/:uid', auth.verify, AppController.connect)
router.post('/doc/op/:docid/:uid', auth.verify, AppController.op)
router.post('/doc/presence/:docid/:uid', auth.verify, AppController.presence)
router.get('/doc/get/:docid/:uid', auth.verify, AppController.getDoc)
*/


module.exports = router
