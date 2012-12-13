
module.exports = function(io, models, diff_match_patch){
	
	
	// socket auth
	/*parseCookie = require('connect').utils.parseCookie;
	io.configure(function () {
	io.set('authorization', function (data, accept) {
	    if (data.headers.cookie) {
	        data.cookie = parseCookie(data.headers.cookie);
	        data.sessionID = data.cookie['session.sid'];
	        sessionStore.get(data.sessionID, function (err, session) {
	            if (err || !session || (typeof session.twitter.user == 'undefined')) {
	                accept(null, false);
	            }
	            else {
	                data.session = session;
	                accept(null, true);
	            }
	        });
	    }
	    else {
	        return accept(null, false);
	    }
	});*/


	var file = io
	.of('/file')
	.on('connection', function (socket) {

	  socket.on('getFile', function (fileId) {
	    console.log("Get File:" + fileId);   

	    models.File.findById(fileId, function(err, fileContents){
		  	if (fileContents != null) {
		  		socket.emit('getFile', fileContents);
			}else{
				socket.emit('getFile', "");
				console.log('Cannot Find the File' + fileId);
			}
		});
	  });

	  socket.on('updateFile', function (data) {
	    console.log("Update File:" + data.id);   

	    socket.broadcast.to(socket.room).emit('updateFile',  data);	    

	    models.File.findById(data.id, function(err, oldfile){
		  	if (oldfile != null) {
		  		var dmp = new diff_match_patch.diff_match_patch();
	    		oldfile.name = data.name; // so that same function can be used for file renaming
		  		oldfile.contents = dmp.patch_apply(data.patch, oldfile.contents)[0];
		  		oldfile.save();
			}else{
				console.log('Cannot Find the File: ' + data._id);
			}
		})
	  });

	  socket.on('createFile', function (data) {
	    console.log("create File:" + data.projectId + " : " +data.fileName);   

	    var newFile = new models.File();
	    newFile.name = data.fileName;
	    newFile.contents = '';	    

	    models.Project.findById(data.projectId, function(err, project){
		  	if (project != null) {
		  		newFile.save(function(err){
		  			if(err){
		  				socket.emit('notify', {type:'danger', text:'Oops! Something went wrong! Could not create file.'});
		  			}else{
		  				project.files.push({'fileId':newFile._id, 'fileName':newFile.name});
		  				project.save(function(err){
		  					if(err){
		  						socket.emit('notify', {type:'danger', text:'Oops! Something went wrong! Could not add file to project.'});
		  					}else{
		  						file.in(socket.room).emit('getProject',  project);
		  						file.in(socket.room).emit('notify', {type:'info', text:newFile.name + ' has been added to project'});
		  						//socket.emit('notify', {type:'info', text:'New File has been created'});
		  						//socket.broadcast.to(socket.room).emit('notify', {type:'info', text:newFile.name + ' has been added to project'});
		  					}
		  				});
		  			}
		  		});
		  		
		  		
			}else{
				console.log('Cannot Find the Project: ' + projectId);
			}
		});
	  });

	  socket.on('deleteFile', function (data) {
	    console.log("delete File:" + data.projectId + " : " +data.fileId);
	    models.Project.findById(data.projectId, function(err, project){
		  	if (project != null) {
		  		var fileIndex = -1;
		  		for (var i =0; i < project.files.length; i++){
		  		   if (project.files[i].fileId == data.fileId) {
		  		      fileIndex = i;
		  		   }
		  		 }
		  		if(fileIndex != -1){
		  			project.files.splice(fileIndex, 1);
		  			project.save(function(err){
		  				if(err){
		  					socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not remove file from project.'});
		  				}else{
	  					    models.File.findById(data.fileId, function(err, oldfile){
	  						  	if (oldfile != null) {
	  						  		var deletedFileName = oldfile.name;
	  						  		oldfile.remove(function(err){
	  						  			if(err){
	  						  				socket.emit('notify', {type:'danger', text:'Oops! something went wrong. File has been removed from project, but could not be deleted permanently.'});
	  						  			}else{
	  						  				file.in(socket.room).emit('getProject',  project);
	  						  				file.in(socket.room).emit('notify', {type:'info', text:deletedFileName + ' has been deleted from project'});
	  						  			}
	  						  		});
	  							}else{
	  								console.log('Cannot Find the File: ' + data._id);
	  							}
	  						});
		  				}
		  			});
		  		} 		
			}else{
				console.log('Cannot Find the Project: ' + projectId);
			}
		})
	  });

	  socket.on('disconnect', function(){
	    
	  });

	  /* move these to a seperate project websocket controller maybe?? */
	  socket.on('getProject', function (projectId) {
	    console.log("Get Project:" + projectId);   

	    socket.join(projectId);
	    socket.room = projectId;

	    models.Project.findById(projectId, function(err, projectData){
		  	if (projectData != null) {
		  		socket.emit('getProject', projectData);
			}else{
				socket.emit('notify', {type:'danger', text:'Oops! Project not found.'});
				console.log('Cannot Find the Project: ' + projectId);
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



		socket.on('addUsersToProject', function (data) {
		  	console.log("Adding users to project:" + data.projectId);   

		  	/*models.Project.findById(data.projectId, function(err, project){
		  	  	if (project != null) {
		  	  		for(i=0;i<data.users.length;i++){
		  	  			if(getUserIndex(project.users, data.users[i] ==-1)){
			  	  			project.users.push({
			  	  				'_id':data.users[i]._id,
			  	  				'permissions':'rw'
			  	  			});
			  	  		}else{
			  	  			data.users.splice(i,1); // remove already active users so that redunant projects are not added to user below
			  	  			i--; // since altering the array
			  	  		}
			  	  	}
			  	  	project.save(function(err){
			  	  		if(err){
			  	  			socket.emit('notify', {type:'danger', text:'Oops! Something went wrong. Could not add users to project.'});
			  	  		}else{
			  	  			var usersArray = new Array();
			  	  			for(i=0;i<data.users.length;i++){
			  	  				usersArray.push(data.users[i]._id)
			  	  			}

			  	  			models.User.find({'_id':{$in:usersArray}}, function(err, users){
			  	  				for(i=0;i<users.length;i++){
			  	  					users[i].projects.push({
			  	  						'projectId':project._id,
			  	  						'projectName':project.name,
			  	  						'permissions':project.permissions
			  	  					});
			  	  					users[i].save();
			  	  				}
			  	  			});
			  	  		}
			  	  	});

		  		}else{
		  			socket.emit('notify', {type:'danger', text:'Oops! Could not locate the project.'});
		  			console.log('Cannot Find the Project: ' + projectId);
		  		}
		  	});*/
		});

		var getUserIndex = function(userArrray, user){
		  var userIndex = -1;
		  for(i=0; i<userArrray.length; i++){
		    if(userArrray[i]._id == user._id){
		      userIndex = i;
		      break;
		    }
		  }
		  return userIndex;
		}

	});
};