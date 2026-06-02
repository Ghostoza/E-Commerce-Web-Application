// --- 1. CONFIGURACIÓN Y ARREGLOS ---
const bannedWords = ['spam', 'fake', 'bot', 'money', 'estafa']; // Agregué una más ;)

document.addEventListener('DOMContentLoaded', () => {
    console.log(">>> [System]: Contact Module Loaded & Ready.");
});

// --- 2. LISTENER DEL FORMULARIO ---
document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    console.log("------------------------------------------------");
    console.log(">>> [Evento]: Formulario enviado. Iniciando validación...");

    // Obtener valores
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;

    // --- 3. CREACIÓN DE OBJETO ---
    const contactRequest = {
        id: Date.now(),
        user: name,
        contactEmail: email,
        topic: subject,
        content: message,
        status: 'validating'
    };

    console.log(">>> [Objeto Creado]:", contactRequest);

    // Validar
    if (validateMessage(contactRequest)) {
        console.log(">>> [Control]: Validación EXITOSA. Conectando con API...");
        sendDataToAPI(contactRequest); // Llamamos a la función real
    } else {
        console.warn(">>> [Control]: Validación FALLIDA. Contenido prohibido.");
        alert("Error: Your message contains forbidden words.");
    }
});

// --- 4. LÓGICA DE VALIDACIÓN (CICLOS) ---
function validateMessage(dataObject) {
    const textToCheck = dataObject.content.toLowerCase();
    let isValid = true;

    console.log(">>> [Ciclo]: Escaneando mensaje por palabras prohibidas...");

    for (let i = 0; i < bannedWords.length; i++) {
        const word = bannedWords[i];
        if (textToCheck.includes(word)) {
            console.error(`>>> [Alerta]: Palabra prohibida detectada: "${word}"`);
            isValid = false;
            break; // Eficiencia: Si encontramos una, paramos
        }
    }
    return isValid;
}

// --- 5. ENVÍO REAL A BASE DE DATOS (API) ---
function sendDataToAPI(data) {
    // Preparamos el JSON que espera el Backend
    // (El backend espera: name, email, subject, message)
    const payload = {
        name: data.user,
        email: data.contactEmail,
        subject: data.topic,
        message: data.content
    };

    console.log(">>> [Red]: Enviando petición POST a /api/contact...", payload);
    const btn = document.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "Sending...";
    btn.disabled = true;

    fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(result => {
        console.log(">>> [Red]: Respuesta del Servidor:", result);
        
        if (result.status === 'success') {
            alert(`Thank you, ${data.user}! Message saved in database.`);
            document.getElementById('contactForm').reset();
        } else {
            alert("Server Error: " + result.message);
        }
    })
    .catch(err => {
        console.error(">>> [Red]: Error de conexión:", err);
        alert("Could not connect to server.");
    })
    .finally(() => {
        btn.innerText = originalText;
        btn.disabled = false;
    });
}