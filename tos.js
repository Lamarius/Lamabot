/* 
  Terms of Service module for Lamabot
 */

const mongoose = require('mongoose');
const core = require('./core');
const Tos = require('./models/tos');
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
    getTosEntry(userId, (error, entry) => {
      if (!!entry && entry.tosVersion === tosVersion) {
        return callback(core.mention(userId) + ", you have already accepted the terms of service.");
      } else {
        acceptTos(userId, entry, (error, result) => {
          if (error) {
            throw error;
          } else {
            createUser(userId, (error, result) => {
              if (error) {
                throw error;
              } else {
                return callback("Thank you, " + core.mention(userId) + ", for accepting the terms "
                                + "of service. You may now use my features!");
              }
            });
          }
        });
      }
    });
  },
  view: () => {
    return tosEmbed;
  },
  getTosStatus: (userId, callback) => {
    getTosEntry(userId, (error, entry) => {
      if (error) {
        throw error;
      } else {
        // TODO: Send different message for new users vs users who haven't accepted updated tos
        return callback(!!entry && entry.tosVersion === tosVersion);
      }
    });
  }
};

function getTosEntry(userId, callback) {
  Tos.findOne( {uid: userId}, (error, entry) => {
    if (error) {
      return callback(error, null);
    } else {
      return callback(null, entry);
    }
  });
}

function acceptTos(userId, entry, callback) {
  if (!entry) {
    entry = new Tos();
    entry.uid = userId;
  }

  entry.tosVersion = tosVersion;
  entry.save((error, entry, numAffected) => {
    if (error) {
      return callback(error, null);
    } else {
      return callback(null, entry);
    }
  });
}

function createUser(userId, callback) {
  var user = new User({ uid: userId, games:[] });
  user.save((error, entry, numAffected) => {
    if (error) {
      return callback(error, null);
    } else {
      return callback(null, entry);
    }
  });
}