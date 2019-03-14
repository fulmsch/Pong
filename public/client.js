let gamestate;
let state = 'waiting';
let homeScreenRendered = false;

const socket = io();

socket.on("connect", function() {
	let id = socket.io.engine.id;
});

socket.on("gamestate",function(packet){
	gamestate = packet;
});

function renderGame(state) {
	removeElements();
	noStroke();
	fill(255,255,255,alpha);
	ellipse(state.ball.pos.x,state.ball.pos.y,10,10);
	drawPlayer(state.players[0]);
	drawPlayer(state.players[1]);

	// Scores
	textSize(16);
	text(state.players[0].score, state.width / 2 - 50, 30);
	text(state.players[1].score, state.width / 2 + 50, 30);
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

        homeScreenRendered = true;
    }

    function startGame() {
		console.log(input.value());
        homeScreenRendered = false;
		//TODO: Send name to Server and start searching for a Lobby
		socket.emit("enterLobby",{"name":input.value()});
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
	switch (state) {
		case 'waiting':
			textSize(32);
			fill(255);
			text(state, 30, 62);
			if (gamestate) {
				state = 'connected'
			}
			break;
		case 'connected':
			switch(gamestate.state){
				case 'playing' : renderGame(gamestate);
				break;
				case 'searching': renderLobby();
				break;
                case 'idle': renderHomeScreen();
			}
		default:
			break;
	}
}

function keyPressed() {
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
