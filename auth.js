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

  passport.deserializeUser(async function(obj, done) { // Made async
    try {
      const user = await models.User.findById(obj);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });


  // Use the TwitterStrategy within Passport.
  //   Strategies in passport require a `verify` function, which accept
  //   credentials (in this case, a token, tokenSecret, and Twitter profile), and
  //   invoke a callback with a user object.
  console.log('[AUTH.JS] Attempting to register Twitter strategy.');
  console.log('[AUTH.JS] TwitterStrategy object constructor name:', TwitterStrategy ? TwitterStrategy.name : 'TwitterStrategy is undefined/null');

  try {
    const strategyInstance = new TwitterStrategy({
        consumerKey: environment.twitter.consumerKey,
        consumerSecret: environment.twitter.consumerSecret,
        callbackURL: environment.twitter.callbackURL
      },
      async function(token, tokenSecret, profile, done) { // Made async
        try {
          let user = await models.User.findOne({ provider: 'twitter', providerId: profile.id });

          if (user) { // returning user
            console.log("Returning User");
            await models.User.updateOne({ "_id": user._id }, { $set: { lastConnected: new Date() } });
            return done(null, user);
          } else { // firsttime user
            console.log("First Time User");
            const newUser = new models.User({ // Changed variable name to avoid conflict if needed, though 'user' is shadowed
              displayName: profile.displayName,
              provider: profile.provider,
              providerId: profile.id,
              providerUsername: profile.username,
              lastConnected: Date.now(),
              profilePicture: `https://api.twitter.com/1/users/profile_image?screen_name=${profile.username}&size=bigger` // Changed to template literal
            });

            await newUser.save();
            console.log("New User saved successfully");
            return done(null, newUser);
          }
        } catch (err) {
          console.log("Error in TwitterStrategy verify callback:", err); // More specific log
          return done(err, null);
        }
      }
    );

    console.log('[AUTH.JS] TwitterStrategy instance created:', strategyInstance ? 'Instance OK' : 'Instance FAILED');
    if (strategyInstance) { // Add this block
        console.log('[AUTH.JS] Strategy instance name:', strategyInstance.name); 
    }
    
    passport.use('twitter', strategyInstance); // Explicitly name the strategy 'twitter'

    console.log('[AUTH.JS] Twitter strategy registration attempted with passport.use(\'twitter\', strategyInstance).'); // Updated log
  } catch (e) {
    console.error('[AUTH.JS] CRITICAL ERROR during TwitterStrategy instantiation or passport.use():', e);
  }
};