function makeTransaction() {
    fetch(API + "/transaction", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            accId: accId.value,
            amount: amount.value,
            type: type.value
        })
    })
    .then(res => res.text())
    .then(msg => alert(msg));
}

