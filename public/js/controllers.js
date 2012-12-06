/**************************
* Controllers
**************************/

/** PROJECT CONTROLLER **/
function ProjectCtrl($scope, $location, $rootScope, fileSocket) {
  $scope.project = '';
  
  //ugly hack to get project info, find proper angularjs initialization
  var url = $location.absUrl().split("/");
  var projectId = url[url.length-1];

  $scope.openFile = function(fileId){
    $rootScope.$broadcast('openFile', fileId);
  }

  fileSocket.emit('getProject', projectId);

  fileSocket.on('getProject', function (newProject) {
    $scope.project = newProject;
  });
}


/** FILE CONTROLLER **/
function FileCtrl($scope, fileSocket) {
  $scope.openFiles = [];

  $scope.activeFile = ''; //$scope.openFiles[0]._id; // currently active tab

  $scope.openFile = function(fileId){
    if(getOpenFileIndex(fileId) == -1){ // if file not open then request file
      fileSocket.emit('getFile', fileId);
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
    fileSocket.emit('updateFile', $scope.activeFile);
  }

  fileSocket.on('getFile', function (newFile) {
    if(newFile == ''){
      alert("file Not Found"); // remove alert and put bootstrap error message
      return;
    }
    $scope.openFiles.push(newFile);
    $scope.changeActiveFile(newFile._id);
  });

  fileSocket.on('updateFile', function (newFile) {
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

/** CHAT CONTROLLER **/
function ChatCtrl($scope, $timeout, chatSocket) {
  
  $scope.chatLog = new Array();
  $scope.chatNotifications = [];
  $scope.onlineUsers = [];
  $scope.chatText = '';

  // on connection to server, ask for user's name with an anonymous callback
  chatSocket.on('connect', function(){
    // call the server-side function 'adduser' and send one parameter (value of prompt)
    chatSocket.emit('adduser', username);
  });

  // listener, whenever the server emits 'updatechat', this updates the chat body
  chatSocket.on('updatechat', function (username, data) {
    if(username == 'SERVER'){
      $scope.chatNotifications.push(data);
      $timeout(function(){
        $scope.chatNotifications.pop();
      }, 3000);
    }else{
      $scope.chatLog.push({'username': username, 'data' : data});
      //$scope.chatLog += '<b>'+username + ':</b> ' + data + '<br>'
    }
  }); 

  // listener, whenever the server emits 'updateusers', this updates the username list
  chatSocket.on('updateusers', function(data) {
    $scope.onlineUsers = data;
  });

  $scope.sendChat = function(){
    chatSocket.emit('sendchat', $scope.chatText);
    $scope.chatText = '';
  }
}