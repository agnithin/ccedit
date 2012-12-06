
module.exports = function(io, models){
	
	// usernames which are currently connected to the chat
	var usernames = {};

	var chat = io
	.of('/chat')
	.on('connection', function (socket) {

	  // when the client emits 'sendchat', this listens and executes
	  socket.on('sendchat', function (data) {
	    // we tell the client to execute 'updatechat' with 2 parameters
	    console.log("Message from client:" + data);
	    chat.emit('updatechat', socket.username, data);
	  });

	  // when the client emits 'adduser', this listens and executes
	  socket.on('adduser', function(username){
	    // we store the username in the socket session for this client
	    socket.username = username;
	    // add the client's username to the global list
	    usernames[username] = username;
	    // echo to client they've connected
	    socket.emit('updatechat', 'SERVER', 'you have connected');
	    // echo globally (all clients) that a person has connected
	    socket.broadcast.emit('updatechat', 'SERVER', username + ' in online');
	    // update the list of users in chat, client-side
	    chat.emit('updateusers', usernames);
	  });

	  // when the user disconnects.. perform this
	  socket.on('disconnect', function(){
	    // remove the username from global usernames list
	    delete usernames[socket.username];
	    // update list of users in chat, client-side
	    chat.emit('updateusers', usernames);
	    // echo globally that this client has left
	    socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	  });
	});
};