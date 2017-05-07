const EMPTY = ':white_circle:';
const PLAYER_ONE = ':red_circle:';
const PLAYER_TWO = ':large_blue_circle:';

currentPlayer = 1;
currentMove = 0;
gameboard = [
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0]
]

module.exports = {
  printBoard: function () {
    board = 'Player 1 ' + PLAYER_ONE + ' vs Player 2 ' + PLAYER_TWO;
    gameboard.forEach(row => {
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
    })
    board = board.concat('\n:one::two::three::four::five::six::seven:')
    return board;
  },

  placeToken: function (column) {
    for (i = 5; i >= 0; i--) {
      if (gameboard[i][column] === 0) {
        gameboard[i][column] = currentPlayer;
        currentMove++;
        return i;
      }
    }
    return false;
  },

  checkVictory: function (row, column) {
    return checkWin(row, column);
  },

  getMoveCount: function () {
    return currentMove
  },

  getCurrentPlayer: function () {
    return currentPlayer === 1 ? 1 : 2;
  },

  swapPlayer: function () {
    currentPlayer *= -1;
  },

  resetGame: function () {
    resetBoard();
    currentPlayer = 1;
    currentMove = 0;
  }
}

function resetBoard() {
  gameboard = [
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0]
  ]
}

// TODO: Merge some of these checkVictory functions together
function checkWin(row, column) {
  if (checkHorizontalVictory(row, column) || checkVerticalVictory(row, column) ||
      checkForwardDiagonalVictory(row, column) || checkBackwardDiagonalVictory(row, column)) {
    return true;
  }
  return false;
}

// -
function checkHorizontalVictory(row, column) {
  var score = currentPlayer;
  score += tallyHorizontalLeft(row, column) + tallyHorizontalRight(row, column);
  if (Math.abs(score) >= 4) {
    return true;
  }

  return false;
}

function tallyHorizontalLeft(row, column) {
  if (column > 0 && gameboard[row][column - 1] === currentPlayer) {
    return currentPlayer + tallyHorizontalLeft(row, column - 1);
  }

  return 0
}

function tallyHorizontalRight(row, column) {
  if (column < 6 && gameboard[row][column + 1] === currentPlayer) {
    return currentPlayer + tallyHorizontalRight(row, column + 1);
  }

  return 0;
}

// |
function checkVerticalVictory(row, column) {
  // Only need to check down, it'd be hard to place a token above this one before it was placed
  if (row < 3 && Math.abs(gameboard[row][column] + gameboard[row + 1][column] + 
                          gameboard[row + 2][column] + gameboard[row + 3][column]) === 4) {
    return true;
  }

  return false;
}

// /
function checkForwardDiagonalVictory(row, column) {
  var score = currentPlayer;
  score += tallyForwardDiagonalLeft(row, column) + tallyForwardDiagonalRight(row, column);
  if (Math.abs(score) >= 4) {
    return true;
  }

  return false;
}

function tallyForwardDiagonalLeft(row, column) {
  if (column > 0 && row < 5 && gameboard[row + 1][column - 1] === currentPlayer) {
    return currentPlayer + tallyForwardDiagonalLeft(row + 1, column - 1);
  }

  return 0;
}

function tallyForwardDiagonalRight(row, column) {
  if (column < 6 && row > 0 && gameboard[row - 1][column + 1] === currentPlayer) {
    return currentPlayer + tallyForwardDiagonalRight(row - 1, column + 1);
  }

  return 0;
}

// \
function checkBackwardDiagonalVictory(row, column) {
  var score = currentPlayer;
  score += tallyBackwardDiagonalLeft(row, column) + tallyBackwardDiagonalRight(row, column);
  if (Math.abs(score) >= 4) {
    return true;
  }

  return false;
}

function tallyBackwardDiagonalLeft(row, column) {
  if (column > 0 && row > 0 && gameboard[row - 1][column - 1] === currentPlayer) {
    return currentPlayer + tallyBackwardDiagonalLeft(row - 1, column - 1);
  }

  return 0;
}

function tallyBackwardDiagonalRight(row, column) {
  if (column < 6 && row < 5 && gameboard[row + 1][column + 1] === currentPlayer) {
    return currentPlayer + tallyBackwardDiagonalRight(row + 1, column + 1);
  }

  return 0;
}