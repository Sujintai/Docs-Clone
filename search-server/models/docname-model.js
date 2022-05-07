const mongoose = require('mongoose')
const mongoosastic = require("mongoosastic");
const Schema = mongoose.Schema
const { Client } = require('@elastic/elasticsearch')

const DocnameSchema = new Schema(
    {
        name: { type:String, es_indexed:true },
        id: { type:String, es_indexed:true },
        content: { type:String, es_indexed:true }
    },
    { timestamps: true },
);
/*
const client = new Client({
  node: 'https://cse356-2c0f5e.es.us-east4.gcp.elastic-cloud.com:9243',
  //cloud: { id: 'CSE356:dXMtZWFzdC0xLmF3cy5mb3VuZC5pbyQ3MTY0MjdlMTI2NTM0ZmIyYmZmYzZiMjQ5OGVhODNiNyQxZjIyNWQ4NDZiZTI0NDdjYjkyOTMxNjAzMDI0N2I1OQ==' },
  auth: { 
    username: 'elastic',
    password: 'InBZTOnmg20F3OHgvOv0VjIB'
  }
})
*/
DocnameSchema.plugin(mongoosastic, {
  /*esClient: client*/
});
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
