
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

/*
 * GET pad.
 */

exports.pad = function(req, res){
  res.render('pad', { title: 'Colloborative Code Editor' });
};
