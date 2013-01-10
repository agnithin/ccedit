/***************************************************
* WebSocket Chat Controller
***************************************************/
module.exports = function(io, models){
	
	// usernames which are currently connected to the chat
	// not ideal when application grows large.. could be moved to mongodb or an intermediate redis
	var onlineUsers = new Array();

	var chat = io
	.of('/chat')
	.on('connection', function (socket) {

		models.User.findById(socket.handshake.session.passport.user, function(err, user) {
		   if(!err && user!=null){

			  var logInUser = function(data){	  	
			    // we store the username in the socket session for this client
			    socket.join(data.projectId);
			    socket.room = data.projectId;
			    socket.username = data.username;
			    // add the client's username to the global list
			    
			    console.log("%%%%%%%%%%%%%%%%%%%%%%% adding user to " + socket.room + "\n" + JSON.stringify(onlineUsers[socket.room]));
			    if(!onlineUsers[socket.room]){
			    	onlineUsers[socket.room] = new Array();
			    }
			    if(onlineUsers[socket.room].indexOf(socket.username) == -1){ // if user opens a new tab, dont add username twice
			    	onlineUsers[socket.room].push(socket.username);

			    	// echo to client they've connected
			    	socket.emit('notify', {type:'info', text:'You have successfully connected'});
			    	// echo globally (all clients) that a person has connected
			    	socket.broadcast.to(socket.room).emit('notify', {type:'info', text:data.username + ' in online'});
			    	// update the list of users in chat, client-side
			    	chat.in(socket.room).emit('updateusers', onlineUsers[socket.room]);
			    }	    
			  };

			  var sendChat = function(data) {
			    // we tell the client to execute 'updatechat' with 2 parameters
			    console.log("Message from client:" + data);
			    //console.log("###" + socket.room + ":" + socket.username + ":" + data);
			    chat.in(socket.room).emit('updatechat', socket.username, data);
			  };

			  var logOffUser = function(){
			  	if(onlineUsers[socket.room] && onlineUsers[socket.room].length>0){
				  	console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$\n"+ socket.room + " : " + socket.username);
				  	console.log(onlineUsers);
				  	console.log("@$$$$$$$$$$$$$$$$$$$$$$$$$$@");
				  	// remove the username from global usernames list
				    var userIndex = onlineUsers[socket.room].indexOf(socket.username);
				    if(userIndex != -1){			    
					    onlineUsers[socket.room].splice(userIndex, 1);
					    // update list of users in chat, client-side
					    chat.in(socket.room).emit('updateusers', onlineUsers[socket.room]);
					    // echo globally that this client has left
					    socket.broadcast.to(socket.room).emit('notify', {type:'info', text: socket.username + ' has gone offline'});
					}
				}
			  };

			  // when the client emits 'adduser', this listens and executes
			  socket.on('adduser', logInUser);

			  // when the client emits 'sendchat', this listens and executes
			  socket.on('sendchat', sendChat);	  

			  // when user navigates outside the project		
			  socket.on('removeuser', logOffUser);
			  
			  // when the user disconnects.. perform this
			  socket.on('disconnect', logOffUser);

		}else{
			console.log("########## could not locate user");
		  	console.log(socket.handshake);
		}
	});

	});
};