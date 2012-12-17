app.factory('fileSocket', function ($rootScope) {
  var fileSocket = io.connect('http://localhost:3000/file');
  return {
    on: function (eventName, callback) {
      fileSocket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(fileSocket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      fileSocket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(fileSocket, args);
          }
        });
      })
    }
  };
});

app.factory('chatSocket', function ($rootScope) {
  var chatSocket = io.connect('http://localhost:3000/chat');
  return {
    on: function (eventName, callback) {
      chatSocket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(chatSocket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      chatSocket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(chatSocket, args);
          }
        });
      })
    }
  };
});

/*
app.factory('collaboration', function ($rootScope) {
  var selectedUsers;
  var findUserString = '';
  var searchedUsers = new Array();
  
  return {
    initialize : function(users){
      selectedUsers = users;
    }

    findUser : function(){
      if($scope.findUserString.length<3){
        bootbox.alert("Enter minmum of 3 characters");
      }else{
        fileSocket.emit('findUserByName', $scope.findUserString);
      }
    } 

    fileSocket.on('findUser', function(data){
      $scope.searchedUsers = data.users;
    });

    addToSelectedUsers : function(user){
      if(getUserIndex($scope.selectedUsers, user.userId) == -1){
        $scope.selectedUsers.push({
          'userId':user._id,
          'displayName': user.displayName,
          'permissions' : 'rw'
        });
      }
      console.log("selected:" + user.displayName);
    }

    removeFromSelectedUsers : function(user){
      console.log("sel user: " + JSON.stringify(user) + "\ncur user:" + JSON.stringify($scope.currentUser) );
      if(user.userId == $scope.currentUser._id){
         bootbox.alert("You cannot remove your self from the project!");
      }else{
        var userIndex = getUserIndex($scope.selectedUsers, user.userId);
        if(userIndex!=-1){
          $scope.selectedUsers.splice(userIndex,1);
        }
      }
    }

    isUserSelected : function(user){
      console.log("isus:" + JSON.stringify($scope.selectedUsers) + " #"+ JSON.stringify(user));
      return getUserIndex($scope.selectedUsers, user._id) == -1;
    }

    addSelectedUsersToProject : function(){
      fileSocket.emit('addUsersToProject', {
        'projectId':$scope.project._id,
        'users': $scope.selectedUsers
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
  };
});

*/