/**************************
* Controllers
**************************/

/** USER CONTROLLER **/
app.controller('UserCtrl', function($scope, $rootScope, $routeParams, $route, userSocket, bootbox, notificationService, Page) {
  /*$rootScope.currentUser = user;

  userSocket.on('connect', function(){
    userSocket.emit('getProjects', $rootScope.currentUser._id);
  });

  userSocket.on('getProjects', function (projects) {
    $scope.userProjects = projects;
  });*/

  $scope.page = Page;

  userSocket.on('connect', function(){
    userSocket.emit('getUser');
  });

  userSocket.on('getUser', function (user) {
    $rootScope.currentUser = user;
    $rootScope.$broadcast('initializeWorkspace');
  });

  userSocket.on('refreshProjects', function () {
    userSocket.emit('getProjects', $rootScope.currentUser._id);
    //TODO if project open then refresh that project
  });
  userSocket.on('getProjects', function (projects) {
    $rootScope.currentUser.projects = projects;
  });

  $scope.deleteProject = function(project){
    bootbox.confirm("<b>Are you sure you want to delete "+project.projectName+"?</b>" 
      + "<br><br>WARNING: If you are the only collaborator of the project, the project and all its files would deleted." 
      + " If there are other collaborators, the project will remain, but you wont have access to it."
      , function(confirmed) {
                    if(confirmed){
                      userSocket.emit('deleteProject', {
                        'userId' :$rootScope.currentUser._id,
                        'projectId' : project.projectId
                      });
                      console.log('deleteProject:'+ $rootScope.currentUser._id + ":"+ project.projectId);
                    }
                });    
  }

  $scope.createProject = function(newProjectName, newProjectDesc){
    var newProject = {
      'name' : newProjectName,
      'description' : newProjectDesc
    };
    console.log('createProject:',  JSON.stringify(newProject));
    userSocket.emit('createProject', {
      'user' : {
        'userId': $rootScope.currentUser._id
      },
      'project': newProject
    });
    $scope.newProjectName = '';
    $scope.newProjectDesc = '';    
  }

  /** ADD COLLABORATOR DIALOG **/
  $scope.findUserString;
  $scope.searchedUsers;
  $scope.selectedUsers;

  $scope.initializeCollaborators = function(project){
    $scope.selectedUsers = project.users;
    $scope.updatedCollaborators = {add:[], remove:[]};
    $scope.findUserString = '';
    $scope.searchedUsers = new Array();
  }
  $scope.findUser = function(){
    if($scope.findUserString.length<3){
      bootbox.alert("Enter minmum of 3 characters");
    }else{
      userSocket.emit('findUserByName', $scope.findUserString);
    }
  }

  userSocket.on('findUser', function(data){
    $scope.searchedUsers = data.users;
  });

  $scope.addToSelectedUsers = function(user){
    if(getUserIndex($scope.selectedUsers, user.userId) == -1){
      $scope.selectedUsers.push({
        'userId':user._id,
        'displayName': user.displayName,
        'permissions' : 'rw'
      });

      /*new logic */
      var userIndexInRemove = getUserIndex($scope.updatedCollaborators.remove, user._id)
      if( userIndexInRemove != -1){ 
        $scope.updatedCollaborators.remove.splice(userIndexInRemove,1);
      }else{ // if user already a collaborator
        $scope.updatedCollaborators.add.push({
          'userId':user._id,
          'displayName': user.displayName,
          'permissions' : 'rw'
        });
      }
    }
    console.log($scope.updatedCollaborators);
  }

  $scope.removeFromSelectedUsers = function(user){
    if(user.userId == $rootScope.currentUser._id){
       bootbox.alert("You cannot remove your self from the project!");
    }else{
      /* new logic */
      var userIndexInAdd = getUserIndex($scope.updatedCollaborators.add, user.userId); //userId
      if( userIndexInAdd != -1){ 
        $scope.updatedCollaborators.add.splice(userIndexInAdd, 1);
      }else{// if user already a collaborator
        $scope.updatedCollaborators.remove.push({
          'userId': user.userId,
          'displayName': user.displayName,
          'permissions' : 'rw'
        });
      }

      var userIndex = getUserIndex($scope.selectedUsers, user.userId);
      if(userIndex!=-1){
        $scope.selectedUsers.splice(userIndex,1);
      }
    }
  }

  $scope.isUserSelected = function(user){
    return getUserIndex($scope.selectedUsers, user._id) == -1;
  }

  $scope.isCollaboratorsUpdated = function(){
    return ($scope.updatedCollaborators
      && $scope.updatedCollaborators.add.length == 0 
      && $scope.updatedCollaborators.remove.length == 0);
  }

  $scope.addSelectedUsersToProject = function(project){
    console.log($scope.updatedCollaborators);
    userSocket.emit('updateCollaborators', {
      'projectId':project._id,
      'users': $scope.updatedCollaborators
    });
  }

  //this function is required because indexOf does not work when there is new search
  var getUserIndex = function(userArrray, userId){
    var userIndex = -1;
    for(i=0; i<userArrray.length; i++){
      if(userArrray[i].userId == userId){
        userIndex = i;
        break;
      }
    }
    return userIndex;
  }

  userSocket.on('notify', function (data) {
    $rootScope.$broadcast('createNotification', data);
  });

  /** NOTIFICATION SERVICE **/
  $scope.$on('createNotification',  function (event, notification){
    console.log("Notification:" + JSON.stringify(notification));
    notificationService.showNotification(notification);
  });

});

/****************************
* PROJECT CONTROLLER 
****************************/
app.controller('ProjectCtrl', function($scope, $rootScope, $routeParams, projectSocket, bootbox) {
  $rootScope.project = {'_id':$routeParams.projectId, 'name':'New Project'};

  /*projectSocket.socket.on('connect_failed', function (message) { 
    bootbox.alert("Connection to the Server lost. Please Refresh the page.");
  });*/

  var initializeProject = function(){
    if(projectSocket.isConnected()){
      projectSocket.emit('getProject', $rootScope.project._id);
    }else{
      projectSocket.connect();
    }
  };

  if($rootScope.currentUser){
    initializeProject();
  }
  $rootScope.$on('initializeWorkspace', function(){
    initializeProject();
  });

  $scope.newFileName;
  $scope.showAddNewFileTextbox = false;

  $scope.$on('$destroy', function() {
   projectSocket.removeAllListeners();
   $rootScope.project = '';
   //projectSocket.disconnect(); 
  });  

  projectSocket.on('connect', function(){
    console.log("projectSocket connected");
    projectSocket.emit('getProject', $rootScope.project._id);
  });  

  projectSocket.on('getProject', function (newProject) {
    $rootScope.project = newProject;
    $scope.page.setProjectPage($rootScope.project.name);
  });

  projectSocket.on('notify', function (data) {
    $rootScope.$broadcast('createNotification', data);
  });

  $scope.openFile = function(fileId){
    $rootScope.$broadcast('openFile', fileId);
  }

  $scope.addFile = function(){
   projectSocket.emit('createFile', {'projectId':$rootScope.project._id, 'fileName':$scope.newFileName});
   $scope.newFileName = '';
   $scope.showAddNewFileTextbox = false;
  };

  $scope.showAddFile = function(){
    $scope.showAddNewFileTextbox = !$scope.showAddNewFileTextbox;    
  }

  $scope.deleteFile = function(fileId, fileName){    
    bootbox.confirm("Are you sure you want to delete "+fileName+"?", function(confirmed) {
                    if(confirmed){
                      $rootScope.$broadcast('closeFile', fileId);
                      projectSocket.emit('deleteFile', {'projectId':$rootScope.project._id, 'fileId':fileId});
                    }
                });         
  };
  /* TODO delete file push activity required to close file in other window */

  // FILE SEARCH // MOVE THIS TO DIRECTIVES
  $('#file-search').typeahead({
      source: function(query, process) {
          return_list = [];
          map = {};
          data = new Array();
          for(i=0;i<$scope.project.files.length;i++){
            data.push({
              id: $scope.project.files[i].fileId, 
              label: $scope.project.files[i].fileName});
          }
          angular.forEach(data, function(object) {
            map[object.label] = object;
            return_list.push(object.label);
          });
          process(return_list);                 
      },
      updater: function(item) {
        $scope.openFile(map[item].id);
        return item;
      }
  });

});


/** FILE CONTROLLER **/
app.controller('FileCtrl', function($scope, $rootScope, projectSocket, bootbox, diffMatchPatch, codeMirrorMode) {
  $scope.openFiles = [];

  var emptyFile = {'_id':'', 'name':'','contents':''};
  $scope.activeFile = emptyFile; //$scope.openFiles[0]._id; // currently active tab
  $scope.activeFileContentsBeforeChange = '';

  $scope.openFile = function(fileId){
    if(getOpenFileIndex(fileId) == -1){ // if file not open then request file
      projectSocket.emit('getFile', fileId);
    }else{// if file already among open files then activate tab
      $scope.changeActiveFile(fileId);
    }
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

  /* CURSOR SYNCING */
  $scope.othersCursors = new Array();

  $scope.cursorActivity = function(cursor){
    if($scope.activeFile._id != ''){
      projectSocket.emit('updateCursor', {
        'user':{
          'userId' : $rootScope.currentUser._id,
          'displayName' : $rootScope.currentUser.displayName
        },
        'projectId' : $rootScope.project._id,
        'fileId' : $scope.activeFile._id,
        'cursor' : cursor
      });
    }
  }

  projectSocket.on('updateCursor', function (data) {
    for(i=0; i<$scope.othersCursors.length;i++){
      if($scope.othersCursors[i].user.userId == data.user.userId){
        $scope.othersCursors[i] = data;
        break;
      }
    }
    if(i==$scope.othersCursors.length){
      $scope.othersCursors.push(data);
    }
    $scope.updateCursors();
  });

  $scope.updateCursors = function(){
    angular.forEach($scope.othersCursors, function(userDetails){
      if(userDetails.fileId == $scope.activeFile._id){
        $rootScope.$broadcast('updateOthersCursor', userDetails);
      }
    });
  }

  $scope.changeActiveFile = function(fileId){
    $rootScope.$broadcast('clearOthersCursor');
    if(!fileId){
      $scope.activeFile = emptyFile;
    }else{
      $scope.activeFile = $scope.openFiles[getOpenFileIndex(fileId)];
      $scope.activeFileContentsBeforeChange = $scope.activeFile.contents;
      $scope.updateCursors();

      if($scope.activeFile.name.split(".").length>1){
        var fileMode = codeMirrorMode.getMode($scope.activeFile.name.split(".")[$scope.activeFile.name.split(".").length-1]);
        $rootScope.$broadcast('updateMode', fileMode);
      }else{
        $scope.fileMode = '';
        console.log("mode not detected");
      }      
    }
  }

  $scope.sendUpdatedFile = function(){
    if($scope.activeFile._id != ''){
      var diff = diffMatchPatch.diff_launch($scope.activeFileContentsBeforeChange, $scope.activeFile.contents);
      /*console.log("=======Unpatched Text\n" + $scope.activeFileContentsBeforeChange);
      console.log("=======Patch\n" + diff);
      console.log("=======patched text\n" + patch_launch($scope.activeFileContentsBeforeChange, diff));*/
      //projectSocket.emit('updateFile', $scope.activeFile);
      projectSocket.emit('updateFile', {'id':$scope.activeFile._id, 'name':$scope.activeFile.name, 'patch': diff});
      $scope.activeFileContentsBeforeChange = $scope.activeFile.contents;
    }
  }

  projectSocket.on('getFile', function (newFile) {
    console.log("recieved file:" + newFile.name);
    if(newFile == ''){
      alert("file Not Found"); // remove alert and put bootstrap error message
      return;
    }
    $scope.openFiles.push(newFile);
    $scope.changeActiveFile(newFile._id);
  });

  projectSocket.on('updateFile', function (fileUpdate) {
    var fileIndex = getOpenFileIndex(fileUpdate.id);
    if(fileIndex != -1){
      /*console.log("=======Unpatched Text\n" + $scope.activeFile.contents);
      console.log("Patch =======\n" + fileUpdate.diff);*/
      var patchedText = diffMatchPatch.patch_launch($scope.activeFile.contents, fileUpdate.patch);
      //console.log("Patched Text =======\n" + patchedText);
      $scope.openFiles[fileIndex].contents = patchedText;
      //$scope.openFiles[fileIndex] = fileUpdate;
    }
    if($scope.activeFile._id == fileUpdate.id){      
      //$scope.activeFile.contents = patch_launch($scope.activeFile.contents, fileUpdate.diff);
      /* activeFile should be automatically refreshed since it is a pointer to an object in openFiles
        but this is not happening. is it cause of angularjs? figure out why */
      $scope.activeFile = $scope.openFiles[fileIndex];
      $scope.activeFileContentsBeforeChange = $scope.activeFile.contents;
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

  /** FILE BACKUP STUFF **/
  $scope.backupList = new Array();
  $scope.selectedBackup == '';

  $scope.backupFile = function(fileId){
    /* This should be removed */
    $('[data-toggle="dropdown"]').parent().removeClass('open');
    projectSocket.emit('backupFile', fileId);
  }

  $scope.initializeBackupList = function(fileId){
    $('[data-toggle="dropdown"]').parent().removeClass('open');
    $scope.selectedBackup = '';
    projectSocket.emit('listBackups', fileId);
  }

  projectSocket.on('listBackups', function(backupList){
    $scope.backupList = backupList;
  })

  $scope.selectBackup = function(backup){
    $scope.selectedBackup = backup;
  }
  $scope.isSelectedBackup = function(backup){
    return ($scope.selectedBackup!= '' && $scope.selectedBackup._id == backup._id);
  }
  $scope.restoreBackup = function(){
    console.log("restoring backup");
    projectSocket.emit('restoreBackup', $scope.selectedBackup);
  }
  $scope.deleteBackup = function(){
    console.log("deleting backup");
    projectSocket.emit('deleteBackup', $scope.selectedBackup);
  }
  projectSocket.on('refreshBackups', function(fileId){
    $scope.selectedBackup = '';
    projectSocket.emit('listBackups', fileId);
  })
});


/** CHAT CONTROLLER **/
app.controller('ChatCtrl', function($scope, $timeout, $rootScope, chatSocket) {
  
  $scope.chatLog = new Array();
  $scope.chatNotifications = [];
  $scope.onlineUsers = [];
  $scope.chatText = '';
  $scope.unreadChatCount = 0;

  var initializeChat = function(){
    if(chatSocket.isConnected()){
      chatSocket.emit('adduser', {'projectId':$rootScope.project._id, 'username':$rootScope.currentUser.displayName});
    }
  };

  //if user has been initialized then initialize chat
  if($rootScope.currentUser){
    initializeChat();
  }
  // if user has not been initialized wait for initialize event
  // this is required when the project page is refreshed
  $rootScope.$on('initializeWorkspace', function(){
    initializeChat();
  });  

  $scope.$on('$destroy', function() {
   chatSocket.emit('removeuser');
   chatSocket.removeAllListeners(); 
  });

  // on connection to server, ask for user's name with an anonymous callback
  /*chatSocket.on('connect', function(){
    // call the server-side function 'adduser' and send one parameter (value of prompt)
    chatSocket.emit('adduser', {'projectId':$rootScope.project._id, 'username':$rootScope.currentUser.displayName});
  });*/

  // listener, whenever the server emits 'updatechat', this updates the chat body
  chatSocket.on('updatechat', function (username, data) {
    $scope.chatLog.push({'username': username, 'data' : data});
  }); 

  // listener, whenever the server emits 'updateusers', this updates the username list
  chatSocket.on('updateusers', function(data) {
    $scope.onlineUsers = data;
  });

  chatSocket.on('notify', function (data) {
    $rootScope.$broadcast('createNotification', data);
  });

  $scope.sendChat = function(){
    chatSocket.emit('sendchat', $scope.chatText);
    $scope.chatText = '';
  }
});

/****************************
* HOME CONTROLLER 
****************************/
app.controller('HomeCtrl', function($scope, $rootScope) {
  $scope.page.setHomePage();
});