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

  const events = ["cursorActivity", "viewportChange", "gutterClick", "focus", "blur", "scroll", "update"]; // Changed to const
  const othersCursorElements = new Array(); // Changed to const (array is mutated, not reassigned)
  return {
    restrict:'A',
    require:'ngModel',
    link:function (scope, elm, attrs, ngModel) {
      let options, opts, onChange, deferCodeMirror, codeMirror; // Declared with let, will be const where possible

      if (elm[0].type !== 'textarea') {
        throw new Error('uiCodemirror3 can only be applied to a textarea element');
      }

      options = uiConfig.codemirror || {}; // options is assigned here
      opts = angular.extend({}, options, scope.$eval(attrs.uiCodemirrorMod)); // opts is assigned here
      
      onChange = function (aEvent) { // onChange is assigned here
        return function (instance, changeObj) {
          const newValue = instance.getValue(); // Changed to const
          if (newValue !== ngModel.$viewValue) {
            ngModel.$setViewValue(newValue);
            scope.$apply();
          }
          if (typeof aEvent === "function")
            aEvent(instance, changeObj);
        };
      };

      // Re-declare with const if only assigned once.
      const const_options = options;
      const const_opts = opts;
      const const_onChange = onChange;

      deferCodeMirror = function () { // deferCodeMirror assigned here       
        codeMirror = CodeMirror.fromTextArea(elm[0], const_opts); // codeMirror assigned here; use const_opts
        codeMirror.on("change", const_onChange(const_opts.onChange)); // use const_onChange, const_opts
        /* change made to get on cursor acctivity  */
        if(attrs.oncursoractivity){
          codeMirror.on("cursorActivity", function(){
              scope.$eval(function(self) {
                  //if(!scope.$$phase) {
                    self[attrs.oncursoractivity](codeMirror.getCursor());
                  //}
                });
            });
        }
        
        const n = events.length; // n can be const
        for (let i = 0; i < n; ++i) { // i to let
          let aEvent = const_opts["on" + events[i].charAt(0).toUpperCase() + events[i].slice(1)]; // aEvent to let, use const_opts
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
          /*start = codeMirror.posFromIndex(pos);
          codeMirror.replaceRange(text, start);*/
          const cursorLocation = codeMirror.getCursor(); // Changed to const
          const scrollPos = codeMirror.getScrollInfo(); // Changed to const
          codeMirror.setValue(ngModel.$viewValue);
          codeMirror.setCursor(cursorLocation);
          codeMirror.scrollTo(scrollPos.left, scrollPos.top);
        };

      };

      // Communicating with controllers using broadcast events
      // probably not the best way to go
      const const_deferCodeMirror = deferCodeMirror; // const for deferCodeMirror
      // codeMirror is assigned inside deferCodeMirror, so it can't be const at this scope directly unless deferCodeMirror is immediately invoked.

      $rootScope.$on('updateOthersCursor', function(event, data){
        //remove prev location of cursor
        angular.forEach(othersCursorElements, function(othersCursor){
          if(othersCursor.userId == data.user.userId){
            const parent = othersCursor.cursorElement.parentNode; // Changed to const
            if (parent) { parent.removeChild(othersCursor.cursorElement); }
          }
        });
        if(data.cursor){ // if cursor is not set; then it is for clear cursor
          const color = 'red'; // Changed to const
          const cursorCoords = codeMirror.cursorCoords(data.cursor); // Changed to const
          const cursorEl = document.createElement('pre'); // Changed to const
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
        }

      });

    $rootScope.$on('clearOthersCursor', function(event){
      angular.forEach(othersCursorElements, function(othersCursor){
          const parent = othersCursor.cursorElement.parentNode; // Changed to const
          if (parent) { parent.removeChild(othersCursor.cursorElement); }
        });
    });

    $rootScope.$on('updateMode', function(event, mode){
      codeMirror.setOption("mode", mode);
      CodeMirror.autoLoadMode(codeMirror, mode);
      console.log("mode changed to " + mode);
    });

      $timeout(const_deferCodeMirror); // use const_deferCodeMirror

    }
  };
}]);