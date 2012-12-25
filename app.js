/**
 * Module dependencies.
 */
var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    mongoose = require('mongoose'),
    diff_match_patch = require('./diff_match_patch_uncompressed'),
    passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy;

var MemoryStore = express.session.MemoryStore,
	sessionStore = new MemoryStore(),
	sessionSecret = "blue_frog",
	sessionKey = 'connect.sid',
  cookieParser = express.cookieParser(sessionSecret); 

var environment = require('./environment.js'),
    service = require('./service.js');
service.init(environment);

var models = {};
models.User = service.useModel('user');
models.Project = service.useModel('project');
models.File = service.useModel('file');

require('./auth.js')(passport, TwitterStrategy, models);

var app = express();
require('./configuration')(app, express, path, passport, sessionStore, sessionKey, sessionSecret);

// include routes
require('./routes/index')(app, models)
require('./routes/auth')(app, passport, models)

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

// websocket controllers
var io = require('socket.io').listen(server);

io.set('authorization', function(data, accept) {
  cookieParser(data, {}, function(err) {
    if (err) {
      accept(err, false);
    } else {
      sessionStore.get(data.signedCookies[sessionKey], function(err, session) {
        if (err || !session) {
          accept('Session error', false);
        } else {
          data.session = session;
          accept(null, true);
        }
      });
    }
  });
});

require('./controllers/userController.js')(io, models);
require('./controllers/chatController.js')(io);
require('./controllers/projectController.js')(io, models, diff_match_patch);