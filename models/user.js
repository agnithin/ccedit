/** User Schema for CC-Edit **/

var mongoose = require('mongoose');

module.exports = function(mongoose) {
  var collection = 'User';
  var Schema = mongoose.Schema;
  var ObjectId = Schema.ObjectId;

  // Define schema
  /*var ProjectLinkSchema = new Schema({
        projectId        : Number
      , permissions      : String
    });*/


  var UserSchema = new Schema({
      userId : {type: String, required: true}
    , provider : {type: String, required: true} 
    , displayName : {type: String, required: true }
    , email: { type: String, unique: true }
    , projects:{ type: [{projectId: ObjectId, projectName: String, permissions: String }] }
  });

  var userModel = mongoose.model('User', UserSchema);
     
  /*var user = new userModel();
     
    user.userId = 'ag_nithin';
    user.provider = 'twitter';
    user.displayName = 'AG Nithin';
    user.email= "agnithin@yahoo.com";

    user.save(function(err) {
      if (err) throw err;
      console.log('User saved, starting server...');
    }); */

    return userModel;
  //return mongoose.model('User', UserSchema);
}

/*
db.users.save({"userId":"agnithin", "provider":"twitter", "displayName":"Nithin Anand Gangadharan", "email":"agnithin@gmail.com", "projects":[{"projectId":1, "projectName":"Test 1", "permissions":"rw"}]});
*/