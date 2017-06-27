/* 
  Connect 4 module for Lamabot
 */

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
                  console.log(result);
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
    hasChallenge(playerId, function(error, challenge) {
      if (error) {
        throw error
      } else {
        if (challenge) {
          console.log(challenge);
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
                  console.log(playerOne);
                  return callback(playerOne);
                }
              })
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

  rejectGame: function (player) {
    if (players[player.id].challenge && !players[player.id].currentGame) {
      var opponent = players[player.id].challenge.opponent;
      players[player.id].challenge = null;
      players[opponent].challenge = null;
      return opponent;
    }
    return null;
  },

  printBoard: function (playerId, callback) {
    getGame(playerId, function(error, game) {
      if (error) {
        throw error;
      } else {
        if (game) {
          var boardMessage = mention(game.player1) + " " + PLAYER_ONE + " vs " + mention(game.player2) + " " + PLAYER_TWO;
          var parsedBoard = JSON.parse(game.board);
          console.log(parsedBoard);
          parsedBoard.forEach(row => {
            console.log('hi');
            boardMessage = boardMessage.concat("\n");
            row.forEach(space => {
              if (space === 0) {
                boardMessage = boardMessage.concat(EMPTY);
              } else if (space === 1) {
                boardMessage = boardMessage.concat(PLAYER_ONE);
              } else {
                boardMessage = boardMessage.concat(PLAYER_TWO);
              }
            });
          });
          boardMessage = boardMessage.concat("\n:one::two::three::four::five::six::seven:");
          console.log(boardMessage);
          return callback(boardMessage);
        } else {
          return callback(null);
        }
      }
    });
  },

  placeToken: function (player, column) {
    if (isPlayerTurn(player.id)) {
      var game = games[players[player.id].currentGame];
      var board = game.board;
      for (i = 5; i >= 0; i--) {
        if (board[i][column] === 0) {
          board[i][column] = game.currentTurn;
          return i;
        }
      }
    }
    return null;
  },

  checkVictory: function (player, row, column) {
    var gameId = players[player.id].currentGame;
    if (checkHorizontalVictory(gameId, row, column) || 
        checkVerticalVictory(gameId, row, column) ||
        checkForwardDiagonalVictory(gameId, row, column) || 
        checkBackwardDiagonalVictory(gameId, row, column)) {
      return true;
    }
    return false;
  },

  checkDraw: function (player) {
    return games[players[player.id].currentGame].moves >= 42;
  },

  swapPlayer: function (player) {
    games[players[player.id].currentGame].currentTurn *= -1;
  },

  removeGame: function (player) {
    var opponent = players[player.id].challenge.opponent;
    delete games[players[player.id].currentGame];
    delete players[player.id].currentGame;
    delete players[player.id].challenge;
    delete players[opponent].currentGame;
    delete players[opponent].challenge;
  }
}

function canChallenge(playerOneId, playerTwoId, callback) {
  var sql = 'SELECT * FROM c4challenges WHERE challenger = ? OR challenged = ? OR challenger = ? OR challenged = ?';
  var values = [playerOneId, playerOneId, playerTwoId, playerTwoId];
  connection.query(sql, values, function(error, results) {
    if (error) {
      callback(error, null);
    } else {
      callback(null, results.length === 0);
    }
  });
}

function createChallenge(playerOneId, playerTwoId, callback) {
  var sql = 'INSERT INTO c4challenges SET ?';
  var values = {challenger: playerOneId, challenged: playerTwoId};
  connection.query(sql, values, function(error, results) {
    if (error) {
      callback(error, null);
    } else {
      callback(null, results.insertId);
    }
  });
}

function setChallenge(playerOneId, playerTwoId, challengeId, callback) {
  var sql = 'INSERT INTO c4users (id, wins, losses, ties, challengeId) VALUES ? ON DUPLICATE KEY UPDATE challengeId = ?';
  var values = [[[playerOneId, 0, 0, 0, challengeId], [playerTwoId, 0, 0, 0, challengeId]], challengeId];
  connection.query(sql, values, function(error, results) {
    if (error) {
      callback(error, null);
    } else {
      callback(null, true);
    }
  });
}

function hasChallenge(playerId, callback) {
  var sql = 'SELECT * FROM c4challenges WHERE challenged = ?';
  var values = [playerId];
  connection.query(sql, values, function(error, results) {
    if (error) {
      callback(error, null);
    } else {
      callback(null, results[0]);
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
  var sql = 'INSERT INTO c4games (player1, player2, currentTurn, board, turnCount) VALUES (?, ?, ?, ?, ?)';
  var values = [playerOneId, playerTwoId, 1, newBoard, 0];

  connection.query(sql, values, function(error, results) {
    if (error) {
      callback(error, null);
    } else {
      callback(null, results.insertId);
    }
  });
}

function setGame(playerOneId, playerTwoId, gameId, callback) {
  var sql = 'UPDATE c4users SET challengeId = ?, gameId = ? WHERE id = ? OR id = ?';
  var values = [0, gameId, playerOneId, playerTwoId];

  connection.query(sql, values, function(error, results) {
    if (error) {
      callback(error, null);
    } else {
      callback(null, results.changedRows);
    }
  });
}

function getGame(playerId, callback) {
  getGameId(playerId, function (error, results) {
    if (error) {
      callback(error, null);
    } else if (results) {
      var sql = 'SELECT * FROM c4games WHERE id = ?';
      var values = results.gameId;

      connection.query(sql, values, function(error, results) {
        if (error) {
          callback(error, null);
        } else {
          callback(null, results[0]);
        }
      });
    } else {
      return callback(null, null);
    }
  });
}

function getGameId(playerId, callback) {
  var sql = 'SELECT gameId FROM c4users WHERE id = ?';
  var values = [playerId];

  connection.query(sql, values, function(error, results) {
    if (error) {
      callback(error, null);
    } else {
      callback(null, results[0]);
    }
  });
}

// function newBoard() {
//   return [
//     [0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0]
//   ]
// }

function playerHasGame(playerId) {
  return (players[playerId] && players[playerId].currentGame);
}

function isPlayerTurn(playerId) {
  var game = playerHasGame(playerId) ? games[players[playerId].currentGame] : null;
  if (game && ((game.playerOne === playerId && game.currentTurn === 1) 
      || (game.playerTwo === playerId && game.currentTurn === -1))) {
    return true;
  }

  return false;
}

// TODO: Merge some of these checkVictory functions together
// -
function checkHorizontalVictory(gameId, row, column) {
  var game = games[gameId];
  var score = game.currentTurn;
  score += tallyHorizontalLeft(game.board, game.currentTurn, row, column) 
        + tallyHorizontalRight(game.board, game.currentTurn, row, column);
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
function checkVerticalVictory(gameId, row, column) {
  // Only need to check below this spot, since there are no tokens above it
  var game = games[gameId];
  if (row < 3 && Math.abs(game.board[row][column] + game.board[row + 1][column] +
                          game.board[row + 2][column] + game.board[row + 3][column]) === 4) {
    console.log("Victory: Vertical");
    return true;
  }
  
  return false;
}

// /
function checkForwardDiagonalVictory(gameId, row, column) {
  var game = games[gameId];
  var score = game.currentTurn;
  score += tallyForwardDiagonalLeft(game.board, game.currentTurn, row, column) 
        + tallyForwardDiagonalRight(game.board, game.currentTurn, row, column);

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
function checkBackwardDiagonalVictory(gameId, row, column) {
  var game = games[gameId];
  var score = game.currentTurn;
  score += tallyBackwardDiagonalLeft(game.board, game.currentTurn, row, column) 
        + tallyBackwardDiagonalRight(game.board, game.currentTurn, row, column);

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

function mention(user) {
  if (typeof user === "string") {
    return "<@" + user + ">";
  }
  return "<@" + user.id + ">";
}