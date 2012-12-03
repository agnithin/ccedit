
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

//var db = mongoose.createConnection('mongodb://localhost/ccedit');

var models = {};
models.User = require('./models/user')(mongoose);
models.Project = require('./models/project')(mongoose);
models.File = require('./models/file')(mongoose);

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

  mongoose.connect('mongodb://localhost/ccedit');
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// configuration for express etc
require('./routes/index')(app, models, mongoose)
require('./routes/auth')(app, passport)

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

// websocket controllers
var io = require('socket.io').listen(server);

require('./chatController.js')(io);
require('./fileController.js')(io, models);

