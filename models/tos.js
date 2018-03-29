var mongoose = require('mongoose');

module.exports = mongoose.model('Tos', {
  uid: { type: String, index: true },
  tosVersion: Number
})