/*
Created by Sam DeLong
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
/* Giveuser access to files...
   If you were going to do this *not* on github you wouldn't want to allow them to see server.js (just saying)
*/
app.use('/', express.static(__dirname + '/public'));

//What file to send users
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Star listening on port 80 for web stuff
server.listen(80, function() {
  console.log('starting webserver');
});

class Player {
	constructor(x, y) {
		this.pos = new Vect2d(x, y);
	}
}

class Ball {
	constructor(x, y) {
		this.pos = new Vect2d(x, y);
		this.vel = new Vect2d(0, 0);
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
		this.players[0] = new Player();
		this.players[1] = new Player();
		this.ball = new Ball(this.width / 2, this.height / 2);
		this.ball.vel.x = 5;
	}

	update() {
		if (this.ball.pos.x > this.width || this.ball.pos.x < 0) {
			this.ball.vel.x = -this.ball.vel.x;
		}
		this.ball.pos.x += this.ball.vel.x;
	}

	send() {
		io.sockets.emit("gamestate",this);
	}
}

let gamestate = new Game();
gamestate.send();

//define users as JSON array
let users = {};

//create socket callbacks...
io.on("connection", (socket) => {
    console.log(`Someone connected! Their id is: ${socket.id}`);

		users[socket.id] = {
		  //set default x and y positions for user
		  x: 0,
		  y: 0
		};

    socket.on('request',(request) => {
		io.sockets.emit("response",{"type":"denied"});
		console.log(`Someone connected! Their id is: ${request.type}`);
	});
    socket.on('info',(info) => {
      
      //Check if client is sending correct information
      if(info.y && info.x && users[socket.id]){

        //Set the specific user's mouse position
        users[socket.id].x = info.x;
        users[socket.id].y = info.y;
      }
    });

    socket.on("disconnect", () => {

      //Someone disconnected
      var temp = {};

      //Remove the disconnected user from the users obj
      for(var id in users){
        if(id != socket.id){
          temp[id] = users[id];
        }
      }
      
       //Set users array to temporary array, which doesn't have the disconnected user
      users = temp;
      console.log(`Someone disconnected... ${socket.id}`);

    });
});

// sends all of the users the mouse positions of the users...
setInterval(() => {
	gamestate.send()
}, 1000/100);

setInterval(() => {
	gamestate.update()
}, gamestate.ticklen);
