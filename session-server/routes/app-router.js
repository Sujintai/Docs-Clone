const express = require('express')
const AppController = require('../controllers/app-controller')
const router = express.Router()

router.get('/connect/:id', AppController.connect)
router.post('/op/:id', AppController.op)
router.get('/doc/:id', AppController.doc)

module.exports = router
