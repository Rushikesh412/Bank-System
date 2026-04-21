const API_BASE = window.location.protocol === "file:" ? "http://localhost:3000" : "";

// Helper function to handle fetch responses
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {"Content-Type": "application/json"},
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}

function adminLogin() {
    const username = document.getElementById("adminUser").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    if (username === "Rushikesh" && password === "Rj12345@") {
        window.location.href = "admin.html";
    } else {
        alert("Invalid admin credentials. Please check username and password.");
    }
}

function login() {
    const loginId = document.getElementById("loginId").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!loginId || !password) {
        alert("Please enter both Login ID and password.");
        return;
    }

    fetchAPI("/customer/login", {
        method: "POST",
        body: JSON.stringify({ loginId, password })
    })
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else if (data.message === "Login Success") {
            localStorage.setItem("customerLoginId", data.customer.LoginId);
            window.location.href = "dashboard.html";
        } else {
            alert("Unexpected response");
        }
    })
    .catch(err => alert("Login Error: " + err.message));
}

function register() {
    const name = document.getElementById("name").value.trim();
    const contact = document.getElementById("contact").value.trim();
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();
    const dob = document.getElementById("dob").value;
    const password = document.getElementById("regPassword").value.trim();
    const internetBanking = document.getElementById("internetBanking").checked;

    if (!name || !contact || !dob) {
        alert("Please fill in all required fields.");
        return;
    }

    fetch(`${API_BASE}/register`, {
        method: "POST",
        hAPI("/register", {
        method: "POST",
        body: JSON.stringify({ name, contact, email, address, dob, password, internetBanking })
    })
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(`Registered successfully!\nLogin ID: ${data.loginId}\nPassword: ${data.password}`);
            document.getElementById("name").value = "";
            document.getElementById("contact").value = "";
            document.getElementById("email").value = "";
            document.getElementById("address").value = "";
            document.getElementById("dob").value = "";
            document.getElementById("regPassword").value = "";
            document.getElementById("internetBanking").checked = false;
        }
    })
    .catch(err => alert("Registration Error: " + err.message
function createCustomerAdmin() {
    const name = document.getElementById("adminName").value.trim();
    const contact = document.getElementById("adminContact").value.trim();
    const email = document.getElementById("adminEmail").value.trim();
    const address = document.getElementById("adminAddress").value.trim();
    const dob = document.getElementById("adminDob").value;
    const password = document.getElementById("adminCustomerPassword").value.trim();
    const accountType = document.getElementById("adminAccountType").value;
    const initialDeposit = document.getElementById("adminInitialDeposit").value;
    const internetBanking = document.getElementById("adminInternetBanking").checked;

    if (!name || !contact || !dob) {
        alert("Please fill in all required fields.");
        return;
    }

    fetchAPI("/admin/createCustomer", {
        method: "POST",
        body: JSON.stringify({
            name,
            contact,
            email,
            address,
            dob,
            password,
            accountType,
            initialDeposit: initialDeposit || 0,
            internetBanking
        })
    })
    .then(data => {
        if (data.error) {
            alert("Error: " + data.error);
        } else {
            document.getElementById("adminResult").textContent = `${data.message}\nLogin ID: ${data.loginId}\nPassword: ${data.password}${data.accountNumber ? `\nAccount Number: ${data.accountNumber}` : ""}`;
            document.getElementById("adminName").value = "";
            document.getElementById("adminContact").value = "";
            document.getElementById("adminEmail").value = "";
            document.getElementById("adminAddress").value = "";
            document.getElementById("adminDob").value = "";
            document.getElementById("adminCustomerPassword").value = "";
            document.getElementById("adminAccountType").value = "";
            document.getElementById("adminInitialDeposit").value = "";
            document.getElementById("adminInternetBanking").checked = false;
        }
    })
    .catch(err => alert("Error creating customer: " + err.message));
}

function createAccountAdmin() {
    const loginId = document.getElementById("existingLoginId").value.trim();
    const accountType = document.getElementById("existingAccountType").value;
    const initialDeposit = document.getElementById("existingInitialDeposit").value;
    const internetBanking = document.getElementById("existingInternetBanking").checked;

    if (!loginId || !accountType) {
        alert("Please enter the customer Login ID and account type.");
        return;
    }

    fetchAPI("/admin/createAccount", {
        method: "POST",
        body: JSON.stringify({
            loginId,
            accountType,
            initialDeposit: initialDeposit || 0,
            internetBanking
        })
    })
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            document.getElementById("adminResult").textContent = `${data.message}\nCustomer ID: ${data.customerId}\nAccount Number: ${data.accountNumber}`;
            document.getElementById("existingLoginId").value = "";
            document.getElementById("existingAccountType").value = "";
            document.getElementById("existingInitialDeposit").value = "";
            document.getElementById("existingInternetBanking").checked = false;
        }
    })
    .catch(err => alert("Error creating account: " + err.message));
}

function getAccountDetails() {
    const accountNumber = document.getElementById("searchAccNumber").value.trim();
    if (!accountNumber) {
        alert("Please enter an account number.");
        return;
    }

    fetch(`${API_BASE}/account/${accountNumber}`)
    .then(res => res.json())
    .thenAPI(`/account/${accountNumber}`)
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            document.getElementById("accBalance").textContent = `$${parseFloat(data.Balance).toFixed(2)}`;
            document.getElementById("accType").textContent = data.AccountType;
            document.getElementById("accStatus").textContent = data.Status;
            document.getElementById("accInternet").textContent = data.InternetBankingEnabled ? "Enabled" : "Disabled";
            document.getElementById("accountDetails").style.display = "block";
        }
    })
    .catch(err => alert("Error fetching account details: " + err.message
function getCustomerLoginId() {
    return localStorage.getItem("customerLoginId");
}

function initDashboard() {
    const loginId = getCustomerLoginId();
    if (!loginId) {
        alert("Please login first");
        window.location.href = "index.html";
        return;
    }

    fetchAPI(`/customer/profile/${loginId}`)
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        document.getElementById("customerIdDisplay").textContent = data.customer.LoginId;
        document.getElementById("customerName").textContent = data.customer.Name;
        populateAccounts(data.accounts);
        displayAccountList(data.accounts);
    })
    .catch(err => alert("Dashboard Error: " + err.message));
}

function populateAccounts(accounts) {
    const select = document.getElementById("txnAccSelect");
    const summary = document.getElementById("accountSummary");

    select.innerHTML = '<option value="">-- Select Account --</option>';
    summary.innerHTML = "";

    if (!Array.isArray(accounts) || accounts.length === 0) {
        summary.innerHTML = "<p>No accounts found for this customer.</p>";
        return;
    }

    accounts.forEach(acc => {
        const opt = document.createElement("option");
        opt.value = acc.AccountNumber;
        opt.setAttribute("data-type", acc.AccountType);
        opt.textContent = `${acc.AccountType.toUpperCase()} - ${acc.AccountNumber}`;
        select.appendChild(opt);

        const card = document.createElement("div");
        card.className = "account-card";
        card.innerHTML = `
            <h3>${acc.AccountType.toUpperCase()} - ${acc.AccountNumber}</h3>
            <p><strong>Balance:</strong> $${parseFloat(acc.Balance).toFixed(2)}</p>
            <p><strong>IFSC:</strong> ${acc.IFSC}</p>
            <p><strong>Status:</strong> ${acc.Status}</p>
            <p><strong>Internet Banking:</strong> ${acc.InternetBankingEnabled ? "Enabled" : "Disabled"}</p>
        `;
        summary.appendChild(card);
    });
}

function redirectToTransactionPage() {
    const select = document.getElementById("txnAccSelect");
    const selectedOption = select.options[select.selectedIndex];
    
    if (!selectedOption || !selectedOption.value) return;
    
    const accountType = selectedOption.getAttribute("data-type");
    const accountNumber = selectedOption.value;
    
    if (accountType === "current") {
        window.location.href = `current-transaction.html?account=${accountNumber}`;
    } else if (accountType === "saving") {
        window.location.href = `saving-transaction.html?account=${accountNumber}`;
    }
}

function previewAllTransactions() {
    fetchAPI("/transactions-all")
    .then(data => {
        displayTransactions(data);
    })
    .catch(err => alert("Error loading transactions: " + err.message));
}

function displayTransactions(data) {
    const tableBody = document.getElementById("tableBody");
    const chartContainer = document.getElementById("chartContainer");

    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No transactions found.</td></tr>';
        chartContainer.style.display = "none";
        return;
    }

    let html = "";
    let totalAmount = 0;

    data.forEach(transaction => {
        html += `
            <tr>
                <td>${transaction.TransId}</td>
                <td>${transaction.AccountId}</td>
                <td>$${parseFloat(transaction.Amount).toFixed(2)}</td>
                <td><strong>${transaction.Type.toUpperCase()}</strong></td>
                <td>${transaction.TxnDate}</td>
                <td>${transaction.TxnTime}</td>
            </tr>
        `;
        totalAmount += parseFloat(transaction.Amount);
    });

    tableBody.innerHTML = html;
    document.getElementById("totalTrans").textContent = data.length;
    document.getElementById("totalAmount").textContent = `$${totalAmount.toFixed(2)}`;
    chartContainer.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.endsWith("dashboard.html")) {
        initDashboard();
    }
});

function logout() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("customerLoginId");
        window.location.href = "index.html";
    }
}
