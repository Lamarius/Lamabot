/*
  A bot that allows users to do things
  Current applications are:
    Connect 4 (cFour.js)
 */

// Import the discord.js module and other modules
const Discord = require('discord.js');
const mongoose = require('mongoose');
const cFour = require('./cFour.js');
const tos = require('./tos.js');
const core = require('./core.js');
const config = require('./config.js');

// Create an intance of a Discord Client, and call it bot
var bot = core.bot;

// The token of your bot - https://discordapp.com/developers/applications/me
const token = config.token;

// The id of the bot admin
const admin = '177970052610392064';

// The location of where log files should go
const logFile = './logs/log.txt';

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted
bot.on('ready', () => {
  try {
    mongoose.connect(config.mongoUrl);
    var db = mongoose.connection;
    db.on('error', error => {if (error) throw error;});
    db.once('open', () => {console.log('Mongoose connected!');});
  } catch (error) {
    console.log(error);
  }

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
  var server = message.guild;

  try {
    if (canSendMessages(channel) && match && match.length > 2) {
      var params = match[3].split(' ');
      // ToS commands
      if (match[2] === 'tos') {
        if (params[0] === 'accept') {
          tos.accept(author.id, message => {
            sendMessage(channel, message);
          });
        } else if (params[0] === 'view') {
          sendMessage(channel, {embed: tos.view()});
        } else {
          sendMessage(channel, "I don't recognize any of those commands. Type ``!lbhelp tos`` for help.");
        }
      } else {
        tos.getTosStatus(author.id, hasAcceptedTos => {
          if (!hasAcceptedTos) {
            var message = "Before you may use any of Lamabot's functions, you must agree to the "
                        + "terms of service by typing ``!lbtos accept``."
            sendMessage(channel, message, {embed: tos.view()});
          } else {
            // Help commands
            if (match[2] === 'help') {
              displayHelpEmbed(channel, params[0]);

            // Connect 4 commands
            // TODO: Move logic out of this function and into the various c4 exports, have them all return strings
            } else if (match[2] === 'c4') {
              if (params[0] === 'accept') {
                // Accept a challenge and start a new game
                cFour.acceptChallenge(server.id, author.id, message => {
                  sendMessage(channel, message);
                });
              } else if (params[0] === 'board') {
                // Display the board the user is currently playing
                cFour.printBoard(server.id, author.id, message => {
                  sendMessage(channel, message);
                });
              } else if (params[0] === 'challenge') {
                // Challenge another user to connect 4
                if (mentions.length === 1) {
                  cFour.challenge(server.id, author.id, mentions[0].id, message => {
                    sendMessage(channel, message);
                  });
                } else if (mentions.length === 0) {
                  // Player didn't mention anyone in their challenge
                  sendMessage(channel, core.mention(author) + ", you need to ``@mention`` someone "
                              + "to challenge them");
                } else {
                  // Player mentioned 2 or more other users in there challenge
                  sendMessage(channel, core.mention(author) + ", please challenge only one person.");
                }
              } else if (params[0] === 'drop') {
                // Drop a token in the specified column
                if (params.length < 2) {
                  // No column specified
                  sendMessage(channel, "Please specify a column number between 1 and 7.");
                } else {
                  var column = parseInt(params[1] - 1)
                  if (column != NaN && column >= 0 && column < 7) {
                    cFour.placeToken(author.id, column, (result, board) => {
                      if (result) {
                        var message = [];
                        message.push(board);
                        if (result === 'victory') {
                          // The player won! Good for him/her
                          message.push(core.mention(author) + " wins!");
                        } else if (result === 'draw') {
                          // It's a draw
                          message.push("Alright, we'll call it a draw.");
                        } else {
                          // Game is still going
                          message.push(core.mention(result) + "'s turn.");
                        }
                        sendMessage(channel, message);
                      } else {
                        sendMessage(channel, core.mention(author) + ", it's not your turn, or you "
                                    + "specified a bad column.");
                      }
                    });
                  } else {
                    // The column specified is invalid, perhaps a number outside the range, perhaps NaN
                    sendMessage(channel, "Please specify a column number between 1 and 7 while it "
                                + "is your turn.");
                  } 
                }
              } else if (params[0] === 'reject') {
                cFour.rejectChallenge(server.id, author.id, message => {
                  sendMessage(channel, message);
                });
              } else if (params[0] === 'stats') {
                cFour.stats(author.id, message => { sendMessage(channel, message) });
              } 
            }
          }
        });
      }
    }
  } catch (error) {
    var fs = require('fs');
    var date = new Date();
    fs.appendFile(logFile, "(" + date.toLocaleString() + ") " + error.stack + '\n\n', err => {
      if (err) {
        return console.log(err);
      } else {
        console.log("(" + date.toLocaleString() + ") " + error);
        console.log("Wrote error to /logs/error.txt");
      }
    });
    sendMessage(channel, "I'm dying... *death gurgle*... Oh hey I was given another chance. "
                + "Anyways, " + core.mention(admin) + ", `" + error.name + "` happened. :(");
  }
});

function canSendMessages(channel) {
  var permissionOverwrites = channel.permissionOverwrites;
  var guild = channel.guild;
  var member = guild.member(bot.user.id);
  var roles = member.roles;
  // Check if channel specifically allows/denies the bot to send messages
  var roleOverwrite = permissionOverwrites.get(bot.user.id);
  if (roleOverwrite && roleOverwrite.type === 'member') {
    var allows = new Discord.Permissions(roleOverwrite.allow);
    var denies = new Discord.Permissions(roleOverwrite.deny);
    if (allows.has('SEND_MESSAGES')) return true;
    if (denies.has('SEND_MESSAGES')) return false;
  }

  // Check the bot's roles and the channel's role-based overwrites to see if it allows the bot to 
  // send messages
  if (roles) {
    var canSendMessages = false;
    var overwriteDenySendMessages = false;
    roles.forEach(role => {
      var roleOverwrite = permissionOverwrites.get(role.id);
      if (roleOverwrite && roleOverwrite.type === 'role') {
        var allows = new Discord.Permissions(roleOverwrite.allow);
        var denies = new Discord.Permissions(roleOverwrite.deny);
        // If an overwrite allows bot to send messages, then it can send messages regardless of 
        // other role-based permissions
        if (allows.has('SEND_MESSAGES')) return true;
        // If an overwrite denies bot to send messages, then it cannot send messages unless another 
        // role-based overwrite allows it to
        if (denies.has('SEND_MESSAGES')) overwriteDenySendMessages = true;
      } else {
        if (role.hasPermission('SEND_MESSAGES')) canSendMessages = true;
      }
    });

    return overwriteDenySendMessages ? false : canSendMessages;
  }
  // Should never reach this since the bot will always inherit permissions from the @everyone role
  return false;
}

function sendMessage(channel, content, options) {
  if (!content && !options) {
    console.log('Ignoring empty message.');
    return;
  }
  channel.send(content, options)
    .then(message => message.embeds.length > 0
          ? console.log(`Sent embedded message regarding ${message.embeds[0].title}`)
          : console.log(`Sent message: ${message.content}`));
}

function displayHelpEmbed(channel, helpTopic) {
  var embed = {}
  if (helpTopic && helpTopic !== "") {
    if (helpTopic === "c4") {
      embed.title = "Lamabot c4 help";
      embed.description = "Challenge a friend to a game of connect 4. Commands for c4 are as "
                        + "follows:";
      embed.fields = [{
        name: "accept",
        value: "Accept a challenge from another user. If you with to play with someone but have " 
               + "not been challenged yet, use ``challenge <mention>`` instead."
      },
      {
        name: "board",
        value: "Displays the board you are currently playing on."
      },
      {
        name: "challenge <mention>",
        value: "Challenge another player to a game of connect 4. You and your opponent must not "
               + "currently have a game active."
      },
      {
        name: "drop <integer (1 - 7)>",
        value: "Drop a piece down the selected column if it is your turn."
      },
      {
        name: "reject",
        value: "Reject or rescind a challenge. Useful if you don't want to play with that scrub."
      },
      {
        name: "stats",
        value: "Displays the wins, losses, and ties that you've achieved over the course of all "
               + "your games."
      }]  
    } else if (helpTopic === "tos") {
      embed.title = "Lamabot tos help";
      embed.description = "View or accept Lamabot's terms of service. Commands for tos are "
                        + "as follows:";
      embed.fields = [{
        name: "accept",
        value: "Accept the terms of service. Enables the use of other commands."
      },
      {
        name: "view",
        value: "View the terms of service."
      }]
    } else {
      embed.title = "Help topic not found";
      embed.description = "There is no help documentation for ``" + helpTopic + "``. Check your "
                        + "spelling, or make sure the command exists by typing ``!lbhelp``.";
    }
  } else {
    embed.title = "Lamabot general help";
    embed.description = "Lamabot is a bot that does things and stuff. You can learn more about a "
                      + "specific command by typing ``!lbhelp <command>``. Current commands are as "
                      + "follows:";
    embed.fields = [{
      name: "c4",
      value: "Challenge a friend to a game of connect 4."
    },
    {
      name: "tos",
      value: "View or accept Lamabot's terms of service."
    }]
  }
  sendMessage(channel, {embed: embed});
}

// log our bot in
console.log("Token: " + token);
console.log("dbconnstring: " + config.mongoUrl);
bot.login(token);