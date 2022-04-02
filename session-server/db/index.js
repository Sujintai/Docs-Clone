
const mongoose = require('mongoose')

mongoose
    .connect(process.env.DB_CONNECT, { useNewUrlParser: true })
    .catch(e => {
        console.error('Connection error: ', e.message)
    })

const db = mongoose.connection

module.exports = db

