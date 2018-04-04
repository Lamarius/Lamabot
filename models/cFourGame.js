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
  currentTurn: { type: Number, default: -1 },
  board: { type: String, default: JSON.stringify(newBoard) }
});