/***************************************************
* WebSocket Project Controller
***************************************************/

const MAX_FILE_BACKUPS_PER_USER = 5; // Added const

module.exports = function(io, models, diff_match_patch){
	
	const projectSocket = io // Changed to const
	.of('/project')
	.on('connection', async function (socket) { // Made async

		console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\nproject socket connected");
		try {
			const user = await models.User.findById(socket.handshake.session.passport.user);
			if (user) {

		   	  /* Get Project details	*/
			  socket.on('getProject', async function (projectId) { // Made async
			    console.log(`Get Project: ${projectId}`); // Changed to template literal
			    try {
			    	if(getArrayIndex(user.projects, 'projectId', projectId) == -1){
			    		// User does not have permission to access the project
			    		console.log("|||||||||||||||||||||: unauthorized user");
			    		// Optionally, send an error message to client
			    		// return socket.emit('notify', {type:'danger', text:'Unauthorized access to project.'});
			    	}

			    	socket.join(projectId);
			    	socket.room = projectId;

			    	const projectData = await models.Project.findById(projectId);
				  	if (projectData) {
				  		socket.emit('getProject', projectData);
					}else{
						socket.emit('notify', {type:'danger', text:'Oops! Project not found.'});
						console.log(`Cannot Find the Project: ${projectId}`); // Changed to template literal
					}
				} catch (err) {
					console.error('Error in getProject:', err);
					socket.emit('notify', {type:'danger', text:'Error retrieving project details.'});
				}
			  });

			  /* Get details fo a file	*/
			  socket.on('getFile', async function (fileId) { // Made async
			    console.log(`Get File: ${fileId}`); // Changed to template literal
			    try {
			    	const fileContents = await models.File.findById(fileId);
				  	if (fileContents) {
				  		socket.emit('getFile', fileContents);
					}else{
						socket.emit('notify', {type:'danger', text:'Oops! Could not locate the file on server. This could be because someone else deleted this file.'});
						console.log(`Cannot Find the File: ${fileId}`); // Changed to template literal
					}
				} catch (err) {
					console.error('Error in getFile:', err);
					socket.emit('notify', {type:'danger', text:'Error retrieving file contents.'});
				}
			  });

			  /* Update a file */
			  socket.on('updateFile', async function (data) { // Made async
			    console.log(`Update File: ${data.id}`); // Changed to template literal
			    socket.broadcast.to(socket.room).emit('updateFile',  data);	    
			    try {
			    	const oldfile = await models.File.findById(data.id);
				  	if (oldfile) {
				  		const dmp = new diff_match_patch.diff_match_patch();
				  		oldfile.contents = dmp.patch_apply(data.patch, oldfile.contents)[0];
				  		oldfile.modifiedOn = Date.now();
				  		oldfile.modifiedBy = {
					  			userId: user._id,
					  			displayName: user.displayName
					  		};
				  		await oldfile.save();
					}else{
						socket.emit('notify', {type:'danger', text:'Oops! Could not update the file on server. This could be because someone else deleted this file.'});
						console.log(`Cannot Find the File: ${data.id}`); // Changed to template literal
					}
				} catch (err) {
					console.error('Error in updateFile:', err);
					socket.emit('notify', {type:'danger', text:'Error updating file.'});
				}
			  });

			  /* Create a new File */
			  socket.on('createFile', async function (data) { // Made async
			    console.log(`create File: ${data.projectId} : ${data.fileName}`); // Changed to template literal
			    try {
			    	const newFile = new models.File({
			    		'name' : data.fileName,
			    		'contents' : "",
			    		'createdOn' : Date.now(),
			    		'createdBy' : { userId: user._id, displayName: user.displayName },
			    		'modifiedOn' : Date.now(),
			    		'modifiedBy' : { userId: user._id, displayName: user.displayName }
			    	});  

			    	const project = await models.Project.findById(data.projectId);
				  	if (project) {
				  		await newFile.save();
				  		project.files.push({'fileId':newFile._id, 'fileName':newFile.name});
				  		await project.save();
				  		projectSocket.in(socket.room).emit('getProject',  project);
				  		projectSocket.in(socket.room).emit('notify', {type:'info', text:`${newFile.name} has been added to project`}); // Changed to template literal
					}else{
						socket.emit('notify', {type:'danger', text:'Oops! Project not found when creating file.'});
						console.log(`Cannot Find the Project: ${data.projectId}`); // Changed to template literal
					}
				} catch (err) {
					console.error('Error in createFile:', err);
					socket.emit('notify', {type:'danger', text:'Oops! Something went wrong! Could not create file.'});
				}
			  });

			  /* Delete Selected file	*/
			  socket.on('deleteFile', async function (data) { // Made async
			    console.log(`delete File: ${data.projectId} : ${data.fileId}`); // Changed to template literal
			    try {
			    	const project = await models.Project.findById(data.projectId);
				  	if (project) {
				  		let fileIndex = -1; 
				  		for (let i = 0; i < project.files.length; i++){
				  		   if (project.files[i].fileId.equals(data.fileId)) { // Use .equals for ObjectId comparison
				  		      fileIndex = i;
				  		      break; 
				  		   }
				  		 }
				  		if(fileIndex !== -1){ // Check against -1
				  			project.files.splice(fileIndex, 1);
				  			await project.save();
			  				const oldfile = await models.File.findById(data.fileId);
			  				if (oldfile) {
			  					const deletedFileName = oldfile.name;
			  					await oldfile.deleteOne(); // Replaced remove with deleteOne
			  					projectSocket.in(socket.room).emit('getProject',  project);
			  					projectSocket.in(socket.room).emit('notify', {type:'info', text:`${deletedFileName} has been deleted from project`}); // Changed to template literal
			  				}else{
			  					socket.emit('notify', {type:'danger', text:'Oops! File to delete not found after removing from project.'});
			  					console.log(`Cannot Find the File for permanent deletion: ${data.fileId}`); // Changed to template literal
			  				}
				  		}else{
				  			socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not locate the file in project.'});
				  		} 
					}else{
						socket.emit('notify', {type:'danger', text:'Oops! Project not found when deleting file.'});
						console.log(`Cannot Find the Project: ${data.projectId}`); // Changed to template literal
					}
				} catch (err) {
					console.error('Error in deleteFile:', err);
					socket.emit('notify', {type:'danger', text:'Error deleting file.'});
				}
			  });

			  /* Create a backup of file 	*/
			  socket.on('backupFile', async function (fileId) { // Made async
			    console.log(`Backup File: ${fileId}`); // Changed to template literal
			    try {
			    	const foundFile = await models.File.findById(fileId);
				  	if (foundFile) {
				  		if(foundFile.countBackupsByUser(user._id) >= MAX_FILE_BACKUPS_PER_USER){
				  			return socket.emit('notify', {type:'danger', text:'You have exceeded your maximum allocated backups for this file. Delete one of your old backups to continue.'});
				  		}
				  		const currentBackup = {
					  		contents : foundFile.contents,
					  		time : Date.now(),
					  		backedupBy : { userId: user._id, displayName: user.displayName }
					  	};
				  		if(!foundFile.backup){
				  			foundFile.backup = new Array();
				  		}
				  		foundFile.backup.push(currentBackup);
				  		await foundFile.save();
				  		socket.emit('notify', {type:'info', text:'File backed-up successfully.'});
					}else{
						socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not find file to backup.'});
						console.log(`Cannot Backup the File, not found: ${fileId}`); // Changed to template literal
					}
				} catch (err) {
					console.error('Error in backupFile:', err);
					socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not backup the file.'});
				}
			  });
				
			  /* Get a list of backups	*/
			  socket.on('listBackups', async function (fileId) { // Made async
			    console.log(`List Backups for File: ${fileId}`); // Changed to template literal
			    try {
			    	const foundFile = await models.File.findById(fileId);
				  	if (foundFile) {
				  		if(!foundFile.backup || foundFile.backup.length === 0){
				  			socket.emit('listBackups', []); // Send empty array if no backups
				  		}else{
				  			const backupList = foundFile.backup.map(bc => ({ // Use map for cleaner transformation
				  				fileId: foundFile._id,
				  				time : new Date(bc.time).toUTCString(),
				  				backedupBy : bc.backedupBy,
				  				_id : bc._id
				  			}));
				  			socket.emit('listBackups', backupList);
				  		}
					}else{
						socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not locate the file for backups.'});
						console.log(`Cannot List Backups, file not found: ${fileId}`); // Changed to template literal
					}
				} catch (err) {
					console.error('Error in listBackups:', err);
					socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not locate the backups.'});
				}
			  });

			  /* Restore a backup  */
			  socket.on('restoreBackup', async function (backup) { // Made async
			    console.log(`Restoring Backup: ${backup._id}`); // Changed to template literal
			    try {
			    	const foundFile = await models.File.findById(backup.fileId);
				  	if (foundFile) {
				  		if(!foundFile.backup){
				  			return socket.emit('notify', {type:'danger', text:'No backups found for this file.'});
				  		}
				  		let backupIndex = -1;
				  		for(let i=0; i<foundFile.backup.length;i++){
				  			if(foundFile.backup[i]._id.equals(backup._id)){ // Use .equals for ObjectId
				  				backupIndex = i;
				  				break;
				  			}
				  		}
				  		console.log(`selected backup found at: ${backupIndex}`); // Changed to template literal
				  		if(backupIndex !== -1){
				  			const contentsBeforeRestore = foundFile.contents;
				  			foundFile.contents = foundFile.backup[backupIndex].contents;
				  			foundFile.modifiedBy = { userId: user._id, displayName: user.displayName }; // Corrected modifiedBy
				  			foundFile.modifiedOn = Date.now();
				  			await foundFile.save();
				  			const patch = {
				  				'id':foundFile._id, 
				  				'name':foundFile.name, 
				  				'patch': diff_launch(contentsBeforeRestore, foundFile.contents)
				  			};
				  			projectSocket.in(socket.room).emit('updateFile',  patch);
				  			socket.emit('notify', {type:'info', text:'Backup Restored Successfully'});
				  		} else {
				  			socket.emit('notify', {type:'danger', text:'Oops! Could not locate the specific backup.'});
				  		}
					}else{
						socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not locate the file to restore backup.'});
						console.log(`Could not restore File, file not found: ${backup.fileId}`); // Changed to template literal
					}
				} catch (err) {
					console.error('Error in restoreBackup:', err);
					socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not restore the backup.'});
				}
			  });

			  /* Delete selected Backup	*/
			  socket.on('deleteBackup', async function (backup) { // Made async
			    console.log(`Deleting Backup: ${backup._id}`); // Changed to template literal
			    try {
			    	const foundFile = await models.File.findById(backup.fileId);
				  	if (foundFile) {
				  		if(!foundFile.backup){
				  			return socket.emit('notify', {type:'danger', text:'No backups found for this file.'});
				  		}
				  		let backupIndex = -1;
				  		for(let i=0; i<foundFile.backup.length; i++){
				  			if(foundFile.backup[i]._id.equals(backup._id)){ // Use .equals for ObjectId
				  				backupIndex = i;
				  				break;
				  			}
				  		}
				  		console.log(`selected backup found at: ${backupIndex}`); // Changed to template literal
				  		if(backupIndex !== -1){
				  			foundFile.backup.splice(backupIndex,1);
				  			await foundFile.save();
				  			socket.emit('notify', {type:'info', text:'Backup Deleted Successfully'});
				  			socket.emit('refreshBackups', backup.fileId);
				  		}else{
				  			socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not locate the backup to delete.'});
				  		}	  				
					}else{
						socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not find file to delete backup from.'});
						console.log(`Could not delete Backup, file not found: ${backup.fileId}`); // Changed to template literal
					}
				} catch (err) {
					console.error('Error in deleteBackup:', err);
					socket.emit('notify', {type:'danger', text:'Oops! something went wrong. Could not delete the backup.'});
				}
			  });			  

			  /* send cursor changes to all clients */
			  socket.on('updateCursor', function (data) { // This is not an async DB operation
			    console.log("Update Cursor:%j", data);
			    socket.broadcast.to(socket.room).emit('updateCursor',  data);
			  });	  

			  socket.on('disconnect', function(){ // This is not an async DB operation
			    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\nclient disconnected");
			  });

			  /* apply patch to text */
			  const diff_launch = function(text1, text2) { 
				const dmp = new diff_match_patch.diff_match_patch(); 
				const diff = dmp.diff_main(text1, text2, true); 
				if (diff.length > 2) {
				  dmp.diff_cleanupSemantic(diff);
				}
				return dmp.patch_make(text1, text2, diff);
			  }

			  /* Searches an object Array for a field */
			  const getArrayIndex = function(objectArray, fieldName, element){ 
			    let elementIndex = -1; 
			    for(let i=0; i<objectArray.length; i++){ 
			      if(objectArray[i][fieldName].equals(element)){ // Use .equals for ObjectId comparison
			        elementIndex = i;
			        break;
			      }
			    }
			    return elementIndex;
			  };

			} else {
				console.log("########## User not found in project controller");
				// socket.disconnect(true);
			}
		} catch (err) {
			console.error("########## Error in project controller user lookup:", err);
			// socket.disconnect(true);
		}
	});
};