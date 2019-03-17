let gamestate;
let state = 'idle';
let homeScreenRendered = false;

const socket = io();
let lobbySocket;


socket.on("connect", function() {
	let id = socket.io.engine.id;
});

socket.on("joinLobby", function(msg) {
	console.log(msg);

	lobbySocket = io('/' + msg.namespace);
	lobbySocket.on('connect', () => {
		lobbySocket.on("gamestate",function(packet){
			state = 'playing';
			gamestate = packet;
		});
	});
});

function renderGame(state) {
	removeElements();
	noStroke();
	fill(255);
	ellipse(state.ball.pos.x,state.ball.pos.y,10,10);
	drawPlayer(state.players[0]);
	drawPlayer(state.players[1]);

	// Scores
	textSize(16);
	textAlign(LEFT);
	text(state.players[0].name + ': ' + state.players[0].score, 20, 30);
	textAlign(RIGHT);
	text(state.players[1].name + ': ' + state.players[1].score, width - 20, 30);
}

function renderHomeScreen() {
    let input;
	if (!homeScreenRendered) {
		removeElements();
        input = createInput();
        input.position(20, 65);

        let button = createButton('submit');
        button.position(input.x + input.width, 65);
        button.mousePressed(startGame);

        let inputLabel = createElement('h2', 'Enter your Name');
        inputLabel.position(20, 5);

        let test = createElement('h2', 'Hello world');

        homeScreenRendered = true;
    }

    function startGame() {
		console.log(input.value());
        homeScreenRendered = false;

		socket.emit("enterLobby",{"name":input.value()});
		state = 'searching';
    }

}

function renderLobby() {
	removeElements();
	let message = createElement('h2', 'Searching...');
	message.position(20, 5);
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
	switch(state){
		case 'playing': renderGame(gamestate);
		break;
		case 'searching': renderLobby();
		break;
		case 'idle': renderHomeScreen();
	}
}

function keyPressed() {
	switch (keyCode) {
		case UP_ARROW:
			lobbySocket.emit("key",{"dir":'up', 'type':'pressed'});
			break;
		case DOWN_ARROW:
			lobbySocket.emit("key",{"dir":'down', 'type':'pressed'});
			break;
		default:
			break;
	}
}

function keyReleased() {
	switch (keyCode) {
		case UP_ARROW:
			lobbySocket.emit("key",{"dir":'up', 'type':'released'});
			break;
		case DOWN_ARROW:
			lobbySocket.emit("key",{"dir":'down', 'type':'released'});
			break;
		default:
			break;
	}
}
