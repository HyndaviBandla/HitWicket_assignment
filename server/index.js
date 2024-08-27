const WebSocket = require('ws');
const gameServer = new WebSocket.Server({ port: 8081 });
const chatServer = new WebSocket.Server({ port: 8082});




const gameState = {
    currentPlayer: 'A',
    board: Array(5).fill(null).map(() => Array(5).fill(null)),
    pieces: {},
    history: []
};

const pieceTypes = {
    'P': {
        name: 'Pawn',
        moves: [
            { x: 0, y: -1 }, // Forward
            { x: 0, y: 1 },  // Backward
            { x: -1, y: 0 }, // Left
            { x: 1, y: 0 }   // Right
        ],
        range: 1
    },
    'H1': {
        name: 'Hero1',
        moves: [
            { x: 0, y: -1 }, // Forward
            { x: 0, y: 1 },  // Backward
            { x: -1, y: 0 }, // Left
            { x: 1, y: 0 }   // Right
        ],
        range: 2
    },
    'H2': {
        name: 'Hero2',
        moves: [
            { x: -1, y: -1 }, // Forward-Left
            { x: 1, y: -1 },  // Forward-Right
            { x: -1, y: 1 },  // Backward-Left
            { x: 1, y: 1 }    // Backward-Right
        ],
        range: 2
    }
};

// Initialize the game board and pieces
function initializeGame() {
    const initialPositions = [
        { type: 'P', player: 'A', position: { row: 0, col: 0 }, id: 'A-P1' },
        { type: 'P', player: 'A', position: { row: 1, col: 0 }, id: 'A-P2' },
        { type: 'P', player: 'A', position: { row: 4, col: 0 }, id: 'A-P3' },
        { type: 'H1', player: 'A', position: { row: 2, col: 0 }, id: 'A-H1' },
        { type: 'H2', player: 'A', position: { row: 3, col: 0 }, id: 'A-H2' },
        { type: 'P', player: 'B', position: { row: 0, col: 4 }, id: 'B-P1' },
        { type: 'P', player: 'B', position: { row: 1, col: 4 }, id: 'B-P2' },
        { type: 'P', player: 'B', position: { row: 4, col: 4 }, id: 'B-P3' },
        { type: 'H1', player: 'B', position: { row: 2, col: 4 }, id: 'B-H1' },
        { type: 'H2', player: 'B', position: { row: 3, col: 4 }, id: 'B-H2' },
    ];

    initialPositions.forEach(pieceInfo => {
        gameState.pieces[pieceInfo.id] = pieceInfo;
        gameState.board[pieceInfo.position.row][pieceInfo.position.col] = pieceInfo;
    });

    broadcastGameState();
}

// Broadcast game state to all connected clients
function broadcastGameState() {
    const data = {
        type: 'UPDATE',
        board: gameState.board,
        pieces: gameState.pieces,
        history: gameState.history
    };
    gameServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}
function broadcastChatMessage(message) {
    chatServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'CHAT', message }));
        }
    });
}


// Handle incoming game WebSocket connections
gameServer.on('connection', ws => {
    console.log('New game client connected');

    ws.on('message', message => {
        const data = JSON.parse(message);

        if (data.type === 'MOVE') {
            const move = data.move;
            const piece = gameState.pieces[move.id];

            if (piece && piece.player === gameState.currentPlayer) {
                // Remove piece from old position
                gameState.board[move.from.row][move.from.col] = null;

                // Update piece position
                piece.position = { row: move.to.row, col: move.to.col };
                gameState.board[move.to.row][move.to.col] = piece;

                // Update history
                gameState.history.push({
                    player: gameState.currentPlayer,
                    piece: piece.id,
                    from: move.from,
                    to: move.to
                });

                // Switch player turn
                gameState.currentPlayer = gameState.currentPlayer === 'A' ? 'B' : 'A';

                // Broadcast updated game state
                broadcastGameState();
            }
        }
    });

    ws.on('close', () => {
        console.log('Game client disconnected');
    });

    // Initialize game for the new client
    initializeGame();
});

// Handle incoming chat WebSocket connections
chatServer.on('connection', ws => {
    console.log('New chat client connected');

    ws.on('message', message => {
        const data = JSON.parse(message);

        if (data.type === 'CHAT') {
            // Broadcast the chat message to all chat clients
            chatServer.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'CHAT', message: data.message }));
                }
            });
        }
    });

    ws.on('close', () => {
        console.log('Chat client disconnected');
    });
});

console.log('Game WebSocket server is running on ws://localhost:8081');
console.log('Chat WebSocket server is running on ws://localhost:8082');
