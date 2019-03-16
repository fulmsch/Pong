const Victor = require('victor');

class Player {
	constructor(x, y, w, h) {
		this.pos = new Victor(x, y);
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
		this.pos = new Victor(x, y);
		this.vel = new Victor(0, 0);
		this.radius = r;
		this.maxAngle = 30;
	}

	collide(player) {
		if (this.pos.x - this.radius <= player.pos.x + player.width &&
		    this.pos.x + this.radius >= player.pos.x - player.width &&
		    this.pos.y - this.radius <= player.pos.y + player.height &&
		    this.pos.y + this.radius >= player.pos.y - player.height
		) {
			let dir = this.pos.clone().subtract(player.pos);
			let vel = this.vel.length();
			dir.norm().multiply(new Victor(vel, vel));
			this.vel = dir;

			// Limit the angle of the ball
			let angle = this.vel.angleDeg();
			if (angle > (90 - this.maxAngle) && angle <= 90) {
				this.vel.rotateToDeg(90 - this.maxAngle);
			} else if (angle >= 90 && angle < (90 + this.maxAngle)) {
				this.vel.rotateToDeg(90 + this.maxAngle);
			} else if (angle < (-90 + this.maxAngle) && angle >= -90) {
				this.vel.rotateToDeg(-90 + this.maxAngle);
			} else if (angle < -90 && angle > (-90 - this.maxAngle)) {
				this.vel.rotateToDeg(-90 - this.maxAngle);
			}
		}
	}
}

class Game {
	constructor(name, users, io) {
		this.ticklen = 1000/60;
		this.width = 400;
		this.height = 300;
		this.players = [];
		this.players[0] = new Player(15, this.height / 2, 5, 25);
		this.players[1] = new Player(this.width - 15, this.height / 2, 5, 25);
		this.ball = new Ball(this.width / 2, this.height / 2, 5);
		this.idmap = {}; // Maps socket IDs to player numbers
		this.startDir = 1;
		this.reset();

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
		this.ball.vel.x = 5 * this.startDir;
		this.ball.vel.y = 0;
		this.ball.pos.x = this.width / 2;
		this.ball.pos.y = this.height / 2;
		this.players[0].pos.y = this.height / 2;
		this.players[1].pos.y = this.height / 2;

		this.startDir = -this.startDir;
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

		// Paddle collision
		this.ball.collide(this.players[0]);
		this.ball.collide(this.players[1]);

		// Edge collision
		if (this.ball.pos.x <= -this.ball.radius) {
			// Point for player 1
			this.players[1].score += 1;
			this.reset();
		} else if (this.ball.pos.x >= this.width + this.ball.radius) {
			// Point for player 0
			this.players[0].score += 1;
			this.reset();
		} else if (this.ball.pos.y <= this.ball.radius) {
			this.ball.vel.y = -this.ball.vel.y;
			this.ball.pos.y = this.ball.radius;
		} else if (this.ball.pos.y >= this.height - this.ball.radius) {
			this.ball.vel.y = -this.ball.vel.y;
			this.ball.pos.y = this.height - this.ball.radius;
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

module.exports = Game;
