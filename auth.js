/***************************************************
* Authentication Functions using Passport.js
***************************************************/

module.exports = function(passport, TwitterStrategy, models, environment){

  // Passport session setup.
  //   To support persistent login sessions, Passport needs to be able to
  //   serialize users into and deserialize users out of the session.  Typically,
  //   this will be as simple as storing the user ID when serializing, and finding
  //   the user by ID when deserializing.  
  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(obj, done) {
    models.User.findById(obj, function(err, user) {
       done(err, user);
     });
  });


  // Use the TwitterStrategy within Passport.
  //   Strategies in passport require a `verify` function, which accept
  //   credentials (in this case, a token, tokenSecret, and Twitter profile), and
  //   invoke a callback with a user object.
  passport.use(new TwitterStrategy({
      consumerKey: environment.twitter.consumerKey,
      consumerSecret: environment.twitter.consumerSecret,
      callbackURL: environment.twitter.callbackURL
    },
    function(token, tokenSecret, profile, done) {
      /*// asynchronous verification, for effect...
      process.nextTick(function () {
        
        // To keep the example simple, the user's Twitter profile is returned to
        // represent the logged-in user.  In a typical application, you would want
        // to associate the Twitter account with a user record in your database,
        // and return that user instead.
        return done(null, profile);
      });*/
      models.User.findOne({provider:'twitter', providerId: profile.id},
        function(err, user) {
          if (!err && user != null) { // returning user
            console.log("Returning User");
            models.User.update({"_id": user._id}, { $set: {lastConnected: new Date()} } ).exec();
            done(null, user);
          } else { // firsttime user
            console.log("First Time User");
            var userData = new models.User({
              displayName: profile.displayName,
              provider: profile.provider,
              providerId : profile.id,
              providerUsername: profile.username,              
              lastConnected : Date.now(),              
              profilePicture: 'https://api.twitter.com/1/users/profile_image?screen_name=' + profile.username +'&size=bigger'
            });

            userData.save(function(err) {
              if (err){ 
                console.log("Error saving User data:" + err);
              }else{ 
                console.log("New User saved successfully");
              }
            }); 
            done(null, userData);           
          }     
        }
      );   
    }
  ))
};