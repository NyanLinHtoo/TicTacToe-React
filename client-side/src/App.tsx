import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import { Toaster, toast } from "sonner";

// connect with server-side
// const socket: Socket = io("http://localhost:4200");

interface InitState {
  boardState: string[];
  sockets: Record<string, string>;
  room: string;
  mySocketId: string;
  playerSign: string;
  currentTurn: string;
  status: string;
}

const App = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<InitState>({
    boardState: ["", "", "", "", "", "", "", "", ""],
    sockets: {},
    room: "",
    mySocketId: "",
    playerSign: "",
    currentTurn: "",
    status: "unstarted",
  });

  useEffect(() => {
    const newSocket: Socket = io("http://localhost:4200");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected with socket ID:", newSocket.id);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    // Handling connection to room and updating state
    socket.on(
      "connectToRoom",
      (uniqueId: string, roomNo: string, sockets: Record<string, string>) => {
        console.log(`Connected to room with unique ID: ${uniqueId}`);
        setState((prevState) => ({
          ...prevState,
          room: roomNo,
          sockets: sockets,
          mySocketId: uniqueId,
        }));
      }
    );

    // when a player has disconnected from the room,
    socket.on("userLeft", () => {
      toast.warning("Your opponent left the game..");
      setState((prevState) => ({
        ...prevState,
        boardState: ["", "", "", "", "", "", "", "", ""],
        currentTurn: "X",
        status: "unstarted",
        playerSign: "X",
      }));
    });

    // updates state accordingly when server assigns a playerSign to the client
    socket.on("playerSign", (playerSign) => {
      console.log("Received playerSign from server: ", playerSign);
      setPlayerSign(playerSign);

      // updates game status to 'started' when server emits startGame event
      socket.on("startGame", () => {
        console.log("Game is started by the server");
        setState((prevState) => ({
          ...prevState,
          status: "started",
          currentTurn: "X", // Set the initial turn to X
        }));
      });

      // updates this.state.boardState when server emits a new boardState
      socket.on("updateBoard", (newBoardState, currentPlayer) => {
        setState((prevState) => ({
          ...prevState,
          boardState: newBoardState,
          currentTurn: currentPlayer,
        }));
      });

      // server announces a winner, update this.state.status accordingly
      socket.on("gameWin", (winningPlayer) => {
        console.log(`${winningPlayer} is the winner!`);
        setState((prevState) => {
          const outcome =
            winningPlayer === prevState.playerSign ? "win" : "lose";
          return {
            ...prevState,
            status: outcome,
          };
        });
      });

      // server announces stalemate, update this.state.status accordingly
      socket.on("stalemate", () => {
        console.log(`stalemate!`);
        setState((prevState) => ({
          ...prevState,
          status: "stalemate",
        }));
      });

      // reset game state when the server emits a resetGame event
      socket.on("resetGame", () => {
        setState((prevState) => ({
          ...prevState,
          boardState: ["", "", "", "", "", "", "", "", ""],
          currentTurn: "X",
          status: "started",
        }));
        toast.info("The game has been reset!");
      });
    });

    socket.on("incomingTaunt", (message) => {
      console.log("Received taunt:", message);
      incomingTauntToast(message, 3);
    });

    return () => {
      socket.off("connectToRoom");
      socket.off("connectToRoom");
      socket.off("userLeft");
      socket.off("playerSign");
      socket.off("startGame");
      socket.off("updateBoard");
      socket.off("gameWin");
      socket.off("stalemate");
      socket.off("resetGame");
      socket.off("incomingTaunt");
    };
  }, [socket]);

  // return a suiting status message depending on game's state
  const getStatusMessage = () => {
    if (state.status === "unstarted") {
      return "Waiting for opponent to connect..";
    } else if (state.status === "stalemate") {
      return "It's a stalemate!";
    } else if (state.status === "win") {
      return "You win!";
    } else if (state.status === "lose") {
      return "You lose..";
    } else if (state.currentTurn === state.playerSign) {
      return "It's your turn";
    } else if (state.currentTurn !== state.playerSign) {
      return "Opponent's turn";
    }
  };

  // return a suiting color for the alert component depending on game's state
  const getStatusColor = () => {
    if (state.status === "unstarted") {
      return "text-xl py-2 bg-gray-400 text-white rounded-xl";
    } else if (state.status === "stalemate") {
      return "text-xl py-2 text-orange-300";
    } else if (state.status === "win") {
      return "text-xl py-2 bg-green-300";
    } else if (state.status === "lose") {
      return "text-xl py-2 bg-rose-300";
    } else if (state.currentTurn === state.playerSign) {
      return "text-xl py-2 bg-blue-300";
    } else if (state.currentTurn !== state.playerSign) {
      return "text-xl py-2 bg-rose-300";
    }
  };

  // sends game reset request to server.
  const resetGame = () => {
    if (state.status === "unstarted") {
      toast.info("Your opponent is not here!");
    } else {
      socket?.emit("resetGame", state.room);
    }
  };

  // setter method for playerSign ('X' or 'O')
  const setPlayerSign = (sign: string) => {
    setState((prevState) => ({ ...prevState, playerSign: sign }));
  };

  // triggered when the player clicks on a cell
  const makeMove = (cellIndex: number) => {
    if (state.status === "unstarted") {
      toast.info("The game hasn't started yet!");
    } else if (
      state.status === "win" ||
      state.status === "lose" ||
      state.status === "stalemate"
    ) {
      toast.info("The game is over!");
    } else if (state.currentTurn !== state.playerSign) {
      toast.warning("It's not your turn!");
    } else if (state.boardState[cellIndex] !== "") {
      toast.warning("This spot is taken!");
    } else {
      setState((prevState) => {
        const newBoardState = [...prevState.boardState];
        newBoardState[cellIndex] = prevState.playerSign;
        const opponentSign = prevState.playerSign === "X" ? "O" : "X";

        // Emit the move to the server with the updated board state
        socket?.emit(
          "makeMove",
          newBoardState,
          prevState.room,
          prevState.playerSign,
          opponentSign
        );

        return {
          ...prevState,
          boardState: newBoardState,
          currentTurn: opponentSign,
        };
      });
    }
  };

  // Update getOpponentId to use these unique IDs
  const getOpponentId = () => {
    const socketArr = Object.keys(state.sockets);

    if (socketArr.length < 2) return null;
    return socketArr.find((id) => id !== state.mySocketId) || null;
  };

  // tells the server to taunt the other opponent.
  const tauntOpponent = () => {
    if (state.status === "unstarted") {
      toast("Who are you taunting to?");
    } else {
      const opponentId = getOpponentId();
      console.log("Taunting opponent with ID:", opponentId);
      if (opponentId) {
        socket?.emit("tauntOpponent", opponentId);
        toast("You taunted the opponent!");
      } else {
        toast("No opponent to taunt!");
      }
    }
  };

  // shows the incoming taunt toast. Is triggered by the opponent.
  const incomingTauntToast = (toastMessage: string, seconds: number) => {
    console.log("Showing taunt toast:", toastMessage);
    toast(toastMessage, {
      duration: seconds * 1000,
      position: "top-left",
      className: "toast__taunt",
    });
  };

  return (
    <>
      <div className="max-w-sm mx-auto mt-32 mb-10 h-auto py-5 px-4 shadow-2xl text-center rounded-lg">
        <p className={getStatusColor()}>{getStatusMessage()}</p>
        <div className="grid grid-cols-3 py-5">
          <button
            className="text-2xl h-32 px-5 py-9 rounded-tl-lg border-t-2 border-l-2 border-blue-400 hover:bg-blue-400"
            onClick={() => makeMove(0)}>
            {state.boardState[0]}
          </button>
          <button
            className="text-2xl h-32 px-5 py-9 border-t-2 border-r-2 border-l-2 border-blue-400 hover:bg-blue-400"
            onClick={() => makeMove(1)}>
            {state.boardState[1]}
          </button>
          <button
            className="text-2xl h-32 px-5 py-9 rounded-tr-lg border-t-2 border-r-2 border-blue-400 hover:bg-blue-400"
            onClick={() => makeMove(2)}>
            {state.boardState[2]}
          </button>
          <button
            className="text-2xl h-32 px-5 py-9 border-t-2 border-b-2 border-l-2 border-blue-400 hover:bg-blue-400"
            onClick={() => makeMove(3)}>
            {state.boardState[3]}
          </button>
          <button
            className="text-2xl h-32 px-5 py-9 border-2 border-blue-400 hover:bg-blue-400"
            onClick={() => makeMove(4)}>
            {state.boardState[4]}
          </button>
          <button
            className="text-2xl h-32 px-5 py-9 border-t-2 border-b-2 border-r-2 border-blue-400 hover:bg-blue-400"
            onClick={() => makeMove(5)}>
            {state.boardState[5]}
          </button>
          <button
            className="text-2xl h-32 px-5 py-9 rounded-bl-lg border-b-2 border-l-2 border-blue-400 hover:bg-blue-400"
            onClick={() => makeMove(6)}>
            {state.boardState[6]}
          </button>
          <button
            className="text-2xl h-32 px-5 py-9 border-b-2 border-r-2 border-l-2 border-blue-400 hover:bg-blue-400"
            onClick={() => makeMove(7)}>
            {state.boardState[7]}
          </button>
          <button
            className="text-2xl h-32 px-5 py-9 rounded-br-lg border-b-2 border-r-2 border-blue-400 hover:bg-blue-400"
            onClick={() => makeMove(8)}>
            {state.boardState[8]}
          </button>
        </div>

        <div
          className="inline-flex items-centers rounded-md shadow-sm text-center bg-slate-600"
          role="group">
          <button
            onClick={() => resetGame()}
            type="button"
            className="px-4 py-2 text-sm font-medium rounded-s-lg text-white hover:bg-slate-700">
            Reset Game
          </button>
          <button
            onClick={() => tauntOpponent()}
            type="button"
            className="px-4 py-2 text-sm font-medium rounded-e-lg text-white hover:bg-slate-700">
            Taunt
          </button>
        </div>
      </div>
      <div className="bg-gray-300 max-w-xs mx-auto p-4 rounded-lg">
        <p>
          Playing in:
          <span className="bg-slate-700 text-white rounded-md text-xs px-2 py-1">
            {state.room}
          </span>
        </p>
        <p>
          You are:
          <span className="bg-slate-700 text-white rounded-md text-xs px-2 py-1">
            {state.playerSign}
          </span>
        </p>
      </div>
      <Toaster richColors />
    </>
  );
};

export default App;
