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

