/***************************************************
* WebSocket service for Project, Chat and User
***************************************************/
app.factory('projectSocket', function ($rootScope) {
  var projectSocket = io.connect('http://localhost:3000/project');
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
      console.log("connecting:" + projectSocket.socket.connected + "&&" + projectSocket.socket.connecting);
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
    },
    removeAllListeners : function(){
      chatSocket.removeAllListeners();
    }
  };
});

app.factory('userSocket', function ($rootScope) {
  var chatSocket = io.connect('http://localhost:3000/user');
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
    confirm: function (text, callback) {
      bootbox.confirm(text, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(bootbox, args);
        });
      });
    },
    alert: function (text) {
      bootbox.alert(text);
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


/*global angular, CodeMirror, Error*/
/**
 * Binds a CodeMirror widget to a <textarea> element.
 */
angular.module('ui.directives').directive('uiCodemirrorMod', ['ui.config', '$timeout', '$rootScope', function (uiConfig, $timeout, $rootScope) {
  'use strict';

  var events = ["cursorActivity", "viewportChange", "gutterClick", "focus", "blur", "scroll", "update"];
  var othersCursorElements = new Array();
  return {
    restrict:'A',
    require:'ngModel',
    link:function (scope, elm, attrs, ngModel) {
      var options, opts, onChange, deferCodeMirror, codeMirror;

      if (elm[0].type !== 'textarea') {
        throw new Error('uiCodemirror3 can only be applied to a textarea element');
      }

      options = uiConfig.codemirror || {};
      opts = angular.extend({}, options, scope.$eval(attrs.uiCodemirrorMod));
      
      onChange = function (aEvent) {
        return function (instance, changeObj) {
          var newValue = instance.getValue();
          if (newValue !== ngModel.$viewValue) {
            ngModel.$setViewValue(newValue);
            scope.$apply();
          }
          if (typeof aEvent === "function")
            aEvent(instance, changeObj);
        };
      };

      deferCodeMirror = function () {        
        codeMirror = CodeMirror.fromTextArea(elm[0], opts);
        codeMirror.on("change", onChange(opts.onChange));
        /* change made to get on cursor acctivity  */
        if(attrs.oncursoractivity){
          codeMirror.on("cursorActivity", function(){
              scope.$apply(function(self) {
                  //if(!scope.$$phase) {
                    self[attrs.oncursoractivity](codeMirror.getCursor());
                  //}
                });
            });
        }
        //$rootScope.codeMirror = codeMirror;
        
        for (var i = 0, n = events.length, aEvent; i < n; ++i) {
          aEvent = opts["on" + events[i].charAt(0).toUpperCase() + events[i].slice(1)];
          if (aEvent === void 0) continue;
          if (typeof aEvent !== "function") continue;
          codeMirror.on(events[i], aEvent);
          
        }

        // CodeMirror expects a string, so make sure it gets one.
        // This does not change the model.
        ngModel.$formatters.push(function (value) {
          if (angular.isUndefined(value) || value === null) {
            return '';
          }
          else if (angular.isObject(value) || angular.isArray(value)) {
            throw new Error('ui-codemirror cannot use an object or an array as a model');
          }
          return value;
        });

        // Override the ngModelController $render method, which is what gets called when the model is updated.
        // This takes care of the synchronizing the codeMirror element with the underlying model, in the case that it is changed by something else.
        ngModel.$render = function () {
          codeMirror.setValue(ngModel.$viewValue);
        };

      };

      $rootScope.$on('updateOthersCursor', function(event, data){
        //remove prev location of cursor
        angular.forEach(othersCursorElements, function(othersCursor){
          if(othersCursor.userId == data.user.userId){
            var parent = othersCursor.cursorElement.parentNode;
            if (parent) { parent.removeChild(othersCursor.cursorElement); }
          }
        });
        var color = 'red';
        var cursorCoords = codeMirror.cursorCoords(data.cursor);
        var cursorEl = document.createElement('pre');
        cursorEl.className = 'blink';
        cursorEl.style.borderLeftWidth = '2px';
        cursorEl.style.borderLeftStyle = 'solid';
        cursorEl.rel="tooltip";
        cursorEl.title=data.user.displayName;
        cursorEl.innerHTML = '&nbsp;';
        cursorEl.style.borderLeftColor = color;
        cursorEl.style.height = (cursorCoords.bottom - cursorCoords.top) * 0.85 + 'px';
        codeMirror.addWidget(data.cursor, cursorEl, false);

        othersCursorElements.push({
          'userId' : data.user.userId,
          'cursorElement':cursorEl
        });      
      });

    $rootScope.$on('clearOthersCursor', function(event){
      angular.forEach(othersCursorElements, function(othersCursor){
          var parent = othersCursor.cursorElement.parentNode;
          if (parent) { parent.removeChild(othersCursor.cursorElement); }
        });
    });

    $rootScope.$on('updateMode', function(event, mode){
      codeMirror.setOption("mode", mode);
      CodeMirror.autoLoadMode(codeMirror, mode);
      console.log("mode changed to " + mode);
    });

      $timeout(deferCodeMirror);

    }
  };
}]);