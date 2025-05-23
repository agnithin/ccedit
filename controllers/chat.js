/***************************************************
* WebSocket Chat Controller
***************************************************/
module.exports = function(io, models){
	
	// usernames which are currently connected to the chat
	// not ideal when application grows large.. could be moved to mongodb or an intermediate redis
	let onlineUsers = new Array(); // Changed to let as properties are reassigned

	const chat = io // Changed to const
	.of('/chat')
	.on('connection', async function (socket) { // Made async

		try {
			const user = await models.User.findById(socket.handshake.session.passport.user);
			if (user) { // Check if user is not null

				const logInUser = function(data){	  	// Changed to const
			    // we store the username in the socket session for this client
			    socket.join(data.projectId);
			    socket.room = data.projectId;
			    socket.username = data.username;
			    // add the client's username to the global list
			    
			    console.log(`%%%%%%%%%%%%%%%%%%%%%%% adding user to ${socket.room}\n${JSON.stringify(onlineUsers[socket.room])}`); // Changed to template literal
			    if(!onlineUsers[socket.room]){
			    	onlineUsers[socket.room] = new Array();
			    }
			    if(onlineUsers[socket.room].indexOf(socket.username) == -1){ // if user opens a new tab, dont add username twice
			    	onlineUsers[socket.room].push(socket.username);

			    	// echo to client they've connected
			    	socket.emit('notify', {type:'info', text:'You have successfully connected'});
			    	// echo globally (all clients) that a person has connected
			    	socket.broadcast.to(socket.room).emit('notify', {type:'info', text:`${data.username} in online`}); // Changed to template literal
			    	// update the list of users in chat, client-side
			    	chat.in(socket.room).emit('updateusers', onlineUsers[socket.room]);
			    }	    
			  };

			  const sendChat = function(data) { // Changed to const
			    // we tell the client to execute 'updatechat' with 2 parameters
			    console.log(`Message from client:${data}`); // Changed to template literal
			    //console.log("###" + socket.room + ":" + socket.username + ":" + data);
			    chat.in(socket.room).emit('updatechat', socket.username, data);
			  };

			  const logOffUser = function(){ // Changed to const
			  	if(onlineUsers[socket.room] && onlineUsers[socket.room].length>0){
				  	console.log(`$$$$$$$$$$$$$$$$$$$$$$$$$$\n${socket.room} : ${socket.username}`); // Changed to template literal
				  	console.log(onlineUsers);
				  	console.log("@$$$$$$$$$$$$$$$$$$$$$$$$$$@");
				  	// remove the username from global usernames list
				    const userIndex = onlineUsers[socket.room].indexOf(socket.username); // Changed to const
				    if(userIndex != -1){			    
					    onlineUsers[socket.room].splice(userIndex, 1);
					    // update list of users in chat, client-side
					    chat.in(socket.room).emit('updateusers', onlineUsers[socket.room]);
					    // echo globally that this client has left
					    socket.broadcast.to(socket.room).emit('notify', {type:'info', text: `${socket.username} has gone offline`}); // Changed to template literal
					}
				}
			  };

			  /* when the client emits 'adduser', this listens and executes */
			  socket.on('adduser', logInUser);

			  /* when the client emits 'sendchat', this listens and executes */
			  socket.on('sendchat', sendChat);	  

			  /* when user navigates outside the project	*/	
			  socket.on('removeuser', logOffUser);
			  
			  /* when the user disconnects.. perform this */
			  socket.on('disconnect', logOffUser);

			} else { // User not found or error (err is caught by try...catch)
				console.log("########## User not found or error during findById in chat controller");
				// Optionally, you might want to disconnect or send an error to the client
				// socket.disconnect(true); 
			}
		} catch (err) {
			console.error("########## Error in chat controller user lookup:", err);
			// Optionally, disconnect or send an error
			// socket.disconnect(true);
		}
	}); // Removed extra closing parenthesis here

};