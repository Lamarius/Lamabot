/* 
  Terms of Service module for Lamabot
 */

const core = require('./core.js');
const connectionInfo = require('./connectionInfo.js');

var connection = connectionInfo.connection();
var tosStatus = {}

var tos = {
  title:  "Lamabot Terms of Service",
  description: "By using this Lamabot, you agree to the following:",
  fields: [{
    name: "Logs",
    value: "Lamabot may log some of your information, including your public discord user ID, as "
           + "well as information provided as a result of using Lamabot's functions (i.e. the "
           + "result of a game of C4)."
  },
  {
    name: "Accepting the Terms",
    value: "You must accept the terms of service before you may use any of Lamabot's functions. To "
           + "accept, type ``!lbtos accept``."
  }]
};

module.exports = {
  accept: function(userId, callback) {
    var query = "INSERT INTO users (id, tos) VALUES (?, ?) ON DUPLICATE KEY UPDATE tos = ?"
    var values = [userId, true, true];
    connection.query(query, values, function(error, results) {
      if (error) {
        throw error;
        //return callback("Sorry " + core.mention(userId) + ", but I ran into some issues.");
      } else if (results.affectedRows === 0) {
        return callback(core.mention(userId) + ", you've already accepted the terms of service.");
      } else {
        tosStatus[userId] = true;
        return callback("Thank you, " + core.mention(userId) + ". You may now use the bot's functions.");
      }
    });
  },
  view: function() {
    return tos;
  },
  getTosStatus: function(userId, callback) {
    if (typeof tosStatus[userId] !== 'undefined') {
      return callback(tosStatus[userId]);
    } else {
      var query = "SELECT tos FROM users WHERE id = ?";
      connection.query(query, [userId], function (error, results) {
        if (error) {
          throw error;
        } else {
          tosStatus[userId] = (!!results[0].tos);
          return callback(results[0].tos);
        }
      });
    }
  }
}