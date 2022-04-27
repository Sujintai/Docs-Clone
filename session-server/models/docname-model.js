const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DocnameSchema = new Schema(
    {
        name: String,
        id: String,
        content: String
    },
    { timestamps: true },
)

module.exports = mongoose.model('Docname', DocnameSchema)
