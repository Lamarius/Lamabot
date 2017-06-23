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
  database: connectionInfo.database
});

var games = {};
var players = {};
/* Games {
    id: <id>
    playerOne: <userId>
    playerTwo: <userId>
    currentTurn: <int>
    moves: <int>
    board: <int[][]>
  }
*/
/* Players {
    id: <userId>
    currentGame: <gameId>
    challenge: {
      initiated: <boolean>
      opponent: <userId>
    }
    stats: {
      wins: <int>
      losses: <int>
      ties: <int>
    }
  }
*/

module.exports = {
  challenge: function (playerOne, playerTwo) {
    canChallenge(playerOne, playerTwo, function (error, result) {
      if (error) {
        throw error;
      } else {
        if (result === true) {
          createChallenge(playerOne, playerTwo, function (error, result) {
            if (error) {
              throw error;
            } else {
              var challengeId = result;
              setChallenge(playerOne, playerTwo, challengeId, function (error, result) {
                if (error) {
                  throw error;
                } else {
                  console.log(result);
                  return result;
                }
              })
            }
          });
        } else {
          return null;
        }
      }
    });
  },

  acceptGame: function (player) {
    if (players[player.id].challenge && players[player.id].challenge.initiated === false && !players[player.id].currentGame) {
      var opponent = players[player.id].challenge.opponent;
      players[player.id].currentGame = player.id;
      players[opponent].currentGame = player.id;
      if (Math.floor(Math.random() * 2)) {
        games[player.id] = {playerOne: player.id, playerTwo: opponent, currentTurn: 1, moves: 0, board: newBoard()};
        return player.id;
      } else {
        games[player.id] = {playerOne: opponent, playerTwo: player.id, currentTurn: 1, moves: 0, board: newBoard()};
        return opponent;
      }
    }
    return null;
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

  printBoard: function (player) {
    if (players[player.id] && players[player.id].currentGame) {
      var game = games[players[player.id].currentGame];
      var board = mention(game.playerOne) + " " + PLAYER_ONE + " vs " + mention(game.playerTwo) + " " + PLAYER_TWO;
      game.board.forEach(row => {
        board = board.concat("\n");
        row.forEach(space => {
          if (space === 0) {
            board = board.concat(EMPTY);
          } else if (space === 1) {
            board = board.concat(PLAYER_ONE);
          } else {
            board = board.concat(PLAYER_TWO);
          }
        });
      });
      board = board.concat("\n:one::two::three::four::five::six::seven:");
      return board;
    }
    return null;
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

function canChallenge(playerOne, playerTwo, callback) {
  var sql = 'SELECT * FROM c4challenges WHERE challenger = ? OR challenged = ? OR challenger = ? OR challenged = ?';
  var values = [playerOne.id, playerOne.id, playerTwo.id, playerTwo.id];
  connection.query(sql, values, function (error, result) {
    if (error) {
      callback(error, null);
    } else {
      callback(null, result.length === 0);
    }
  });
}

function createChallenge(playerOne, playerTwo, callback) {
  var sql = 'INSERT INTO c4challenges SET ?';
  var values = {challenger: playerOne.id, challenged: playerTwo.id};
  connection.query(sql, values, function (error, result) {
    if (error) {
      callback(error, null);
    } else {
      callback(null, result.insertId);
    }
  })
}

function setChallenge(playerOne, playerTwo, challengeId, callback) {
  var sql = 'INSERT INTO c4users (id, wins, losses, ties, challengeId) VALUES ? ON DUPLICATE KEY UPDATE challengeId = ?';
  var values = [[[playerOne.id, 0, 0, 0, challengeId], [playerTwo.id, 0, 0, 0, challengeId]], challengeId];
  connection.query(sql, values, function (error, result) {
    if (error) {
      callback(error, null);
    } else {
      callback(null, true);
    }
  })
}

function isChallengeable(playerId) {
  return !players[playerId].challenge;
}

function newBoard() {
  return [
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0]
  ]
}

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