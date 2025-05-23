/***************************************************
* WebSocket service for Project, Chat and User
***************************************************/
app.factory('userSocket', function ($rootScope) {
  const chatSocket = io.connect().of('/user'); // Changed to const
  return {
    on: function (eventName, callback) {
      chatSocket.on(eventName, function () {  
        const args = arguments; // Changed to const
        $rootScope.$apply(function () {
          callback.apply(chatSocket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      chatSocket.emit(eventName, data, function () {
        const args = arguments; // Changed to const
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(chatSocket, args);
          }
        });
      })
    }
  };
});

app.factory('projectSocket', function ($rootScope) {
  const projectSocket = io.connect().of('/project'); // Changed to const
  console.log("instantiating projectSocket service");
  projectSocket.socket.on('connect_failed', function (message) { 
    console.log("######## Connection Lost");
  });
  return {
    on: function (eventName, callback) {
      projectSocket.on(eventName, function () {  
        const args = arguments; // Changed to const
        $rootScope.$apply(function () {
          callback.apply(projectSocket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      projectSocket.emit(eventName, data, function () {
        const args = arguments; // Changed to const
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
      console.log(`connectios status: ${projectSocket.socket.connected} && ${projectSocket.socket.connecting}`); // Changed to template literal
      return projectSocket.socket.connected === true ||
            projectSocket.socket.connecting === true;
    },
    removeAllListeners : function(){
      projectSocket.removeAllListeners();
    }
  };
});

app.factory('chatSocket', function ($rootScope) {
  const chatSocket = io.connect().of('/chat'); // Changed to const
  return {
    on: function (eventName, callback) {
      chatSocket.on(eventName, function () {  
        const args = arguments; // Changed to const
        $rootScope.$apply(function () {
          callback.apply(chatSocket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      chatSocket.emit(eventName, data, function () {
        const args = arguments; // Changed to const
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(chatSocket, args);
          }
        });
      })
    },
    connect : function(){
      chatSocket.socket.connect();
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

/***************************************************
* jQuery BootBox plugin for alerts and prompts
***************************************************/
app.factory('bootbox', function ($rootScope) {
  return {
    alert: function (text, callback) {
      bootbox.alert(text, function(){
        const args = arguments; // Changed to const
        $rootScope.$apply(function () {
          callback.apply(bootbox, args);
        });
      });
    },
    confirm: function (text, callback) {
      bootbox.confirm(text, function () {  
        const args = arguments; // Changed to const
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
  const dmp = new diff_match_patch(); // Changed to const
  const patch_text = ''; // Changed to const (as it's not reassigned in current code)

  return {
      diff_launch : function (text1, text2) {
        const diff = dmp.diff_main(text1, text2, true); // Changed to const
        if (diff.length > 2) {
          dmp.diff_cleanupSemantic(diff);
        }
        const patch_list = dmp.patch_make(text1, text2, diff); // Changed to const
        //patch_text = dmp.patch_toText(patch_list);
        return patch_list;
      },


      patch_launch : function (text1, patch_list) {
        //var patches = dmp.patch_fromText(patch_text);
        //var results = dmp.patch_apply(patches, text1);        
        const results = dmp.patch_apply(patch_list, text1); // Changed to const
        return  results[0];        
        /*results = results[1];
        let html = ''; // Would be let if used
        for (let x = 0; x < results.length; x++) { // Would be let if used
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
  const modes = { // Changed to const
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

/***************************************************
* Simple Page Service to display status of page
***************************************************/
app.factory('Page', function(){
  let title; // Changed to let
  let isProjectPage = false; // Changed to let
  return {
    getTitle: function() { return title; },
    isProjectPage : function(){ return isProjectPage},
    setProjectPage : function(projectName){
      isProjectPage = true;
      title = projectName;
    },
    setHomePage : function(){
      isProjectPage = false;
      title = "CC-Edit - Home";
    }
  };
});