
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
	    
	    if(!onlineUsers[socket.room]){
	    	onlineUsers[socket.room] = new Array();
	    }
	    if(onlineUsers[socket.room].indexOf(socket.username) == -1){ // if user opens a new tab, dong show usrename twice
	    	onlineUsers[socket.room].push(socket.username);
	    }
	    // echo to client they've connected
	    socket.emit('updatechat', 'SERVER', 'you have connected');
	    // echo globally (all clients) that a person has connected
	    socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', data.username + ' in online');
	    // update the list of users in chat, client-side
	    chat.in(socket.room).emit('updateusers', onlineUsers[socket.room]);
	  });

	  // when the client emits 'sendchat', this listens and executes
	  socket.on('sendchat', function (data) {
	    // we tell the client to execute 'updatechat' with 2 parameters
	    console.log("Message from client:" + data);
	    //console.log("###" + socket.room + ":" + socket.username + ":" + data);
	    chat.in(socket.room).emit('updatechat', socket.username, data);
	  });

	  // when the user disconnects.. perform this
	  socket.on('disconnect', function(){
	    // remove the username from global usernames list
	    onlineUsers[socket.room].splice(onlineUsers[socket.room].indexOf(socket.username));
	    // update list of users in chat, client-side
	    chat.in(socket.room).emit('updateusers', onlineUsers[socket.room]);
	    // echo globally that this client has left
	    socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	  });
	});
};