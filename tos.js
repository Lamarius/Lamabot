/* 
  Terms of Service module for Lamabot
 */

const mongoose = require('mongoose');
const core = require('./core');
const User = require('./models/user');

const tosVersion = 1;
const tosEmbed = {
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
  accept: (userId, callback) => {
    getUser(userId, (error, doc) => {
      if (!!doc && doc.tosVersion === tosVersion) {
        return callback(core.mention(userId) + ", you have already accepted the terms of service.");
      } else {
        acceptTos(userId, (error) => {
          if (error) {
            throw error;
          } else {
            return callback("Thank you, " + core.mention(userId) + ", for accepting the terms of "
                            + "service. You may now use my features!");
          }
        });
      }
    });
  },
  view: () => {
    return tosEmbed;
  },
  getTosStatus: (userId, callback) => {
    getUser(userId, (error, doc) => {
      if (error) {
        throw error;
      } else {
        // TODO: Send different message for new users vs users who haven't accepted updated tos
        return callback(!!doc && doc.tosVersion === tosVersion);
      }
    });
  }
};

function getUser(userId, callback) {
  User.findOne( {uid: userId}, (error, doc) => {
    if (error) {
      return callback(error, null);
    } else {
      return callback(null, doc);
    }
  })
}

function acceptTos(userId, callback) {
  var query = { uid: userId };
  var update = { $set: { tosVersion: tosVersion }};
  var options = { upsert: true, new: true, setDefaultsOnInsert: true };

  User.findOneAndUpdate(query, update, options, (error, results) => {
    if (error) {
      return callback(error);
    } else {
      return callback(null);
    }
  });
}