/*
Based on a project by Sam DeLong
*/

const Lobby = require('./lobby.js');

//Yahdeyaa setup socket.io and express for web server
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set('port', 5941);

var fs = require('fs');
var mkdirp = require('mkdirp');

// Copy library files
mkdirp.sync(__dirname + '/public/lib');
for (const libFile of [
     '/node_modules/p5/lib/p5.js',
     '/node_modules/p5/lib/addons/p5.dom.js',
]) {
	let destFile = '/public/lib/' + libFile.split('/').reverse()[0];

	// destination will be created or overwritten by default.
	fs.copyFile(__dirname + libFile, __dirname + destFile, (err) => {
		if (err) throw err;
		console.log(`"${libFile}" was copied to "${destFile}"`);
	});
}

// Let clients only access the 'public' directory
app.use('/', express.static(__dirname + '/public'));

//What file to send users
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Start listening on port 80 for web stuff
server.listen(80, function() {
  console.log('starting webserver');
});

let queue = [];

//create socket callbacks...
io.on("connection", (socket) => {
	console.log(`Someone connected! Their id is: ${socket.id}`);

	socket.on("enterLobby", (request) => {
		console.log(`Player ${request.name} is looking for a game...`);

		queue.push({'id':socket.id,'name':request.name});
		if (queue.length >= 2) {
			let users = queue.splice(0, 2);
			let name = users[0].id + users[1].id;
//			console.log(socket.id);
//			console.log(users);
			let game = new Lobby(name, users, io);
			socket.emit('joinLobby', {'namespace':name});
			for (const user of users) {
				socket.to(user.id).emit('joinLobby', {'namespace':name});
			}
		}
	});

});
