
module.exports = function (app, models, mongoose) {

	app.get('/', ensureAuthenticated, function(req, res){

		if(req.user){
		  	models.User.findOne({"userId": req.user.username}, function(err, user){
			  	if (user != null) {
			  		console.log('Found the User:' + user.displayName);
			  		res.render('index', { 'user': req.user, 'projects':user.projects });
				}else{
					console.log('Cannot Find the User');
					res.render('index', { 'user': req.user });
				}
		  	});
		  }else{
		  	res.render('index', { 'user': req.user });
		  }
	  
	});

	app.get('/project/:id', ensureAuthenticated, function(req, res){
	  models.Project.findOne({"_id": req.params.id}, function(err, project){
		  	if (project != null) {
		  		console.log('Found the Project:' + project.name);
		  		res.render('project', { user: req.user, project:project });
			}else{
				console.log('Cannot Find the Project');
			}
		});

	  
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