
module.exports = function (app, models) {

	app.get('/', ensureAuthenticated, function(req, res){

		if(req.user){
		  	models.User.findOne({"_id": req.user._id}, function(err, user){
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
		res.render('project', { 
			'user': {
				'displayName':req.user.displayName, 
				'_id':req.user._id
				},
			'projectId':req.params.id 
		});
	});

	app.get('/project/create/:projectName', ensureAuthenticated, function(req, res){	  
		
		models.User.findById(req.user._id, function(err, user){
		  	if (user != null) {
		  		var newProject = new models.Project();
		  		var permissions = 'rw';
    			newProject.name = req.params.projectName;
    			newProject.users.push({
    				'userId': user._id, 
    				'displayName':user.displayName,
    				'permissions': permissions
    			});
    			newProject.author = req.user._id;
    			newProject.createdOn = Date.now();
    			newProject.save(function(err){
    				if(err){
    					console.log("Error while creating new project");
    				}else{
	    				user.projects.push(	{
							"projectId" : newProject._id,
							"projectName" : newProject.name,
							"permissions" : permissions
						});
						user.save(function(err){
    						if(err){
    							console.log("Error saving project to users" + err);
    						}else{
    							console.log("Successfully created a new project");
    							res.redirect('/project/'+newProject._id);
    						}
    					});
	    			}
    			});    			
			}else{
				console.log('Cannot Find the User');
			}
	  	});
	});

	app.get('/project/:id/delete', ensureAuthenticated, function(req, res){	  
		
		models.Project.findById(req.params.id, function(err, project){
		  	if (!err && project != null) {		  		
		  		models.User.findById(req.user._id, function(err,user){
		  			var projIndex = getElementIndex(user.projects, project._id);
		  			user.projects.splice(projIndex, 1);
		  			user.save(function(err){
		  				if(err){
		  					console.log("Error while removing project from user");
		  				}else{
		  					// if other users are using the project then just delete the user from project
	  				  		if(project.users.length>1){
	  				  			var userIndex = getElementIndex(project.users, req.user._id);
	  				  			project.users.splice(userIndex,1);
	  				  			project.save(function(err){
	  				  				if(err){
	  				  					console.log("Error while removing user from project");
	  				  				}else{
	  				  					console.log("User removed from project");
	  					  				res.redirect('/');
	  				  				}
	  				  			})
	  				  			console.log("user removed from proj");
	  				  		}else{
	  					  		var projectFiles = projectFiles;
	  					  		project.remove(function (err){
	  					  			if(err){
	  					  				console.log("project could not be deleted");
	  					  			}else{
	  					  				console.log("project deleted");
	  					  				/* REMOVE INDIVIDUAL FILES */
	  					  				
	  					  			}
	  					  		});
	  					  	}
	  					}
		  			})
		  		})
		  		
			  	res.redirect('/');
			}else{
				console.log('Cannot Find the Project: ' + req.params.id);
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

	var getElementIndex = function(objectArray, elementId){
	  var elementIndex = -1;
	  for(i=0; i<objectArray.length; i++){
	    if(objectArray[i]._id == elementId){
	      elementIndex = i;
	      break;
	    }
	  }
	  return elementIndex;
	};

}