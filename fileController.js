
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
	});
};