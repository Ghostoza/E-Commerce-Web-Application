// js/register.js

document.getElementById('formularioRegistro').addEventListener('submit', function(event) {
    event.preventDefault();
    
    console.log(">>> [FUNCIÓN]: Iniciando proceso de registro...");

    // 1. Obtener valores
    const firstName = document.getElementById('first_name').value;
    const lastName = document.getElementById('last_name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const respuesta = document.getElementById('respuesta');

    // --- EVIDENCIA: ESTRUCTURA DE CONTROL (VALIDACIÓN) ---
    console.log(">>> [CONTROL IF]: Verificando campos vacíos...");
    if (!firstName || !lastName || !email || !password) {
        console.warn(">>> [ERROR]: Faltan campos por llenar.");
        respuesta.textContent = 'Please complete all fields.';
        respuesta.className = 'error';
        respuesta.style.display = 'block';
        return;
    }

    // --- EVIDENCIA: ESTRUCTURA DE CONTROL (LONGITUD) ---
    console.log(`>>> [CONTROL IF]: Verificando longitud de contraseña (${password.length} caracteres)...`);
    if (password.length < 8) {
        console.warn(">>> [ERROR]: Contraseña muy corta.");
        respuesta.textContent = 'Password must be at least 8 characters long.';
        respuesta.className = 'error';
        respuesta.style.display = 'block';
        return;
    }

    // --- EVIDENCIA: USO DE OBJETOS ---
    const userData = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password
    };
    console.log(">>> [OBJETO CREADO]: Datos del usuario empaquetados:", userData);

    // Enviar a la API
    fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(result => {
        console.log(">>> [API]: Respuesta recibida:", result);
        if (result.status === 'success') {
            respuesta.textContent = 'Account created successfully! Redirecting...';
            respuesta.className = 'success';
            respuesta.style.display = 'block';
            setTimeout(() => { window.location.href = "/Final_Project_QT_SW_UNIT_3/Main_index/login.html"; }, 2000);
        } else {
            respuesta.textContent = result.message;
            respuesta.className = 'error';
            respuesta.style.display = 'block';
        }
    })
    .catch(error => console.error('Error:', error));
});