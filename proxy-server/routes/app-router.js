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
    let hash = Number("0x" + req.params.docid.slice(-2)) % process.env.NUMBER_OF_SERVERS_OP; // Number between 0 to Number_of_servers-1 inclusive
    let serversPerCluster = process.env.NUMBER_OF_SERVERS_OP / process.env.NUMBER_OF_CLUSTERS_OP;
    let clusterNumber = Math.floor(hash/serversPerCluster)
    let portDigit = hash % serversPerCluster; // NEW PORT: 0-15 % 8 = 0-7
    let port = 4000 + portDigit // new port
    let address = process.env.SERVER_1 + port.toString();
    switch (clusterNumber) {
      case 0:
        //port = 4000 + portDigit // new port
        address = process.env.SERVER_1 + port.toString();
        console.log(`routed: docid:${req.params.docid} uid:${req.params.uid} to hash:${hash} address: ${address}`)
        return address; // protocol + host
      case 1:
        //port = 4000 + portDigit // new port
        address = process.env.SERVER_2 + port.toString();
        console.log(`routed: docid:${req.params.docid} uid:${req.params.uid} to hash:${hash} address: ${address}`)
        return address; // protocol + host
      default:
        console.log(`Shouldn't happen. No case for proxy`);
    }
    
};

const options = {
  target:  process.env.SERVER_1 + '4000',
  changeOrigin: true,
  router: customRouter,
  onProxyReq: (proxyRes, req, res) => {
    res.on('close', () => proxyRes.destroy());
  }
};
const myProxy = createProxyMiddleware(options);
const searchProxy = createProxyMiddleware({
  target: "http://localhost:80", 
  onProxyReq: (proxyReq, req, res) => {
    console.log("hey")
    
    //console.log(proxyReq);
    //proxyReq.path = '/index/search?&q=valudog';
    const stopwords = ['i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves','he','him','his','himself','she','her','hers','herself','it','its','itself','they','them','their','theirs','themselves','what','which','who','whom','this','that','these','those','am','is','are','was','were','be','been','being','have','has','had','having','do','does','did','doing','a','an','the','and','but','if','or','because','as','until','while','of','at','by','for','with','about','against','between','into','through','during','before','after','above','below','to','from','up','down','in','out','on','off','over','under','again','further','then','once','here','there','when','where','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','s','t','can','will','just','don','should','now'];
    function remove_stopwords(str) {
      res = []
      words = str.split(' ')
      for(i=0;i<words.length;i++) {
        word_clean = words[i].split(".").join("")
        if(!stopwords.includes(word_clean)) {
            res.push(word_clean)
        }
      }
      return(res.join(' '))
    }
    let query = remove_stopwords(req.query.q);
    
    proxyReq.path = '/index/search?q=' + encodeURI(query);
  }
});
const suggestProxy = createProxyMiddleware({
  target: "http://localhost:80"
});
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

router.get('/index/search/', searchProxy)
router.get('/index/suggest/', suggestProxy)
module.exports = router