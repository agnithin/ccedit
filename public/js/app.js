
/**************************
* Application
**************************/

var App = Ember.Application.create();

/**************************
* Models
**************************/
App.Project = Ember.Object.extend({
    _id: null,
    name: null,
    users: null,
    files: null
});

App.File = Ember.Object.extend({
    _id: null,
    name: null,
    contents: null, 
    update: function(newFile) {
    	this.contents=newFile.contents;
 	}   
});

App.currentFile = App.File.create({
	_id:"0",
	name:"test",
	contents:"xxxxxxx"

});

/**************************
* Views
**************************/

/**************************
* Controllers
**************************/
App.ApplicationController = Ember.Controller.extend();
App.ApplicationView = Ember.View.extend({
  templateName: 'application'
});

/*
App.Router = Ember.Router.extend({
  root: Ember.Route.extend({
    index: Ember.Route.extend({
      route: '/'
    })
  })
})
*/


App.initialize();

