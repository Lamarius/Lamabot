const mongoose = require('mongoose');
const newBoard = [
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0]
  ];

module.exports = mongoose.model('CFourGame', {
  playerOneId: String,
  playerTwoId: String,
  currentTurn: { type: Number, default: 0 },
  turnCount: { type: Number, default: 0 },
  board: { type: String, default: JSON.stringify(newBoard) }
});