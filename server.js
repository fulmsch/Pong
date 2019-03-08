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
	constructor() {
		this.ticklen = 1000/60;
		this.width = 400;
		this.height = 300;
		this.players = [];
		this.players[0] = new Player(15, this.height / 2, 5, 25);
		this.players[1] = new Player(this.width - 15, this.height / 2, 5, 25);
		this.ball = new Ball(this.width / 2, this.height / 2, 5);
		this.ball.vel.x = 3;
		this.ball.vel.y = 3;
		this.idmap = {} // Maps socket IDs to player numbers
	}

	reset() {
		this.ball.vel.x = 3;
		this.ball.vel.y = 3;
		this.ball.pos.x = this.width / 2;
		this.ball.pos.y = this.height / 2;
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
			// Point for player 0
			this.reset();
		} else if (this.ball.pos.x >= this.width + this.ball.radius) {
			// Point for player 1
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
		io.sockets.emit("gamestate",this);
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

	move(id, data) {
		let player = this.idmap[id];
		console.log(player);
		if (data.type == 'pressed') {
			this.players[player].dir = data.dir;
		} else if (data.type == 'released' && data.dir == this.players[player].dir) {
			this.players[player].dir = null;
		}
	}
}

let gamestate = new Game();

//create socket callbacks...
io.on("connection", (socket) => {
	console.log(`Someone connected! Their id is: ${socket.id}`);

	//TODO handle more than two connections
	gamestate.addplayer(socket.id);

	socket.on('request',(request) => {
		io.sockets.emit("response",{"type":"denied"});
		console.log(`Someone connected! Their id is: ${request.type}`);
	});

	socket.on('key', (data) => {
		gamestate.move(socket.id, data);
		console.log(`Player: ${socket.id}, Direction: ${data.dir}`);
	});

	socket.on("disconnect", () => {
		//TODO do something
		console.log(`Someone disconnected... ${socket.id}`);
	});
});

setInterval(() => {
	gamestate.update()
	gamestate.send()
}, gamestate.ticklen);
