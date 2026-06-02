document.addEventListener("DOMContentLoaded", function() {
    
    const formulario = document.getElementById("formularioRegistro");
    const respuestaDiv = document.getElementById("respuesta");

    formulario.addEventListener("submit", function(e) {
        // Evita que la página se recargue
        e.preventDefault(); 
        
        // Crea un objeto con los datos del formulario
        const datos = {
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        // Envía los datos al endpoint de registro en tu servidor Node.js
        fetch('http://localhost:3000/registrar-usuario', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(datos) // Convierte el objeto a un string JSON
        })
        .then(response => response.json()) // Convierte la respuesta del servidor a JSON
        .then(data => {
            // 'data' es la respuesta JSON que envió tu server.js
            if(data.status === 'exito') {
                respuestaDiv.innerHTML = `<p style="color:green;">${data.mensaje}</p>`;
                formulario.reset(); // Limpia el formulario
            } else {
                // Muestra el mensaje de error que envió el servidor
                respuestaDiv.innerHTML = `<p style="color:red;">Error: ${data.mensaje}</p>`;
            }
        })
        .catch(error => {
            // Esto captura errores de conexión (ej. si el servidor está apagado)
            console.error('Error de conexión:', error);
            respuestaDiv.innerHTML = `<p style="color:red;">Ocurrió un error de conexión con el servidor.</p>`;
        });
    });
});