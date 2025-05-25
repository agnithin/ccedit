/***************************************************
* Express server configuration
***************************************************/

const favicon = require('serve-favicon');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const errorhandler = require('errorhandler');
const cookieParser = require('cookie-parser');

module.exports = function(app, express, path, passport, environment, sessionMiddleware){

  app.set('port', process.env.PORT || environment.port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');

  app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use(morgan('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(methodOverride());
  app.use(cookieParser(environment.session.secret));

  app.use(sessionMiddleware);

  app.use(passport.initialize());
  app.use(passport.session());

  // app.use(express.static(path.join(__dirname, 'public'))); // Removed from here

  if (app.get('env') === 'development' || environment.mode === 'development') {
    app.use(errorhandler());
  }

};