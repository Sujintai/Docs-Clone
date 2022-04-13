const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DocSchema = new Schema(
    {
        _id: String,
        _o: { type: Schema.Types.ObjectId },
        _m: {
            ctime: Number,
            mtime: Number
        }
    },
    { timestamps: true },
)

module.exports = mongoose.model('Doc', DocSchema)
