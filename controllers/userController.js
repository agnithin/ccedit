
module.exports = function(io, models){

	var userSocket = io
		.of('/user')
		.on('connection', function (socket) {

		/* authorization */
		if(!socket.handshake.session.passport.user){
			userSocket.disconnect();
		}
		models.User.findById(socket.handshake.session.passport.user, function(err, user) {
		   if(err){
		   		userSocket.disconnect();
			}else{
		   		console.log(user);

		   		  socket.on('getUser', function () {
				    console.log("Get User:");
				    socket.emit('getUser', user);   

				  });

				  socket.on('getProjects', function (userId) {
				    console.log("Get Projects:" + userId); 
				    models.User.findOne({"_id": userId}, function(err, user){
					  	if (user != null) {
					  		console.log('Found the User:' + user.displayName);
					  		socket.emit('getProjects', user.projects);
						}else{
							console.log('Cannot Find the User');
							socket.emit('notify', {type:'danger', text:'Oops! Could not locate the user.'});
						}
				  	});  

				  });

				  socket.on('createProject', function (data) {
				    console.log("create Project:" + data.project.name);

		    		models.User.findById(data.user.userId, function(err, user){
		    		  	if (user != null) {
		    		  		var newProject = new models.Project();
		    		  		var permissions = 'rw';
		        			newProject.name = data.project.name;
		        			newProject.description = data.project.description;
		        			newProject.users.push({
		        				'userId': user._id, 
		        				'displayName':user.displayName,
		        				'permissions': permissions
		        			});
		        			newProject.author = user._id;
		        			newProject.createdOn = Date.now();
		        			newProject.save(function(err){
		        				if(err){
		        					console.log("Error while creating new project");
		        					socket.emit('notify', {type:'danger', text:'Oops! Could not create the project.'});
		        				}else{
		    	    				user.projects.push(	{
		    							"projectId" : newProject._id,
		    							"projectName" : newProject.name,
		    							"permissions" : permissions
		    						});
		    						user.save(function(err){
		        						if(err){
		        							console.log("Error saving project to users" + err);
		        							socket.emit('notify', {type:'danger', text:'Oops! Could not add projects to user.'});
		        						}else{
		        							console.log("Successfully created a new project");
		        							socket.emit('notify', {type:'info', text:'Successfully created a new project.'});
		        							userSocket.emit('refreshProjects');
		        						}
		        					});
		    	    			}
		        			});    			
		    			}else{
		    				console.log('Cannot Find the User');
		    				socket.emit('notify', {type:'danger', text:'Oops! Could not locate the user.'});
		    			}
		    	  	});   

				  });

				  socket.on('deleteProject', function (data) {
				    console.log("Delete Project:" + data.projectId); 

			    	models.Project.findById(data.projectId, function(err, project){
			    	  	if (!err && project != null) {		  		
			    	  		models.User.findById(data.userId, function(err,user){
			    	  			var projIndex = getProjectIndex(user.projects, project._id);
			    	  			user.projects.splice(projIndex, 1);
			    	  			user.save(function(err){
			    	  				if(err){
			    	  					console.log("Error while removing project from user");
			    	  				}else{
			    	  					// if other users are using the project then just delete the user from project
			      				  		if(project.users.length>1){
			      				  			var userIndex = getUserIndex(project.users, user._id);
			      				  			project.users.splice(userIndex,1);
			      				  			project.save(function(err){
			      				  				if(err){
			      				  					console.log("Error while removing user from project");
			      				  				}else{
			      				  					console.log("User removed from project");
			      					  				userSocket.emit('refreshProjects');
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
			      					  				/* TODO: REMOVE INDIVIDUAL FILES */
			      					  				userSocket.emit('refreshProjects');
			      					  			}
			      					  		});
			      					  	}
			      					}
			    	  			})
			    	  		})
			    		}else{
			    			console.log('Cannot Find the Project: ' + data.projectId);
			    		}
			    	});  

				  });

				  socket.on('findUserByName', function (searchString) {
				    console.log("Find User:" + searchString);   

				    models.User.find({'displayName': new RegExp(searchString, 'i')}, function(err, users){
					  	if (users != null) {
					  		var foundUsers = new Array();
					  		for(i=0; i<users.length;i++){
					  			var tUser = {
						  			'_id' : users[i]._id,
						  			'displayName' : users[i].displayName,
						  			'email' : users[i].email,
						  		}
					  			foundUsers.push(tUser);
					  		}

					  		socket.emit('findUser', {
					  			'searchString':searchString,
					  			'users': foundUsers
					  		});

					  		console.log("Found "+users.length + " Users:" + users);
						}else{
							console.log("No users found");
						}
					});
				  });


			  	/* IMPORTANT REMOVE USERS STILL DOES NOT WORK */
				socket.on('addUsersToProject', function (data) {
				  	console.log("Adding users to project: %j", data);   

				  	models.Project.findById(data.projectId, function(err, project){
				  	  	if (project != null) {
				  	  		/*for(i=0;i<data.users.length;i++){
				  	  			if(getProjectIndex(project.users, data.users[i] ==-1)){
					  	  			project.users.push({
					  	  				'_id':data.users[i]._id,
					  	  				'permissions':'rw'
					  	  			});
					  	  		}else{
					  	  			data.users.splice(i,1); // remove already active users so that redunant projects are not added to user below
					  	  			i--; // since altering the array
					  	  		}
					  	  	}*/
					  	  	project.users = data.users;
					  	  	project.save(function(err){
					  	  		if(err){
					  	  			socket.emit('notify', {type:'danger', text:'Oops! Something went wrong. Could not add users to project.'});
					  	  		}else{
					  	  			var usersArray = new Array();
					  	  			for(i=0;i<data.users.length;i++){
					  	  				usersArray.push(data.users[i].userId)
					  	  			}
					  	  			console.log("## usersArray:%j",usersArray);

					  	  			models.User.find({'_id':{$in:usersArray}}, function(err, users){
					  	  				console.log("## users:%j",users)
					  	  				if(!err && users!=null){
						  	  				users.forEach(function(usr){
						  	  					console.log("========usr:"+usr.displayName +':' + getProjectIndex(usr.projects, project._id));
						  	  					console.log("========projectId:"+project._id+"###:%j", usr.projects);
						  	  					if(getProjectIndex(usr.projects, project._id) == -1){
							  	  					usr.projects.push({
							  	  						'projectId':project._id,
							  	  						'projectName':project.name,
							  	  						'permissions':project.permissions
							  	  					});
							  	  					usr.save(function(err){
										  				if(err){
										  					console.log("Error while adding project to user");
										  				}else{
										  					socket.emit('notify', {type:'info', text:'Collaborators updated successfully.'});
										  					userSocket.emit('refreshProjects');
									  					}
									  				});
							  	  				}
						  	  				});
					  	  				}
					  	  			});
					  	  		}
					  	  	});

				  		}else{
				  			socket.emit('notify', {type:'danger', text:'Oops! Could not locate the project.'});
				  			console.log('Cannot Find the Project: ' + projectId);
				  		}
				  	});
				});
		   		//=============================================================================
			}
		 });
		
		  

		var getProjectIndex = function(objectArray, elementId){
		  var elementIndex = -1;
		  for(i=0; i<objectArray.length; i++){
		    if(objectArray[i].projectId.equals(elementId)){
		      elementIndex = i;
		      break;
		    }
		  }
		  return elementIndex;
		};

		var getUserIndex = function(objectArray, elementId){
		  var elementIndex = -1;
		  for(i=0; i<objectArray.length; i++){
		    if(objectArray[i].userId.equals(elementId)){
		      elementIndex = i;
		      break;
		    }
		  }
		  return elementIndex;
		};	  
	});
};