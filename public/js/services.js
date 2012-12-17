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

/***************************************************
* Google Diff-Match_Patch Service
***************************************************/
app.factory('diffMatchPatch', function ($rootScope) {
  var dmp = new diff_match_patch();
  var patch_text = '';

  return {
      diff_launch : function (text1, text2) {
        var diff = dmp.diff_main(text1, text2, true);
        if (diff.length > 2) {
          dmp.diff_cleanupSemantic(diff);
        }
        var patch_list = dmp.patch_make(text1, text2, diff);
        //patch_text = dmp.patch_toText(patch_list);
        return patch_list;
      },


      patch_launch : function (text1, patch_list) {
        //var patches = dmp.patch_fromText(patch_text);
        //var results = dmp.patch_apply(patches, text1);        
        var results = dmp.patch_apply(patch_list, text1);
        return  results[0];        
        /*results = results[1];
        var html = '';
        for (var x = 0; x < results.length; x++) {
          if (results[x]) {
            html += 'Ok';
          } else {
            html += 'Fail';
          }
        }
        console.log("Status:" + html);*/
      }
    }
});


/*angular.module('collaborationService', ['fileSocket'])
.service('collaboration', function(fileSocket) {*/
/*
app.factory('collaboration', ['$rootScope', 'fileSocket', function ($rootScope,  fileSocket) {
  var findUserString;// = '';
  var searchedUsers;// = new Array();
  var selectedUsers;// = new Array();



  fileSocket.on('findUser', function(data){
      searchedUsers = data.users;
    });

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

  return {

    initializeCollaborators : function(){
      selectedUsers = $rootScope.project.users;
      findUserString = '';
      searchedUsers = new Array();
      console.log("insideservice" +  JSON.stringify(selectedUsers));
    },

    findUser : function(){
      if(findUserString.length<3){
        bootbox.alert("Enter minmum of 3 characters");
      }else{
        fileSocket.emit('findUserByName', findUserString);
      }
    },    

    addToSelectedUsers : function(user){
      if(getUserIndex(selectedUsers, user.userId) == -1){
        selectedUsers.push({
          'userId':user._id,
          'displayName': user.displayName,
          'permissions' : 'rw'
        });
      }
    },

    removeFromSelectedUsers : function(user){
      if(user.userId == currentUser._id){
         bootbox.alert("You cannot remove your self from the project!");
      }else{
        var userIndex = getUserIndex(selectedUsers, user.userId);
        if(userIndex!=-1){
          selectedUsers.splice(userIndex,1);
        }
      }
    },

    isUserSelected : function(user){
      return getUserIndex(selectedUsers, user._id) == -1;
    },

    addSelectedUsersToProject : function(){
      fileSocket.emit('addUsersToProject', {
        'projectId':$rootScope.project._id,
        'users': selectedUsers
      });
    }   

  }
}]);

*/