/***************************************************
* Main Node.js App
***************************************************/

/* Module dependencies */
const express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    mongoose = require('mongoose'),
    diff_match_patch = require('./diff_match_patch_uncompressed'),
    passport = require('passport'),
    session = require('express-session'),
    cookieParser = require('cookie-parser');

const environment = require('./environment.js'),
    service = require('./service.js');

service.init(environment);

const MemoryStore = session.MemoryStore,
    sessionStore = new MemoryStore();

/* include the Mongoose Models */
const models = {};
models.User = service.useModel('user');
models.Project = service.useModel('project');
models.File = service.useModel('file');

require('./auth')(passport, models, environment);

const app = express();

// Define session middleware
const sessionMiddleware = session({
    store: sessionStore,
    key: environment.session.key,
    secret: environment.session.secret,
    resave: false,
    saveUninitialized: true
});

require('./configuration')(app, express, path, passport, environment, sessionMiddleware);

/* include routes */
require('./routes/index')(app, models)
require('./routes/auth')(app, passport, models)

app.use(express.static(path.join(__dirname, 'public'))); // <--- ADD THIS LINE HERE

const server = http.createServer(app).listen(app.get('port'), function(){
  console.log(`Express server listening on port ${app.get('port')}`);
});

/* include websocket controllers */
const io = require('socket.io')(server);

// 1. Use Express session middleware for Socket.IO
io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// 2. Custom authorization middleware for Socket.IO
io.use((socket, next) => {
    if (socket.request.session && socket.request.session.passport && socket.request.session.passport.user) {
        socket.session = socket.request.session;
        next();
    } else {
        console.error('Socket.IO Authentication error: No user session found.');
        next(new Error('Authentication error'));
    }
});

require('./controllers/user.js')(io, models);
require('./controllers/chat.js')(io, models);
require('./controllers/project.js')(io, models, diff_match_patch);