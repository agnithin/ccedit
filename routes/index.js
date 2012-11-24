
module.exports = function (app) {

	app.get('/', function(req, res){
	  //console.log(user);
	  res.render('index', { user: req.user });
	});

	app.get('/pad', ensureAuthenticated, function(req, res){
	  res.render('pad', { user: req.user });
	});

	app.get('/login', function(req, res){
	  res.render('login', { user: req.user });
	});

	// Simple route middleware to ensure user is authenticated.
	//   Use this route middleware on any resource that needs to be protected.  If
	//   the request is authenticated (typically via a persistent login session),
	//   the request will proceed.  Otherwise, the user will be redirected to the
	//   login page.
	function ensureAuthenticated(req, res, next) {
	  if (req.isAuthenticated()) { return next(); }
	  res.redirect('/login')
	}
}