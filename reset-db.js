const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

// Read schema file
const schemaFile = path.join(__dirname, "backend/schema.sql");
const schema = fs.readFileSync(schemaFile, "utf8");

// Connect to MySQL without specifying database
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Rj12345@"
});

connection.connect((err) => {
    if (err) {
        console.error("Connection error:", err);
        process.exit(1);
    }
    
    console.log("Connected to MySQL. Resetting database...");
    
    // Drop existing database
    connection.query("DROP DATABASE IF EXISTS BankSystem", (err) => {
        if (err) {
            console.error("Error dropping database:", err);
            connection.end();
            process.exit(1);
        }
        
        console.log("✓ Dropped BankSystem database");
        
        // Execute schema - split by statements more carefully
        const statements = [];
        let current = "";
        
        for (const char of schema) {
            current += char;
            if (char === ";") {
                if (current.trim()) {
                    statements.push(current);
                }
                current = "";
            }
        }
        
        let executed = 0;
        
        const executeNext = () => {
            if (executed >= statements.length) {
                console.log("✓ Database reset complete!");
                connection.end();
                process.exit(0);
            }
            
            const query = statements[executed].trim();
            if (!query) {
                executed++;
                executeNext();
                return;
            }
            
            connection.query(query, (err) => {
                if (err) {
                    console.error(`Error executing query ${executed}:`, err.message);
                    console.error("Query:", query.substring(0, 100));
                    connection.end();
                    process.exit(1);
                }
                console.log(`✓ Executed query ${executed + 1}/${statements.length}`);
                executed++;
                executeNext();
            });
        };
        
        executeNext();
    });
});
