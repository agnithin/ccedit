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

  /*[{
    '_id':'50b3169fd5b15beb0e000005',
    'name':'sample.html',
    'contents':'<p>retineg iv inwerin</p><h2>adfqwfgewrfgsdfg</h2>'
  },
  {
    '_id':'50b3169fd5b15beb0e000006',
    'name':'sampleTest.html',
    'contents':'<p>newstuff</p><h2>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</h2>'
  }];*/

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
    $scope.activeFile=fileId;
  }

  $scope.getActiveFileContents = function(){
    var fileIndex = getOpenFileIndex($scope.activeFile);
    if( fileIndex == -1){
      return "";
    }else{
      return $scope.openFiles[fileIndex].contents;
    }
  }

  socket.on('putFile', function (newFile) {
    if(newFile == ''){
      alert("file Not Found"); // remove alert and put bootstrap error message
      return;
    }
    $scope.openFiles.push(newFile);
    $scope.changeActiveFile(newFile._id);
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