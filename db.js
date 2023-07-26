const mysql = require("mysql2");
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Arvesemo10*",
  database: "test",
});

// Testing DB connection
connection.connect(function (error) {
  if (error) {
    console.log("Error connecting to database.");
  } else {
    console.log("Database Connected Successfully!!");
  }
});

module.exports = connection;
