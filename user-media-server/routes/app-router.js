const express = require('express')
const AppController = require('../controllers/app-controller')
const UserController = require('../controllers/user-controller')
//const CollectionController = require('../controllers/collection-controller')

const auth = require('../auth')
const router = express.Router()
const path = require('path');
const md5 = require("md5");
const crypto = require('crypto');

//var httpProxy = require('http-proxy');
//var proxy = httpProxy.createProxyServer(options);

const { createProxyMiddleware } = require('http-proxy-middleware');
const customRouter = function (req) {
    console.log("custom routed:")
    //let hash = crypto.createHash('sha1').update(req.params.docid).digest('base64');
    let hash = Number("0x" + req.params.docid.slice(-2)) % process.env.NUMBER_OF_SERVERS_OP;
    console.log(`routed: docid:${req.params.docid} uid:${req.params.uid} to hash:${hash}`)
    let port = 4000 + hash // new port
    let address = 'http://209.94.58.107:' + port.toString();
    console.log(address);
    return address // protocol + host
    
};

const options = {
  target: 'http://209.94.58.107:4000',
  changeOrigin: true,
  router: customRouter
};
const myProxy = createProxyMiddleware(options);
//const opProxy = createProxyMiddleware(options);

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

router.get('/doc/connect/:docid/:uid', auth.verify, myProxy, AppController.mediaAccess)
router.post('/doc/op/:docid/:uid', auth.verify, myProxy, function(req,res) {
    console.log("hey")
})
router.post('/doc/presence/:docid/:uid', auth.verify, myProxy)
router.get('/doc/get/:docid/:uid', auth.verify, myProxy)


module.exports = router
