
/**
 * Module dependencies.
 */
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  ,	diff_match_patch = require('./diff_match_patch_uncompressed.js')
  , passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy;

var environment = require('./environment.js')
  , service = require('./service.js');
service.init(environment);

require('./auth.js')(passport, TwitterStrategy);

var models = {};
models.User = service.useModel('user');
models.Project = service.useModel('project');
models.File = service.useModel('file');

var app = express();
require('./configuration')(app, express, path, passport);

// include routes
require('./routes/index')(app, models, mongoose)
require('./routes/auth')(app, passport)

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

// websocket controllers
var io = require('socket.io').listen(server);

require('./controllers/chatController.js')(io);
require('./controllers/fileController.js')(io, models, diff_match_patch);

var dmp = new diff_match_patch();