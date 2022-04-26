
search = async (req,res) => {
  console.log(req.query);
  //console.log(req.query.q);
  if (req.query && req.query.q) {
    // Valid query

  }
  Book.search({ query: req.query.q }, function(err,results) {  
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
