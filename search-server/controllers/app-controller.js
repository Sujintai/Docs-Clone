const Docname = require("../models/docname-model");
search = async (req,res) => {
  console.log(req.query);
  //console.log(req.query.q);
  //await new Docname({name:"testname", id:123, content:"test"}).save();
  var stream = Docname.synchronize();
  stream.on('error', function (err) {
    console.log("Error while synchronizing" + err);
  });
  if (req.query && req.query.q) {
    // Valid query
    
  }
  let result = await Docname.search({ query_string: {
    query: req.query.q
  }});
  console.log(result.body.hits);
  
  let docid = 123;
  let name = "test"
  let snippet = "<em>test</em>"
  let returnArr = [];
  let hits = result.body.hits.hits;
  console.log(hits)
  if (hits.length > 0) {
    for (var i = 0; i < hits.length; i++) {
      if (i == 10) {
        break;
      }
      console.log(`hits[i]: ${JSON.stringify(hits[i])}`)
      docid = hits[i]._source.id;
      name = hits[i]._source.name;
      let words = req.query.q.split(" ");
      console.log(words);
      for (var i = 0; i < words.length; i++) {
        let word = words[i];
        const regex = new RegExp("\\b" + word + "\\b", 'g');
        snippet = hits[i]._source.content.replaceAll(regex, "<em>" + word + "</em>");
      }
      returnArr.push({docid, name, snippet})
    }
  }
  
  res.status(200).json(returnArr);
}

suggest = async (req,res) => {
  console.log(req.query);
  //console.log(req.query.q);
  //await new Docname({name:"testname", id:123, content:"test"}).save();
  var stream = Docname.synchronize();
  stream.on('error', function (err) {
    console.log("Error while synchronizing" + err);
  });
  if (req.query && req.query.q) {
    // Valid query
    
  }
  let result = await Docname.esSearch({
    query: {
      match_phrase_prefix: {
        content: {
          query: req.query.q
        }
      }
    }
  });
  console.log(result.body.hits);
  
  let string = "<em>test</em>"
  let returnArr = [];
  let hits = result.body.hits.hits;
  console.log(hits)
  if (hits.length > 0) {
    for (var i = 0; i < hits.length; i++) {
      if (i == 10) {
        break;
      }
      console.log(`hits[i]: ${JSON.stringify(hits[i])}`)
      let idxstart = hits[i]._source.content.indexOf(req.query.q);
      let idxend = hits[i]._source.content.indexOf(" ", idxstart);
      string = hits[i]._source.content.substring(idxstart,idxend);
      returnArr.push(string)
    }
  }
  
  res.status(200).json(returnArr);
}

module.exports = {
  search,
  suggest
}
