const express = require('express')
const AppController = require('../controllers/app-controller')
const router = express.Router()
const path = require('path');

router.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, 'static/index.html'));
  });
  router.get("/dist/bundle.js", function(req, res) {
    res.sendFile(path.join(__dirname, 'static/dist/bundle.js'));
  });
router.get('/connect/:id', AppController.connect)
router.post('/op/:id', AppController.op)
router.get('/doc/:id', AppController.getDoc)

module.exports = router
