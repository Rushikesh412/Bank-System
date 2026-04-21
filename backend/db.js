const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Rj12345@", 
    database: "BankSystem"
});

db.connect((err) => {
    if (err) {
        console.log("Database Error:", err.message);
        console.log("Server will continue without database connection. Some features may not work.");
    } else {
        console.log("MySQL Connected...");
    }
});

// Handle connection errors
db.on('error', (err) => {
    console.log('Database connection error:', err.message);
});

module.exports = db;
