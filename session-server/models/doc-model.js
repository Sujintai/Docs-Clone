const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DocSchema = new Schema(
    {
        _id: { type: String },
        grid: { type: [String], required: true },
        winner: { type: String, required: true }, 
        start_date: { type: Date, default: Date.now() },
        _o: { type: Schema.Types.ObjectId }
    },
    { timestamps: true },
)

module.exports = mongoose.model('Doc', DocSchema)
