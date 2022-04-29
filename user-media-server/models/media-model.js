const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const MediaSchema = new Schema(
    {
        filename: String,
        mimetype: String,
        path: String

    },
    { timestamps: true },
)

module.exports = mongoose.model('Media', MediaSchema)
