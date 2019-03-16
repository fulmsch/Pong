const Game = require('./game.js');

class Lobby {
	constructor(name, users, io) {
		this.gamestate = new Game(users);

		this.namespace = io.of('/' + name);
		this.namespace.on('connection', (socket) => {
			console.log(`Someone connected to the namespace! Their id is: ${socket.id}`);
			this.gamestate.addplayer(socket.id);

			socket.on("disconnect", (msg) => {
				console.log(msg);
	//			this.removeplayer(socket.id);
	//			console.log(`Someone disconnected... ${socket.id}`);
			});

			socket.on('key', (data) => {
				this.gamestate.move(socket.id, data);
				console.log(`Player: ${socket.id}, Direction: ${data.dir}`);
			});
		});

		setInterval(() => {
			this.gamestate.update()
			this.namespace.emit("gamestate", this.gamestate);
		}, this.gamestate.ticklen);
	}
}

module.exports = Lobby;
