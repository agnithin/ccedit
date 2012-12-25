
/**
 * Module dependencies.
 */
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  ,	diff_match_patch = require('./diff_match_patch_uncompressed')
  , passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy,
  connect = require('connect');

var MemoryStore = express.session.MemoryStore,
	sessionStore = new MemoryStore(),
  //sessionStore = new connect.middleware.session.MemoryStore()
	sessionSecret = "blue_frog",
	sessionKey = 'connect.sid';  

var environment = require('./environment.js')
  , service = require('./service.js');
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

var cookieParser = express.cookieParser(sessionSecret);

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
          console.log(data);
          accept(null, true);
        }
      });
    }
  });
});

/*io.configure(function () {
    io.set('authorization', function (data, accept) {
      console.log(data);
        if (data.headers.cookie) {

          data.cookie = require('express/node_modules/cookie').parse(decodeURIComponent(data.headers.cookie));
          //data.cookie.expires = false;
          data.sessionID = require('connect').utils.parseSignedCookie(data.cookie[sessionKey], sessionSecret);
          //data.sessionID = require('connect').utils.parseSignedCookies(cookie.parse(decodeURIComponent(req.headers.cookie)),'your cookie secret')
          //data.sessionID = data.cookie[sessionKey];
          //data.sessionStore = sessionStore;

          console.log("data:%j", data)
          console.log("session Key:" + sessionKey+ "\nsession secret:" + sessionSecret);
          console.log("=============\nsessionstore:%j", sessionStore)
          sessionStore.get(data.sessionID, function (err, session) {
              console.log(err, session);
              if (err || !session)
                  return accept('Error', false);
              //data.session = new Session(data, session);
              return accept(null, true);
          });
      }else {
            return accept(null, false);
        }
    });
  });*/

require('./controllers/userController.js')(io, models);
require('./controllers/chatController.js')(io);
require('./controllers/projectController.js')(io, models, diff_match_patch);