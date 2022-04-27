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
  Docname.search({ query_string: {
    query: req.query.q
  }}, function(err,results) {
    console.log(err)
    console.log(results)
  });
    res.send("Ok")
}

suggest = async (req,res) => {
  console.log(req.query)
  console.log(req.query.q)
  res.send("Ok")
}

module.exports = {
  search,
  suggest
}
