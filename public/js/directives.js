'use strict';

/* Directives */

angular.module('cceditApp.directives', [])
  .directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]);

angular.module('cceditApp.directives', [])
.directive('focusOn', function( $timeout ) {
  return function( scope, elem, attrs ) {
    scope.$watch(attrs.focusOn, function( newval ) {
      if ( newval ) {
        $timeout(function() {
          elem[0].focus();
        }, 0, false);
      }
    });
  };
});