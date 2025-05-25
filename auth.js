/***************************************************
* Authentication Functions using Passport.js
***************************************************/

module.exports = function(passport, models, environment){ // Removed TwitterStrategy from parameters

  // Passport session setup.
  //   To support persistent login sessions, Passport needs to be able to
  //   serialize users into and deserialize users out of the session.  Typically,
  //   this will be as simple as storing the user ID when serializing, and finding
  //   the user by ID when deserializing.  
  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(async function(obj, done) {
    try {
      const user = await models.User.findById(obj);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });


  // Use the GoogleStrategy within Passport.
  const GoogleStrategy = require('passport-google-oauth20').Strategy;

  passport.use('google', new GoogleStrategy({
      clientID: environment.google.clientID,
      clientSecret: environment.google.clientSecret,
      callbackURL: environment.google.callbackURL
    },
    async function(accessToken, refreshToken, profile, done) {
      try {
        let user = await models.User.findOne({ provider: 'google', providerId: profile.id });

        if (user) { // Returning user
          console.log('Google Strategy: Returning User');
          user.lastConnected = new Date();
          user.profilePicture = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : user.profilePicture; // Update profile picture
          await user.save();
          return done(null, user);
        } else { // First-time user
          console.log('Google Strategy: First Time User');
          const newUser = new models.User({
            displayName: profile.displayName,
            email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null, // Store primary email
            provider: 'google',
            providerId: profile.id,
            // providerUsername: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null, // Optional
            profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
            lastConnected: new Date()
          });
          await newUser.save();
          console.log('Google Strategy: New User saved successfully');
          return done(null, newUser);
        }
      } catch (err) {
        console.error('Error in GoogleStrategy:', err);
        return done(err, null);
      }
    }
  ));
};