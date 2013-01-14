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

  FileSchema.methods.deleteBackupsByUser = function(userId) {
    var backupsByUser = 0;
    for(i=0; i<this.backup.length; i++){
      console.log("====" + this.backup[i].backedupBy.userId + " | " + userId);
      if(this.backup[i].backedupBy.userId.equals(userId)){
        this.backup.splice(i, 1);
        i--;
      }
    }
    console.log(this.backup);
  };

  return mongoose.model('File', FileSchema);
}