/* -------- LOGIN -------- */
function login() {
    const contact = document.getElementById("loginContact").value;
    const password = document.getElementById("loginPassword").value;

    if (!contact || !password) {
        alert("Please fill in all fields");
        return;
    }

    fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ contact, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message === "Login Success") {
            alert("Login successful!");
            localStorage.setItem("customerId", data.customerId);
            window.location.href = "dashboard.html";
        } else {
            alert("Invalid credentials");
        }
    })
    .catch(err => alert("Error: " + err));
}

/* -------- REGISTER -------- */
function register() {
    const name = document.getElementById("name").value;
    const address = document.getElementById("address").value;
    const contact = document.getElementById("contact").value;
    const email = document.getElementById("email").value;
    const dob = document.getElementById("dob").value;
    const password = document.getElementById("password").value;

    if (!name || !contact || !password) {
        alert("Please fill in all required fields");
        return;
    }

    fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name, address, contact, email, dob, password })
    })
    .then(res => res.text())
    .then(msg => {
        alert(msg);
        if (msg === "Registered Successfully") {
            document.getElementById("name").value = "";
            document.getElementById("address").value = "";
            document.getElementById("contact").value = "";
            document.getElementById("email").value = "";
            document.getElementById("dob").value = "";
            document.getElementById("password").value = "";
        }
    })
    .catch(err => alert("Error: " + err));
}

/* -------- SELECT BRANCH -------- */
function selectBranch() {
    const branchSelect = document.getElementById("branchSelect").value;
    const branchNames = {
        1: "Mumbai Main Branch",
        2: "Delhi Branch",
        3: "Bangalore Branch",
        4: "Pune Branch",
        5: "Kolkata Branch"
    };
    
    if (branchSelect) {
        document.getElementById("branchInfo").textContent = "Branch: " + branchNames[branchSelect];
    }
}

/* -------- LOAD BRANCH INFO -------- */
function loadBranchInfo() {
    const branchId = document.getElementById("branchSelect").value;
    if (!branchId) {
        alert("Please select a branch");
        return;
    }

    fetch("http://localhost:3000/branch/" + branchId)
    .then(res => res.json())
    .then(data => {
        alert("Branch: " + data.BranchName + "\nLocation: " + data.Location + "\nContact: " + data.ContactNumber);
    })
    .catch(err => alert("Error loading branch info: " + err));
}

/* -------- CREATE ACCOUNT -------- */
function createAccount() {
    const cid = document.getElementById("cid").value;
    const balance = document.getElementById("balance").value;
    const branchId = document.getElementById("branchIdAccount").value;

    if (!cid || !balance || !branchId) {
        alert("Please fill in all fields");
        return;
    }

    fetch("http://localhost:3000/createAccount", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ cid, balance, branchId })
    })
    .then(res => res.text())
    .then(msg => {
        alert(msg);
        if (msg.includes("Account Created") || msg.includes("Success")) {
            document.getElementById("cid").value = "";
            document.getElementById("balance").value = "";
            document.getElementById("branchIdAccount").value = "";
        }
    })
    .catch(err => alert("Error: " + err));
}

/* -------- GET ACCOUNT DETAILS -------- */
function getAccountDetails() {
    const accId = document.getElementById("checkAccId").value;
    
    if (!accId) {
        alert("Please enter Account ID");
        return;
    }

    fetch("http://localhost:3000/account/" + accId)
    .then(res => res.json())
    .then(data => {
        if (data.AccId) {
            document.getElementById("accBalance").textContent = "$" + parseFloat(data.Balance).toFixed(2);
            document.getElementById("accStatus").textContent = data.Status;
            document.getElementById("accType").textContent = data.Type || "Bank Account";
            document.getElementById("accountDetails").style.display = "block";
        } else {
            alert("Account not found");
        }
    })
    .catch(err => alert("Error: " + err));
}

/* -------- TRANSFER MONEY -------- */
function transfer() {
    const fromAcc = document.getElementById("fromAcc").value;
    const toAcc = document.getElementById("toAcc").value;
    const amount = document.getElementById("amount").value;
    const type = document.getElementById("transType").value;

    if (!fromAcc || !toAcc || !amount || !type) {
        alert("Please fill in all fields");
        return;
    }

    if (parseFloat(amount) <= 0) {
        alert("Amount must be greater than 0");
        return;
    }

    fetch("http://localhost:3000/transfer", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ fromAcc, toAcc, amount, type })
    })
    .then(res => res.text())
    .then(msg => {
        alert(msg);
        if (msg.includes("Success") || msg.includes("Transfer")) {
            document.getElementById("fromAcc").value = "";
            document.getElementById("toAcc").value = "";
            document.getElementById("amount").value = "";
            document.getElementById("transType").value = "";
            loadTransactions();
        }
    })
    .catch(err => alert("Error: " + err));
}

/* -------- LOAD TRANSACTIONS FOR SPECIFIC ACCOUNT -------- */
function loadTransactions() {
    const viewAcc = document.getElementById("viewAcc").value;

    if (!viewAcc) {
        alert("Please enter an Account ID");
        return;
    }

    fetch("http://localhost:3000/transactions/" + viewAcc)
    .then(res => res.json())
    .then(data => {
        displayTransactions(data, "specific");
    })
    .catch(err => {
        alert("Error loading transactions: " + err);
    });
}

/* -------- LOAD ALL TRANSACTIONS -------- */
function previewAllTransactions() {
    fetch("http://localhost:3000/transactions/all")
    .then(res => res.json())
    .then(data => {
        displayTransactions(data, "all");
    })
    .catch(err => {
        alert("Error loading transactions: " + err);
    });
}

/* -------- DISPLAY TRANSACTIONS -------- */
function displayTransactions(data, type) {
    let tableBody = document.getElementById("tableBody");
    let chartContainer = document.getElementById("chartContainer");
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">No transactions found.</td></tr>';
        chartContainer.style.display = "none";
        return;
    }

    let html = "";
    let totalAmount = 0;

    data.forEach(transaction => {
        const status = transaction.Status || "Completed";
        const statusClass = status === "Completed" ? "status-completed" : 
                           status === "Pending" ? "status-pending" : "status-failed";
        
        html += `
            <tr>
                <td>${transaction.TransId}</td>
                <td>${transaction.FromAcc}</td>
                <td>${transaction.ToAcc}</td>
                <td>$${parseFloat(transaction.Amount).toFixed(2)}</td>
                <td>${transaction.Type}</td>
                <td>${formatDate(transaction.TransactionDate)}</td>
                <td>${transaction.TransactionTime}</td>
                <td><span class="${statusClass}">${status}</span></td>
            </tr>
        `;
        totalAmount += parseFloat(transaction.Amount);
    });

    tableBody.innerHTML = html;

    // Show chart
    document.getElementById("totalTrans").textContent = data.length;
    document.getElementById("totalAmount").textContent = "$" + totalAmount.toFixed(2);
    chartContainer.style.display = "block";
}

/* -------- FORMAT DATE -------- */
function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/* -------- LOGOUT -------- */
function logout() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("customerId");
        window.location.href = "index.html";
    }
}
            <th>ID</th>
            <th>From</th>
            <th>To</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Date</th>
            <th>Time</th>
        </tr>`;

        data.forEach(t => {
            table.innerHTML += `
            <tr>
                <td>${t.TransId}</td>
                <td>${t.FromAcc}</td>
                <td>${t.ToAcc}</td>
                <td>${t.Amount}</td>
                <td>${t.Type}</td>
                <td>${t.Date}</td>
                <td>${t.Time}</td>
            </tr>`;
        });
    })
    .catch(err => alert("Error: " + err));
}

