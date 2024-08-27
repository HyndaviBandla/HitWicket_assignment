const ws = new WebSocket('ws://localhost:8082'); // Connect to the chat WebSocket server


// Handle incoming chat messages
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'CHAT') {
        displayChatMessage(message.message);
    }
};

// Send chat message
document.getElementById('chat-send').addEventListener('click', sendChatMessage);
document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

function sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    if (message) {
        ws.send(JSON.stringify({ type: 'CHAT', message: message }));
        chatInput.value = '';
        displayChatMessage(`You: ${message}`);
    }
}

function displayChatMessage(message) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}


// Define initial game state
const gameState = {
    currentPlayer: 'A',
    board: [],
    pieces: {}
};

// Define piece types and their movement rules
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
    },
    'H3': {
        name: 'Hero3',
        moves: [
            { x: 2, y: 1 },  // "L" Shape: Right 2, Up 1
            { x: 2, y: -1 }, // "L" Shape: Right 2, Down 1
            { x: -2, y: 1 }, // "L" Shape: Left 2, Up 1
            { x: -2, y: -1 },// "L" Shape: Left 2, Down 1
            { x: 1, y: 2 },  // "L" Shape: Up 2, Right 1
            { x: 1, y: -2 }, // "L" Shape: Up 2, Left 1
            { x: -1, y: 2 }, // "L" Shape: Down 2, Right 1
            { x: -1, y: -2 }// "L" Shape: Down 2, Left 1
        ],
        range: 1 // Move exactly 1 "L" shape
    }
};


// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeBoard();
    placePieces();
    updateCurrentPlayerDisplay();
});

// Initialize the game board
function initializeBoard() {
    const boardElement = document.getElementById('game-board');
    boardElement.innerHTML = ''; // Clear the board

    for (let row = 0; row < 5; row++) {
        gameState.board[row] = [];
        for (let col = 0; col < 5; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('drop', handleDrop);
            boardElement.appendChild(cell);
            gameState.board[row][col] = null;
        }
    }
}

// Place initial pieces on the board
function placePieces() {
    const initialPositions = [
        { type: 'H3', player: 'A', position: { row: 0, col: 0 }, id: 'A-H3' },
        { type: 'P', player: 'A', position: { row: 1, col: 0 }, id: 'A-P2' },
        { type: 'P', player: 'A', position: { row: 4, col: 0 }, id: 'A-P3' },
        { type: 'H1', player: 'A', position: { row: 2, col: 0 }, id: 'A-H1' },
        { type: 'H2', player: 'A', position: { row: 3, col: 0 }, id: 'A-H2' },
        
        { type: 'H3', player: 'B', position: { row: 0, col: 4 }, id: 'B-H3' },
        { type: 'P', player: 'B', position: { row: 1, col: 4 }, id: 'B-P2' },
        { type: 'P', player: 'B', position: { row: 4, col: 4 }, id: 'B-P3' },
        { type: 'H1', player: 'B', position: { row: 2, col: 4 }, id: 'B-H1' },
        { type: 'H2', player: 'B', position: { row: 3, col: 4 }, id: 'B-H2' },
    ];

    initialPositions.forEach(pieceInfo => {
        const piece = document.createElement('div');
        piece.classList.add('piece', `player${pieceInfo.player}`);
        piece.draggable = true;
        piece.id = pieceInfo.id; // Unique ID based on convention
        piece.dataset.type = pieceInfo.type;
        piece.dataset.player = pieceInfo.player;
        piece.dataset.row = pieceInfo.position.row;
        piece.dataset.col = pieceInfo.position.col;
        piece.innerText = pieceInfo.id; // Display the ID directly on the piece
        
        piece.addEventListener('dragstart', handleDragStart);
        piece.addEventListener('dragend', handleDragEnd);

        const cell = getCell(pieceInfo.position.row, pieceInfo.position.col);
        cell.appendChild(piece);

        gameState.board[pieceInfo.position.row][pieceInfo.position.col] = pieceInfo;
        gameState.pieces[pieceInfo.id] = pieceInfo;
    });
}

// Get cell element by row and col
function getCell(row, col) {
    return document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
}

// Drag and drop handlers
let draggedPiece = null;
let validMoves = [];

function handleDragStart(e) {
    const piece = e.target;
    if (piece.dataset.player !== gameState.currentPlayer) {
        e.preventDefault();
        return;
    }

    draggedPiece = piece;
    piece.classList.add('dragging');

    const row = parseInt(piece.dataset.row);
    const col = parseInt(piece.dataset.col);
    const type = piece.dataset.type;
    validMoves = calculateValidMoves(row, col, type, piece.dataset.player);

    highlightValidMoves(true);
}

function handleDragEnd(e) {
    if (draggedPiece) {
        draggedPiece.classList.remove('dragging');
    }
    highlightValidMoves(false);
    draggedPiece = null;
    validMoves = [];
}

function handleDragOver(e) {
    e.preventDefault(); // Allow dropping
    const targetCell = e.target.closest('.cell');
    if (validMoves.some(move => move.row == targetCell.dataset.row && move.col == targetCell.dataset.col)) {
        targetCell.classList.add('highlight');
    }
}
// Track move history
let moveHistory = [];

function handleDrop(e) {
    e.preventDefault();
    const targetCell = e.target.closest('.cell');
    const targetRow = parseInt(targetCell.dataset.row);
    const targetCol = parseInt(targetCell.dataset.col);

    if (!validMoves.some(move => move.row == targetRow && move.col == targetCol)) return;

    const previousRow = parseInt(draggedPiece.dataset.row);
    const previousCol = parseInt(draggedPiece.dataset.col);
    const pieceId = draggedPiece.id; // Use the unique ID

    // Remove any existing piece at target location (capture)
    const existingPiece = targetCell.querySelector('.piece');
    if (existingPiece) {
        existingPiece.remove();
        const existingPieceInfo = gameState.pieces[existingPiece.id];
        gameState.board[existingPieceInfo.position.row][existingPieceInfo.position.col] = null;
        delete gameState.pieces[existingPiece.id];
    }

    // Update piece position
    gameState.board[previousRow][previousCol] = null;
    draggedPiece.dataset.row = targetRow;
    draggedPiece.dataset.col = targetCol;
    targetCell.appendChild(draggedPiece);
    gameState.board[targetRow][targetCol] = {
        type: draggedPiece.dataset.type,
        player: draggedPiece.dataset.player,
        position: { row: targetRow, col: targetCol },
        id: draggedPiece.id
    };

    // Record the move using the unique ID
    const direction = getDirection(previousRow, previousCol, targetRow, targetCol);
    moveHistory.push(`${pieceId}: ${direction}`);
    updateMoveHistoryDisplay();

    // Check for win condition
    checkForWin();

    // Switch player turn
    gameState.currentPlayer = gameState.currentPlayer === 'A' ? 'B' : 'A';
    updateCurrentPlayerDisplay();
}


function getDirection(previousRow, previousCol, targetRow, targetCol) {
    const rowDiff = targetRow - previousRow;
    const colDiff = targetCol - previousCol;

    if (rowDiff === -1 && colDiff === 0) return 'F'; // Forward
    if (rowDiff === 1 && colDiff === 0) return 'B'; // Backward
    if (rowDiff === 0 && colDiff === -1) return 'L'; // Left
    if (rowDiff === 0 && colDiff === 1) return 'R'; // Right
    if (rowDiff === -1 && colDiff === -1) return 'FL'; // Forward-Left
    if (rowDiff === -1 && colDiff === 1) return 'FR'; // Forward-Right
    if (rowDiff === 1 && colDiff === -1) return 'BL'; // Backward-Left
    if (rowDiff === 1 && colDiff === 1) return 'BR'; // Backward-Right

    return 'FL';
}

function updateMoveHistoryDisplay() {
    const moveHistoryElement = document.getElementById('move-history');
    moveHistoryElement.innerHTML = '';

    const half = Math.ceil(moveHistory.length / 2);
    const leftColumn = document.createElement('ul');
    const rightColumn = document.createElement('ul');

    moveHistory.slice(0, half).forEach(move => {
        const li = document.createElement('li');
        li.textContent = move;
        leftColumn.appendChild(li);
    });

    moveHistory.slice(half).forEach(move => {
        const li = document.createElement('li');
        li.textContent = move;
        rightColumn.appendChild(li);
    });

    moveHistoryElement.appendChild(leftColumn);
    moveHistoryElement.appendChild(rightColumn);
}


function highlightValidMoves(highlight) {
    validMoves.forEach(move => {
        const cell = getCell(move.row, move.col);
        if (highlight) {
            cell.classList.add('highlight');
        } else {
            cell.classList.remove('highlight');
        }
    });
}

// Calculate valid moves based on piece type and current position
// Calculate valid moves based on piece type and current position
function calculateValidMoves(row, col, type, player) {
    const moves = [];
    const pieceInfo = pieceTypes[type];
    pieceInfo.moves.forEach(direction => {
        const newRow = row + direction.y;
        const newCol = col + direction.x;

        // Ensure move is within bounds
        if (newRow >= 0 && newRow <= 4 && newCol >= 0 && newCol <= 4) {
            const targetCellInfo = gameState.board[newRow][newCol];
            if (!targetCellInfo || targetCellInfo.player !== player) {
                moves.push({ row: newRow, col: newCol });
            }
        }
    });
    return moves;
}


// Check for a win condition
function checkForWin() {
    const opponent = gameState.currentPlayer === 'A' ? 'B' : 'A';
    const remainingPieces = Object.values(gameState.pieces).filter(piece => piece.player === opponent);

    if (remainingPieces.length === 0) {
        const winner = gameState.currentPlayer === 'A' ? 'player1' : 'player2';
        const loser = opponent === 'A' ? 'player1' : 'player2';

        players[winner].wins += 1;
        players[loser].losses += 1;

        setTimeout(() => {
            displayWinner(gameState.currentPlayer);
            updateStarRating(); // Ensure this function is called to update stars

            setTimeout(() => {
                resetGame();
            }, 2000);
        }, 100);
    }
}




// Display the winner with styling
function displayWinner(winner) {
    const winnerMessage = document.getElementById('winner-message');
    winnerMessage.innerText = `Player ${winner} wins!`;
    winnerMessage.style.display = 'block';
}

// Update current player display
function updateCurrentPlayerDisplay() {
    const currentPlayerElement = document.getElementById('current-player');
    currentPlayerElement.innerText = `Current Player: ${gameState.currentPlayer}`;
}

function resetGame() {
    gameState.currentPlayer = 'A';
    gameState.board = [];
    gameState.pieces = {};

    const boardElement = document.getElementById('game-board');
    boardElement.innerHTML = ''; // Clear the board
    initializeBoard();
    placePieces();
    updateCurrentPlayerDisplay();

    // Hide the winner message
    const winnerMessage = document.getElementById('winner-message');
    winnerMessage.style.display = 'none';
    moveHistory=[];
    const moveHistoryElement = document.getElementById('move-history');
    moveHistoryElement.innerHTML = ''; // Ensure history is cleared

    console.log('Game reset complete.');
    
}

// Handle WebSocket messages
ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'UPDATE') {
        updateBoard(data.board);
        updateHistory(data.history);
        updateCurrentPlayerDisplay();
    }
};

function updateBoard(updatedData) {
    if (!updatedData || !updatedData.board || !updatedData.pieces) {
        console.error('Invalid board data received:', updatedData);
        return;
    }

    gameState.board = updatedData.board;
    gameState.pieces = updatedData.pieces;

    // Clear the board
    const boardElement = document.getElementById('game-board');
    boardElement.innerHTML = '';

    // Place pieces on the board
    for (const [id, pieceInfo] of Object.entries(gameState.pieces)) {
        if (!pieceInfo.position || !pieceInfo.position.row || !pieceInfo.position.col) {
            console.error('Invalid piece position:', pieceInfo);
            continue;
        }

        const piece = document.createElement('div');
        piece.classList.add('piece', `player${pieceInfo.player}`);
        piece.draggable = true;
        piece.id = id;
        piece.dataset.type = pieceInfo.type;
        piece.dataset.player = pieceInfo.player;
        piece.dataset.row = pieceInfo.position.row;
        piece.dataset.col = pieceInfo.position.col;
        piece.innerText = `${pieceInfo.player}-${pieceTypes[pieceInfo.type]?.name || 'Unknown'}`;
        
        piece.addEventListener('dragstart', handleDragStart);
        piece.addEventListener('dragend', handleDragEnd);

        const cell = getCell(pieceInfo.position.row, pieceInfo.position.col);
        if (cell) {
            cell.appendChild(piece);
        } else {
            console.error('Cell not found for position:', pieceInfo.position);
        }
    }
}


function updateHistory(history) {
    const historyElement = document.getElementById('game-history');
    historyElement.innerHTML = '';
    history.forEach(entry => {
        const div = document.createElement('div');
        div.innerText = `Player ${entry.player} moved ${entry.piece} from (${entry.from.row}, ${entry.from.col}) to (${entry.to.row}, ${entry.to.col})`;
        historyElement.appendChild(div);
    });
}
function updateStarRating() {
    Object.keys(players).forEach(playerKey => {
        const player = players[playerKey];
        const totalGames = player.wins + player.losses;
        const winPercentage = totalGames > 0 ? (player.wins / totalGames) * 100 : 0;

        // Determine the number of stars (0 to 5) based on the win percentage
        let stars = 0;
        if (winPercentage > 80) {
            stars = 5;
        } else if (winPercentage > 60) {
            stars = 4;
        } else if (winPercentage > 40) {
            stars = 3;
        } else if (winPercentage > 20) {
            stars = 2;
        } else if (winPercentage > 0) {
            stars = 1;
        }

        // Update the stars in the UI
        const starContainer = document.getElementById(`${playerKey}-stars`);
        if (starContainer) {
            const starElements = starContainer.children;
            for (let i = 0; i < 5; i++) {
                starElements[i].classList.toggle('filled', i < stars);
            }
        } else {
            console.error(`Star container not found for ${playerKey}`);
        }
    });
}


// Example data structure for players
let players = {
    player1: {
        name: "Player 1",
        wins: 8,
        losses: 2,
        points: 0,
        rank: 0
    },
    player2: {
        name: "Player 2",
        wins: 4,
        losses: 6,
        points: 0,
        rank: 0
    }
};

// Call updateStarRating after every game

updateStarRating();


