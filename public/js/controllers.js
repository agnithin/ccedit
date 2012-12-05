/**************************
* Controllers
**************************/

function ProjectCtrl($scope, $location, $rootScope, socket) {
  $scope.project = '';
  
  //ugly hack to get project info, find proper angularjs initialization
  var url = $location.absUrl().split("/");
  var projectId = url[url.length-1];

  $scope.openFile = function(fileId){
    $rootScope.$broadcast('openFile', fileId);
  }

  socket.emit('getProject', projectId);

  socket.on('putProject', function (newProject) {
    $scope.project = newProject;
  });
}



function FileCtrl($scope, socket) {
  $scope.openFiles = [];

  $scope.activeFile = ''; //$scope.openFiles[0]._id; // currently active tab

  $scope.openFile = function(fileId){
    if(getOpenFileIndex(fileId) == -1){ // if file not open then request file
      socket.emit('getFile', fileId);
    }
    $scope.changeActiveFile(fileId);
  }

  $scope.closeFile = function(fileId){
    var openFileIndex = getOpenFileIndex(fileId);
     if(openFileIndex != -1){
      $scope.openFiles.splice(openFileIndex,1);
        if($scope.openFiles.length>0) 
          $scope.changeActiveFile($scope.openFiles[0]._id); 
     }
  }

  $scope.changeActiveFile = function(fileId){
    $scope.activeFile=$scope.openFiles[getOpenFileIndex(fileId)];
  }

  $scope.sendUpdatedFile = function(){
    console.log("file changed");
    socket.emit('updateFile', $scope.activeFile);
  }

  socket.on('putFile', function (newFile) {
    if(newFile == ''){
      alert("file Not Found"); // remove alert and put bootstrap error message
      return;
    }
    $scope.openFiles.push(newFile);
    $scope.changeActiveFile(newFile._id);
  });

  socket.on('updateFile', function (newFile) {
    if($scope.activeFile._id == newFile._id){
      $scope.activeFile = newFile;
    }
    var fileIndex = getOpenFileIndex(newFile._id);
    if(fileIndex != -1){
      $scope.openFiles[fileIndex] = newFile;
    }
  });

  function getOpenFileIndex(fileId){
    for (var i =0; i < $scope.openFiles.length; i++){
       if ($scope.openFiles[i]._id == fileId) {
          return i;
          break;
       }
     }
    return -1;
  }

  /* EVENTS */
  $scope.$on('openFile', function(event, fileId) {
    $scope.openFile(fileId);
  });
}