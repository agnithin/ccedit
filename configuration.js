/***************************************************
* Express server configuration
***************************************************/

const favicon = require('serve-favicon');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session'); // express-session module
const errorhandler = require('errorhandler');
const cookieParser = require('cookie-parser');

module.exports = function(app, express, path, passport, environment, sessionStore, sessionKey, sessionSecret){

  app.set('port', process.env.PORT || environment.port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');

  app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use(morgan('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(methodOverride());
  app.use(cookieParser(sessionSecret));

  app.use(session({
    store: sessionStore,
    key: sessionKey,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // app.router is removed in Express 4.x. Middleware are processed in order.
  // Routes will be handled by app.use('/path', router) or app.get/post calls in index.js and auth.js
  // app.use(app.router); 
  app.use(express.static(path.join(__dirname, 'public')));

  if (app.get('env') === 'development' || environment.mode === 'development') { // Check environment robustly
    app.use(errorhandler());
  }

};