/**************************
* Controllers
**************************/

function ProjectCtrl($scope, $location, socket) {
  $scope.project = '';
  
  //ugly hack to get project info, find proper angularjs initialization
  var url = $location.absUrl().split("/");
  var projectId = url[url.length-1];

  /*$scope.openFile = function(fileId){
    console.log("openfile:"+ fileId);
    $scope.$emit('openFile');
  }*/

  socket.emit('getProject', projectId);

  socket.on('putProject', function (newProject) {
    $scope.project = newProject;
  });
}



function FileCtrl($scope, socket) {
  $scope.openFiles = [{
    '_id':'50b3169fd5b15beb0e000005',
    'name':'sample.html',
    'contents':'<p>retineg iv inwerin</p><h2>adfqwfgewrfgsdfg</h2>'
  },
  {
    '_id':'50b3169fd5b15beb0e000006',
    'name':'sampleTest.html',
    'contents':'<p>newstuff</p><h2>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</h2>'
  }];

  $scope.activeFile = $scope.openFiles[0]._id; // currently active tab

  /*$scope.$on('openFile', function() {
    console.log("request to open file:" + fileId);
    $scope.openFile(fileId);
  });*/


  $scope.openFile = function(fileId){
    if(getOpenFileIndex == -1){ // if file not open then request file
      socket.emit('getFile', value);
    }
    $scope.changeActiveFile(fileId);
  }

  $scope.closeFile = function(fileId){
    /*for (var i =0; i < $scope.openFiles.length; i++)
       if ($scope.openFiles[i]._id == fileId) {
          $scope.openFiles.splice(i,1);
          if($scope.openFiles.length>0) 
            $scope.changeActiveFile($scope.openFiles[0]._id);
          break;
       }*/
     var openFileIndex = getOpenFileIndex(fileId);
     if(openFileIndex != -1){
      $scope.openFiles.splice(openFileIndex,1);
        if($scope.openFiles.length>0) 
          $scope.changeActiveFile($scope.openFiles[0]._id); 
     }
  }

  $scope.changeActiveFile = function(fileId){
    $scope.activeFile=fileId;
  }

  socket.on('putFile', function (newFile) {
    $scope.openFiles.push(newFile);
    $scope.changeActiveFile(newFile._id);
  });

  function getOpenFileIndex(fileId){
    for (var i =0; i < $scope.openFiles.length; i++)
       if ($scope.openFiles[i]._id == fileId) {
          return i;
          break;
       }
       return -1;
  }
}