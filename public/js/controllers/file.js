/****************************
* FILE CONTROLLER 
****************************/

app.controller('FileCtrl', function($scope, $rootScope, projectSocket, bootbox, diffMatchPatch, codeMirrorMode) {
  $scope.openFiles = [];

  const emptyFile = {'_id':'', 'name':'','contents':''}; // Changed to const
  $scope.activeFile = emptyFile; //$scope.openFiles[0]._id; // currently active tab
  $scope.activeFileContentsBeforeChange = '';

  $scope.openFile = function(fileId){
    if(getOpenFileIndex(fileId) == -1){ // if file not open then request file
      projectSocket.emit('getFile', fileId);
    }else{// if file already among open files then activate tab
      $scope.changeActiveFile(fileId);
    }
  }

  $scope.$on('$destroy', function(){    
    console.log("inside destroy file");
    console.log($scope.openFiles);
    angular.forEach($scope.openFiles, function(file){
      projectSocket.emit('updateCursor', {
        'user':{
          'userId' : $rootScope.currentUser._id,
          'displayName' : $rootScope.currentUser.displayName
        },
        'projectId' : $rootScope.project._id,
        'fileId' : file._id
      });
    });
  });

  $scope.closeFile = function(fileId){
    const openFileIndex = getOpenFileIndex(fileId); // Changed to const
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
    let i; // Declared i here for use after loop
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
        const fileMode = codeMirrorMode.getMode($scope.activeFile.name.split(".")[$scope.activeFile.name.split(".").length-1]); // Changed to const
        $rootScope.$broadcast('updateMode', fileMode);
      }else{
        $scope.fileMode = '';
        console.log("mode not detected");
      }      
    }
  }

  $scope.sendUpdatedFile = function(){
    if($scope.activeFile._id != ''){
      const diff = diffMatchPatch.diff_launch($scope.activeFileContentsBeforeChange, $scope.activeFile.contents); // Changed to const
      /*console.log("=======Unpatched Text\n" + $scope.activeFileContentsBeforeChange);
      console.log("=======Patch\n" + diff);
      console.log("=======patched text\n" + patch_launch($scope.activeFileContentsBeforeChange, diff));*/
      //projectSocket.emit('updateFile', $scope.activeFile);
      projectSocket.emit('updateFile', {'id':$scope.activeFile._id, 'name':$scope.activeFile.name, 'patch': diff});
      $scope.activeFileContentsBeforeChange = $scope.activeFile.contents;
    }
  }

  projectSocket.on('getFile', function (newFile) {
    console.log(`recieved file: ${newFile.name}`); // Changed to template literal
    if(newFile == ''){
      alert("file Not Found"); // remove alert and put bootstrap error message
      return;
    }
    $scope.openFiles.push(newFile);
    $scope.changeActiveFile(newFile._id);
  });

  projectSocket.on('updateFile', function (fileUpdate) {
    const fileIndex = getOpenFileIndex(fileUpdate.id); // Changed to const
    if(fileIndex != -1){
      /*console.log("=======Unpatched Text\n" + $scope.activeFile.contents);
      console.log("Patch =======\n" + fileUpdate.diff);*/
      const patchedText = diffMatchPatch.patch_launch($scope.activeFile.contents, fileUpdate.patch); // Changed to const
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

  function getOpenFileIndex(fileId){ // This function is part of the controller scope
    for (let i =0; i < $scope.openFiles.length; i++){ // Changed to let
       if ($scope.openFiles[i]._id == fileId) {
          return i;
          // break; // Unreachable code after return
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
    const fileIndex = getOpenFileIndex(fileId); // Changed to const
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