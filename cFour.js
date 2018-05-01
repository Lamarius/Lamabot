/* 
  Connect Four module for Lamabot
 */

const core = require('./core');
const config = require('./config');
const User = require('./models/user');
const CFourGame = require('./models/cFourGame');

const EMPTY = ':white_circle:';
const PLAYER_ONE = ':red_circle:';
const PLAYER_TWO = ':large_blue_circle:';
const GAME_TYPE = 'cFour';

module.exports = {
  challenge: (serverId, playerOneId, playerTwoId, callback) => {
    if (playerOneId === playerTwoId) {
      // Player tried to challenge themself
      return callback("I'm sorry " + core.mention(playerOneId) + ", but you can't challenge "
                      + "yourself");
    } else if (playerTwoId === core.bot.user.id) {
      // Player tried to challenge the bot
      return callback(core.mention(playerOneId) + ", you can't challenge me.");
    } else {
      canChallenge(serverId, playerOneId, playerTwoId, (error, isChallengeable) => {
        if (error) {
          throw error;
        } else if (!isChallengeable) {
          // Player is unable to challenge their opponent, probably due to the opponent already 
          // having an active game
          return callback("I'm sorry " + core.mention(playerOneId) + ", but you are unable to "
                          + "challenge " + core.mention(playerTwoId) + ". Maybe one of you already "
                          + "has a game active.")
        } else {
          // Drop the gauntlet and setup the challenge
          createGame(serverId, playerOneId, playerTwoId, error => {
            if (error) {
              throw error;
            } else {
              return callback(core.mention(playerTwoId) + ", you have been challenged to a game of "
                              + "connect 4! Type ``!lbc4 accept`` to accept their challenge. Either "
                              + "player may type ``!lbc4 reject`` to call off the challenge.");
            }
          });
        }
      });
    }
  },
  acceptChallenge: (serverId, playerId, callback) => {
    getCFourGame(serverId, playerId, (error, game) => {
      if (error) {
        throw error;
      } else if (game && game.playerTwoId === playerId && game.currentTurn === 0) {
        var board = parseBoard(game, true);
        game.currentTurn = 1 - 2 * Math.round(Math.random());
        game.save();
        var message = [
          core.mention(game.playerTwoId) + " has accepted the challenge!",
          core.mention(game.currentTurn ? game.playerTwoId : game.playerOneId) + " has the first turn.",
          board
        ];
        return callback(message);
      } else {
        return callback("I'm sorry " + core.mention(playerId) + ", but you have no challenges.");
      }
    });
  },
  rejectChallenge: (serverId, playerId, callback) => {
    getCFourGame(serverId, playerId, (error, game) => {
      if (error) {
        throw error;
      } else if (game && game.currentTurn === 0) {
        removeCFourGame(serverId, game, (error, playerIds) => {
          if (error) {
            throw error;
          } else {
            return callback("The game between " + core.mention(playerIds.playerOneId) + " and " 
                            + core.mention(playerIds.playerTwoId) + " has been called off.");
          }
        });
      } else {
        return callback("I'm sorry " + core.mention(playerId) + ", but you have no challenges.");
      }
    });
  },
  printBoard: (serverId, playerId, callback) => {
    getCFourGame(serverId, playerId, (error, game) => {
      if (error) {
        throw error;
      } else if (game) {
        return callback(parseBoard(game, true));
      } else {
        return callback(core.mention(playerId) + ", you have no active game.")
      }
    });
  },
  placeToken: (serverId, playerId, column, callback) => {
    getCFourGame(serverId, playerId, (error, game) => {
      if (error) {
        throw error;
      } else if (game) {
        if ((game.currentTurn === 1 && game.playerOneId === playerId) || (game.currentTurn === -1 && game.playerTwoId === playerId)) {
          var board = JSON.parse(game.board);
          if (board[0][column] === 0) {
            var row = -1;
            for (i = 5; i >=0; i--) {
              if (board[i][column] === 0) {
                row = i;
                break;
              }
            }

            board[row][column] = game.currentTurn;
            game.board = JSON.stringify(board);
            game.currentTurn *= -1;
            game.turnCount++;
            game.save();

            var message = [];
            if (isVictory(board, row, column)) {
              addWin(serverId, playerId);
              addLoss(serverId, game.currentTurn === 1 ? game.playerOneId : game.playerTwoId);
              removeCFourGame(serverId, game, (error, playerIds) => {
                if (error) {
                  throw error;
                } else {
                  message.push(parseBoard(game, false));
                  message.push(core.mention(playerId) + " has won!");
                  return callback(message);
                }
              });
            } else if (game.turnCount >= 42) {
              addDraw(serverId, game.playerOneId, game.playerTwoId);
              removeCFourGame(serverId, game, (error, playerIds) => {
                if (error) {
                  throw error;
                } else {
                  message.push(parseBoard(game, false));
                  message.push("The game is a draw.");
                  return callback(message);
                }
              });
            } else {
              message.push(parseBoard(game, true));
              return callback(message);
            }
          } else {
            // Column is full
            return callback(core.mention(playerId) + ", that column is full.");
          }
        }
      } else {
        return callback(core.mention(playerId) + ", you have no active game.");
      }
    });
  },
  stats: (serverId, playerId, callback) => {
    User.find( {uid: playerId, 'games.serverId': serverId, 'games.type': GAME_TYPE }, {'games.$': 1}, (error, docs) => {
      if (error) {
        throw error;
      } else if (docs && docs[0] && docs[0].games && docs[0].games[0] && docs[0].games[0].stats) {
        var stats = docs[0].games[0].stats;
        return callback(core.mention(playerId) + ", your connect 4 stats are: ``Wins: " + stats.wins 
                        + ", Losses: " + stats.losses + ", Draws: " + stats.draws + "``");
      } else {
        return callback("You have not played a game of connect 4 yet.");
      }
    });
  }
};

function canChallenge(serverId, playerOneId, playerTwoId, callback) {
  User.find({ uid: { $in: [playerOneId, playerTwoId] } }, (error, docs) => {
    if (error) {
      return (error, null);
    } else if (docs.length === 0) {
      return callback(null, false);
    } else {
      var isChallengeable = true;
      docs.some(doc => {
        if (doc.games) {
          doc.games.forEach(game => {
            if (game.type === GAME_TYPE && game.serverId === serverId && game.currentGameId !== null) {
              isChallengeable = false;
              return true;
            }
          });
        }
      });
      return callback(null, isChallengeable);
    }
  });
}

function createGame(serverId, playerOneId, playerTwoId, callback) {
  var cFourGame = new CFourGame({ playerOneId: playerOneId, playerTwoId: playerTwoId });
  cFourGame.save((error, game) => {
    if (error) {
      return callback(error)
    } else {
      var query = { 
        uid: { $in: [playerOneId, playerTwoId] }, 
        $and: [{ 'games.type': {$ne: GAME_TYPE } }, { 'games.serverId': {$ne: serverId } }]
      };
      var update = { 
        $addToSet: { 
          games: { type: GAME_TYPE, serverId: serverId, stats: { wins: 0, losses: 0, draws: 0 } }
        }
      };
      User.update(query, update, error => {
        if (error) {
          return callback(error);
        } else {
          var query = { 
            uid: { $in: [playerOneId, playerTwoId]}, 
            'games.type': GAME_TYPE, 'games.serverId': serverId 
          };
          var update = { $set : {'games.$.currentGameId': game._id} }
          User.update(query, update, error => {
            if (error) {
              return callback(error);
            } else {
              return callback(null);
            }
          })
        }
      });
    }
  });
}

function parseBoard(game, showCurrentTurn) {
  var message = core.mention(game.playerOneId) + " " + PLAYER_ONE + " vs " 
              + core.mention(game.playerTwoId) + " " + PLAYER_TWO;
  if (showCurrentTurn && game.currentTurn === 1) {
    message = message.concat("\nIt is " + PLAYER_ONE + "'s turn.");
  } else if (showCurrentTurn && game.currentTurn === -1) {
    message = message.concat("\nIt is " + PLAYER_TWO + "'s turn.");
  }

  JSON.parse(game.board).forEach(row => {
    message = message.concat("\n");
    row.forEach(space => {
      if (space === 0) {
        message = message.concat(EMPTY);
      } else if (space === 1) {
        message = message.concat(PLAYER_ONE);
      } else {
        message = message.concat(PLAYER_TWO);
      }
    });
  });
  message = message.concat("\n:one::two::three::four::five::six::seven:");
  return message;
}

function getCFourGame(serverId, playerId, callback) {
  var query = { uid: playerId, $and: [{ 'games.type': GAME_TYPE }, { 'games.serverId': serverId }]};
  User.findOne(query, (error, user) => {
    if (error) {
      return callback(error, null);
    } else {
      if (user) {
        user.games.some(game => {
          if (game.type === GAME_TYPE && game.serverId === serverId) {
            CFourGame.findOne({ _id: game.currentGameId }, (error, game) => {
              if (error) {
                return callback(error, null);
              } else {
                return callback(null, game);
              }
            });
          }
        });
      } else {
        return callback(null, null);
      }
    }
  });
}

function removeCFourGame(serverId, game, callback) {
  var query = { 
    uid: { $in: [game.playerOneId, game.playerTwoId] }, 
    'games.type': GAME_TYPE, 'games.serverId': serverId 
  };
  var update = { $set: { 'games.$.currentGameId': null } };
  User.update(query, update, error => {
    if (error) {
      return callback(error, null);
    } else {
      game.remove(error => {
        if (error) {
          return callback(error, null);
        } else {
          return callback(null, { playerOneId: game.playerOneId, playerTwoId: game.playerTwoId });
        }
      });
    }
  });
}

function addWin(serverId, playerId) {
  var query = { uid: playerId, 'games.type': GAME_TYPE, 'games.serverId': serverId };
  var update = { $inc: { 'games.$.stats.wins': 1 } };
  User.update(query, update, error => {
    if (error) {
      throw error;
    }
  });
}

function addLoss(serverId, playerId, callback) {
  var query = { uid: playerId, 'games.type': GAME_TYPE, 'games.serverId': serverId };
  var update = { $inc: { 'games.$.stats.losses': 1 } };
  User.update(query, update, error => {
    if (error) {
      throw error;
    }
  });
}

function addDraw(serverId, playerOneId, playerTwoId, callback) {
  var query = { 
    uid: { $in: [playerOneId, playerTwoId] }, 'games.type': GAME_TYPE, 'games.serverId': serverId 
  };
  var update = { $inc: { 'games.$.stats.draws': 1 } };
  User.update(query, update, error => {
    if (error) {
      throw error;
    }
  });
}

function isVictory(board, row, column) {
  var currentTurn = board[row][column];
  if (checkHorizontalVictory(board, currentTurn, row, column) 
      || checkVerticalVictory(board, row, column) 
      || checkForwardDiagonalVictory(board, currentTurn, row, column) 
      || checkBackwardDiagonalVictory(board, currentTurn, row, column)) {

    return true;
  }

  return false;
}

// TODO: Merge some of these checkVictory functions together
// -
function checkHorizontalVictory(board, currentTurn, row, column) {
  var score = currentTurn;
  score += tallyHorizontalLeft(board, currentTurn, row, column) 
        + tallyHorizontalRight(board, currentTurn, row, column);
  if (Math.abs(score) >= 4) {
    console.log("Victory: Horizontal");
    return true;
  }

  return false;
}

function tallyHorizontalLeft(board, currentTurn, row, column) {
  if (column > 0 && board[row][column - 1] === currentTurn) {
    return currentTurn + tallyHorizontalLeft(board, currentTurn, row, column - 1);
  }

  return 0
}

function tallyHorizontalRight(board, currentTurn, row, column) {
  if (column < 6 && board[row][column + 1] === currentTurn) {
    return currentTurn + tallyHorizontalRight(board, currentTurn, row, column + 1);
  }

  return 0;
}

// |
function checkVerticalVictory(board, row, column) {
  // Only need to look downwards, since tokens always land on the top of the stack
  if (row < 3 && Math.abs(board[row][column] + board[row + 1][column] +
                          board[row + 2][column] + board[row + 3][column]) === 4) {
    console.log("Victory: Vertical");
    return true;
  }
  
  return false;
}

// /
function checkForwardDiagonalVictory(board, currentTurn, row, column) {
  var score = currentTurn;
  score += tallyForwardDiagonalLeft(board, currentTurn, row, column) 
        + tallyForwardDiagonalRight(board, currentTurn, row, column);

  if (Math.abs(score) >= 4) {
    console.log("Victory: Forward Diagonal");
    return true;
  }

  return false;
}

function tallyForwardDiagonalLeft(board, currentTurn, row, column) {
  if (column > 0 && row < 5 && board[row + 1][column - 1] === currentTurn) {
    return currentTurn + tallyForwardDiagonalLeft(board, currentTurn, row + 1, column - 1);
  }

  return 0;
}

function tallyForwardDiagonalRight(board, currentTurn, row, column) {
  if (column < 6 && row > 0 && board[row - 1][column + 1] === currentTurn) {
    return currentTurn + tallyForwardDiagonalRight(board, currentTurn, row - 1, column + 1);
  }

  return 0;
}

// \
function checkBackwardDiagonalVictory(board, currentTurn, row, column) {
  var score = currentTurn;
  score += tallyBackwardDiagonalLeft(board, currentTurn, row, column) 
        + tallyBackwardDiagonalRight(board, currentTurn, row, column);

  if (Math.abs(score) >= 4) {
    console.log("Victory: Backward Diagonal");
    return true;
  }

  return false;
}

function tallyBackwardDiagonalLeft(board, currentTurn, row, column) {
  if (column > 0 && row > 0 && board[row - 1][column - 1] === currentTurn) {
    return currentTurn + tallyBackwardDiagonalLeft(board, currentTurn, row - 1, column - 1);
  }

  return 0;
}

function tallyBackwardDiagonalRight(board, currentTurn, row, column) {
  if (column < 6 && row < 5 && board[row + 1][column + 1] === currentTurn) {
    return currentTurn + tallyBackwardDiagonalRight(board, currentTurn, row + 1, column + 1);
  }

  return 0;
}