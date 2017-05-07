/*
  A bot that allows users to do things. Those things include playing connect 4
 */

// import the discord.js module and other modules
const Discord = require('discord.js');
const c4 = require('./c4.js');

// create an intance of a Discord Client, and call it bot
const bot = new Discord.Client();

// the token of your bot - https://discordapp.com/developers/applications/me
const token = 'MzA1MTI2NTA2OTYxODI5ODg4.C9wqyw.gIj968LkCCqVsZdbpvbf-qngz3s';

// the ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted.
bot.on('ready', () => {
  console.log('Lamabot reporting for duty!');
  bot.user.setGame('!lbhelp');
});

// create an event listener for messages
bot.on('message', message => {
  console.log(message.author);
  var rgx = /^(!lb)(\S*)\s*(.*)/g;
  var match = rgx.exec(message.content);
  if (match && match.length > 2) {
    var params = match[3].split(' ');
    // Help
    if (match[2] === 'help') {
      if (params[0] === 'c4') {
        message.channel.sendMessage("You can play connect 4 eventually.");
      } else {
        message.channel.sendMessage("Current commands are: c4");
      }
    // Connect 4
    } else if (match[2] === 'c4') {
      if (params[0] === 'board') {
        // Display the board the user is currently playing
        message.channel.sendMessage(c4.printBoard(message.author));
      } else if (params[0] === 'challenge') {
        // Challenge another user to connect 4
        if (message.mentions.users.array().length > 0) {
          if (message.mentions.users.array().length === 1) {
            if (message.mentions.users.array()[0] != message.author) {
              message.channel.sendMessage(mention(message.author) + 
                                          " has thrown down the gauntlet. " + 
                                          mention(message.mentions.users.array()[0]) + 
                                          ", you have been challenged!");
              var player = c4.initiateGame(message.author, message.mentions.users.array()[0]);
              if (player !== null) {
                message.channel.sendMessage(mention(player) + ", you go first.");
                message.channel.sendMessage(c4.printBoard(message.author));
              } else {
                message.channel.sendMessage("I'm sorry, but both players must not currently be in a game.");
              }
            } else {
              message.channel.sendMessage(mention(message.author) + 
                                          ", you can't challenge yourself you goof.");
            }
          } else {
            message.channel.sendMessage(mention(message.author) +
                                        ", challenge only one person, please.");
          }
        } else {
          message.channel.sendMessage(mention(message.author) +
                                      ", you gotta challenge someone you dingus (use an @mention).");
        }
      } else if (params[0] === 'drop') {
        // Drop a token in the specified column
        if (params.length < 2) {
          // No column specified
          message.channel.sendMessage("Please specify a column number between 1 and 7.");
        } else {
          var column = parseInt(params[1] - 1)
          if (column != NaN && column >= 0 && column < 7) {
            var row = c4.placeToken(message.author, column);
            if (row === false) {
              // Specified column is filled, or perhaps something else went wrong
              message.channel.sendMessage("Invalid placement. Column is probably filled.");
            } else {
              message.channel.sendMessage(c4.printBoard(message.author));
              if (c4.checkVictory(message.author, row, column)) {
                // The player won! Good for him/her
                message.channel.sendMessage(mention(message.author) + " wins!");
                c4.removeGame(message.author);
              } else if (c4.getMoveCount() === 42) {
                // All spots have been filled up and nobody won, which is ridiculous
                message.channel.sendMessage("Alright, we'll call it a draw.");
                c4.removeGame(message.author);
              } else {
                // No one won, and spots are still open to play, so just swap the active player
                c4.swapPlayer(message.author);
              }
            } 
          } else {
            // The column specified is invalid, perhaps a number outside the range, perhaps NaN
            message.channel.sendMessage("Please specify a column number between 1 and 7.");
          } 
        }
      }
    }
  }
});

function mention(user) {
  return "<@" + user.id + ">";
}

// log our bot in
bot.login(token);