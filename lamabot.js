/*
  A bot that allows users to do things
  Current applications are:
    Connect 4 (c4.js)
 */

// Import the discord.js module and other modules
const Discord = require('discord.js');
const c4 = require('./c4.js');

// Create an intance of a Discord Client, and call it bot
const bot = new Discord.Client();

// The token of your bot - https://discordapp.com/developers/applications/me
const token = 'MzA1MTI2NTA2OTYxODI5ODg4.C9wqyw.gIj968LkCCqVsZdbpvbf-qngz3s';

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted.
bot.on('ready', () => {
  console.log('Lamabot reporting for duty!');
  bot.user.setGame('!lbhelp');
});

// Create an event listener for messages
bot.on('message', message => {
  var rgx = /^(!lb)(\S*)\s*(.*)/g;
  var match = rgx.exec(message.content);
  var channel = message.channel;
  var mentions = message.mentions.users.array();
  var author = message.author;

  if (match && match.length > 2) {
    var params = match[3].split(' ');
    // Help commands
    if (match[2] === 'help') {
      displayHelpEmbed(channel, params[0]);

    // Connect 4 commands
    // TODO: Move all this stuff out and place inside a function
    } else if (match[2] === 'c4') {
      if (params[0] === 'board') {
        // Display the board the user is currently playing
        sendMessage(channel, c4.printBoard(author));
      } else if (params[0] === 'challenge') {
        // Challenge another user to connect 4
        if (mentions.length > 0) {
          if (mentions.length === 1) {
            if (mentions[0] != author) {
              var player = c4.initiateGame(author, mentions[0]);
              if (player !== null) {
                var message = [];
                message.push(mention(author) + " has thrown down the gauntlet. " 
                             + mention(mentions[0]) + ", you have been challenged!");
                message.push(mention(player) + " has the first turn.");
                message.push(c4.printBoard(player));
                sendMessage(channel, message);
              } else {
                // At least one of the players is currently in a game, though I suppose something
                // else could be wrong
                sendMessage(channel, "I'm sorry, but both players must not be currently in a game.");
              }
            } else {
              // Player tried to challenge himself/herself
              sendMessage(channel, mention(author) + ", you can't challenge yourself you goof.");
            }
          } else {
            // Player tried to challenge 2 or more other players
            sendMessage(channel, mention(author) + ", challenge only one person, please.");
          }
        } else {
          // Player didn't mention anyone in their challenge
          sendMessage(channel, mention(author) + ", you gotta challenge someone you dingus (use an @mention).");
        }
      } else if (params[0] === 'drop') {
        // Drop a token in the specified column
        if (params.length < 2) {
          // No column specified
          sendMessage(channel, "Please specify a column number between 1 and 7.");
        } else {
          var column = parseInt(params[1] - 1)
          if (column != NaN && column >= 0 && column < 7) {
            var row = c4.placeToken(author, column);
            if (row === false) {
              // Specified column is filled, or perhaps something else went wrong
              sendMessage(channel, "Invalid placement. Column is probably filled.");
            } else {
              var message = [];
              message.push(c4.printBoard(author));
              if (c4.checkVictory(author, row, column)) {
                // The player won! Good for him/her
                message.push(mention(author) + " wins!");
                c4.removeGame(author);
              } else if (c4.getMoveCount(author) === 42) {
                // All spots have been filled up and nobody won, which is ridiculous
                message.push("Alright, we'll call it a draw.");
                c4.removeGame(author);
              } else {
                // No one won, and spots are still open to play, so just swap the active player
                c4.swapPlayer(author);
              }
              sendMessage(channel, message);
            } 
          } else {
            // The column specified is invalid, perhaps a number outside the range, perhaps NaN
            sendMessage(channel, "Please specify a column number between 1 and 7 while it is your turn.");
          } 
        }
      }
    }
  }
});

function sendMessage(channel, content, options) {
  channel.send(content, options)
    .then(message => message.embeds.length > 0
          ? console.log(`Sent embedded message regarding ${message.embeds[0].title}`)
          : console.log(`Sent message: ${message.content}`))
    .catch(console.error);
}

function mention(user) {
  return "<@" + user.id + ">";
}

function displayHelpEmbed(channel, helpTopic) {
  var embed = {}
  if (helpTopic && helpTopic !== "") {
    if (helpTopic === "c4") {
      embed.title = "Lamabot c4 help";
      embed.description = "Challenge a friend to a game of connect 4! Commands for c4 are as follows:";
      embed.fields = [{
        name: "board",
        value: "Displays the board you are currently playing on."
      },
      {
        name: "challenge *<mention>*",
        value: "Challenge another player to a game of connect 4. You and your opponent must not currently have a game active."
      },
      {
        name: "drop *<integer (1 - 7)>*",
        value: "Drop a piece down the selected column if it is your turn."
      }]
    } else {
      embed.title = "Help topic not found";
      embed.description = "There is no help documentation for *" + helpTopic + "*. Check your "
                        + "spelling, or make sure the command exists by typing *!lbhelp*.";
    }
  } else {
    embed.title = "Lamabot general help";
    embed.description = "Lamabot is a bot that does things and stuff. You can learn more about a "
                      + "specific command by typing *!lbhelp <command>*. Current commands are as "
                      + "follows:";
    embed.fields = [{
      name: "c4",
      value: "Play connect 4."
    }]
  }
  sendMessage(channel, {embed: embed});
  //return embed
}

// log our bot in
bot.login(token);