/** Project Schema for CC-Edit **/

var mongoose = require('mongoose');

module.exports = function(mongoose) {
  var Schema = mongoose.Schema;
  var ObjectId = Schema.ObjectId;
  

  // Define schema
  var ProjectSchema = new Schema({
      name : {type: String, required: true} 
    , users : [{userId:ObjectId, permissions: String}]
    , files:[{fileId:ObjectId, fileName:String}]
  });

  /*this.model = mongoose.model("User", UserSchema);
  return this;*/

  var projectModel = mongoose.model('Project', ProjectSchema);
     
  /* 
  var project = new projectModel();
    
    var fileModel = require('./file')(mongoose);
    var file= new fileModel();
    file.name="sample.html";
    file.contents="<h1>hello</h1> adfasdfasdfasdf";
    file.save();
    var file2= new fileModel();
    file2.name="sampleTest.html";
    file2.contents="<h3>xxxx</h1> opicxvbnxcvlbonimnbdoymbnogmnbodfmnbogfminbodfmnhbog";
    file2.save();

    project.name = 'Hello World';
    project.users = [{'userId': ObjectId("50b19bd587ceb5fb9b63f2c2"), 'permissions': "rw"}];
    project.files = [{'fileId':file._id, 'fileName':file.name}, {'fileId':file2._id, 'fileName':file2.name}];

    project.save(function(err) {
      if (err) throw err;
      console.log('project saved');
    });*/

    return projectModel;
  //return mongoose.model('User', UserSchema);
}

/*
db.users.save({"userId":"agnithin", "provider":"twitter", "displayName":"Nithin Anand Gangadharan", "email":"agnithin@gmail.com", "projects":[{"projectId":1, "projectName":"Test 1", "permissions":"rw"}, {"projectId":2,"projectName":"Test 2", "permissions":"rw"}]});
*/