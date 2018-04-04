var mongoose = require('mongoose');

module.exports = mongoose.model('User', {
  uid: { type: String, index: true },
  games: [{
    type: String,
    serverId: String,
    currentGame: { type: mongoose.Types.ObjectId, default: null },
    stats: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 }
    }
  }]
});