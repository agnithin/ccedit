/**************************
* User Schema
**************************/
module.exports = function(mongoose) {
  var collection = 'User';
  var Schema = mongoose.Schema;
  var ObjectId = Schema.ObjectId;

  var UserSchema = new Schema({
    displayName : {type: String, required: true },
    provider : {type: String, required: true},
    providerId : {type: String, required: true},
    providerUsername : String,
    profilePicture : String,
    email: String,
    lastConnected : Date,
    projects:{ 
      type : [{
        projectId : ObjectId, 
        projectName : String,
        description : String,
        permissions: String,
        _id : false 
      }] 
    }
  });

  return mongoose.model('User', UserSchema);
}