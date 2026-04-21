const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, "../fronted")));

// Helper function to update saving account interest rate based on balance
function updateSavingInterestRate(accId, balance, callback) {
    let interestRate = 0;
    if (balance >= 100000) {
        interestRate = 7.00;
    } else if (balance >= 50000) {
        interestRate = 4.00;
    } else {
        interestRate = 0.00;
    }

    db.query(
        "UPDATE SavingAccount SET InterestRate = ? WHERE AccId = ?",
        [interestRate, accId],
        (err) => {
            if (err) {
                console.error("Error updating interest rate:", err);
            }
            callback(err);
        }
    );
}

// Helper function to generate login ID
const generateLoginId = (id) => `CUST${String(id).padStart(4, "0")}`;

// Get next account number
const getNextAccountNumber = (callback) => {
    db.query("SELECT MAX(AccountNumber) AS maxAcc FROM BankAccount", (err, result) => {
        if (err) return callback(err);
        const nextNumber = (result[0].maxAcc || 4000) + 1;
        callback(null, nextNumber);
    });
};

// Create bank account
const createBankAccount = (cid, accountType, balance, internetBankingEnabled, callback) => {
    getNextAccountNumber((err, accountNumber) => {
        if (err) return callback(err);

        db.query(
            "INSERT INTO BankAccount (AccountNumber, CId, Balance, AccountType, IFSC, Status, InternetBankingEnabled) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [accountNumber, cid, balance || 0, accountType, "NBIN0000001", "active", internetBankingEnabled ? 1 : 0],
            (err, result) => {
                if (err) return callback(err);

                const accId = result.insertId;

                if (accountType === "saving") {
                    let interestRate = 0;
                    if (balance >= 100000) {
                        interestRate = 7.00;
                    } else if (balance >= 50000) {
                        interestRate = 4.00;
                    }
                    db.query(
                        "INSERT INTO SavingAccount (AccId, InterestRate, MinimumBalance) VALUES (?, ?, ?)",
                        [accId, interestRate, 1000.00],
                        (err) => {
                            if (err) return callback(err);
                            callback(null, { accountId: accId, accountNumber });
                        }
                    );
                } else if (accountType === "current") {
                    db.query(
                        "INSERT INTO CurrentAccount (AccId, OverdraftLimit) VALUES (?, ?)",
                        [accId, 10000.00],
                        (err) => {
                            if (err) return callback(err);
                            callback(null, { accountId: accId, accountNumber });
                        }
                    );
                } else {
                    callback(null, { accountId: accId, accountNumber });
                }
            }
        );
    });
};

/* 1. REGISTER */
app.post("/register", (req, res) => {
    const { name, contact, address, dob, email, password, internetBanking } = req.body;

    if (!name || !contact || !dob) {
        return res.status(400).json({ error: "Name, Contact, and DOB are required" });
    }

    const plainPassword = password || `pwd${Math.floor(1000 + Math.random() * 9000)}`;
    const tempLoginId = `TEMP${Date.now()}`;

    db.query(
        "INSERT INTO Customer (LoginId, Password, Name, Contact, Email, Address, DOB, IsInternetBankingEnabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [tempLoginId, plainPassword, name, contact, email || "", address || "", dob, internetBanking ? 1 : 0],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error registering customer" });
            }

            const loginId = generateLoginId(result.insertId);
            db.query(
                "UPDATE Customer SET LoginId = ? WHERE CId = ?",
                [loginId, result.insertId],
                (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: "Error saving login ID" });
                    }

                    res.json({
                        message: "Registered Successfully",
                        customerId: result.insertId,
                        loginId,
                        password: plainPassword
                    });
                }
            );
        }
    );
});

/* 2. LOGIN */
app.post("/customer/login", (req, res) => {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
        return res.status(400).json({ error: "Login ID and password are required" });
    }

    db.query("SELECT * FROM Customer WHERE LoginId = ? AND Password = ?", [loginId, password], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error during login" });
        }

        if (result.length === 0) {
            return res.status(401).json({ error: "Invalid login credentials" });
        }

        const customer = result[0];
        db.query("SELECT * FROM BankAccount WHERE CId = ?", [customer.CId], (err, accounts) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error fetching accounts" });
            }

            res.json({
                message: "Login successful",
                customer: {
                    id: customer.CId,
                    loginId: customer.LoginId,
                    name: customer.Name,
                    contact: customer.Contact
                },
                accounts
            });
        });
    });
});

/* 3. CREATE ACCOUNT */
app.post("/createAccount", (req, res) => {
    const { cid, loginId, balance, accountType, internetBanking } = req.body;

    if (!accountType || (!cid && !loginId)) {
        return res.status(400).send("Customer ID or Login ID and Account Type are required");
    }

    const createForCustomer = (customerId) => {
        createBankAccount(customerId, accountType, balance || 0, internetBanking, (err, accountData) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error creating account" });
            }
            res.json({ message: "Account Created Successfully", accountNumber: accountData.accountNumber });
        });
    };

    if (cid) {
        return createForCustomer(cid);
    }

    db.query("SELECT CId FROM Customer WHERE LoginId = ?", [loginId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error finding customer" });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        createForCustomer(result[0].CId);
    });
});

/* 4. GET ACCOUNT */
app.get("/account/:accountNumber", (req, res) => {
    const accountNumber = req.params.accountNumber;

    db.query(
        "SELECT * FROM BankAccount WHERE AccountNumber = ?",
        [accountNumber],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error fetching account" });
            }

            if (result.length > 0) {
                res.json(result[0]);
            } else {
                res.status(404).json({ error: "Account not found" });
            }
        }
    );
});

/* 5. GET CUSTOMER ACCOUNTS */
app.get("/accounts/:cid", (req, res) => {
    const cid = req.params.cid;

    db.query(
        "SELECT * FROM BankAccount WHERE CId = ?",
        [cid],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error fetching accounts" });
            }
            res.json(result);
        }
    );
});

/* 6. TRANSACTION */
app.post("/transaction", (req, res) => {
    const { accountNumber, amount, type } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!accountNumber || !parsedAmount || !type || parsedAmount <= 0) {
        return res.status(400).json({ error: "Invalid transaction details" });
    }

    if (!["credit", "debit"].includes(type)) {
        return res.status(400).json({ error: "Type must be 'credit' or 'debit'" });
    }

    db.query(
        "SELECT AccId, Balance, AccountType FROM BankAccount WHERE AccountNumber = ?",
        [accountNumber],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error checking account" });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: "Account not found" });
            }

            const account = result[0];
            const newBalance = type === "credit" ? account.Balance + parsedAmount : account.Balance - parsedAmount;

            if (type === "debit" && newBalance < 0) {
                return res.status(400).json({ error: "Insufficient balance" });
            }

            db.query(
                "UPDATE BankAccount SET Balance = ? WHERE AccId = ?",
                [newBalance, account.AccId],
                (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: "Error updating balance" });
                    }

                    if (type === "credit" && account.AccountType === 'saving') {
                        updateSavingInterestRate(account.AccId, newBalance, () => {
                            db.query(
                                "INSERT INTO Transactions (AccountId, Amount, Type, TxnDate, TxnTime) VALUES (?, ?, ?, CURDATE(), CURTIME())",
                                [account.AccId, parsedAmount, type],
                                (err, insertResult) => {
                                    if (err) {
                                        console.error(err);
                                        return res.status(500).json({ error: "Error recording transaction" });
                                    }
                                    res.json({ message: "Transaction Successful", transactionId: insertResult.insertId, newBalance });
                                }
                            );
                        });
                    } else {
                        db.query(
                            "INSERT INTO Transactions (AccountId, Amount, Type, TxnDate, TxnTime) VALUES (?, ?, ?, CURDATE(), CURTIME())",
                            [account.AccId, parsedAmount, type],
                            (err, insertResult) => {
                                if (err) {
                                    console.error(err);
                                    return res.status(500).json({ error: "Error recording transaction" });
                                }
                                res.json({ message: "Transaction Successful", transactionId: insertResult.insertId, newBalance });
                            }
                        );
                    }
                }
            );
        }
    );
});

/* 7. GET CUSTOMER PROFILE */
app.get("/customer/profile/:loginId", (req, res) => {
    const loginId = req.params.loginId;

    db.query("SELECT * FROM Customer WHERE LoginId = ?", [loginId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error fetching customer" });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        const customer = result[0];
        db.query("SELECT * FROM BankAccount WHERE CId = ?", [customer.CId], (err, accounts) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error fetching accounts" });
            }

            res.json({ customer, accounts });
        });
    });
});

/* 8. ADMIN - CREATE CUSTOMER WITH ACCOUNT */
app.post("/admin/createCustomer", (req, res) => {
    const { name, contact, email, address, dob, password, accountType, initialDeposit, internetBanking } = req.body;

    if (!name || !contact || !dob) {
        return res.status(400).json({ error: "Name, Contact, and DOB are required" });
    }

    const plainPassword = password || `pwd${Math.floor(1000 + Math.random() * 9000)}`;
    const tempLoginId = `TEMP${Date.now()}`;

    db.query(
        "INSERT INTO Customer (LoginId, Password, Name, Contact, Email, Address, DOB, IsInternetBankingEnabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [tempLoginId, plainPassword, name, contact, email || "", address || "", dob, internetBanking ? 1 : 0],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error creating customer" });
            }

            const customerId = result.insertId;
            const loginId = generateLoginId(customerId);

            db.query(
                "UPDATE Customer SET LoginId = ? WHERE CId = ?",
                [loginId, customerId],
                (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: "Error saving login ID" });
                    }

                    if (accountType) {
                        createBankAccount(customerId, accountType, initialDeposit || 0, internetBanking, (err, accountData) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ error: "Error creating account" });
                            }
                            res.json({
                                message: "Customer and Account Created Successfully",
                                customerId,
                                loginId,
                                password: plainPassword,
                                accountNumber: accountData.accountNumber
                            });
                        });
                    } else {
                        res.json({
                            message: "Customer Created Successfully",
                            customerId,
                            loginId,
                            password: plainPassword
                        });
                    }
                }
            );
        }
    );
});

/* 9. ADMIN - CREATE ADDITIONAL ACCOUNT */
app.post("/admin/createAccount", (req, res) => {
    const { loginId, accountType, initialDeposit, internetBanking } = req.body;

    if (!loginId || !accountType) {
        return res.status(400).json({ error: "Login ID and Account Type are required" });
    }

    db.query("SELECT CId FROM Customer WHERE LoginId = ?", [loginId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error finding customer" });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        const customerId = result[0].CId;
        createBankAccount(customerId, accountType, initialDeposit || 0, internetBanking, (err, accountData) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error creating account" });
            }
            res.json({
                message: "Account Created Successfully",
                customerId,
                accountNumber: accountData.accountNumber
            });
        });
    });
});

/* 10. GET SAVING ACCOUNT DETAILS */
app.get("/saving-account/:accountNumber", (req, res) => {
    const accountNumber = req.params.accountNumber;

    db.query(
        "SELECT sa.* FROM SavingAccount sa JOIN BankAccount ba ON sa.AccId = ba.AccId WHERE ba.AccountNumber = ?",
        [accountNumber],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error fetching saving account" });
            }

            if (result.length > 0) {
                res.json(result[0]);
            } else {
                res.json({ MinimumBalance: 1000, InterestRate: 0 });
            }
        }
    );
});

/* 11. GET CURRENT ACCOUNT DETAILS */
app.get("/current-account/:accountNumber", (req, res) => {
    const accountNumber = req.params.accountNumber;

    db.query(
        "SELECT ca.* FROM CurrentAccount ca JOIN BankAccount ba ON ca.AccId = ba.AccId WHERE ba.AccountNumber = ?",
        [accountNumber],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error fetching current account" });
            }

            if (result.length > 0) {
                res.json(result[0]);
            } else {
                res.json({ OverdraftLimit: 0 });
            }
        }
    );
});

/* 12. GET TRANSACTIONS FOR ACCOUNT */
app.get("/transactions/:accountNumber", (req, res) => {
    const accountNumber = req.params.accountNumber;

    db.query(
        "SELECT t.* FROM Transactions t JOIN BankAccount ba ON t.AccountId = ba.AccId WHERE ba.AccountNumber = ? ORDER BY t.TxnDate DESC LIMIT 10",
        [accountNumber],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error fetching transactions" });
            }
            res.json(result || []);
        }
    );
});

/* 13. GET ALL TRANSACTIONS */
app.get("/transactions-all", (req, res) => {
    db.query(
        "SELECT t.* FROM Transactions t ORDER BY t.TxnDate DESC LIMIT 100",
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error fetching transactions" });
            }
            res.json(result || []);
        }
    );
});

/* 14. TRANSFER BETWEEN ACCOUNTS */
app.post("/transfer", (req, res) => {
    const { fromAccount, toAccount, amount } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!fromAccount || !toAccount || !parsedAmount || parsedAmount <= 0) {
        return res.status(400).json({ error: "Invalid transfer details" });
    }

    if (fromAccount === toAccount) {
        return res.status(400).json({ error: "Cannot transfer to the same account" });
    }

    db.query(
        "SELECT AccId, Balance, AccountType FROM BankAccount WHERE AccountNumber = ?",
        [fromAccount],
        (err, fromResult) => {
            if (err || fromResult.length === 0) {
                return res.status(404).json({ error: "From account not found" });
            }

            db.query(
                "SELECT AccId, Balance FROM BankAccount WHERE AccountNumber = ?",
                [toAccount],
                (err, toResult) => {
                    if (err || toResult.length === 0) {
                        return res.status(404).json({ error: "To account not found" });
                    }

                    const fromData = fromResult[0];
                    const toData = toResult[0];
                    const newFromBalance = fromData.Balance - parsedAmount;

                    if (newFromBalance < 0) {
                        return res.status(400).json({ error: "Insufficient balance" });
                    }

                    db.query(
                        "UPDATE BankAccount SET Balance = ? WHERE AccId = ?",
                        [newFromBalance, fromData.AccId],
                        (err) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ error: "Error updating from account" });
                            }

                            const newToBalance = toData.Balance + parsedAmount;
                            db.query(
                                "UPDATE BankAccount SET Balance = ? WHERE AccId = ?",
                                [newToBalance, toData.AccId],
                                (err) => {
                                    if (err) {
                                        console.error(err);
                                        return res.status(500).json({ error: "Error updating to account" });
                                    }

                                    db.query(
                                        "INSERT INTO Transactions (AccountId, Amount, Type, TxnDate, TxnTime) VALUES (?, ?, ?, CURDATE(), CURTIME())",
                                        [fromData.AccId, parsedAmount, "debit"],
                                        (err) => {
                                            if (err) {
                                                console.error(err);
                                                return res.status(500).json({ error: "Error recording transfer" });
                                            }

                                            db.query(
                                                "INSERT INTO Transactions (AccountId, Amount, Type, TxnDate, TxnTime) VALUES (?, ?, ?, CURDATE(), CURTIME())",
                                                [toData.AccId, parsedAmount, "credit"],
                                                (err) => {
                                                    if (err) {
                                                        console.error(err);
                                                        return res.status(500).json({ error: "Error recording transfer" });
                                                    }

                                                    res.json({
                                                        message: "Transfer Successful",
                                                        fromBalance: newFromBalance,
                                                        toBalance: newToBalance
                                                    });
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

/* ====== API END ====== */

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
