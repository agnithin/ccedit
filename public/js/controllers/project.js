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
    //initializeProject();
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

  projectSocket.on('refreshProject', function () {
    $projectSocket.emit('getProject', $rootScope.project._id);
  });

  projectSocket.on('notify', function (data) {
    $rootScope.$broadcast('createNotification', data);
  });

  $scope.openFile = function(fileId){
    console.log("openfile:" + fileId);
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
        $rootScope.$apply(function () {
          $scope.openFile(map[item].id);
        });
        return "";
      }
  });

});