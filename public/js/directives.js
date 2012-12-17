'use strict';

/* Directives */

angular.module('myApp.directives', [])
  .directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]);

angular.module('myApp.directives', [])
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

/*angular.module('myApp.directives', [])
.directive('contextMenu', function( $parse ) {
  return {
    scope:{
      file:"=file"
    },
    templateUrl:'/partials/fileContextMenu.html'
    

  }
});*/


/*

link: function(scope, element, attr) {
      console.log("inside contextm:",scope,element,attr);
      scope.$watch(attr.contextMenu, function(cm){
        element.text("this is:" + cm);
      });
      //element.contextmenu();
    }

  {
    template: '<div>Data: {{data}}</div>',
    replace: true,
    scope: {
      model: '=contextMenu'
    }
  }
  */