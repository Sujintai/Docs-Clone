const express = require('express')
const AppController = require('../controllers/app-controller')
const router = express.Router()
const path = require('path');

router.get('/index/search/', AppController.search)
router.get('/index/suggest/', AppController.suggest)




module.exports = router
