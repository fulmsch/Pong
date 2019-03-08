let gamestate;
let state = 'waiting';

const socket = io();

socket.on("connect", function() {
	let id = socket.io.engine.id;
	console.log(id);
});

socket.on("gamestate",function(packet){
	gamestate = packet;
});

function renderGame(state) {
	noStroke();
	fill(255,255,255,alpha);
	ellipse(state.ball.pos.x,state.ball.pos.y,10,10);
	drawPlayer(state.players[0]);
	drawPlayer(state.players[1]);
}

function drawPlayer(player) {
	rectMode(RADIUS);
	rect(player.pos.x, player.pos.y, player.width, player.height);
}


function setup() {
	createCanvas(400,300);
	background(51);
}

function draw() {
    background(51);
	switch (state) {
		case 'waiting':
			textSize(32);
			fill(255);
			text(state, 30, 62);
			if (gamestate) {
				state = 'playing'
			}
			break;
		case 'playing':
			renderGame(gamestate);
		default:
			break;
	}
}

function keyPressed() {
	console.log(keyCode);
	switch (keyCode) {
		case UP_ARROW:
			socket.emit("key",{"dir":'up', 'type':'pressed'});
			break;
		case DOWN_ARROW:
			socket.emit("key",{"dir":'down', 'type':'pressed'});
			break;
		default:
			break;
	}
}

function keyReleased() {
	switch (keyCode) {
		case UP_ARROW:
			socket.emit("key",{"dir":'up', 'type':'released'});
			break;
		case DOWN_ARROW:
			socket.emit("key",{"dir":'down', 'type':'released'});
			break;
		default:
			break;
	}
}
