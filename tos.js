/* 
  Terms of Service module for Lamabot
 */

const mongoose = require('mongoose');
const core = require('./core.js');
const connectionInfo = require('./connectionInfo.js');

var connection = connectionInfo.connection();
var tosSchema = mongoose.Schema({ uid: String, date: Date });
var Tos = mongoose.model('Tos', tosSchema);
var tosEmbed = {
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
    hasAcceptedTos(userId, function(error, accepted) {
      if (accepted) {
        return callback(core.mention(userId) + ", you have already accepted the terms of service.");
      } else {
        var userTos = new Tos({ uid: userId, date: new Date });
        userTos.save(function (err, userTos) {
          if (err) {
            throw error;
          } else {
            return callback(core.mention(userId) + " has accepted the tos");
          }
        });
      }
    });
    // var query = "INSERT INTO users (id, tos) VALUES (?, ?) ON DUPLICATE KEY UPDATE tos = ?"
    // var values = [userId, true, true];
    // connection.query(query, values, function(error, results) {
    //   if (error) {
    //     throw error;
    //     //return callback("Sorry " + core.mention(userId) + ", but I ran into some issues.");
    //   } else if (results.affectedRows === 0) {
    //     return callback(core.mention(userId) + ", you've already accepted the terms of service.");
    //   } else {
    //     tosStatus[userId] = true;
    //     return callback("Thank you, " + core.mention(userId) + ". You may now use the bot's functions.");
    //   }
    // });
  },
  view: function() {
    return tosEmbed;
  },
  getTosStatus: function(userId, callback) {
    hasAcceptedTos(userId, function(error, accepted) {
      if (error) {
        throw error;
      } else {
        console.log(accepted);
        return callback(accepted);
      }
    });
    // if (typeof tosStatus[userId] !== 'undefined') {
    //   return callback(tosStatus[userId]);
    // } else {
    //   var query = "SELECT tos FROM users WHERE id = ?";
    //   connection.query(query, [userId], function (error, results) {
    //     if (error) {
    //       throw error;
    //     } else {
    //       tosStatus[userId] = (!!results[0].tos);
    //       return callback(results[0].tos);
    //     }
    //   });
    // }
  }
}

function hasAcceptedTos(userId, callback) {
  Tos.findOne( {uid: userId }, function(error, userTos) {
    if (error) {
      throw error;
    } else {
      console.log(userTos);
      return callback(null, userTos ? true : false);
    }
  });
}