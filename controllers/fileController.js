
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
				socket.emit('notify', {type:'danger', text:'Oops! Could not update the file on server. This could be because someone else deleted this file.'});
				console.log('Cannot Find the File: ' + data._id);
			}
		})
	  });

	  socket.on('createFile', function (data) {
	    console.log("create File:" + data.projectId + " : " +data.fileName);   

	    /*var newFile = new models.File();
	    newFile.name = data.fileName;
	    newFile.contents = '';*/
	    var newFile = new models.File({
	    	'name' : data.fileName,
	    	'contents' : "",
	    	'createdOn' : Date.now(),
	    	'ModifiedOn' : Date.now()
	    	});  

	    models.Project.findById(data.projectId, function(err, project){
		  	if (!err && project != null) {
		  		newFile.save(function(err){
		  			if(err){
		  				console.log("error saging file : " + err);
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

	  socket.on('backupFile', function (fileId) {
	    console.log("Backup File:" + fileId);   

	    models.File.findById(fileId, function(err, foundFile){
		  	if (foundFile != null) {
		  		var currentBackup = {
			  		contents : foundFile.contents,
			  		time : Date.now(),
			  		backedupBy : "userid"
			  	};

			  	if(!foundFile.backup){
			  		foundFile.backup = new Array();
			  	}
			  	foundFile.backup.push(currentBackup);

		  		if(foundFile.backup.length>5){ // keep onlu 5 backup at a time
		  			foundFile.backup.splice(0,1);
		  		}

		  		foundFile.save(function(err){
		  			if(!err){
		  				socket.emit('notify', {type:'info', text:'File backed-up successfully.'});
		  			}else{
		  				socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not backup the file.'});
		  			}
		  		});

			}else{
				socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not backup the file.'});
				console.log('Cannot Backup the File' + fileId);
			}
		});
	  });

	  socket.on('listBackups', function (fileId) {
	    console.log("Backup File:" + fileId);   

	    models.File.findById(fileId, function(err, foundFile){
		  	if (foundFile != null) {
		  		if(!foundFile.backup){

		  		}else{
		  			var backupList = new Array();
		  			foundFile.backup.forEach(function(bc){
		  				var time = new Date(bc.time);
		  				backupList.push({
		  					fileId:foundFile._id,
		  					time : time.toUTCString(),
			  				backedupBy : bc.backedupBy,
			  				_id : bc._id
		  				});
		  			});
		  			socket.emit('listBackups', backupList);
		  		}

			}else{
				socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not locate the backups.'});
				console.log('Cannot Backup the File' + fileId);
			}
		});
	  });

	  socket.on('restoreBackup', function (backup) {
	    console.log("Restoring Backup:" + backup._id);   

	    models.File.findById(backup.fileId, function(err, foundFile){
		  	if (!err && foundFile != null) {
		  		if(!foundFile.backup){
		  			console.log("No backups found");
		  		}else{
		  			for(i=0; i<foundFile.backup.length;i++){
		  				if(foundFile.backup[i]._id==backup._id){
		  					break;
		  				}
		  			}
		  			console.log("selected backup found at:" + i);
		  			if(i<foundFile.backup.length){
		  				if(i+1<foundFile.backup.length){
		  					foundFile.backup.splice(i+1); // remove all the later backups
		  				}
		  				var contentsBeforeRestore = foundFile.contents;
		  				foundFile.contents = foundFile.backup[i].contents;
		  				foundFile.modifiedBy = "userid";
		  				foundFile.modifiedOn = Date.now();
		  				foundFile.save(function(err){
		  					if(!err){		  						 
		  						var patch ={
		  							'id':foundFile._id, 
		  							'name':foundFile.name, 
		  							'patch': diff_launch(contentsBeforeRestore, foundFile.contents)
		  						};
		  						file.in(socket.room).emit('updateFile',  patch);
		  						socket.emit('notify', {type:'info', text:'Backup Restored Successfully'});
		  					}else{
		  						console.log(err);
		  						socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not restore the backup.'});
		  					}
		  				});
		  			}
		  				
		  		}

			}else{
				socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not locate the backup.'});
				console.log('Could not restore File' + backup._id);
			}
		});
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


	  	/* IMPORTANT REMOVE USERS STILL DOES NOT WORK */
		socket.on('addUsersToProject', function (data) {
		  	console.log("Adding users to project: %j", data);   

		  	models.Project.findById(data.projectId, function(err, project){
		  	  	if (project != null) {
		  	  		/*for(i=0;i<data.users.length;i++){
		  	  			if(getElementIndex(project.users, data.users[i] ==-1)){
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
			  	  					console.log("========usr:"+usr.displayName +':' + getElementIndex(usr.projects, project._id));
			  	  					console.log("========projectId:"+project._id+"###:%j", usr.projects);
			  	  					if(getElementIndex(usr.projects, project._id) == -1){
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
							  					//file.in(socket.room).emit('getProject',  project);
						  					}
						  				});
				  	  				}
			  	  				});
			  	  			}
			  	  			});
			  	  			file.in(socket.room).emit('getProject',  project);
			  	  		}
			  	  	});

		  		}else{
		  			socket.emit('notify', {type:'danger', text:'Oops! Could not locate the project.'});
		  			console.log('Cannot Find the Project: ' + projectId);
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


		function diff_launch(text1, text2) {
			var dmp = new diff_match_patch.diff_match_patch();
			var diff = dmp.diff_main(text1, text2, true);
			if (diff.length > 2) {
			  dmp.diff_cleanupSemantic(diff);
			}
			return dmp.patch_make(text1, text2, diff);
		}

	});
};