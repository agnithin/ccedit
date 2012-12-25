
module.exports = function(io, models, diff_match_patch){
	
	// socket auth
	
	var projectSocket = io
	.of('/project')
	.on('connection', function (socket) {

	console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\nproject socket connected");
	console.log(socket.handshake);

		
	  socket.on('getFile', function (fileId) {
	    console.log("Get File:" + fileId);   

	    models.File.findById(fileId, function(err, fileContents){
		  	if (fileContents != null) {
		  		socket.emit('getFile', fileContents);
			}else{
				socket.emit('notify', {type:'danger', text:'Oops! Could not locate the file on server. This could be because someone else deleted this file.'});
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
		  						projectSocket.in(socket.room).emit('getProject',  project);
		  						projectSocket.in(socket.room).emit('notify', {type:'info', text:newFile.name + ' has been added to project'});
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
	  						  				projectSocket.in(socket.room).emit('getProject',  project);
	  						  				projectSocket.in(socket.room).emit('notify', {type:'info', text:deletedFileName + ' has been deleted from project'});
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
		  						projectSocket.in(socket.room).emit('updateFile',  patch);
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

	  socket.on('deleteBackup', function (backup) {
	    console.log("Deleting Backup:" + backup._id);   

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
		  				foundFile.backup.splice(i,1);
		  				foundFile.save(function(err){
		  					if(!err){		  						 
		  						socket.emit('notify', {type:'info', text:'Backup Deleted Successfully'});
		  						socket.emit('refreshBackups', backup.fileId);
		  					}else{
		  						console.log(err);
		  						socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not delete the backup.'});
		  					}
		  				});
		  			}		  				
		  		}
			}else{
				socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not delete the backup.'});
				console.log('Could not delete File' + backup._id);
			}
		});
	  });

	  

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

	  socket.on('updateCursor', function (data) {
	    console.log("Update Cursor:%j", data);   

	    socket.broadcast.to(socket.room).emit('updateCursor',  data);
	  });
	  

	socket.on('disconnect', function(){
	    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\nclient disconnected");
	  });

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