/* 
  Connect 4 module for Lamabot
 */

const core = require('./core.js');
const connectionInfo = require('./connectionInfo.js');

const EMPTY = ':white_circle:';
const PLAYER_ONE = ':red_circle:';
const PLAYER_TWO = ':large_blue_circle:';

var connection = connectionInfo.connection();

module.exports = {
  challenge: function (playerOneId, playerTwoId, callback) {
    canChallenge(playerOneId, playerTwoId, function(error, isChallengeable) {
      if (error) {
        throw error;
      } else {
        if (isChallengeable) {
          createGame(playerOneId, playerTwoId, function(error, gameId) {
            if (error) {
              throw error;
            } else {
              setGame(playerOneId, playerTwoId, gameId, function(error, results) {
                if (error) {
                  throw error;
                } else {
                  return callback(true);
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

  acceptChallenge: function (playerId, callback) {
    getGameFromPlayerId(playerId, function(error, game) {
      if (error) {
        throw error;
      } else if (game) {
        if ((game.challenger === 1 && game.playerTwoId === playerId) || (game.challenger === 2 && game.playerOneId === playerId)) {
          acceptGame(game.id, function(error, results) {
            if (error) {
              throw error;
            } else {
              return callback(game.playerOneId, parseBoard(game.playerOneId, game.playerTwoId, JSON.parse(game.board)));
            }
          });
        } else {
          return callback(playerId === game.playerOneId ? game.playerTwoId : game.playerOneId, null);
        }
      } else {
        return callback(null);
      }
    });
  },

  rejectChallenge: function (playerId, callback) {
    getGameFromPlayerId(playerId, function(error, game) {
      if (error) {
        throw error;
      } else if (game) {
        removeGame(game.id, game.playerOneId, game.playerTwoId, function(error, results) {
          if (error) {
            throw error;
          } else {
            return callback(playerId === game.playerOneId ? game.playerTwoId : game.playerOneId);
          }
        });
      } else {
        return callback(null);
      }
    });
  },

  printboard: function (playerId, callback) {
    getGameFromPlayerId(playerId, function(error, game) {
      if (error) {
        throw error;
      } else if (game) {
        return callback(parseBoard(game.playerOneId, game.playerTwoId, JSON.parse(game.board)));
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
        if ((game.playerOneId === playerId && game.currentTurn === 1) || (game.playerTwoId === playerId && game.currentTurn === -1)) {
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
            var opponentId = game.playerOneId === playerId ? game.playerTwoId : game.playerOneId;
            updateGame(game, function(error, results) {
              if (error) {
                throw error;
              }
              if (isVictory(board, game.currentTurn * -1, row, column)) {
                // Victory fanfare
                removeGame(game.id, game.playerOneId, game.playerTwoId, function(error, results) {
                  if (error) {
                    throw error;
                  }
                  addWin(playerId, function(error, result) {
                    if (error) throw error;
                  });
                  addLoss(opponentId, function(error, result) {
                    if (error) throw error;
                  });
                  return callback('victory', parseBoard(game.playerOneId, game.playerTwoId, board));
                });
              } else if (game.turnCount >= 42) {
                // Alright, we'll cal it a draw
                removeGame(game.id, game.playerOneId, game.playerTwoId, function(error, results) {
                  if (error) {
                    throw error;
                  }
                  addTie(game.playerOneId, function(error, result) {
                    if (error) {
                      throw error;
                    }
                  });
                  addTie(game.playerTwoId, function(error, result) {
                    if (error) {
                      throw error;
                    }
                  });
                  return callback('draw', parseBoard(game.playerOneId, game.playerTwoId, board));
                });
              } else {
                return callback(opponentId, parseBoard(game.playerOneId, game.playerTwoId, board));
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

function parseBoard(playerOneId, playerTwoId, board) {
  var message = core.mention(playerOneId) + " " + PLAYER_ONE + " vs " + core.mention(playerTwoId) + " " + PLAYER_TWO;
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
  var sql = 'SELECT id FROM users WHERE (id = ? OR id = ?) AND c4gameId IS NOT NULL';
  var values = [playerOneId, playerTwoId];
  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    } else {
      return callback(null, results.length === 0);
    }
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
  var sql = 'INSERT INTO c4games (playerOneId, playerTwoId, challenger, currentTurn, board, turnCount) VALUES (?, ?, ?, ?, ?, ?)';
  var values = Math.round(Math.random()) ? [playerOneId, playerTwoId, 1, 1, newBoard, 0]
                                         : [playerTwoId, playerOneId, 2, 1, newBoard, 0];

  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    }
    callback(null, results.insertId);
  });
}

function setGame(playerOneId, playerTwoId, gameId, callback) {
  var sql = 'INSERT INTO users (id, c4gameId) VALUES ? ON DUPLICATE KEY UPDATE c4gameId = ?';
  var values = [[[playerOneId, gameId], [playerTwoId, gameId]], gameId];

  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    } else {
      return callback(null, results);
    }
  });
}

function acceptGame(gameId, callback) {
  var sql = 'UPDATE c4games SET challenger = ? WHERE id = ?';
  var values = [0, gameId];

  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    } else {
      return callback(null, results);
    }
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
  var sql = 'SELECT c4gameId FROM users WHERE id = ?';
  var values = [playerId];

  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    } else if (results.length > 0) {
      return callback(null, results[0].c4gameId)
    } else {
      return callback(null, null);
    }
  });
}

function removeGame(gameId, playerOneId, playerTwoId, callback) {
  // Should I actually delete the games? Might be useful to pull old games for some raisin
  var sql = 'UPDATE users SET c4gameId = ? WHERE id = ? OR id = ?';
  var values = [null, playerOneId, playerTwoId];

  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    } else {
      callback(null, results);
    }
  });
}

function getStatsId(playerId, callback) {
  var sql = 'SELECT c4statsId FROM users WHERE id = ?';
  var values = [playerId];

  connection.query(sql, values, function(error, results) {
    if (error) {
      return callback(error, null);
    } else {
      return callback(null, results[0].c4statsId);
    }
  });
}

function createStatsEntry(stats, callback) {
  var sql = 'INSERT INTO c4stats SET ?';

  connection.query(sql, stats, function(error, results) {
    if (error) {
      return callback(error, null);
    } else {
      return callback(null, results.insertId);
    }
  })
}

function updateStatsEntry(stats, callback) {
  getStatsId(stats.Playerid, function(error, statsId) {
    if (error) {
      return callback(error, null);
    } else if (statsId) {
      var sql = 'UPDATE c4stats SET Wins = Wins + ?, Losses = Losses + ?, Ties = Ties + ? WHERE id = ?';
      var values = [stats.Wins, stats.Losses, stats.Ties, stats.Playerid];

      connection.query(sql, values, function(error, results) {
        if (error) {
          return callback(error, null);
        } else {
          return callback(null, results);
        }
      });
    } else {
      createStatsEntry(stats, function(error, statsId) {
        if (error) {
          return callback(error, null);
        } else {
          var sql = 'UPDATE users SET c4statsId = ? WHERE id = ?';
          var values = [statsId, stats.playerid];

          connection.query(sql, values, function(error, results) {
            if (error) {
              return callback(error, null);
            } else {
              return callback(null, results);
            }
          });
        }
      });
    }
  });
}

function addWin(playerId, callback) {
  updateStatsEntry({Playerid: playerId, Wins: 1, Losses: 0, Ties: 0}, function(error, results) {
    if (error) {
      return callback(error, null);
    } else {
      return callback(null, results);
    }
  });
}

function addLoss(playerId, callback) {
  updateStatsEntry({Playerid: playerId, Wins: 0, Losses: 1, Ties: 0}, function(error, results) {
    if (error) {
      return callback(error, null);
    } else {
      return callback(null, results);
    }
  });
}

function addTie(playerId, callback) {
  updateStatsEntry({Playerid: playerId, Wins: 0, Losses: 0, Ties: 1}, function(error, results) {
    if (error) {
      return callback(error, null);
    } else {
      return callback(null, results);
    }
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