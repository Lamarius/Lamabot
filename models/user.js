const mongoose = require('mongoose');

module.exports = mongoose.model('User', {
  uid: { type: String, index: true },
  tosVersion: Number,
  games: { type: Array, default: [] }
});