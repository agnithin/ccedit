/**************************
* File Schema
**************************/
var mongoose = require('mongoose');

module.exports = function(mongoose) {
  var Schema = mongoose.Schema;
  var ObjectId = Schema.ObjectId;

  // Define schema
  var FileSchema = new Schema({
      name : {type: String, required: true} 
    , contents : String
    , timeCreated: Date
    , timeModified: Date
  });

  /*this.model = mongoose.model("User", UserSchema);
  return this;*/

  var fileModel = mongoose.model('File', FileSchema);

  return fileModel;
}

/*
db.files.save({'name':"test.html", 'contents':"<h1>hello</h1> adfasdfasdfasdf"});
*/