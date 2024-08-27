>Turn-based Chess-like Game with Websocket Communication
#HOW TO PLAY
this was a two player game motivated by online chess where you will drag and drop or move your coin to a valid  positon in the board.It will not allow you to keep the coins at invalid positions.Here it will indicate the positions to where a selected coin can move.

##FEATURES
-indication of current player's turn.
-Indications to valid positons of a selected coin
-Have the movement guide to show the moves of all the coins as a note to refer
-Able to see the moves of the coins in the Move History
- ranking system that tracks player performance across multiple games.
- chat feature for players to communicate during the game.
-The game ends when one player eliminates all of their opponent's characters and will reset the board
-winning player is announced
-Prevent selection or movement of opponent's pieces.
-Correct handling of piece elimination upon valid capture moves.

##USAGE
Install Dependencies (server)
cd server
npm install

#Run server
cd server
node index.js
#Run client
run index.html or open it in live server