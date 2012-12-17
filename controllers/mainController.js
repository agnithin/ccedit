
module.exports = function(io, models){
	
	// socket auth
	/*parseCookie = require('connect').utils.parseCookie;
	io.configure(function () {
	io.set('authorization', function (data, accept) {
	    if (data.headers.cookie) {
	        data.cookie = parseCookie(data.headers.cookie);
	        data.sessionID = data.cookie['session.sid'];
	        sessionStore.get(data.sessionID, function (err, session) {
	            if (err || !session || (typeof session.twitter.user == 'undefined')) {
	                accept(null, false);
	            }
	            else {
	                data.session = session;
	                accept(null, true);
	            }
	        });
	    }
	    else {
	        return accept(null, false);
	    }
	});*/

	var mainSocketCtrl = io
	.of('/main')
	.on('connection', function (socket) {

	  socket.on('getUser', function (fileId) {
	    console.log("Get User:" + fileId);   

	  });

	  
};