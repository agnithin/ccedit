/***************************************************
* WebSocket service for Project, Chat and User
***************************************************/
app.factory('projectSocket', function ($rootScope) {
  var projectSocket = io.connect().of('/project');
  console.log("instantiating projectSocket service");
  return {
    on: function (eventName, callback) {
      projectSocket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(projectSocket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      projectSocket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(projectSocket, args);
          }
        });
      })
    },
    connect : function(){
      //console.log("connecting:" + projectSocket.socket.connected + "&&" + projectSocket.socket.connecting);
      projectSocket.socket.connect();
      /*if (projectSocket.socket.connected === false &&
            projectSocket.socket.connecting === false) {
            // use a connect() or reconnect() here if you want
            console.log("inside connecting:");
            projectSocket.socket.connect();
       }*/
    },
    disconnect : function(){
      console.log("dis - connecting");
      projectSocket.socket.disconnect();
    },
    isConnected : function(){
      console.log("connectios status:" + projectSocket.socket.connected + "&&" + projectSocket.socket.connecting);
      return projectSocket.socket.connected === true ||
            projectSocket.socket.connecting === true;
    },
    removeAllListeners : function(){
      projectSocket.removeAllListeners();
    }
  };
});

app.factory('chatSocket', function ($rootScope) {
  var chatSocket = io.connect().of('/chat');
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
    },
    isConnected : function(){
      return chatSocket.socket.connected === true ||
            chatSocket.socket.connecting === true;
    },
    removeAllListeners : function(){
      chatSocket.removeAllListeners();
    }
  };
});

app.factory('userSocket', function ($rootScope) {
  var chatSocket = io.connect().of('/user');
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
* jQuery BootBox plugin for alerts and prompts
***************************************************/
app.factory('bootbox', function ($rootScope) {
  return {
    alert: function (text) {
      bootbox.alert(text);
    },
    confirm: function (text, callback) {
      bootbox.confirm(text, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(bootbox, args);
        });
      });
    }
  };
});

/***************************************************
* jQuery Notification plugin
***************************************************/
app.factory('notificationService', function ($rootScope) {
  return {
    showNotification: function (notification) {
      $('.notifications').notify({
        message: { 'text': notification.text },
        type: notification.type
      }).show();
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

/***************************************************
* jQuery Notification plugin
***************************************************/
app.factory('codeMirrorMode', function ($rootScope) {
  var modes = {
    'html' : 'htmlmixed',
    'htm' : 'htmlmixed',
    'js' : 'javascript',
    'css' : 'css',
    'cofee' : 'cofeescript',
    'php' : 'php',
    'sql' : 'sql',
    'java' : 'java',
    'xml' :'xml',
    'rb' : 'ruby',
    'py' : 'python',
    'sh' : 'perl',
    'less' : 'less',
    'go' : 'go',

  }
  return {
    getMode: function(ext){
      if(!modes[ext]){
        return '';
      }else{
        return modes[ext];
      }
    }
  };
});