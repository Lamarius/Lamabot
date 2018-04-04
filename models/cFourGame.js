var mongoose = require('mongoose');

module.exports = mongoose.model('CFourGame', {
  playerOneId: String,
  playerTwoId: String,
  board: Object,
  currentTurn: Number
});