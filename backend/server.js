const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, "../fronted")));

// Create tables if they don't exist
const createTables = () => {
    // First, check existing tables
    db.query("SHOW TABLES", (err, results) => {
        if (err) console.log("Error showing tables:", err);
        else {
            console.log("Existing tables:", results.map(r => Object.values(r)[0]));
        }
    });

    // Check Branch table structure
    db.query("DESCRIBE Branch", (err, results) => {
        if (err) console.log("Error describing Branch:", err);
        else {
            console.log("Branch table structure:", results);
        }
    });

    // For now, just ensure the insert works
    setTimeout(() => {
        db.query("INSERT IGNORE INTO Branch (BranchName, Location) VALUES ('Main Branch', 'City Center')", (err) => {
            if (err) console.log("Insert branch error:", err);
            else console.log("Branch inserted or already exists");
        });
    }, 1000);
};

// createTables(); // Commented out for now

/* ====== API START ====== */

/* REGISTER */
app.post("/register", (req, res) => {
    const { name, address, contact, dob, password } = req.body;

    db.query(
        "INSERT INTO Customer (Name, Address, Contact, DOB, Password) VALUES (?, ?, ?, ?, ?)",
        [name, address, contact, dob, password],
        (err) => {
            if (err) return res.send("Error");
            res.send("Registered Successfully");
        }
    );
});

/* LOGIN */
app.post("/login", (req, res) => {
    const { contact, password } = req.body;

    db.query(
        "SELECT * FROM Customer WHERE Contact=? AND Password=?",
        [contact, password],
        (err, result) => {
            if (result.length > 0) {
                res.send({ message: "Login Success" });
            } else {
                res.send({ message: "Invalid Credentials" });
            }
        }
    );
});

/* CREATE ACCOUNT */
app.post("/createAccount", (req, res) => {
    const { cid, balance, branchId } = req.body;

    db.query(
        "INSERT INTO BankAccount (Balance, CId, BranchId) VALUES (?, ?, ?)",
        [balance, cid, branchId],
        (err) => {
            if (err) return res.send("Error");
            res.send("Account Created");
        }
    );
});

/* TRANSFER */
app.post("/transfer", (req, res) => {
    const { fromAcc, toAcc, amount } = req.body;

    if (!fromAcc || !toAcc || !amount || amount <= 0) {
        return res.send("Invalid transfer details");
    }

    // Check if from account has sufficient balance
    db.query("SELECT Balance FROM BankAccount WHERE AccId=?", [fromAcc], (err, fromResult) => {
        if (err) return res.send("Error checking balance");
        if (fromResult.length === 0) return res.send("From account not found");
        if (fromResult[0].Balance < amount) return res.send("Insufficient balance");

        // Check if to account exists
        db.query("SELECT AccId FROM BankAccount WHERE AccId=?", [toAcc], (err, toResult) => {
            if (err) return res.send("Error checking to account");
            if (toResult.length === 0) return res.send("To account not found");

            // Perform transfer
            db.query("UPDATE BankAccount SET Balance = Balance - ? WHERE AccId=?", [amount, fromAcc]);
            db.query("UPDATE BankAccount SET Balance = Balance + ? WHERE AccId=?", [amount, toAcc]);

            db.query(
                "INSERT INTO Transactions (FromAcc, ToAcc, Amount, Type, Date, Time) VALUES (?, ?, ?, 'Transfer', CURDATE(), CURTIME())",
                [fromAcc, toAcc, amount],
                (err) => {
                    if (err) return res.send("Transfer recorded but error logging");
                    res.send("Transfer Done Successfully");
                }
            );
        });
    });
});

/* GET TRANSACTIONS */
app.get("/transactions/:accId", (req, res) => {
    const accId = req.params.accId;

    db.query(
        "SELECT * FROM Transactions WHERE FromAcc=? OR ToAcc=?",
        [accId, accId],
        (err, result) => {
            if (err) return res.send(err);
            res.send(result);
        }
    );
});

/* ====== API END ====== */

app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});

