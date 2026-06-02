document.getElementById('serviceForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert("Please login to request a quote.");
        window.location.href = "login.html";
        return;
    }

    const data = {
        userId: userId,
        serviceType: document.getElementById('serviceType').value,
        date: document.getElementById('serviceDate').value,
        description: document.getElementById('serviceDesc').value
    };

    fetch('http://localhost:3000/api/quotes/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.status === 'success') {
            alert("Request received! We will contact you shortly.");
            document.getElementById('serviceForm').reset();
        } else {
            alert("Error: " + result.message);
        }
    })
    .catch(err => console.error(err));
});