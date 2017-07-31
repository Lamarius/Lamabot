// A sample connectionInfo file, replace all values with values used for your bot, then remove the
// .sample from the file name

const mysql = require('mysql');

module.exports = {
  connection: function () {
    var db_config = {
      host: 'host',
      user: 'user',
      password: 'password',
      database: 'database'
    };

    var connection = mysql.createConnection(db_config);

    function handleDisconnect(connection) {
      connection.on('error', function(err) {
        console.log('MySQL error:', err);
        console.log('Re-connecting to MySQL database.');
        connection.destroy();
        connection = mysql.createConnection(db_config);
        handleDisconnect(connection);
        connection.connect();
      });
    }

    handleDisconnect(connection);

    return connection;
  }
}