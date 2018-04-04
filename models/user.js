const mongoose = require('mongoose');

module.exports = mongoose.model('User', {
  uid: { type: String, index: true },
  tosVersion: Number,
  games: { type: Array, default: [] }
  // games: [{
  //   type: String,
  //   serverId: String,
  //   currentGameId: { type: mongoose.Types.ObjectId, default: null },
  //   stats: {
  //     wins: { type: Number, default: 0 },
  //     losses: { type: Number, default: 0 },
  //     draws: { type: Number, default: 0 }
  //   }
  // }]
});