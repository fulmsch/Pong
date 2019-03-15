/*
Based on a project by Sam DeLong
*/

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

// destination will be created or overwritten by default.
fs.copyFile(__dirname + '/node_modules/p5/lib/p5.js', __dirname + '/public/p5.js', (err) => {
  if (err) throw err;
  console.log('File was copied to destination');
});
fs.copyFile(__dirname + '/node_modules/p5/lib/addons/p5.dom.js', __dirname + '/public/p5.dom.js', (err) => {
  if (err) throw err;
  console.log('File was copied to destination');
});

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

class Player {
	constructor(x, y, w, h) {
		this.pos = new Vect2d(x, y);
		this.width = w;
		this.height = h;
		this.dir = null;
		this.score = 0;
		this.connected = false;
		this.name = '';
	}
}

class Ball {
	constructor(x, y, r) {
		this.pos = new Vect2d(x, y);
		this.vel = new Vect2d(0, 0);
		this.radius = r;
	}
}

class Vect2d {
	constructor(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}
}

class Game {
	constructor(name, users) {
		this.ticklen = 1000/60;
		this.width = 400;
		this.height = 300;
		this.players = [];
		this.players[0] = new Player(15, this.height / 2, 5, 25);
		this.players[1] = new Player(this.width - 15, this.height / 2, 5, 25);
		this.ball = new Ball(this.width / 2, this.height / 2, 5);
		this.ball.vel.x = 3;
		this.ball.vel.y = 3;
		this.idmap = {}; // Maps socket IDs to player numbers

		for (let i = 0; i < 2; i++) {
			this.players[i].name = users[i].name;
		}

		this.namespace = io.of('/' + name);
		this.namespace.on('connection', (socket) => {
			console.log(`Someone connected to the namespace! Their id is: ${socket.id}`);
			this.addplayer(socket.id);

			socket.on("disconnect", (msg) => {
				console.log(msg);
	//			this.removeplayer(socket.id);
	//			console.log(`Someone disconnected... ${socket.id}`);
			});

			socket.on('key', (data) => {
				this.move(socket.id, data);
				console.log(`Player: ${socket.id}, Direction: ${data.dir}`);
			});
		});

		setInterval(() => {
			this.update()
			this.send()
		}, this.ticklen);
	}

	reset() {
		this.ball.vel.x = 3;
		this.ball.vel.y = 3;
		this.ball.pos.x = this.width / 2;
		this.ball.pos.y = this.height / 2;
	}

	addplayer(id) {
		if (!this.players[0].connected) {
			this.idmap[id] = 0;
			this.players[0].connected = true;
		} else if (!this.players[1].connected) {
			this.idmap[id] = 1;
			this.players[1].connected = true;
		}
	}

	update() {
		// Update the position of the ball and paddles
		this.ball.pos.x += this.ball.vel.x;
		this.ball.pos.y += this.ball.vel.y;
		for (const player of this.players) {
			if (player.dir == 'up') {
				player.pos.y -= 4;
			} else if (player.dir == 'down') {
				player.pos.y += 4;
			}

			if (player.pos.y < player.height) {
				player.pos.y = player.height;
			} else if (player.pos.y > this.height - player.height) {
				player.pos.y = this.height - player.height;
			}
		}

		// Edge collision
		if (this.ball.pos.x <= -this.ball.radius) {
			// Point for player 1
			this.players[1].score += 1;
			this.reset();
		} else if (this.ball.pos.x >= this.width + this.ball.radius) {
			// Point for player 0
			this.players[0].score += 1;
			this.reset();
		} else if (this.ball.pos.y <= this.ball.radius || this.ball.pos.y >= this.height - this.ball.radius) {
			this.ball.vel.y = -this.ball.vel.y;
		}

		// Paddle collision
		//TODO improve this
		if (this.ball.pos.x - this.ball.radius <= this.players[0].pos.x + this.players[0].width &&
		    this.ball.pos.y - this.ball.radius <= this.players[0].pos.y + this.players[0].height &&
		    this.ball.pos.y + this.ball.radius >= this.players[0].pos.y - this.players[0].height &&
		    this.ball.vel.x < 0) {
			this.ball.vel.x = -this.ball.vel.x;
		} else if (this.ball.pos.x + this.ball.radius >= this.players[1].pos.x - this.players[1].width &&
		    this.ball.pos.y - this.ball.radius <= this.players[1].pos.y + this.players[1].height &&
		    this.ball.pos.y + this.ball.radius >= this.players[1].pos.y - this.players[1].height &&
		    this.ball.vel.x > 0) {
			this.ball.vel.x = -this.ball.vel.x;
		}
	}

	send() {
		let gamestate = {
			'ball':this.ball,
			'players':this.players
		}
		this.namespace.emit("gamestate", gamestate);
	}
	
	move(id, data) {
		let player = this.players[this.idmap[id]];
		if (!player) return;
		if (data.type == 'pressed') {
			player.dir = data.dir;
		} else if (data.type == 'released' && data.dir == player.dir) {
			player.dir = null;
		}
	}
}

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
			let game = new Game(name, users);
			socket.emit('joinLobby', {'namespace':name});
			for (const user of users) {
				socket.to(user.id).emit('joinLobby', {'namespace':name});
			}
		}
	});

});
