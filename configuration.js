/***************************************************
* Express server configuration
***************************************************/

module.exports = function(app, express, path, passport, environment, sessionStore, sessionKey, sessionSecret){

	app.configure(function(){
	  app.set('port', process.env.PORT || environment.port);
	  app.set('views', __dirname + '/views');
	  app.set('view engine', 'ejs');
	  app.use(express.favicon());
	  app.use(express.logger('dev'));
	  app.use(express.bodyParser());
	  app.use(express.methodOverride());
	  app.use(express.cookieParser(sessionSecret));	   
	  app.use(express.session({
	  	store: sessionStore,
	  	key: sessionKey,
	  	secret : sessionSecret
	  }));

	  app.use(passport.initialize());
	  app.use(passport.session());

	  app.use(app.router);
	  app.use(express.static(path.join(__dirname, 'public')));
	});

	app.configure('development', function(){
	  app.use(express.errorHandler());
	});

};