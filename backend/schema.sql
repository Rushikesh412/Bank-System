-- Create Database
CREATE DATABASE IF NOT EXISTS BankSystem;
USE BankSystem;

-- Bank Table
CREATE TABLE IF NOT EXISTS Bank (
    BankId INT AUTO_INCREMENT PRIMARY KEY,
    BankName VARCHAR(100) NOT NULL UNIQUE,
    HeadOffice VARCHAR(255),
    FoundedYear INT,
    ContactNumber VARCHAR(20)
);

-- Branch Table
CREATE TABLE IF NOT EXISTS Branch (
    BranchId INT AUTO_INCREMENT PRIMARY KEY,
    BranchName VARCHAR(100) NOT NULL,
    Location VARCHAR(255) NOT NULL,
    BankId INT,
    ContactNumber VARCHAR(20),
    FOREIGN KEY (BankId) REFERENCES Bank(BankId)
);

-- Customer Table
CREATE TABLE IF NOT EXISTS Customer (
    CId INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Address VARCHAR(255),
    Contact VARCHAR(20) UNIQUE NOT NULL,
    DOB DATE,
    Email VARCHAR(100) UNIQUE,
    Password VARCHAR(255) NOT NULL,
    JoinDate DATE,
    Status VARCHAR(20) DEFAULT 'Active'
);

-- Employee Table
CREATE TABLE IF NOT EXISTS Employee (
    EId INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Position VARCHAR(100) NOT NULL,
    Department VARCHAR(100),
    Contact VARCHAR(20),
    Email VARCHAR(100) UNIQUE,
    Salary DECIMAL(10,2),
    BranchId INT,
    JoinDate DATE,
    FOREIGN KEY (BranchId) REFERENCES Branch(BranchId)
);

-- Bank Account Table
CREATE TABLE IF NOT EXISTS BankAccount (
    AccId INT AUTO_INCREMENT PRIMARY KEY,
    CId INT NOT NULL,
    BranchId INT NOT NULL,
    Balance DECIMAL(15,2) DEFAULT 0.00,
    OpenDate DATE,
    Status VARCHAR(20) DEFAULT 'Active',
    FOREIGN KEY (CId) REFERENCES Customer(CId),
    FOREIGN KEY (BranchId) REFERENCES Branch(BranchId)
);

-- Current Account Table
CREATE TABLE IF NOT EXISTS CurrentAccount (
    CurrentAccId INT AUTO_INCREMENT PRIMARY KEY,
    AccId INT NOT NULL UNIQUE,
    OverdraftLimit DECIMAL(15,2) DEFAULT 0.00,
    ChequeBookIssued BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (AccId) REFERENCES BankAccount(AccId)
);

-- Saving Account Table
CREATE TABLE IF NOT EXISTS SavingAccount (
    SavingAccId INT AUTO_INCREMENT PRIMARY KEY,
    AccId INT NOT NULL UNIQUE,
    InterestRate DECIMAL(5,2) DEFAULT 4.50,
    MinimumBalance DECIMAL(15,2) DEFAULT 1000.00,
    WithdrawalLimit INT DEFAULT 5,
    FOREIGN KEY (AccId) REFERENCES BankAccount(AccId)
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS Transactions (
    TransId INT AUTO_INCREMENT PRIMARY KEY,
    FromAcc INT NOT NULL,
    ToAcc INT NOT NULL,
    Amount DECIMAL(15,2) NOT NULL,
    Type VARCHAR(50) NOT NULL,
    TransactionDate DATE NOT NULL,
    TransactionTime TIME NOT NULL,
    Status VARCHAR(20) DEFAULT 'Completed',
    FOREIGN KEY (FromAcc) REFERENCES BankAccount(AccId),
    FOREIGN KEY (ToAcc) REFERENCES BankAccount(AccId)
);

-- 1️⃣ INSERT INTO BANK (Only 1 Bank)
INSERT INTO Bank (BankName, HeadOffice, FoundedYear, ContactNumber) 
VALUES ('National Bank', 'Mumbai', 2000, '1800-123-4567');

-- 2️⃣ INSERT INTO BRANCH (Multiple Branches for 1 Bank)
INSERT INTO Branch (BranchName, Location, BankId, ContactNumber) 
VALUES 
('Mumbai Main', 'Downtown Mumbai', 1, '9876543210'),
('Delhi Branch', 'New Delhi', 1, '9876543211'),
('Bangalore Branch', 'Bangalore', 1, '9876543212'),
('Pune Branch', 'Pune', 1, '9876543213'),
('Kolkata Branch', 'Kolkata', 1, '9876543214');

-- 3️⃣ INSERT INTO CUSTOMER (no dependencies)
INSERT INTO Customer (Name, Address, Contact, DOB, Email, Password, JoinDate, Status) 
VALUES 
('Rajesh Sharma', 'Mumbai', '9876543210', '1985-05-20', 'rajesh@email.com', 'pass123', NOW(), 'Active'),
('Priya Desai', 'Pune', '9876543211', '1990-08-15', 'priya@email.com', 'pass123', NOW(), 'Active'),
('Amit Kumar', 'Delhi', '9876543212', '1988-12-10', 'amit@email.com', 'pass123', NOW(), 'Active'),
('Neha Patel', 'Bangalore', '9876543213', '1992-03-25', 'neha@email.com', 'pass123', NOW(), 'Active'),
('Vikram Singh', 'Kolkata', '9876543214', '1987-07-12', 'vikram@email.com', 'pass123', NOW(), 'Active'),
('Sneha Iyer', 'Chennai', '9876543215', '1993-11-08', 'sneha@email.com', 'pass123', NOW(), 'Active');

-- 4️⃣ INSERT INTO EMPLOYEE (depends on Branch - all branches under 1 Bank)
INSERT INTO Employee (Name, Position, Department, Contact, Email, Salary, BranchId, JoinDate) 
VALUES 
('Vikram Singh', 'Manager', 'Operations', '9111111111', 'vikram.emp@bank.com', 50000, 1, NOW()),
('Anjali Verma', 'Cashier', 'Customer Service', '9111111112', 'anjali@bank.com', 30000, 1, NOW()),
('Rohan Gupta', 'Loan Officer', 'Loans', '9111111113', 'rohan@bank.com', 40000, 1, NOW()),
('Sneha Iyer', 'Account Manager', 'Accounts', '9111111114', 'sneha.emp@bank.com', 35000, 2, NOW()),
('Arjun Nair', 'Manager', 'Operations', '9111111115', 'arjun@bank.com', 52000, 2, NOW()),
('Divya Sharma', 'Cashier', 'Customer Service', '9111111116', 'divya@bank.com', 31000, 3, NOW()),
('Karan Joshi', 'Loan Officer', 'Loans', '9111111117', 'karan@bank.com', 42000, 4, NOW()),
('Pooja Singh', 'Account Manager', 'Accounts', '9111111118', 'pooja@bank.com', 36000, 5, NOW());

-- 5️⃣ INSERT INTO BANKACCOUNT (depends on Customer & Branch)
INSERT INTO BankAccount (CId, BranchId, Balance, OpenDate, Status) 
VALUES 
(1, 1, 50000.00, NOW(), 'Active'),
(1, 1, 75000.00, NOW(), 'Active'),     -- Same customer, 2 accounts
(2, 4, 100000.00, NOW(), 'Active'),
(3, 2, 30000.00, NOW(), 'Active'),
(4, 3, 150000.00, NOW(), 'Active'),
(5, 1, 25000.00, NOW(), 'Active'),
(6, 2, 80000.00, NOW(), 'Active');

-- 6️⃣ INSERT INTO CURRENTACCOUNT (depends on BankAccount)
-- Current Accounts (AccId 1, 3, 5)
INSERT INTO CurrentAccount (AccId, OverdraftLimit, ChequeBookIssued) 
VALUES 
(1, 10000.00, TRUE),
(3, 15000.00, TRUE),
(5, 5000.00, FALSE);

-- 7️⃣ INSERT INTO SAVINGACCOUNT (depends on BankAccount)
-- Saving Accounts (AccId 2, 4, 6, 7)
INSERT INTO SavingAccount (AccId, InterestRate, MinimumBalance, WithdrawalLimit) 
VALUES 
(2, 5.50, 1000.00, 5),
(4, 4.75, 1000.00, 5),
(6, 5.00, 1000.00, 5),
(7, 5.25, 2000.00, 3);

-- 8️⃣ INSERT INTO TRANSACTIONS (depends on BankAccount)
INSERT INTO Transactions (FromAcc, ToAcc, Amount, Type, TransactionDate, TransactionTime, Status) 
VALUES 
(1, 2, 5000.00, 'Transfer', NOW(), CURTIME(), 'Completed'),
(2, 3, 2500.00, 'Transfer', NOW(), CURTIME(), 'Completed'),
(3, 4, 1000.00, 'Transfer', NOW(), CURTIME(), 'Completed'),
(4, 5, 3000.00, 'Transfer', NOW(), CURTIME(), 'Completed'),
(5, 6, 1500.00, 'Transfer', NOW(), CURTIME(), 'Completed'),
(1, 4, 10000.00, 'Transfer', NOW(), CURTIME(), 'Completed'),
(6, 3, 2000.00, 'Transfer', NOW(), CURTIME(), 'Completed'),
(2, 5, 500.00, 'Deposit', NOW(), CURTIME(), 'Completed');