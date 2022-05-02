const Docname = require("../models/docname-model");
const Doc = require("../models/doc-model");
QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;
const { convert } = require('html-to-text');

const cache = require('memory-cache');
const redis = require('redis');
const redisClient = redis.createClient();

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', function() {
  console.log('Connected to Redis!');
});
redisClient.connect();

search = async (req,res) => {
  console.time('Search Execution Time');
  console.log(`Search: ${JSON.stringify(req.query.q)}`);
  //console.log(req.query.q);
  //await new Docname({name:"testname", id:123, content:"test"}).save();
  
  /*
  let cacheResult = await cache.get(req.query.q);
  console.log(cacheResult)
  if (cacheResult) {
    console.log("cache")
    return res.status(200).json(cacheResult);
  }
  */
  /*
  var stream = Docname.synchronize();
  stream.on('error', function (err) {
    console.log("Error while synchronizing" + err);
  });
  */
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
  if (returnArr.length == 0) {
    return res.status(200).json([{docid,name,snippet}]);
  }
  res.status(200).json(returnArr);
  //await cache.put(req.query.q, returnArr, 5000); // Cache result for 5 seconds

  console.timeEnd('Search Execution Time');
}

suggest = async (req,res) => {
  console.time('Suggest Execution Time');
  console.log(`Suggest: ${JSON.stringify(req.query.q)}`);
  //console.log(req.query.q);
  //await new Docname({name:"testname", id:123, content:"test"}).save();
  /*
  let cacheResult = cache.get(req.query.q);
  if (cacheResult) {
    console.log("cache")
    return res.status(200).json(cacheResult);
  }
  */
  /*
  var stream = Docname.synchronize();
  stream.on('error', function (err) {
    console.log("Error while synchronizing" + err);
  });
  */
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
  if (returnArr.length == 0) {
    return res.status(200).json(["dog"]);
  }
  res.status(200).json(returnArr);
  // await cache.put(req.query.q, returnArr, 5000); // Cache result for 5 seconds

  console.timeEnd('Suggest Execution Time');
}
// params: (docid)
index = async (req,res) => {
  res.send(); // Instantly respond to req
  console.log(`Index: ${req.body.docid}`);
  /*
  // Check redis cache for id to see if another process is watching id
  let cached = await redisClient.get(req.body.docid)
  console.log(`cached: ${cached}`)
  if (cached == "T") { // T if being watched, F if not being watched
    // Another process is already watching this doc
    console.log("already being watched")
  } else {
    console.log("set up watching")
    // Let other processes know that this docid is being tracked
    await redisClient.set(req.body.docid, "T");
    // Set timer
    setTimeout(async () => {
      console.log("Delayed for 5 seconds.");
      // Stopped tracking docid, let other process handle new reqs
      await redisClient.set(req.body.docid, "F");
  */
      // Index
      // Fetch Doc
      let currentDoc = await Doc.findOne({_id:req.body.docid});
      console.log(`currentDoc: ${currentDoc}`);
      let ops = currentDoc.ops;
      console.log(`ops: ${ops[0]}`)
      // Convert Doc.ops to html
      let converter = new QuillDeltaToHtmlConverter(ops, {});
      let html = converter.convert(); // Convert ops to html 
      console.log(`html:${html}`);
      // Convert html to plaintext
      let plaintext = convert(html, {wordwrap: false });
      console.log(`plaintext: ${plaintext}`);
      // Fetch docname
      let currentDocname = await Docname.findOne({id:req.body.docid})
      console.log(currentDocname);
      // Update Docname with new content
      currentDocname.content = plaintext;
      
      try {
        currentDocname.save(function(err) {
          if (err) {
          console.log(err);
          }
          console.log("Saved docname") 
        });
      } catch(err) {
        console.log("Error saving docname")
      }
   //}, 5000)
  //}
  
  /*
  // Get ISO String, bc mongo stores ISO string
  var myDateString = new Date("2015-06-17T10:03:46Z").toISOString(); 

  let results = await Docname.find({updatedAt: { $lt: myDateString }}).exec();
  //var myDateString = Date("2016-05-18T16:00:00Z");
  console.log(results);
  */
  
}
module.exports = {
  search,
  suggest,
  index
}
