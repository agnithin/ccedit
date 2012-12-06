
module.exports = function(io, models){
	
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

	    socket.broadcast.emit('updateFile',  data);

	    models.File.findById(data._id, function(err, file){
		  	if (file != null) {
		  		file.name = data.name; // so that same function can be used for file renaming
		  		file.contents = data.contents;
		  		file.save();
			}else{
				console.log('Cannot Find the File: ' + data._id);
			}
		})
	  });

	  socket.on('disconnect', function(){
	    
	  });

	  /* move these to a seperate project websocket maybe?? */
	  socket.on('getProject', function (projectId) {
	    console.log("Get Project:" + projectId);   

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