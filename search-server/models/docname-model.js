const mongoose = require('mongoose')
const mongoosastic = require("mongoosastic");
const Schema = mongoose.Schema

const DocnameSchema = new Schema(
    {
        name: { type:String, es_indexed:true },
        id: { type:String, es_indexed:true },
        content: { type:String, es_indexed:true }
    },
    { timestamps: true },
);

DocnameSchema.plugin(mongoosastic/*, {
    clientOptions: {
      nodes: [
        'http://194.113.74.36'
      ]
    }
}*/);
let Docname = mongoose.model('Docname', DocnameSchema);
Docname.createMapping(function(err, mapping){  
    if(err){
      console.log('error creating mapping (you can safely ignore this)');
      console.log(err);
    }else{
      console.log('mapping created!');
      console.log(mapping);
    }
  });
Docname.synchronize();
module.exports = mongoose.model('Docname', DocnameSchema)
