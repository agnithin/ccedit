'use strict';

/* Directives */
angular.module('cceditApp.directives', [])
  .directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]);

/**
 * Directive to set focus on particular element
 */
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

/**
 * Directive to scroll on particular element
 */
/*angular.module('cceditApp.directives', [])
.directive('scrollBottom', function($window) {
  return function(scope, element, attrs) {
    
    scope.$watch(element.change(), function( newval ) {  
      console.log("######## change");
      console.log(element);
      var windowEl = angular.element($window);
      windowEl.on('scroll', function() {
        scope.$apply(function() {
          //scope[attrs.scrollPosition] = windowEl.scrollTop();
          element.scrollTop = element.scrollHeight;
        });
      });
    });
  };
});*/

/**
 * CodeMirror Directive: to include CodeMirror editor
 * Original source is from AngularUI. Modified to add multiple cursors.
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

      // Communicating with controllers using broadcast events
      // probably not the best way to do
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
        //cursorEl.rel="tooltip";
        cursorEl.setAttribute('ui-jq', "tooltip");
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