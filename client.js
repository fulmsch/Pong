var things = [];
var users = {};
var gamestate;

const socket = io();

socket.on('connect', function() {
	var id = socket.io.engine.id;
	console.log(id);
});

socket.on("gamestate",function(packet){
	gamestate = packet;
//	console.log(packet);
});

socket.on("response",function(info){
	console.log(info);
});

function renderGame(state) {
	if (!state) {
		return;
	} else {
		fill(255,255,255,alpha);
		ellipse(state.ball.pos.x,state.ball.pos.y,20,20);
		rect(state.players[0].pos.x, state.players[0].pos.y, 20, 50);
	}
}

function mysetup() {
	if (!gamestate) {
		setTimeout(mysetup, 1000);
	} else {
		createCanvas(gamestate.width,gamestate.height);
		background(51);
	}
  //socket.emit("request",{"type":"start"});
}

function setup() {
	mysetup();

}

function draw() {
    //Clear the canvas
    background(51);
    //Remove outline of things
    noStroke();

	renderGame(gamestate);

  //We need to send the server our information so the other players can see it
//  socket.emit("info",{"x":mouseX,"y":mouseY});

}
