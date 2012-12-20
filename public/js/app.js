'use strict';

// Declare app level module which depends on filters, and services
//var app = angular.module('myApp', ['myApp.filters', 'myApp.directives']);

var app = angular.module('cceditApp', ['cceditApp.directives', 'ui'])
.config(function($routeProvider) {
  $routeProvider.
  when('/', {
    templateUrl: 'partials/home.html'
  }).
  when('/project/:projectId', {
    templateUrl: 'partials/project.html',
    controller:"ProjectCtrl"
  }).
  otherwise({
    redirectTo: '/'
  });
})