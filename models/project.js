/**************************
* Project Schema
**************************/
module.exports = function(mongoose) {
  var Schema = mongoose.Schema;
  var ObjectId = Schema.ObjectId;

  // Define schema
  var ProjectSchema = new Schema({
    name : {type: String, required: true},
    description : String,
    author : ObjectId,
    createdOn : Date,
    users : [{
      userId : ObjectId, 
      displayName : String,
      permissions : String,
      _id : false
    }],
    files:[{
      fileId : ObjectId, 
      fileName : String,
      _id : false
    }]
  });

  return mongoose.model('Project', ProjectSchema);
}