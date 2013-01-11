/**************************
* USER CONTROLLER
**************************/

app.controller('UserCtrl', function($scope, $rootScope, $routeParams, $route, userSocket, bootbox, notificationService, Page) {

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
    //$rootScope.$broadcast('initializeWorkspace');
    //TODO if project open then refresh that project
  });
  
  userSocket.on('getProjects', function (projects) {
    $rootScope.currentUser.projects = projects;
  });

  $scope.deleteProject = function(project){
    bootbox.confirm("<b>Are you sure you want to delete "+project.projectName+"?</b>" 
      + "<br><br>NOTE: If you are the only collaborator of the project, the project and all its files will be deleted from the server." 
      + " If there are other collaborators, the project will remain on the server, but you will be removed from the collaborators list."
      , function(confirmed) {
                    if(confirmed){
                      userSocket.emit('deleteProject', {
                        'userId' : $rootScope.currentUser._id,
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