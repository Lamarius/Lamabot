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
      Player tried to challenge themself
      return callback("I'm sorry " + core.mention(playerOneId) + ", but you can't challenge "
                      + "yourself");
    } else {
      canChallenge(serverId, playerOneId, playerTwoId, (error, isChallengeable) => {
        if (error) {
          throw error;
        } else if (!isChallengeable) {
          console.log('hi');
          // Player is unable to challenge their opponent, probably due to the opponent already 
          // having an active game
          return callback("I'm sorry " + core.mention(playerOneId) + ", but you are unable to "
                          + "challenge " + core.mention(playerTwoId) + ". Maybe one of you already "
                          + "has a game active.")
        } else {
          console.log('hey');
          // Drop the gauntlet and setup the challenge
          createGame(serverId, playerOneId, playerTwoId, error => {
            if (error) {
              throw error;
            } else {
              return callback(core.mention(playerTwoId) + ", you have been challenged to a game of "
                              + "c4! Type ``!lbc4 accept`` to accept their challenge, or "
                              + "``!lbc4 reject`` to reject it.");
            }
          })
          
        }
      });
    }
  },
  acceptChallenge: (playerId, callback) => {
    return callback(null);
    // getGameFromPlayerId(playerId, (error, game) => {
    //   if (error) {
    //     throw error;
    //   } else if (game) {
    //     if ((game.challenger === 1 && game.playerTwoId === playerId) || (game.challenger === 2 && game.playerOneId === playerId)) {
    //       acceptGame(game.id, (error, results) => {
    //         if (error) {
    //           throw error;
    //         } else {
    //           return callback(game.playerOneId, parseBoard(game.playerOneId, game.playerTwoId, JSON.parse(game.board)));
    //         }
    //       });
    //     } else {
    //       return callback(playerId === game.playerOneId ? game.playerTwoId : game.playerOneId, null);
    //     }
    //   } else {
    //     return callback(null);
    //   }
    // });
  },
  rejectChallenge: (playerId, callback) => {
    return callback(null);
    // getGameFromPlayerId(playerId, (error, game) => {
    //   if (error) {
    //     throw error;
    //   } else if (game) {
    //     removeGame(game.id, game.playerOneId, game.playerTwoId, (error, results) => {
    //       if (error) {
    //         throw error;
    //       } else {
    //         return callback(playerId === game.playerOneId ? game.playerTwoId : game.playerOneId);
    //       }
    //     });
    //   } else {
    //     return callback(null);
    //   }
    // });
  },
  printboard: (playerId, callback) => {
    return callback(null);
    // getGameFromPlayerId(playerId, (error, game) => {
    //   if (error) {
    //     throw error;
    //   } else if (game) {
    //     return callback(parseBoard(game.playerOneId, game.playerTwoId, JSON.parse(game.board)));
    //   } else {
    //     return callback(null);
    //   }
    // });
  },
  placeToken: (playerId, column, callback) => {
    return callback(null);
    // getGameFromPlayerId(playerId, (error, game) => {
    //   if (error) {
    //     throw error;
    //   } else if (game) {
    //     if ((game.playerOneId === playerId && game.currentTurn === 1) || (game.playerTwoId === playerId && game.currentTurn === -1)) {
    //       var board = JSON.parse(game.board);
    //       var row = -1;
    //       for (i = 5; i >= 0; i--) {
    //         if (board[i][column] === 0) {
    //           row = i;
    //           break;
    //         }
    //       }

    //       if (row !== -1) {
    //         board[row][column] = game.currentTurn;
    //         game.board = JSON.stringify(board);
    //         game.currentTurn *= -1;
    //         game.turnCount++;
    //         var opponentId = game.playerOneId === playerId ? game.playerTwoId : game.playerOneId;
    //         updateGame(game, (error, results) => {
    //           if (error) {
    //             throw error;
    //           }
    //           if (isVictory(board, game.currentTurn * -1, row, column)) {
    //             // Victory fanfare
    //             removeGame(game.id, game.playerOneId, game.playerTwoId, (error, results) => {
    //               if (error) {
    //                 throw error;
    //               }
    //               addWin(playerId, (error, result) => {
    //                 if (error) throw error;
    //               });
    //               addLoss(opponentId, (error, result) => {
    //                 if (error) throw error;
    //               });
    //               return callback('victory', parseBoard(game.playerOneId, game.playerTwoId, board));
    //             });
    //           } else if (game.turnCount >= 42) {
    //             // Alright, we'll cal it a draw
    //             removeGame(game.id, game.playerOneId, game.playerTwoId, (error, results =>) {
    //               if (error) {
    //                 throw error;
    //               }
    //               addTie(game.playerOneId, (error, result) => {
    //                 if (error) {
    //                   throw error;
    //                 }
    //               });
    //               addTie(game.playerTwoId, (error, result) => {
    //                 if (error) {
    //                   throw error;
    //                 }
    //               });
    //               return callback('draw', parseBoard(game.playerOneId, game.playerTwoId, board));
    //             });
    //           } else {
    //             return callback(opponentId, parseBoard(game.playerOneId, game.playerTwoId, board));
    //           }
    //         });
    //       } else {
    //         return callback(null);
    //       }
    //     }
    //   } else {
    //     return callback(null);
    //   }
    // });
  },
  stats: (playerId, callback) => {
    return callback(null);
    // getStats(playerId, (error, stats) => {
    //   if (error) {
    //     throw error;
    //   } else if (stats) {
    //     return callback(core.mention(playerId) + ', you have ' 
    //                     + stats.wins + (stats.wins === 1 ? ' win, ' : ' wins, ') 
    //                     + stats.losses + (stats.losses === 1 ? ' loss, and ' : ', losses, and ') 
    //                     + stats.ties + (stats.ties === 1 ? ' tie.' : ' ties.'));
    //   } else {
    //     return callback(core.mention(playerId) + ', you have no recorded stats.');
    //   }
    // });
  }
};

function canChallenge(serverId, playerOneId, playerTwoId, callback) {
  User.find({ uid: { $in: [playerOneId, playerTwoId] }}, (err, docs) => {
    if (err) {
      return (err, null);
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

// function parseBoard(playerOneId, playerTwoId, board) {
//   var message = core.mention(playerOneId) + " " + PLAYER_ONE + " vs " + core.mention(playerTwoId) + " " + PLAYER_TWO;
//   board.forEach(row => {
//     message = message.concat("\n");
//     row.forEach(space => {
//       if (space === 0) {
//         message = message.concat(EMPTY);
//       } else if (space === 1) {
//         message = message.concat(PLAYER_ONE);
//       } else {
//         message = message.concat(PLAYER_TWO);
//       }
//     });
//   });
//   message = message.concat("\n:one::two::three::four::five::six::seven:");
//   return message;
// }

function createGame(serverId, playerOneId, playerTwoId, callback) {
  var cFourGame = new CFourGame({ playerOneId: playerOneId, playerTwoId: playerTwoId });
  cFourGame.save((err, game) => {
    if (err) {
      return callback(err)
    } else {
      var query = { 
        uid: { $in: [playerOneId, playerTwoId] }, 
        $and: [{ "games.type": {$ne: GAME_TYPE }}, { "games.serverId": {$ne: serverId }}]
      };
      var update = { $addToSet: { games: { type: GAME_TYPE, serverId: serverId, stats: { wins: 0, losses: 0, draws: 0 }}}};
      User.update( query, update, err => {
        if (err) {
          return callback(err);
        } else {
          var query = { uid: { $in: [playerOneId, playerTwoId] }, "games.type": GAME_TYPE, "games.serverId": serverId};
          var update = { $set : {"games.$.currentGameId": game._id}}
          User.update(query, update, err => {
            if (err) {
              return callback(err);
            } else {
              return callback(null);
            }
          })
        }
      });
    }
  });
}

// function createGame(playerOneId, playerTwoId, callback) {
//   var newBoard = JSON.stringify([
//     [0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0]
//   ]);
//   var sql = 'INSERT INTO c4games (playerOneId, playerTwoId, challenger, currentTurn, board, turnCount) VALUES (?, ?, ?, ?, ?, ?)';
//   var values = Math.round(Math.random()) ? [playerOneId, playerTwoId, 1, 1, newBoard, 0]
//                                          : [playerTwoId, playerOneId, 2, 1, newBoard, 0];

//   connection.query(sql, values, (error, results) => {
//     if (error) {
//       return callback(error, null);
//     }
//     callback(null, results.insertId);
//   });
// }

// function setGame(playerOneId, playerTwoId, gameId, callback) {
//   var sql = 'INSERT INTO users (id, c4gameId) VALUES ? ON DUPLICATE KEY UPDATE c4gameId = ?';
//   var values = [[[playerOneId, gameId], [playerTwoId, gameId]], gameId];

//   connection.query(sql, values, (error, results) => {
//     if (error) {
//       return callback(error, null);
//     } else {
//       return callback(null, results);
//     }
//   });
// }

// function acceptGame(gameId, callback) {
//   var sql = 'UPDATE c4games SET challenger = ? WHERE id = ?';
//   var values = [0, gameId];

//   connection.query(sql, values, (error, results) => {
//     if (error) {
//       return callback(error, null);
//     } else {
//       return callback(null, results);
//     }
//   });
// }

// function getGame(gameId, callback) {
//   var sql = 'SELECT * FROM c4games WHERE id = ?';
//   var values = [gameId];

//   connection.query(sql, values, (error, results) => {
//     if (error) {
//       return callback(error, null);
//     }
//     callback(null, results[0]);
//   });
// }

// function getGameFromPlayerId(playerId, callback) {
//   getGameId(playerId, (error, gameId) => {
//     if (error) {
//       return callback(error, null);
//     } else if (gameId) {
//       getGame(gameId, (error, game) => {
//         if (error) {
//           return callback(error, null);
//         } else {
//           return callback(null, game);
//         }
//       });
//     } else {
//       return callback(null, null);
//     }
//   });
// }

// function updateGame(game, callback) {
//   var sql = 'UPDATE c4games SET currentTurn = ?, board = ?, turnCount = ? WHERE id = ?';
//   var values = [game.currentTurn, game.board, game.turnCount, game.id];

//   connection.query(sql, values, (error, results) => {
//     if (error) {
//       return callback(error, null);
//     }
//     callback(null, results);
//   });
// }

// function getGameId(playerId, callback) {
//   var sql = 'SELECT c4gameId FROM users WHERE id = ?';
//   var values = [playerId];

//   connection.query(sql, values, (error, results) => {
//     if (error) {
//       return callback(error, null);
//     } else if (results.length > 0) {
//       return callback(null, results[0].c4gameId)
//     } else {
//       return callback(null, null);
//     }
//   });
// }

// function removeGame(gameId, playerOneId, playerTwoId, callback) {
//   // Should I actually delete the games? Might be useful to pull old games for some raisin
//   var sql = 'UPDATE users SET c4gameId = ? WHERE id = ? OR id = ?';
//   var values = [null, playerOneId, playerTwoId];

//   connection.query(sql, values, (error, results) => {
//     if (error) {
//       return callback(error, null);
//     } else {
//       callback(null, results);
//     }
//   });
// }

// function getStatsId(playerId, callback) {
//   var sql = 'SELECT c4statsId FROM users WHERE id = ?';
//   var values = [playerId];

//   connection.query(sql, values, (error, results) => {
//     if (error) {
//       return callback(error, null);
//     } else if (results[0]) {
//       return callback(null, results[0].c4statsId);
//     } else {
//       return callback(null, null);
//     }
//   });
// }

// function getStats(playerId, callback) {
//   getStatsId(playerId, (error, statsId) => {
//     if (error) {
//       return callback(error, null);
//     } else if (statsId) {
//       var sql = 'SELECT * FROM c4stats WHERE id = ?'
//       var values = [statsId];

//       connection.query(sql, values, (error, results) => {
//         if (error) {
//           return callback(error, null);
//         } else {
//           return callback(null, results[0]);
//         }
//       });
//     } else {
//       return callback(null, null);
//     }
//   });
// }

// function createStatsEntry(stats, callback) {
//   var sql = 'INSERT INTO c4stats SET ?';

//   connection.query(sql, stats, (error, results) => {
//     if (error) {
//       return callback(error, null);
//     } else {
//       return callback(null, results.insertId);
//     }
//   })
// }

// function updateStatsEntry(stats, callback) {
//   getStatsId(stats.playerId, (error, statsId) => {
//     if (error) {
//       return callback(error, null);
//     } else if (statsId) {
//       var sql = 'UPDATE c4stats SET wins = wins + ?, losses = losses + ?, ties = ties + ? WHERE id = ?';
//       var values = [stats.wins, stats.losses, stats.ties, statsId];

//       connection.query(sql, values, (error, results) => {
//         if (error) {
//           return callback(error, null);
//         } else {
//           return callback(null, results);
//         }
//       });
//     } else {
//       createStatsEntry(stats, (error, statsId) => {
//         if (error) {
//           return callback(error, null);
//         } else {
//           var sql = 'UPDATE users SET c4statsId = ? WHERE id = ?';
//           var values = [statsId, stats.playerId];

//           connection.query(sql, values, (error, results) => {
//             if (error) {
//               return callback(error, null);
//             } else {
//               return callback(null, results);
//             }
//           });
//         }
//       });
//     }
//   });
// }

// function addWin(playerId, callback) {
//   updateStatsEntry({playerId: playerId, wins: 1, losses: 0, ties: 0}, (error, results) => {
//     if (error) {
//       return callback(error, null);
//     } else {
//       return callback(null, results);
//     }
//   });
// }

// function addLoss(playerId, callback) {
//   updateStatsEntry({playerId: playerId, wins: 0, losses: 1, ties: 0}, (error, results) => {
//     if (error) {
//       return callback(error, null);
//     } else {
//       return callback(null, results);
//     }
//   });
// }

// function addTie(playerId, callback) {
//   updateStatsEntry({playerId: playerId, wins: 0, losses: 0, ties: 1}, (error, results) => {
//     if (error) {
//       return callback(error, null);
//     } else {
//       return callback(null, results);
//     }
//   });
// }

// function isVictory(board, currentTurn, row, column) {
//   if (checkHorizontalVictory(board, currentTurn, row, column) || 
//       checkVerticalVictory(board, row, column) ||
//       checkForwardDiagonalVictory(board, currentTurn, row, column) || 
//       checkBackwardDiagonalVictory(board, currentTurn, row, column)) {
//     return true;
//   }

//   return false;
// }

// // TODO: Merge some of these checkVictory functions together
// // -
// function checkHorizontalVictory(board, currentTurn, row, column) {
//   var score = currentTurn;
//   score += tallyHorizontalLeft(board, currentTurn, row, column) 
//         + tallyHorizontalRight(board, currentTurn, row, column);
//   if (Math.abs(score) >= 4) {
//     console.log("Victory: Horizontal");
//     return true;
//   }

//   return false;
// }

// function tallyHorizontalLeft(board, currentTurn, row, column) {
//   if (column > 0 && board[row][column - 1] === currentTurn) {
//     return currentTurn + tallyHorizontalLeft(board, currentTurn, row, column - 1);
//   }

//   return 0
// }

// function tallyHorizontalRight(board, currentTurn, row, column) {
//   if (column < 6 && board[row][column + 1] === currentTurn) {
//     return currentTurn + tallyHorizontalRight(board, currentTurn, row, column + 1);
//   }

//   return 0;
// }

// // |
// function checkVerticalVictory(board, row, column) {
//   // Only need to check below this spot, since there are no tokens above it
//   if (row < 3 && Math.abs(board[row][column] + board[row + 1][column] +
//                           board[row + 2][column] + board[row + 3][column]) === 4) {
//     console.log("Victory: Vertical");
//     return true;
//   }
  
//   return false;
// }

// // /
// function checkForwardDiagonalVictory(board, currentTurn, row, column) {
//   var score = currentTurn;
//   score += tallyForwardDiagonalLeft(board, currentTurn, row, column) 
//         + tallyForwardDiagonalRight(board, currentTurn, row, column);

//   if (Math.abs(score) >= 4) {
//     console.log("Victory: Forward Diagonal");
//     return true;
//   }

//   return false;
// }

// function tallyForwardDiagonalLeft(board, currentTurn, row, column) {
//   if (column > 0 && row < 5 && board[row + 1][column - 1] === currentTurn) {
//     return currentTurn + tallyForwardDiagonalLeft(board, currentTurn, row + 1, column - 1);
//   }

//   return 0;
// }

// function tallyForwardDiagonalRight(board, currentTurn, row, column) {
//   if (column < 6 && row > 0 && board[row - 1][column + 1] === currentTurn) {
//     return currentTurn + tallyForwardDiagonalRight(board, currentTurn, row - 1, column + 1);
//   }

//   return 0;
// }

// // \
// function checkBackwardDiagonalVictory(board, currentTurn, row, column) {
//   var score = currentTurn;
//   score += tallyBackwardDiagonalLeft(board, currentTurn, row, column) 
//         + tallyBackwardDiagonalRight(board, currentTurn, row, column);

//   if (Math.abs(score) >= 4) {
//     console.log("Victory: Backward Diagonal");
//     return true;
//   }

//   return false;
// }

// function tallyBackwardDiagonalLeft(board, currentTurn, row, column) {
//   if (column > 0 && row > 0 && board[row - 1][column - 1] === currentTurn) {
//     return currentTurn + tallyBackwardDiagonalLeft(board, currentTurn, row - 1, column - 1);
//   }

//   return 0;
// }

// function tallyBackwardDiagonalRight(board, currentTurn, row, column) {
//   if (column < 6 && row < 5 && board[row + 1][column + 1] === currentTurn) {
//     return currentTurn + tallyBackwardDiagonalRight(board, currentTurn, row + 1, column + 1);
//   }

//   return 0;
// }