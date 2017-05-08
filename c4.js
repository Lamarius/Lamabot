/* 
  Connect 4 module for Lamabot
 */

const EMPTY = ':white_circle:';
const PLAYER_ONE = ':red_circle:';
const PLAYER_TWO = ':large_blue_circle:';

games = {};
stats = {};

module.exports = {
  initiateGame: function (playerOne, playerTwo) {
    if (games && games[playerOne.id]) {
      return null;
    }

    // Determine who goes first through RNG
    if (Math.floor(Math.random() * 2)) {
      games[playerOne.id] = {opponent: playerTwo, playerTurn: 1, currentTurn: 1, moves: 0, board: newBoard()};
      games[playerTwo.id] = {opponent: playerOne, playerTurn: -1, currentTurn: 1, moves: 0, board: newBoard()};
      return playerOne;
    } else {
      games[playerOne.id] = {opponent: playerTwo, playerTurn: -1, currentTurn: 1, moves: 0, board: newBoard()};
      games[playerTwo.id] = {opponent: playerOne, playerTurn: 1, currentTurn: 1, moves: 0, board: newBoard()};
      return playerTwo;
    }
  },

  printBoard: function (player) {
    if (games && games[player.id]) {
      board = games[player.id].playerTurn === 1 ? mention(player) + ' ' + PLAYER_ONE + ' vs ' 
      + mention(games[player.id].opponent) + ' ' + PLAYER_TWO
      : mention(games[player.id].opponent) + ' ' + PLAYER_ONE + ' vs ' + mention(player) + ' ' 
      + PLAYER_TWO;
      games[player.id].board.forEach(row => {
        board = board.concat('\n');
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
      board = board.concat('\n:one::two::three::four::five::six::seven:');
      return board;
    }

    return (null);
  },

  placeToken: function (player, column) {
    if (isPlayerTurn(player.id)) {
      var gameboard = games[player.id].board;
      for (i = 5; i >=0; i--) {
        if (gameboard[i][column] === 0) {
          // Update opponent's board when we swap players
          // If a win/draw occurs, no reason to update the opponent's board 
          // since we're wiping everything
          gameboard[i][column] = games[player.id].playerTurn;
          games[player.id].board = gameboard;
          games[player.id].moves++;
          return i;
        }
      }
    }
    return false;
  },

  checkVictory: function (player, row, column) {
    if (checkHorizontalVictory(player.id, row, column) || 
        checkVerticalVictory(player.id, row, column) ||
        checkForwardDiagonalVictory(player.id, row, column) || 
        checkBackwardDiagonalVictory(player.id, row, column)) {
      return true;
    }
    return false;
  },

  getMoveCount: function (player) {
    return games[player.id].moves;
  },

  // Swaps the active player in a game, and copies the results of the previous turn 
  // to the opponent's storage
  swapPlayer: function (player) {
    games[player.id].currentTurn *= -1;

    var game = games[player.id];
    var opponentId = game.opponent.id;
    games[opponentId].board = game.board;
    games[opponentId].currentTurn = game.currentTurn;
    games[opponentId].moves = game.moves;
  },

  removeGame: function (player) {
    var opponentId = games[player.id].opponent.id;
    delete games[player.id];
    delete games[opponentId];
  }
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

function isPlayerTurn(playerId) {
  if (games && games[playerId] && games[playerId].playerTurn === games[playerId].currentTurn) {
    return true;
  }
  return false;
}

// TODO: Merge some of these checkVictory functions together
// -
function checkHorizontalVictory(playerId, row, column) {
  var game = games[playerId];
  var score = game.playerTurn;
  score += tallyHorizontalLeft(game.board, game.playerTurn, row, column) 
        + tallyHorizontalRight(game.board, game.playerTurn, row, column);

  if (Math.abs(score) >= 4) {
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
function checkVerticalVictory(playerId, row, column) {
  // Only need to check below this spot, since there are no tokens above it
  var game = games[playerId];
  if (row < 3 && Math.abs(game.board[row][column] + game.board[row + 1][column] +
                          game.board[row + 2][column] + game.board[row + 3][column]) === 4) {
    return true;
  }
  
  return false;
}

// /
function checkForwardDiagonalVictory(playerId, row, column) {
  var game = games[playerId];
  var score = game.playerTurn;
  score += tallyForwardDiagonalLeft(game.board, game.playerTurn, row, column) 
        + tallyForwardDiagonalRight(game.board, game.playerTurn, row, column);

  if (Math.abs(score) >= 4) {
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
function checkBackwardDiagonalVictory(playerId, row, column) {
  var game = games[playerId];
  var score = game.playerTurn;
  score += tallyBackwardDiagonalLeft(game.board, game.playerTurn, row, column) 
        + tallyBackwardDiagonalRight(game.board, game.playerTurn, row, column);

  if (Math.abs(score) >= 4) {
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
  return "<@" + user.id + ">";
}