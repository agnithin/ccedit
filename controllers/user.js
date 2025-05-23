/***************************************************
* WebSocket User Controller
***************************************************/
// Helper function (moved to module scope)
const getArrayIndex = function(objectArray, fieldName, element){
  let elementIndex = -1; // Changed to let
  for(let i=0; i<objectArray.length; i++){ // Changed to let
    if(objectArray[i][fieldName].equals(element)){
      elementIndex = i;
      break;
    }
  }
  return elementIndex;
};

module.exports = function(io, models){

	const userSocket = io // Changed to const
		.of('/user')
		.on('connection', async function (socket) { // Made async

		try {
			let user = await models.User.findById(socket.handshake.session.passport.user); // user can be reassigned
			if (!user) {
				console.log("########## User not found in user controller initial lookup");
				return; // Or socket.disconnect(true);
			}
			
			socket.on('getUser', function () { // Not async, just emits current user
				console.log("Get User:");
				socket.emit('getUser', user);  
			});

			/* get all the user projects */
			socket.on('getProjects', async function (userId) { // Made async
				console.log(`Get Projects: ${userId}`); // Changed to template literal
				try {
					const newUser = await models.User.findById(user._id); // Assuming user._id is the correct ID
					if(newUser){
						user = newUser; // This reassignment is key
						socket.emit('getProjects', user.projects);
					}else{
						console.log("Error retrieving user for getProjects");
						socket.emit('notify', {type:'danger', text:'Oops! Something went wrong. Please refresh the page.'});
					}
				} catch (err) {
					console.error("Error in getProjects:", err);
					socket.emit('notify', {type:'danger', text:'Oops! Something went wrong while fetching projects.'});
				}
			});

			/* create a new project */
			socket.on('createProject', async function (data) { // Made async
				console.log(`create Project: ${data.project.name}`); // Changed to template literal
				try {
					const newProject = new models.Project(); 
					const permissions = 'rw'; 
					newProject.name = data.project.name;
					newProject.description = data.project.description;
					newProject.users.push({
						'userId': user._id, 
						'displayName':user.displayName,
						'permissions': permissions
					});
					newProject.author = user._id;
					newProject.createdOn = Date.now();
					await newProject.save();
					
					user.projects.push({
						"projectId" : newProject._id,
						"projectName" : newProject.name,
						"description" : newProject.description,
						"permissions" : permissions
					});
					await user.save(); // Note: original log "Error saving project to users" + err was inside a callback here.
					console.log("Successfully created a new project");
					socket.emit('notify', {type:'info', text:'Successfully created a new project.'});
					userSocket.emit('refreshProjects');
				} catch (err) {
					console.error(`Error while creating new project: ${err}`); // Changed to template literal
					socket.emit('notify', {type:'danger', text:'Oops! Could not create the project.'});
				}
			});

			/* delete an existing project	 */
			socket.on('deleteProject', async function (data) { // Made async
				console.log(`Delete Project: ${data.projectId}`); // Changed to template literal
				try {
					const project = await models.Project.findById(data.projectId);
					if (project) {		  		
						const projIndex = getArrayIndex(user.projects, 'projectId', project._id);
						if (projIndex !== -1) { // Ensure project is in user's list
							user.projects.splice(projIndex, 1);
							await user.save();
						} else {
							console.log("Project not found in user's project list for deletion.");
							// Optionally notify user or just proceed if this is not critical
						}

						if(project.users.length > 1){ // More than one user
							const userIndex = getArrayIndex(project.users, 'userId', user._id);
							if (userIndex !== -1) {
								project.users.splice(userIndex,1);
								await project.save();
								console.log("User removed from project");
							}
						}else{ // Last user, delete the project
							await project.deleteOne(); // Replaced remove with deleteOne
							console.log("project deleted");
							// TODO: REMOVE INDIVIDUAL FILES associated with the project
						}
						userSocket.emit('refreshProjects');
					}else{
						console.log(`Cannot Find the Project: ${data.projectId}`); // Changed to template literal
						socket.emit('notify', {type:'danger', text:'Oops! Could not find the project to delete.'});
					}
				} catch (err) {
					console.error("Error in deleteProject:", err);
					socket.emit('notify', {type:'danger', text:'Oops! Error deleting project.'});
				}
			});
			
			/* search user by name; used for add collaborators */
			socket.on('findUserByName', async function (searchString) { // Made async
				console.log(`Find User: ${searchString}`); // Changed to template literal
				try {
					const users = await models.User.find({'displayName': new RegExp(searchString, 'i')});
					if (users) { // find returns an array, check users.length if needed, or just proceed
						const foundUsers = users.map(u => ({ // Use map for cleaner transformation
							'_id' : u._id,
							'displayName' : u.displayName,
							'email' : u.email,
						}));
						socket.emit('findUser', {
							'searchString':searchString,
							'users': foundUsers
						});
						console.log(`Found ${foundUsers.length} Users: ${foundUsers}`); // Changed to template literal
					}else{
						// find returns [] if no users, so this else might not be hit unless error.
						console.log("No users found or error in findUserByName");
						socket.emit('findUser', {'searchString': searchString, 'users': []});
					}
				} catch (err) {
					console.error("Error in findUserByName:", err);
					socket.emit('findUser', {'searchString': searchString, 'users': []}); // Send empty on error
				}
			});

			/* add/remove collaborators in a project  */
			socket.on('updateCollaborators', async function (data) { // Made async
				console.log("updating collaborators to project: %j", data);   
				try {
					const project = await models.Project.findById(data.projectId);
					if (project) {
						// Remove users
						for (const usrToRemove of data.users.remove) {
							const userIndex = getArrayIndex(project.users, 'userId', usrToRemove.userId);
							if(userIndex !== -1){
								project.users.splice(userIndex, 1);
							}
							// remove backups created by that collaborator
							if (project.files && project.files.length > 0) {
								const filesArray = project.files.map(f => f.fileId);
								const filesToUpdate = await models.File.find({'_id':{$in:filesArray}});
								for (const file of filesToUpdate) {
									file.deleteBackupsByUser(usrToRemove.userId); // Assuming this method is synchronous or handles its own async
									await file.save(); // Save each file after modification
								}
							}
						}
						// Add users
						for (const usrToAdd of data.users.add) {
							if(getArrayIndex(project.users, 'userId', usrToAdd.userId) === -1){
								project.users.push(usrToAdd);
							}
						}
						await project.save();
						
						let updateSuccessfull = true; 
						// Update removed users' project lists
						if(data.users.remove.length > 0){
							const usersToRemoveIds = data.users.remove.map(u => u.userId);
							const usersToRemoveFromProjectList = await models.User.find({'_id':{$in:usersToRemoveIds}});
							for (const usr of usersToRemoveFromProjectList) {
								const projIndex = getArrayIndex(usr.projects, 'projectId', project._id);
								if( projIndex !== -1){
									usr.projects.splice(projIndex, 1);
									try { await usr.save(); } catch (e) { updateSuccessfull = false; console.error("Error saving user after removing project:", e); }
								}
							}
						}
						
						// Update added users' project lists
						if(data.users.add.length > 0){
							const usersToAddIds = data.users.add.map(u => u.userId);
							const usersToAddToProjectList = await models.User.find({'_id':{$in:usersToAddIds}});
							for (const usr of usersToAddToProjectList) {
								if(getArrayIndex(usr.projects, 'projectId', project._id) === -1){
									usr.projects.push({
										'projectId':project._id,
										'projectName':project.name,
										// 'permissions':project.permissions // project.permissions might not exist directly
										'permissions': usr.permissions || 'rw' // Or set default
									});
									try { await usr.save(); } catch (e) { updateSuccessfull = false; console.error("Error saving user after adding project:", e); }
								}
							}
						}

						if(updateSuccessfull){
							socket.emit('notify', {type:'info', text:'Collaborators updated successfully.'});
							userSocket.emit('refreshProjects');
						}else{
							socket.emit('notify', {type:'danger', text:'Oops! Some operations failed while updating collaborators.'});
						}
					}else{
						socket.emit('notify', {type:'danger', text:'Oops! Could not locate the project.'});
						console.log(`Cannot Find the Project: ${data.projectId}`); // Changed to template literal
					}
				} catch (err) {
					console.error("Error in updateCollaborators:", err);
					socket.emit('notify', {type:'danger', text:'Oops! Something went wrong. Could not update collaborators.'});
				}
			});
		} catch (err) {
			console.error("########## Error in user controller initial user lookup:", err);
			// socket.disconnect(true);
		}
	});
};