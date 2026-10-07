/**************************
* DATABASE ACCESS LAYER
* Code borrowed from : https://github.com/dtryon/clog
**************************/

let environment;
const mongoose = require('mongoose');

module.exports.init = function(env) {
    environment = env;
    // Connect only if not already connected (readyState 1) or connecting (readyState 2)
    // and not disconnecting (readyState 3). Only connect if disconnected (readyState 0).
    if (mongoose.connection.readyState === 0) { 
        mongoose.connect(environment.db.URL)
            .then(() => console.log('MongoDB connected successfully via service.js init.'))
            .catch(err => console.error('MongoDB connection error in service.js init:', err));
    }
};

module.exports.useModel = function (modelName) {
    return require(`./models/${modelName}`)(mongoose);
};

/*
module.exports.useModule = function (moduleName) {
    return require("./modules/" + moduleName);
};
*/