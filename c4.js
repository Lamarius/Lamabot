/* 
  Connect 4 module for Lamabot
 */

const core = require('./core');

const EMPTY = ':white_circle:';
const PLAYER_ONE = ':red_circle:';
const PLAYER_TWO = ':large_blue_circle:';

var mysql = require('mysql');
var connectionInfo = require('./connectionInfo.js')
var connection = mysql.createConnection({
  host: connectionInfo.host,
  user: connectionInfo.user,
  password: connectionInfo.password,
  database: connectionInfo.database,
  supportBigNumbers: connectionInfo.supportBigNumbers
});

var games = {};
var players = {};

module.exports = {
  challenge: function (playerOneId, playerTwoId, callback) {
    canChallenge(playerOneId, playerTwoId, function(error, result) {
      if (error) {
        throw error;
      } else {
        if (result === true) {
          createChallenge(playerOneId, playerTwoId, function(error, result) {
            if (error) {
              throw error;
            } else {
              var challengeId = result;
              setChallenge(playerOneId, playerTwoId, challengeId, function(error, result) {
                if (error) {
                  throw error;
                } else {
                  return callback(result);
                }
              })
            }
          });
        } else {
          return callback(null);
        }
      }
    });
  },

  acceptGame: function (playerId, callback) {
    getChallenge(playerId, function(error, challenge) {
      if (error) {
        throw error
      } else {
        if (challenge) {
          // Create a new game, set player challenges to null and set game to new game
          var playerOne;
          var playerTwo;
          if (Math.round(Math.random())) {
            playerOne = challenge.challenger;
            playerTwo = challenge.challenged;
          } else {
            playerOne = challenge.challenged;
            playerTwo = challenge.challenger;
          }
          createGame(playerOne, playerTwo, function(error, gameId) {
            if (error) {
              throw error;
            } else if (gameId) {
              setGame(playerOne, playerTwo, gameId, function(error, results) {
                if (error) {
                  throw error;
                } else {
                  removeChallenge(playerId, function(error) {
                    if (error) {
                      throw error;
                    }
                    return callback(playerOne);
                  });
                }
              });
            } else {
              // Shouldn't ever do this, but I'm protecting my butt in case we do
              return callback(null);
            }
          });
        } else {
          return callback(null);
        }
      }
    });
  },

  rejectGame: function (playerId, callback) {
    removeChallenge(playerId, function(error) {
      if (error) {
        throw error;
      }
      return callback(true);
    });
  },

  printBoard: function (playerId, callback) {
    getGameFromPlayerId(playerId, function(error, game) {
      if (error) {
        throw error;
      } else if (game) {
        return callback(parseBoard(game.player1, game.player2, JSON.parse(game.board)));
      } else {
        return callback(null);
      }
    });
  },

  placeToken: function (playerId, column, callback) {
    getGameFromPlayerId(playerId, function(error, game) {
      if (error) {
        throw error;
      } else if (game) {
        if ((game.player1 === playerId && game.currentTurn === 1) || (game.player2 === playerId && game.currentTurn === -1)) {
          var board = JSON.parse(game.board);
          var row = -1;
          for (i = 5; i >= 0; i--) {
            if (board[i][column] === 0) {
              row = i;
              break;
            }
          }
          if (row !== -1) {
            board[row][column] = game.currentTurn;
            game.board = JSON.stringify(board);
            game.currentTurn *= -1;
            game.turnCount++;
            updateGame(game, function(error, results) {
              if (error) {
                throw error;
              }
              if (isVictory(board, game.currentTurn * -1, row, column)) {
                // Victory fanfare
                removeGame(game.id, game.player1, game.player2, function(error, results) {
                  if (error) {
                    throw error;
                  }
                  return callback('victory', parseBoard(game.player1, game.player2, board));
                });
              } else if (game.turnCount >= 42) {
                // Alright, we'll cal it a draw
                removeGame(game.id, game.player1, game.player2, function(error, results) {
                  if (error) {
                    throw error;
                  }
                  return callback('draw', parseBoard(game.player1, game.player2, board));
                });
              } else {
                return callback(game.player1 === playerId ? game.player2 : game.player1, parseBoard(game.player1, game.player2, board));
              }
            });
          } else {
            return callback(null);
          }
        }
      } else {
        return callback(null);
      }
    });
  }
}

function parseBoard(playerOne, playerTwo, board) {
  var message = core.mention(playerOne) + " " + PLAYER_ONE + " vs " + core.mention(playerTwo) + " " + PLAYER_TWO;
  board.forEach(row => {
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

function canChallenge(playerOneId, playerTwoId, callback) {
  var sql = 'SELECT * FROM c4challenges WHERE challenger = ? OR challenged = ? OR challenger = ? OR challenged = ?';
  var values = [playerOneId, playerOneId, playerTwoId, playerTwoId];
  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    }
    callback(null, results.length === 0);
  });
}

function createChallenge(playerOneId, playerTwoId, callback) {
  var sql = 'INSERT INTO c4challenges SET ?';
  var values = {challenger: playerOneId, challenged: playerTwoId};
  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    }
    callback(null, results.insertId);
  });
}

function setChallenge(playerOneId, playerTwoId, challengeId, callback) {
  var sql = 'INSERT INTO c4users (id, wins, losses, ties, challengeId) VALUES ? ON DUPLICATE KEY UPDATE challengeId = ?';
  var values = [[[playerOneId, 0, 0, 0, challengeId], [playerTwoId, 0, 0, 0, challengeId]], challengeId];
  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    }
    callback(null, true);
  });
}

function getChallenge(playerId, callback) {
  var sql = 'SELECT * FROM c4challenges WHERE challenged = ?';
  var values = [playerId];
  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    }
    callback(null, results[0]);
  });
}

function removeChallenge(playerId, callback) {
  getChallenge(playerId, function(error, challenge) {
    if (error) {
      return callback(error, null);
    }
    var sql = 'DELETE FROM c4challenges WHERE id = ?';
    var values = [challenge.id];
    connection.query(sql, values, function(error, results) {
      if (error) {
        return callback(error, null);
      }

      sql = 'UPDATE c4users SET challengeId = ? WHERE challengeId = ?';
      values = [null, challenge.id];
      connection.query(sql, values, function(error, results) {
        if (error) {
          return callback(error, null);
        }
        callback(null, results);
      });
    });
  });
}

function createGame(playerOneId, playerTwoId, callback) {
  var newBoard = JSON.stringify([
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0]
  ]);
  var sql = 'INSERT INTO c4games (player1, player2, currentTurn, board, turnCount) VALUES (?, ?, ?, ?, ?)';
  var values = [playerOneId, playerTwoId, 1, newBoard, 0];

  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    }
    callback(null, results.insertId);
  });
}

function setGame(playerOneId, playerTwoId, gameId, callback) {
  var sql = 'UPDATE c4users SET challengeId = ?, gameId = ? WHERE id = ? OR id = ?';
  var values = [0, gameId, playerOneId, playerTwoId];

  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    }
    callback(null, results.changedRows);
  });
}

function getGame(gameId, callback) {
  var sql = 'SELECT * FROM c4games WHERE id = ?';
  var values = [gameId];

  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    }
    callback(null, results[0]);
  });
}

function getGameFromPlayerId(playerId, callback) {
  getGameId(playerId, function (error, gameId) {
    if (error) {
      return callback(error, null);
    } else if (gameId) {
      getGame(gameId, function(error, game) {
        if (error) {
          return callback(error, null);
        } else {
          return callback(null, game);
        }
      });
    } else {
      return callback(null, null);
    }
  });
}

function updateGame(game, callback) {
  var sql = 'UPDATE c4games SET currentTurn = ?, board = ?, turnCount = ? WHERE id = ?';
  var values = [game.currentTurn, game.board, game.turnCount, game.id];

  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    }
    callback(null, results);
  });
}

function getGameId(playerId, callback) {
  var sql = 'SELECT gameId FROM c4users WHERE id = ?';
  var values = [playerId];

  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    }
    callback(null, results[0].gameId);
  });
}

function removeGame(gameId, playerOne, playerTwo, callback) {
  // Should I actually delete the games? Might be useful to pull old games for some raisin
  var sql = 'UPDATE c4users SET gameId = ? WHERE id = ? OR id = ?';
  var values = [null, playerOne, playerTwo];

  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    }
    callback(null, results);
  });
}

function isVictory(board, currentTurn, row, column) {
  if (checkHorizontalVictory(board, currentTurn, row, column) || 
      checkVerticalVictory(board, row, column) ||
      checkForwardDiagonalVictory(board, currentTurn, row, column) || 
      checkBackwardDiagonalVictory(board, currentTurn, row, column)) {
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
  // Only need to check below this spot, since there are no tokens above it
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