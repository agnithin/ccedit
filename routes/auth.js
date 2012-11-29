
module.exports = function (app, passport) {

/* --- passport --- */
  // GET /auth/twitter
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  The first step in Twitter authentication will involve redirecting
  //   the user to twitter.com.  After authorization, the Twitter will redirect
  //   the user back to this application at /auth/twitter/callback
  app.get('/auth/twitter',
    passport.authenticate('twitter'),
    function(req, res){
      // The request will be redirected to Twitter for authentication, so this
      // function will not be called.
    });

  // GET /auth/twitter/callback
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  app.get('/auth/twitter/callback', 
    passport.authenticate('twitter', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
    });

  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });


  /** IMPORTANT! - REMOVE THIS CODE **/
  app.get('/auth/backdoor/:id', function(req, res){
    user={'username':req.params.id, 'displayName': req.params.id}
    /*req.user.username = ;
    req.user.displayName = req.params.id;*/
    //console.log(req.user);
    req.login(user, function(err) {
      if (err) {
        console.log(err);
      }
    });

    res.redirect('/');
  });


}
