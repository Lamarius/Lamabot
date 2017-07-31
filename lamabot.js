/*
  A bot that allows users to do things
  Current applications are:
    Connect 4 (c4.js)
 */

// Import the discord.js module and other modules
const Discord = require('discord.js');
const c4 = require('./c4.js');
const core = require('./core.js');
const connectionInfo = require('./connectionInfo.js');

// Create an intance of a Discord Client, and call it bot
const bot = new Discord.Client();

// The token of your bot - https://discordapp.com/developers/applications/me
const token = connectionInfo.token;

// The id of the bot admin
const admin = '177970052610392064';

// The location of where log files should go
const logFile = './logs/log.txt';

// Database connection
var connection = connectionInfo.connection();

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted
bot.on('ready', () => {
  console.log('Lamabot reporting for duty!');
  bot.user.setGame('!lbhelp');

  // Create/Update database tables
  updateTables();
});

// Create an event listener for messages
bot.on('message', message => {
  var rgx = /^(!lb)(\S*)\s*(.*)/g;
  var match = rgx.exec(message.content);
  var channel = message.channel;
  var mentions = message.mentions.users.array();
  var author = message.author;

  try {
    if (canSendMessages(channel) && match && match.length > 2) {
      var params = match[3].split(' ');
      // Help commands
      if (match[2] === 'help') {
        displayHelpEmbed(channel, params[0]);

      // Connect 4 commands
      // TODO: Move all this stuff out and place inside a function
      } else if (match[2] === 'c4') {
        if (params[0] === 'accept') {
          // Accept a challenge and start a new game
          c4.acceptChallenge(author.id, function(playerOne, board) {
            if (board) {
              var message = [
                core.mention(author) + " has accepted the challenge!",
                core.mention(playerOne) + " has the first turn.",
                board
              ];
              sendMessage(channel, message);
            } else if (playerOne) {
              sendMessage(channel, "I'm sorry " + core.mention(author) + ", but " + core.mention(playerOne) + " has to be the one to accept your challenge.")
            } else {
              sendMessage(channel, "I'm sorry " + core.mention(author) + ", but it looks like you have no challenges.");
            }
          });
        } else if (params[0] === 'board') {
          // Display the board the user is currently playing
          c4.printBoard(author.id, function(board) {
            if (board) {
              sendMessage(channel, board);
            } else {
              sendMessage(channel, core.mention(author) + ", you have no game.");
            }
          });
        } else if (params[0] === 'challenge') {
          // Challenge another user to connect 4
          if (mentions.length > 0) {
            if (mentions.length === 1) {
              if (mentions[0] != author) {
                if (mentions[0] != bot.user) {
                  c4.challenge(author.id, mentions[0].id, function(result) {
                    if (result) {
                      sendMessage(channel, core.mention(mentions[0]) + ", you have been challenged by "
                                + core.mention(author) + ". Type ``!lbc4 accept`` to accept this challenge,"
                                + " or ``!lbc4 reject`` to reject it.");
                    } else {
                      // At least one of the players is currently in a game, though I suppose something
                      // else could be wrong
                      sendMessage(channel, "I'm sorry, neither player can have an active game or challenge.");
                    }
                  });
                } else {
                  // Player tried to challenge the bot
                  sendMessage(channel, core.mention(author) + ", you can't challenge me.");
                }
              } else {
                // Player tried to challenge himself/herself
                sendMessage(channel, core.mention(author) + ", you can't challenge yourself you goof.");
              }
            } else {
              // Player tried to challenge 2 or more other players
              sendMessage(channel, core.mention(author) + ", challenge only one person, please.");
            }
          } else {
            // Player didn't mention anyone in their challenge
            sendMessage(channel, core.mention(author) + ", you gotta challenge someone you dingus (use an @mention).");
          }
        } else if (params[0] === 'drop') {
          // Drop a token in the specified column
          if (params.length < 2) {
            // No column specified
            sendMessage(channel, "Please specify a column number between 1 and 7.");
          } else {
            var column = parseInt(params[1] - 1)
            if (column != NaN && column >= 0 && column < 7) {
              c4.placeToken(author.id, column, function(result, board) {
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
                  sendMessage(channel, core.mention(author) + ", it's not your turn, or you specified a bad column.");
                }
              });
            } else {
              // The column specified is invalid, perhaps a number outside the range, perhaps NaN
              sendMessage(channel, "Please specify a column number between 1 and 7 while it is your turn.");
            } 
          }
        } else if (params[0] === 'reject') {
          c4.rejectChallenge(author.id, function(opponent) {
            if (opponent) {
              sendMessage(channel, "The challenge between " + core.mention(author) + " and " + core.mention(opponent) + " has been rescinded.");
            } else {
              sendMessage(channel, core.mention(author) + ", you have no challenge to reject.");
            }
          });          
        }

      // TODO: Remove these commands
      // Test commands
      } else if (match[2] === 'die') {
        // Throw an error to test error handling
        if (author.id === admin) {
          throw new Error("I'm testing the bot's error handling.");
        } else {
          sendMessage(channel, "What gives you the right to end my life? (Sorry but only the admin" 
                      + " can use this command.");
        }  
      }
    }
  } catch (error) {
    var fs = require('fs');
    fs.appendFile(logFile, error.stack + '\n', function (err) {
      if (err) {
        return console.log(err);
      } else {
        console.log(error);
        console.log("Wrote error to /logs/error.txt");
      }
    });
    sendMessage(channel, "I'm dying... *death gurgle*... Oh hey I was given another chance. Anyways, "
                + core.mention(admin) + ", `" + error.name + "` happened. :(");
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

  // Check the bot's roles and the channel's role-based overwrites to see if it allows the bot to send messages
  if (roles) {
    var canSendMessages = false;
    var overwriteDenySendMessages = false;
    roles.forEach(function (role) {
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
  // Wow, nothing? For real? Well, I think that means it can't send messages
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
      embed.description = "Challenge a friend to a game of connect 4! Commands for c4 are as follows:";
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
      value: "Play connect 4."
    }]
  }
  sendMessage(channel, {embed: embed});
}

function updateRoles(guildMember) {
  sortedRoles[guildMember.guild.id] = Object.keys(guildMember.roles).sort(function (a, b) { 
    console.log(a);
    return guildMember.roles.get(a).position - guildMember.roles.get(b).position 
  });
  console.log('Sorted roles for guild:', guildMember.guild.id);
}

// TODO: Better error handling
function updateTables() {
  connection.query("CREATE TABLE IF NOT EXISTS users (id BIGINT(20) UNSIGNED NOT NULL PRIMARY KEY, " +
                   "c4gameId INT, c4statsId INT)", function(error, results) {
    if (error) {
      throw error;
    }
  });
  connection.query("CREATE TABLE IF NOT EXISTS c4games (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, " +
                   "playerOneId BIGINT(20) UNSIGNED, playerTwoId BIGINT(20) UNSIGNED, challenger TINYINT(1), " + 
                   "currentTurn TINYINT(1), board VARCHAR(139), turnCount TINYINT)", function(error, results) {
    if (error) {
      throw error;
    }
  });
  connection.query("CREATE TABLE IF NOT EXISTS c4stats (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, " +
                   "playerId BIGINT(20) UNSIGNED, wins INT, losses INT, ties INT)", function(error, results) {
    if (error) {
      throw error;
    }
  });
}

// log our bot in
bot.login(token);