module.exports = function (app, models) {

	app.get('/', ensureAuthenticated, function(req, res){
		res.render('index');
	});

	app.get('/login', function(req, res){
	  	res.render('login');
	});

	app.get('/logout', function(req, res){
	    req.logout();
	    res.redirect('/');
	});

	// Simple route middleware to ensure user is authenticated.
	//   Use this route middleware on any resource that needs to be protected.  If
	//   the request is authenticated (typically via a persistent login session),
	//   the request will proceed.  Otherwise, the user will be redirected to the
	//   login page.
	function ensureAuthenticated(req, res, next) {
	  if (req.isAuthenticated()) { 
	  	return next(); 
	  }
	  res.redirect('/login');
	}
}