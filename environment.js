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

module.exports.twitter = {
	consumerKey : "q3FrfHhPosxQ05jCDYOdfA",
	consumerSecret : "4aiKO3a4sSQeElwzpCMlaHGRgtq7Wjb9Gxyw6N9o9w",
	callbackURL : "http://local.ccedit.com:2066/auth/twitter/callback"
};