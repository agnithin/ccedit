
module.exports = function(io){
	
	// usernames which are currently connected to the chat
	// not ideal when application grows large.. could be moved to mongodb or an intermediate redis
	var onlineUsers = new Array();

	var chat = io
	.of('/chat')
	.on('connection', function (socket) {

	  // when the client emits 'adduser', this listens and executes
	  socket.on('adduser', function(data){
	  	
	    // we store the username in the socket session for this client
	    socket.join(data.projectId);
	    socket.room=data.projectId;
	    socket.username = data.username;
	    // add the client's username to the global list
	    
	    console.log("%%%%%%%%%%%%%%%%%%%%%%% adding user to "+socket.room + "\n"+JSON.stringify(onlineUsers[socket.room]));
	    if(!onlineUsers[socket.room]){
	    	onlineUsers[socket.room] = new Array();
	    }
	    if(onlineUsers[socket.room].indexOf(socket.username) == -1){ // if user opens a new tab, dont add username twice
	    	console.log("%%%%%%%%%%%%%%%%%%%%%%% adding user before\n%j",onlineUsers);
	    	console.log("socket.room:"+socket.room +" |socket.username:" + socket.username);
	    	onlineUsers[socket.room].push(socket.username);
	    	console.log("%%%%%%%%%%%%%%%%%%%%%%% adding user\n%j",onlineUsers[socket.room]);

	    	// echo to client they've connected
	    	socket.emit('notify', {type:'info', text:'You have successfully connected'});
	    	// echo globally (all clients) that a person has connected
	    	socket.broadcast.to(socket.room).emit('notify', {type:'info', text:data.username + ' in online'});
	    	// update the list of users in chat, client-side
	    	chat.in(socket.room).emit('updateusers', onlineUsers[socket.room]);
	    }
	    
	  });

	  // when the client emits 'sendchat', this listens and executes
	  socket.on('sendchat', function (data) {
	    // we tell the client to execute 'updatechat' with 2 parameters
	    console.log("Message from client:" + data);
	    //console.log("###" + socket.room + ":" + socket.username + ":" + data);
	    chat.in(socket.room).emit('updatechat', socket.username, data);
	  });

	  // when the user disconnects.. perform this
	  socket.on('removeuser', function(){
	  	console.log("%%%%%%%%%%%%%%%%%%%%%%% signing off\n%j",onlineUsers[socket.room]);
	  	if(onlineUsers[socket.room] && onlineUsers[socket.room].length>0){
		  	// remove the username from global usernames list
		  	var userIndex = onlineUsers[socket.room].indexOf(socket.username);
		  	console.log("us index:" + userIndex);
		    if(userIndex != -1){
			    onlineUsers[socket.room].splice(userIndex, 1);
			    // update list of users in chat, client-side
			    chat.in(socket.room).emit('updateusers', onlineUsers[socket.room]);
			    // echo globally that this client has left
			    socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has gone offline');
			}
		}
	  });

	  // when the user disconnects.. perform this
	  socket.on('disconnect', function(){
	  	if(onlineUsers[socket.room] && onlineUsers[socket.room].length>0){
		  	// remove the username from global usernames list
		    var userIndex = onlineUsers[socket.room].indexOf(socket.username);
		    if(userIndex != -1){			    
			    onlineUsers[socket.room].splice(userIndex, 1);
			    // update list of users in chat, client-side
			    chat.in(socket.room).emit('updateusers', onlineUsers[socket.room]);
			    // echo globally that this client has left
			    socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has gone offline');
			}
		}
	  });
	});
};