'use strict';

// Declare app level module which depends on filters, and services
//var app = angular.module('myApp', ['myApp.filters', 'myApp.directives']);

angular.module('ui.config', []).value('ui.config', {});
angular.module('ui.directives', ['ui.config']);

var app = angular.module('myApp', ['myApp.directives', 'ui.directives', 'ui.config']);

