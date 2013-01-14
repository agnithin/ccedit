/***************************************************
* WebSocket User Controller
***************************************************/
module.exports = function(io, models){

	var userSocket = io
		.of('/user')
		.on('connection', function (socket) {

		models.User.findById(socket.handshake.session.passport.user, function(err, user) {
		   if(err){
		   		//userSocket.disconnect();
			}else{
		   		  socket.on('getUser', function () {
				    console.log("Get User:");
				    socket.emit('getUser', user);  
				  });

				  socket.on('getProjects', function (userId) {
				    console.log("Get Projects:" + userId);
				    models.User.findById(user._id, function(err, newUser) {
		   				if(!err && newUser != null){
		   					user = newUser;
		   					socket.emit('getProjects', user.projects);
		   				}else{
		   					console.log("Error retrieving user");
        					socket.emit('notify', {type:'danger', text:'Oops! Something went wrong. Please refresh the page.'});
		   				}
		   			});				    
				  });

				  socket.on('createProject', function (data) {
				    console.log("create Project:" + data.project.name);

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
    							"description" : newProject.description,
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
				  });

				  socket.on('deleteProject', function (data) {
				    console.log("Delete Project:" + data.projectId);
			    	models.Project.findById(data.projectId, function(err, project){
			    	  	if (!err && project != null) {		  		
		    	  			var projIndex = getArrayIndex(user.projects, 'projectId', project._id);
		    	  			user.projects.splice(projIndex, 1);
		    	  			user.save(function(err){
		    	  				if(err){
		    	  					console.log("Error while removing project from user");
		    	  				}else{
		    	  					// if other users are using the project then just delete the user from project
		      				  		if(project.users.length>1){
		      				  			var userIndex = getArrayIndex(project.users, 'userId', user._id);
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

				socket.on('updateCollaborators', function (data) {
				  	console.log("updating collaborators to project: %j", data);   

				  	models.Project.findById(data.projectId, function(err, project){
				  	  	if (project != null) {
				  	  		//remove users from proj
				  	  		data.users.remove.forEach(function(usr){
				  	  			var userIndex = getArrayIndex(project.users, 'userId', usr.userId);
				  	  			if(userIndex != -1){
				  	  				project.users.splice(userIndex, 1);
				  	  			}

				  	  			// remove backups created by that collaborator
				  	  			var filesArray = new Array();
				  	  			for(i=0;i<project.files.length;i++){
				  	  				filesArray.push(project.files[i].fileId);
				  	  			}
				  	  			console.log("********");
				  	  			console.log(filesArray);
				  	  			models.File.find({'_id':{$in:filesArray}}, function(err, files){
				  	  				files.forEach(function(file){
				  	  					file.deleteBackupsByUser(usr.userId);
				  	  					file.save();
				  	  				});
				  	  			});
				  	  		});
				  	  		//add users to proj
				  	  		data.users.add.forEach(function(usr){
				  	  			if(getArrayIndex(project.users, 'userId', usr.userId) == -1){
				  	  				project.users.push(usr);
				  	  			}
				  	  		});
					  	  	project.save(function(err){
					  	  		if(err){
					  	  			socket.emit('notify', {type:'danger', text:'Oops! Something went wrong. Could not add users to project.'});
					  	  		}else{
					  	  			var updateSuccessfull = true;
					  	  			// remove users
					  	  			if(data.users.remove.length>0){
						  	  			var usersArray = new Array();
						  	  			for(i=0;i<data.users.remove.length;i++){
						  	  				usersArray.push(data.users.remove[i].userId)
						  	  			}
						  	  			models.User.find({'_id':{$in:usersArray}}, function(err, users){
						  	  				console.log("## users:%j",users)
						  	  				if(!err && users!=null){
							  	  				users.forEach(function(usr){
							  	  					var projIndex = getArrayIndex(usr.projects, 'projectId', project._id);
							  	  					if( projIndex != -1){
								  	  					usr.projects.splice(projIndex, 1);
								  	  					usr.save(function(err){
											  				if(err){
											  					console.log("Error while removing project from user");
											  					updateSuccessfull = false;
											  				}
										  				});
								  	  				}
							  	  				});
						  	  				}else{
						  	  					updateSuccessfull = false;
						  	  				}
						  	  			});
									}
									
									//add users
									if(data.users.add.length>0){
										var usersArray = new Array();
						  	  			for(i=0;i<data.users.add.length;i++){
						  	  				usersArray.push(data.users.add[i].userId)
						  	  			}					  	  			
						  	  			models.User.find({'_id':{$in:usersArray}}, function(err, users){
						  	  				console.log("## users:%j",users)
						  	  				if(!err && users!=null){
							  	  				users.forEach(function(usr){
							  	  					if(getArrayIndex(usr.projects, 'projectId', project._id) == -1){
								  	  					usr.projects.push({
								  	  						'projectId':project._id,
								  	  						'projectName':project.name,
								  	  						'permissions':project.permissions
								  	  					});
								  	  					usr.save(function(err){
											  				if(err){
											  					console.log("Error while adding project to user");
											  					updateSuccessfull = false;
											  				}
										  				});
								  	  				}
							  	  				});
						  	  				}else{
						  	  					updateSuccessfull = false;
						  	  				}
						  	  			});
									}
									if(updateSuccessfull){
										socket.emit('notify', {type:'info', text:'Collaborators updated successfully.'});
										userSocket.emit('refreshProjects');
									}else{
										socket.emit('notify', {type:'danger', text:'Oops! Something went wrong. Could not add project to users.'});
									}
					  	  		}
					  	  	});

				  		}else{
				  			socket.emit('notify', {type:'danger', text:'Oops! Could not locate the project.'});
				  			console.log('Cannot Find the Project: ' + projectId);
				  		}
				  	});
				});
			}
		 });		  

		/* Searches an object Array for a field */
		var getArrayIndex = function(objectArray, fieldName, element){
		  var elementIndex = -1;
		  for(i=0; i<objectArray.length; i++){
		    if(objectArray[i][fieldName].equals(element)){
		      elementIndex = i;
		      break;
		    }
		  }
		  return elementIndex;
		}; 

	});
};