-- Create Database
CREATE DATABASE IF NOT EXISTS BankSystem;
USE BankSystem;

-- ============================================
-- 1️⃣ BANK TABLE (5 attributes + PK)
-- ============================================
CREATE TABLE IF NOT EXISTS Bank (
    BankId INT AUTO_INCREMENT PRIMARY KEY,
    BankName VARCHAR(100) NOT NULL UNIQUE,
    HeadOffice VARCHAR(255),
    FoundedYear INT,
    ContactNumber VARCHAR(20)
);

-- ============================================
-- 2️⃣ BRANCH TABLE (1 Bank → Many Branches)
-- ============================================
CREATE TABLE IF NOT EXISTS Branch (
    BranchId INT AUTO_INCREMENT PRIMARY KEY,
    BranchName VARCHAR(100) NOT NULL,
    Location VARCHAR(255) NOT NULL,
    BankId INT NOT NULL,
    ContactNumber VARCHAR(20),
    FOREIGN KEY (BankId) REFERENCES Bank(BankId) ON DELETE CASCADE
);

-- ============================================
-- 3️⃣ CUSTOMER TABLE (customer login + internet banking)
-- ============================================
CREATE TABLE IF NOT EXISTS Customer (
    CId INT AUTO_INCREMENT PRIMARY KEY,
    LoginId VARCHAR(20) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Name VARCHAR(100) NOT NULL,
    Contact VARCHAR(20) UNIQUE NOT NULL,
    Email VARCHAR(100),
    Address VARCHAR(255),
    DOB DATE NOT NULL,
    IsInternetBankingEnabled BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 4️⃣ EMPLOYEE TABLE (5 attributes + PK)
-- ============================================
CREATE TABLE IF NOT EXISTS Employee (
    EId INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Gender ENUM('M', 'F', 'O') NOT NULL,
    Contact VARCHAR(20) NOT NULL,
    Address VARCHAR(255),
    BranchId INT NOT NULL,
    FOREIGN KEY (BranchId) REFERENCES Branch(BranchId) ON DELETE CASCADE
);

-- ============================================
-- 5️⃣ BANKACCOUNT TABLE (with sequential account number)
-- ============================================
CREATE TABLE IF NOT EXISTS BankAccount (
    AccId INT AUTO_INCREMENT PRIMARY KEY,
    AccountNumber INT NOT NULL UNIQUE,
    CId INT NOT NULL,
    Balance DECIMAL(15,2) DEFAULT 0.00,
    AccountType ENUM('current', 'saving') NOT NULL,
    IFSC VARCHAR(20) DEFAULT 'NBIN0000001',
    Status ENUM('active', 'inactive') DEFAULT 'active',
    InternetBankingEnabled BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (CId) REFERENCES Customer(CId) ON DELETE CASCADE
);

-- ============================================
-- 5.1️⃣ CURRENT ACCOUNT TABLE (extends BankAccount)
-- ============================================
CREATE TABLE IF NOT EXISTS CurrentAccount (
    CurrentAccId INT AUTO_INCREMENT PRIMARY KEY,
    AccId INT NOT NULL UNIQUE,
    OverdraftLimit DECIMAL(15,2) DEFAULT 0.00,
    ChequeBookIssued BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (AccId) REFERENCES BankAccount(AccId) ON DELETE CASCADE
);

-- ============================================
-- 5.2️⃣ SAVING ACCOUNT TABLE (extends BankAccount)
-- ============================================
CREATE TABLE IF NOT EXISTS SavingAccount (
    SavingAccId INT AUTO_INCREMENT PRIMARY KEY,
    AccId INT NOT NULL UNIQUE,
    InterestRate DECIMAL(5,2) DEFAULT 4.50,
    MinimumBalance DECIMAL(15,2) DEFAULT 1000.00,
    WithdrawalLimit INT DEFAULT 5,
    FOREIGN KEY (AccId) REFERENCES BankAccount(AccId) ON DELETE CASCADE
);

-- ============================================
-- 6️⃣ TRANSACTION TABLE (4 attributes + PK + FK)
-- ============================================
CREATE TABLE IF NOT EXISTS Transactions (
    TransId INT AUTO_INCREMENT PRIMARY KEY,
    AccountId INT NOT NULL,
    Amount DECIMAL(15,2) NOT NULL,
    Type ENUM('credit', 'debit') NOT NULL,
    TxnDate DATE DEFAULT (CURDATE()),
    TxnTime TIME DEFAULT (CURTIME()),
    FOREIGN KEY (AccountId) REFERENCES BankAccount(AccId) ON DELETE CASCADE
);

-- ============================================
-- INSERT MASTER DATA
-- ============================================

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

-- 3️⃣ INSERT INTO CUSTOMER (login credentials included)
INSERT INTO Customer (LoginId, Password, Name, Contact, Email, Address, DOB, IsInternetBankingEnabled) 
VALUES 
('CUST0001', 'pwd1234', 'Rajesh Sharma', '9876543210', 'rajesh@example.com', 'Mumbai', '1985-05-20', TRUE),
('CUST0002', 'pwd1234', 'Priya Desai', '9876543211', 'priya@example.com', 'Pune', '1990-08-15', TRUE),
('CUST0003', 'pwd1234', 'Amit Kumar', '9876543212', 'amit@example.com', 'Delhi', '1988-12-10', FALSE),
('CUST0004', 'pwd1234', 'Neha Patel', '9876543213', 'neha@example.com', 'Bangalore', '1992-03-25', FALSE),
('CUST0005', 'pwd1234', 'Vikram Singh', '9876543214', 'vikram@example.com', 'Kolkata', '1987-07-12', TRUE),
('CUST0006', 'pwd1234', 'Sneha Iyer', '9876543215', 'sneha@example.com', 'Chennai', '1993-11-08', TRUE);

-- 4️⃣ INSERT INTO EMPLOYEE (5 fields: Name, Gender, Contact, Address, EId-PK, linked to Branch)
INSERT INTO Employee (Name, Gender, Contact, Address, BranchId) 
VALUES 
('Vikram Singh', 'M', '9111111111', 'Andheri, Mumbai', 1),
('Anjali Verma', 'F', '9111111112', 'Dadar, Mumbai', 1),
('Rohan Gupta', 'M', '9111111113', 'Bandra, Mumbai', 1),
('Sneha Iyer', 'F', '9111111114', 'Pune', 2),
('Arjun Nair', 'M', '9111111115', 'Kothrud, Pune', 2),
('Divya Sharma', 'F', '9111111116', 'Jayanagar, Bangalore', 3),
('Karan Joshi', 'M', '9111111117', 'CP, Delhi', 4),
('Pooja Singh', 'F', '9111111118', 'Salt Lake, Kolkata', 5);

-- 5️⃣ INSERT INTO BANKACCOUNT (sequential AccountNumber starting from 4001)
INSERT INTO BankAccount (AccountNumber, CId, Balance, AccountType, IFSC, Status, InternetBankingEnabled) 
VALUES 
(4001, 1, 50000.00, 'current', 'NBIN0000001', 'active', TRUE),
(4002, 1, 75000.00, 'saving', 'NBIN0000001', 'active', TRUE),
(4003, 2, 100000.00, 'saving', 'NBIN0000001', 'active', TRUE),
(4004, 3, 30000.00, 'current', 'NBIN0000001', 'active', FALSE),
(4005, 4, 150000.00, 'saving', 'NBIN0000001', 'active', FALSE),
(4006, 5, 25000.00, 'current', 'NBIN0000001', 'active', TRUE),
(4007, 6, 80000.00, 'saving', 'NBIN0000001', 'active', TRUE);

-- 5.1️⃣ INSERT INTO CURRENTACCOUNT (for current accounts: AccId 1,3,5)
INSERT INTO CurrentAccount (AccId, OverdraftLimit, ChequeBookIssued) 
VALUES 
(1, 10000.00, TRUE),
(3, 15000.00, TRUE),
(5, 5000.00, FALSE);

-- 5.2️⃣ INSERT INTO SAVINGACCOUNT (for saving accounts: AccId 2,4,6,7)
INSERT INTO SavingAccount (AccId, InterestRate, MinimumBalance, WithdrawalLimit) 
VALUES 
(2, 5.50, 1000.00, 5),
(4, 4.75, 1000.00, 5),
(6, 5.00, 1000.00, 5),
(7, 5.25, 2000.00, 3);

-- 6️⃣ INSERT INTO TRANSACTIONS (4 fields: TransId-PK, Amount, Type(credit/debit), TxnDate, TxnTime, AccountId-FK)
INSERT INTO Transactions (AccountId, Amount, Type, TxnDate, TxnTime) 
VALUES 
(1, 5000.00, 'credit', CURDATE(), CURTIME()),
(2, 2500.00, 'debit', CURDATE(), CURTIME()),
(3, 1000.00, 'credit', CURDATE(), CURTIME()),
(4, 3000.00, 'debit', CURDATE(), CURTIME()),
(5, 1500.00, 'credit', CURDATE(), CURTIME()),
(6, 10000.00, 'debit', CURDATE(), CURTIME()),
(7, 2000.00, 'credit', CURDATE(), CURTIME()),
(1, 500.00, 'credit', CURDATE(), CURTIME());