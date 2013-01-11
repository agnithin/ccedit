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
    createdBy : {
      userId: ObjectId,
      displayName : String
    },
    modifiedOn : Date,
    modifiedBy : {
      userId: ObjectId,
      displayName : String
    },
    backup : [{
            contents : String,
            time : Date,
            backedupBy : {
              userId: ObjectId,
              displayName : String
            } 
          }]
  });

  FileSchema.methods.countBackupsByUser = function(userId) {
    var backupsByUser = 0;
    this.backup.forEach(function(backup){
      if(backup.backedupBy.userId.equals(userId)){
        backupsByUser++;
      }
    });
    return backupsByUser;
  };

  return mongoose.model('File', FileSchema);
}