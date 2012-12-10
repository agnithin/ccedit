
module.exports = function(io, models, diff_match_patch){
	
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
	    console.log("Update File:" + data._id);   

	    socket.broadcast.to(socket.room).emit('updateFile',  data);
	    

	    models.File.findById(data.id, function(err, oldfile){
		  	if (oldfile != null) {
		  		/*var dmp = new diff_match_patch();
	    		console.log("Patched Text: " + dmp.patch_apply(data.patch, oldfile.contents));*/

		  		/*oldfile.name = data.name; // so that same function can be used for file renaming
		  		oldfile.contents = data.contents;
		  		oldfile.save();*/
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
		  		newFile.save();
		  		//console.log("### new File" + newFile._id + " : " + newFile.name);
		  		project.files.push({'fileId':newFile._id, 'fileName':newFile.name});
		  		project.save();
		  		file.in(socket.room).emit('getProject',  project);
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
		  		if(fileIndex!=-1){
		  			project.files.splice(fileIndex, 1);
		  			project.save();
		  		}
		  		
	  		    models.File.findById(data.fileId, function(err, oldfile){
	  			  	if (oldfile != null) {
	  			  		oldfile.remove();
	  				}else{
	  					console.log('Cannot Find the File: ' + data._id);
	  				}
	  			});
		  		file.in(socket.room).emit('getProject',  project);
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
				socket.emit('getProject', "");
				console.log('Cannot Find the Project: ' + projectId);
			}
		});
	  });

	});
};