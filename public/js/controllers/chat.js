/****************************
* CHAT CONTROLLER 
****************************/

app.controller('ChatCtrl', function($scope, $timeout, $rootScope, chatSocket) {
  
  $scope.chatLog = new Array();
  $scope.chatNotifications = [];
  $scope.onlineUsers = [];
  $scope.chatText = '';
  $scope.unreadChatCount = 0;
  $scope.showChat = true;

  $scope.toggleChat = function(){
    $scope.showChat = !($scope.showChat);
    if($scope.showChat){
      $scope.unreadChatCount = 0;
    }
  }
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
    if(!$scope.showChat){
      $scope.unreadChatCount++;
    }
    
    //ugly fix to keep scroll at bottom; move to directive
    $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight)
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