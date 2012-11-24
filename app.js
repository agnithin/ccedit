
/**
 * Module dependencies.
 */
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose');

var passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy;

require('./auth.js')(passport, TwitterStrategy);

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(express.cookieParser()); 
  app.use(express.session({secret:'something'}));
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// configuration for express etc
require('./routes/index')(app)
require('./routes/auth')(app, passport)

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});



/*********************************************** now **/
app.get('/chat', function(req, res){
  res.render('chat', {locals: {
    title: 'NowJS + Express Example'
  }});
});

// NowJS component
var nowjs = require("now");
var everyone = nowjs.initialize(server);
everyone.now.users=new Array();


nowjs.on('connect', function(){
      this.now.room = "room 1"; // change this to workspace id
      nowjs.getGroup(this.now.room).addUser(this.user.clientId);
      console.log("Joined: " + this.now.name);
      everyone.now.users.push(this.now.name);
});


nowjs.on('disconnect', function(){
      console.log("Left: " + this.now.name);
      everyone.now.users.splice(everyone.now.users.indexOf(this.now.name), 1);
});

everyone.now.distributeMessage = function(message){
  //everyone.now.receiveMessage(this.now.name, message);
  nowjs.getGroup(this.now.room).now.receiveMessage(this.now.name, message);
};
