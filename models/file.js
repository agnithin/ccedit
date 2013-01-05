/**************************
* File Schema
**************************/
var mongoose = require('mongoose');

module.exports = function(mongoose) {
  var Schema = mongoose.Schema;
  var ObjectId = Schema.ObjectId;

  // Define File schema
  var FileSchema = new Schema({
    name : {type: String, required: true},
    contents : String,
    createdOn : Date,
    createdBy : ObjectId,
    modifiedOn : Date,
    modifiedBy : String, // change this to ObjectId
    backup : [{
            contents : String,
            time : Date,
            backedupBy : String // change this to ObjectId
          }]
  });

  return mongoose.model('File', FileSchema);
}