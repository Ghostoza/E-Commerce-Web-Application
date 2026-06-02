// js/login.js

document.addEventListener('submit', function(event) {
    if (event.target.id !== 'formularioLogin') return;
    
    event.preventDefault();
    console.log(">>> [FUNCIÓN]: Evento Submit detectado en Login.");
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const respuesta = document.getElementById('respuesta');

    // --- EVIDENCIA: OBJETO PARA API ---
    const loginData = {
        email: email,
        password: password
    };
    console.log(">>> [OBJETO]: Credenciales preparadas para envío:", loginData);

    fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
    })
    .then(response => response.json())
    .then(result => {
        console.log(">>> [LOGICA]: Evaluando respuesta del servidor...");
        
        // --- EVIDENCIA: ESTRUCTURA DE CONTROL ---
        if (result.status === 'success') {
            console.log(">>> [EXITO]: Usuario autenticado. Guardando sesión.");
            localStorage.setItem('userId', result.user.userId);
            
            respuesta.textContent = `Login successful! Welcome back, ${result.user.firstName}!`;
            respuesta.className = 'success';
            respuesta.style.display = 'block';
            
            setTimeout(() => { window.location.href = "index.html"; }, 1500);
        } else {
            console.warn(">>> [FALLO]: Credenciales incorrectas.");
            respuesta.textContent = result.message;
            respuesta.className = 'error';
            respuesta.style.display = 'block';
        }
    })
    .catch(error => console.error('Error:', error));
});