/****************************
* PROJECT CONTROLLER 
****************************/
app.controller('ProjectCtrl', function($scope, $rootScope, $routeParams, projectSocket, bootbox) {
  $rootScope.project = {'_id':$routeParams.projectId, 'name':'New Project'};

  /*projectSocket.socket.on('connect_failed', function (message) { 
    bootbox.alert("Connection to the Server lost. Please Refresh the page.");
  });*/

  /* initialize project */
  const initializeProject = function(){ // Changed to const
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

  /* send open file action to file controller */
  $scope.openFile = function(fileId){
    console.log(`openfile: ${fileId}`); // Changed to template literal
    $rootScope.$broadcast('openFile', fileId);
  }

  /* create a new file */
  $scope.addFile = function(){
   projectSocket.emit('createFile', {'projectId':$rootScope.project._id, 'fileName':$scope.newFileName});
   $scope.newFileName = '';
   $scope.showAddNewFileTextbox = false;
  };

  /* show for to enter new file name */
  $scope.showAddFile = function(){
    $scope.showAddNewFileTextbox = !$scope.showAddNewFileTextbox;    
  }

  /* delete selected file */
  $scope.deleteFile = function(fileId, fileName){    
    bootbox.confirm(`Are you sure you want to delete ${encodeHTML(fileName)} ?`, function(confirmed) { // Changed to template literal
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
          let return_list = []; // Changed to let
          let map = {}; // Changed to let
          let data = new Array(); // Changed to let
          for(let i=0; i<$scope.project.files.length; i++){ // Changed i to let
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

  /* sanitise filenames */
  function encodeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

});