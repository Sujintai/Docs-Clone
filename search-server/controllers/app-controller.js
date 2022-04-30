const Docname = require("../models/docname-model");
const cache = require('memory-cache');
search = async (req,res) => {
  console.time('Search Execution Time');
  console.log(`Search: ${JSON.stringify(req.query.q)}`);
  //console.log(req.query.q);
  //await new Docname({name:"testname", id:123, content:"test"}).save();
  
  
  let cacheResult = cache.get(req.query.q);
  if (cacheResult) {
    return res.status(200).json(cacheResult);
  }
  
  var stream = Docname.synchronize();
  stream.on('error', function (err) {
    console.log("Error while synchronizing" + err);
  });
  if (req.query && req.query.q) {
    // Valid query
    
  }
  //let querywords = req.query.q.split(" ");
  //for (var i = 0; i < querywords.length; i++) {
    let result = await Docname.esSearch(
    {
      query: {
        match_phrase: {
          content: req.query.q
        }
      }
    });
  
  //console.log(result.body.hits);
  
  let docid = 123;
  let name = "test"
  let snippet = "<em>test</em>"
  let returnArr = [];
  let hits = result.body.hits.hits;
  //console.log(hits)
  if (hits.length > 0) {
    for (var i = 0; i < hits.length; i++) {
      if (i == 10) {
        break;
      }
      //console.log(`hits[i]: ${JSON.stringify(hits[i])}`)
      docid = hits[i]._source.id;
      name = hits[i]._source.name;
      content = hits[i]._source.content;

      // Get snippet
      let words = req.query.q.split(" ");
      console.log(words);
      let minIdx = content.length - 1;
      let maxIdx = 0;
      for (var x = 0; x < words.length; x++) { 
        let word = words[x];
        let currentIdx = content.indexOf(word);
        if (currentIdx < minIdx) {
          minIdx = currentIdx;
          console.log(`minidx: ${word}`);
        }
        if (currentIdx > maxIdx) {
          maxIdx = currentIdx + word.length;
          console.log(`maxidx: ${word}`);
        }  
      }
      minIdx -= 50; // Get 50 characters before first word
      if (minIdx < 0) {
        minIdx = 0;
      }
      maxIdx += 50; // Get 50 characters after last word
      if (maxIdx > content.length) {
        maxIdx = content.length;
      }
      snippet = content.substring(minIdx, maxIdx);

      // Process snippet
      for (var x = 0; x < words.length; x++) { 
        let word = words[x];
        const regex = new RegExp("\\b" + word + "\\b", 'g');
        snippet = snippet.replaceAll(regex, "<em>" + word + "</em>");
      }
      returnArr.push({docid, name, snippet})
    }
  }
  res.status(200).json(returnArr);
  cache.put(req.query.q, returnArr, 5000); // Cache result for 5 seconds

  console.timeEnd('Search Execution Time');
}

suggest = async (req,res) => {
  console.time('Suggest Execution Time');
  console.log(`Suggest: ${JSON.stringify(req.query.q)}`);
  //console.log(req.query.q);
  //await new Docname({name:"testname", id:123, content:"test"}).save();
  let cacheResult = cache.get(req.query.q);
  if (cacheResult) {
    return res.status(200).json(cacheResult);
  }
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
  
  //console.log(result.body.hits);
  
  let string = "<em>test</em>"
  let returnArr = [];
  let hits = result.body.hits.hits;
  //console.log(hits)
  if (hits.length > 0) {
    for (var i = 0; i < hits.length; i++) {
      if (i == 10) {
        break;
      }
      //console.log(`hits[i]: ${JSON.stringify(hits[i])}`)
      let idxstart = hits[i]._source.content.indexOf(req.query.q);
      let idxend = hits[i]._source.content.indexOf(" ", idxstart);
      string = hits[i]._source.content.substring(idxstart,idxend);
      returnArr.push(string)
    }
  }
  res.status(200).json(returnArr);
  cache.put(req.query.q, returnArr, 5000); // Cache result for 5 seconds

  console.timeEnd('Suggest Execution Time');
}

module.exports = {
  search,
  suggest
}
