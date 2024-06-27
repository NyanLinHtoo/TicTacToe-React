// library imports
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const port = 4200; // localhost port
const app = express(); // invoking app instance
app.use(cors());
const server = http.createServer(app); // server instance
const io = socketIO(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
  },
});

// server listens to given port
server.listen(port, () => {
  console.log(`http server listening on port ${port}`);
});

var roomno = 1; // initial socket.io room number

// socket.io onConnect
io.on("connection", (socket) => {
  const uniqueId = uuidv4();
  socket.uniqueId = uniqueId;

  console.log("New connection:", socket.id, "Unique ID:", uniqueId);

  var currentRoomId = "room-" + roomno;
  socket.join(currentRoomId);

  console.log(`${socket.id} has connected to ${currentRoomId}`);

  // Increase roomno if 2 clients are present in a room.
  if (io.sockets.adapter.rooms.get(currentRoomId).size > 1) {
    roomno++;
  }

  // decides the playerSign ('X' or 'O') of the player who just connected, emits it to the player.
  var playerSign =
    io.sockets.adapter.rooms.get(currentRoomId).size > 1 ? "O" : "X";
  socket.emit("playerSign", playerSign);

  // Modify your connectToRoom emit to include the uniqueId
  io.to(currentRoomId).emit(
    "connectToRoom",
    uniqueId, // Use uniqueId instead of socket.id
    currentRoomId,
    Array.from(io.sockets.adapter.rooms.get(currentRoomId) || []).map(
      (socketId) => {
        const s = io.sockets.sockets.get(socketId);
        return s ? s.uniqueId : socketId;
      }
    )
  );

  // emit startGame event if there are enough players in this room
  if (io.sockets.adapter.rooms.get(currentRoomId).size > 1) {
    io.to(currentRoomId).emit("startGame");
  }

  // a player made a move, checks if it is a winning/stalemate situation, emits the updated board to all users in room
  socket.on("makeMove", (boardState, room, currPlayer, nextPlayer) => {
    if (checkWin(boardState, currPlayer)) {
      io.to(room).emit("gameWin", currPlayer);
    }
    if (checkStalemate(boardState)) {
      io.to(room).emit("stalemate");
    }
    io.to(room).emit("updateBoard", boardState, nextPlayer);
  });

  // a player resets the game.
  socket.on("resetGame", (room) => {
    console.log(`${socket.id} reset the game in ${room}!`);
    io.to(room).emit("resetGame");
  });

  // when a player disconnects from the game, notifies remaining player in the room
  socket.on("disconnect", () => {
    console.log(`${socket.id} has disconnected from ${currentRoomId}`);
    socket.to(currentRoomId).emit("userLeft", socket.id);
  });

  // a player taunts their opponent
  socket.on("tauntOpponent", (opponentUniqueId) => {
    const opponentSocket = Array.from(io.sockets.sockets.values()).find(
      (s) => s.uniqueId === opponentUniqueId
    );
    if (opponentSocket) {
      opponentSocket.emit("incomingTaunt", getRandomTaunt());
    }
  });
});

// winning board index combinations
const winConditions = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// Receives a board, checks if it's in a stalemate situation.
const checkStalemate = (boardState) => {
  // checking if board is completely occupied
  for (let i = 0; i < boardState.length; i++) {
    if (boardState[i] === "") {
      return false;
    }
  }
  // checking if board has a winner
  if (checkWin(boardState, "X") || checkWin(boardState, "O")) {
    return false;
  }
  return true;
};

// Receives a board state and a player sign, checks if that player has won
const checkWin = (boardState, currPlayer) => {
  for (let i = 0; i < winConditions.length; i++) {
    var win = true;
    for (let j = 0; j < winConditions[i].length; j++) {
      if (boardState[winConditions[i][j]] !== currPlayer) {
        win = false;
      }
    }
    if (win === true) {
      return true;
    }
  }
  return false;
};

// returns a random taunt message from the 'taunts' array.
const getRandomTaunt = () => {
  return taunts[Math.floor(Math.random() * taunts.length)];
};

const taunts = [
  "what up bish",
  "u are a joke",
  "what a scrub",
  "u got no chance",
  "damn im SO smart",
  "HA what now",
  "u can go home",
  "thanks for wasting my time",
  "can i play with someone else",
  "u should feel bad",
  "stop crying",
];
