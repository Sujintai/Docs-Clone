const mongoose = require('mongoose')
const mongoosastic = require("mongoosastic");
const Schema = mongoose.Schema

const DocnameSchema = new Schema(
    {
        name: { type:String, es_indexed:true },
        id: String,
        content: { type:String, es_indexed:true }
    },
    { timestamps: true },
)

DocnameSchema.plugin(mongoosastic, {
    clientOptions: {
      nodes: [
        '194.113.74.36:9200'
      ]
    }
})

module.exports = mongoose.model('Docname', DocnameSchema)
