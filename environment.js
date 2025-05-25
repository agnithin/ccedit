/***************************************************
* Environment variables
***************************************************/
module.exports.appName = "ccedit",
module.exports.db = {
    URL: 'mongodb://localhost/ccedit'
};
module.exports.port = 2066;

module.exports.session = {
	secret : "blue_frog",
	key : "connect.sid"
}

module.exports.google = {
  clientID: 'YOUR_GOOGLE_CLIENT_ID',
  clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
  callbackURL: 'http://localhost:2066/auth/google/callback'
};