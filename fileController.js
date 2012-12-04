
module.exports = function(io, models){
	
	// usernames which are currently connected to the chat
	var usernames = {};

	var file = io
	.of('/file')
	.on('connection', function (socket) {

	  socket.on('getFile', function (data) {
	    console.log("Get File:" + data);   

	    models.File.findOne({"_id": data}, function(err, fileContents){
		  	if (fileContents != null) {
		  		socket.emit('putFile', fileContents);
			}else{
				socket.emit('putFile', "");
				console.log('Cannot Find the File');
			}
		});
	  });

	  socket.on('updateFile', function (data) {
	    console.log("Update File:" + data);   

	    socket.broadcast.emit('updateFile',  data);
	    models.File.save(data);
	    //models.File.update({'_id':data._id}, data);
	    /*models.File.findOne({"_id": data}, function(err, fileContents){
		  	if (fileContents != null) {
		  		socket.emit('putFile', fileContents);
			}else{
				socket.emit('putFile', "");
				console.log('Cannot Find the File');
			}
		});*/
	  });

	  socket.on('disconnect', function(){
	    
	  });

	  /* move these to a seperate project websocket maybe?? */
	  socket.on('getProject', function (data) {
	    console.log("Get Project:" + data);   

	    models.Project.findOne({"_id": data}, function(err, projectData){
		  	if (projectData != null) {
		  		socket.emit('putProject', projectData);
		  		console.log("Retrieved Project" + projectData);
			}else{
				socket.emit('putProject', "");
				console.log('Cannot Find the Project');
			}
		});
	  });

	});
};