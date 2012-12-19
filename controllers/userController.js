
module.exports = function(io, models){

	var userSocket = io
		.of('/user')
		.on('connection', function (socket) {

		  socket.on('getUser', function (fileId) {
		    console.log("Get User:" + fileId);   

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
        							userSocket.emit('getProjects',  user.projects);
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
	    	  			var projIndex = getElementIndex(user.projects, project._id);
	    	  			user.projects.splice(projIndex, 1);
	    	  			user.save(function(err){
	    	  				if(err){
	    	  					console.log("Error while removing project from user");
	    	  				}else{
	    	  					// if other users are using the project then just delete the user from project
	      				  		if(project.users.length>1){
	      				  			var userIndex = getElementIndex(project.users, user._id);
	      				  			project.users.splice(userIndex,1);
	      				  			project.save(function(err){
	      				  				if(err){
	      				  					console.log("Error while removing user from project");
	      				  				}else{
	      				  					console.log("User removed from project");
	      					  				userSocket.emit('getProjects',  user.projects);
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
	      					  				userSocket.emit('getProjects',  user.projects);
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

		var getElementIndex = function(objectArray, elementId){
		  var elementIndex = -1;
		  for(i=0; i<objectArray.length; i++){
		    if(objectArray[i].projectId.equals(elementId)){
		      elementIndex = i;
		      break;
		    }
		  }
		  return elementIndex;
		};

	  
	});
};