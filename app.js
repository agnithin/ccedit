/***************************************************
* Main Node.js App
***************************************************/

/* Module dependencies */
var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    mongoose = require('mongoose'),
    diff_match_patch = require('./diff_match_patch_uncompressed'),
    passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy;

var environment = require('./environment.js'),
    service = require('./service.js');

service.init(environment);

var MemoryStore = express.session.MemoryStore,
	  sessionStore = new MemoryStore();

/* include the Mongoose Models */
var models = {};
models.User = service.useModel('user');
models.Project = service.useModel('project');
models.File = service.useModel('file');

require('./auth')(passport, TwitterStrategy, models, environment);

var app = express();
require('./configuration')(app, express, path, passport, environment, sessionStore, environment.session.key, environment.session.secret);

/* include routes */
require('./routes/index')(app, models)
require('./routes/auth')(app, passport, models)

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

/* include websocket controllers */
var io = require('socket.io').listen(server);

io.set('authorization', function(data, accept) {
  express.cookieParser(environment.session.secret)(data, {}, function(err) {
    if (err) {
      accept(err, false);
    } else {
      sessionStore.get(data.signedCookies[environment.session.key], function(err, session) {
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

require('./controllers/user.js')(io, models);
require('./controllers/chat.js')(io, models);
require('./controllers/project.js')(io, models, diff_match_patch);