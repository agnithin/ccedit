/**************************
* Controllers
**************************/

/** PROJECT CONTROLLER **/
function ProjectCtrl($scope, $rootScope, fileSocket) {
  $scope.project = {'_id':projectId, 'name':'New Project'};
  $scope.username = username;
  $scope.newFileName;
  $scope.modal = {'header':'asdf', 
                  'body':'asdf', 
                  'buttons':[{'display':'df',
                              'action':function(){
                                console.log("lets see if this works");
                              }
                            }]
                  };
  $scope.showModal = false;

  $scope.openFile = function(fileId){
    $rootScope.$broadcast('openFile', fileId);
  }

  $scope.addFile = function(){
   fileSocket.emit('createFile', {'projectId':$scope.project._id, 'fileName':$scope.newFileName});
   $scope.newFileName = '';
  };

  $scope.deleteFile = function(fileId, fileName){
    $rootScope.$broadcast('closeFile', fileId);

    bootbox.confirm("Are you sure you want to delete "+fileName+"?", function(confirmed) {
                    if(confirmed){
                      fileSocket.emit('deleteFile', {'projectId':$scope.project._id, 'fileId':fileId});
                    }
                });         
  };
  /* TODO delete file push activity required to close file in ohter window */

  fileSocket.emit('getProject', projectId);

  fileSocket.on('getProject', function (newProject) {
    $scope.project = newProject;
  });
}


/** FILE CONTROLLER **/
function FileCtrl($scope, fileSocket) {
  $scope.openFiles = [];

  var emptyFile = {'_id':'', 'name':'','contents':''};
  $scope.activeFile = emptyFile; //$scope.openFiles[0]._id; // currently active tab

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
        if($scope.openFiles.length>0){ 
          $scope.changeActiveFile($scope.openFiles[0]._id);
        }else{
          $scope.activeFile = emptyFile;
        }

     }
  }

  $scope.changeActiveFile = function(fileId){
    if(!fileId){
      $scope.activeFile = emptyFile;
    }else{
      $scope.activeFile = $scope.openFiles[getOpenFileIndex(fileId)];
    }
  }

  $scope.sendUpdatedFile = function(){
    if($scope.activeFile._id != ''){
      fileSocket.emit('updateFile', $scope.activeFile);
    }
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

  $scope.$on('closeFile', function(event, fileId) {
    console.log("closing file");    
    var fileIndex = getOpenFileIndex(fileId);
    if(fileIndex != -1){ // if file among open files      
      $scope.openFiles.splice(fileIndex, 1);
      if($scope.activeFile._id == fileId){ // if currently editing file, change tab
        if($scope.openFiles.length > 0){
          $scope.activeFile = $scope.openFiles[0];
        }else{
          $scope.changeActiveFile();
        }
      }      
    }    
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