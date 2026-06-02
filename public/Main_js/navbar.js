// js/navbar.js

document.addEventListener('DOMContentLoaded', () => {
    console.log(">>> [SISTEMA]: Cargando Barra de Navegación...");
    checkLoginStatus();
    highlightCurrentPage();
    loadNavCategories();
    highlightProfileMenu();
});

// --- [FUNCIÓN]: Verificar sesión ---
function checkLoginStatus() {
    // Obtener datos del almacenamiento local
    const userId = localStorage.getItem('userId');

    const navLogin = document.getElementById('nav-login');
    const navLogout = document.getElementById('nav-logout');
    const navCart = document.getElementById('nav-cart');
    const navProfile = document.getElementById('nav-profile');

    if (!navLogin || !navLogout || !navCart) return;

    // --- [ESTRUCTURA DE CONTROL]: IF / ELSE ---
    console.log(`>>> [CONTROL]: Verificando estado de usuario. ID: ${userId ? userId : 'Invitado'}`);

    if (userId) {
        // Usuario Logueado
        navLogin.style.display = 'none';
        navLogout.style.display = 'block';
        navCart.style.display = 'block';
        if(navProfile) navProfile.style.display = 'block';
        
        updateCartBadge(userId);
    } else {
        // Usuario Invitado
        navLogin.style.display = 'block';
        navLogout.style.display = 'none';
        navCart.style.display = 'none';
        if(navProfile) navProfile.style.display = 'none';
    }
}

// --- [FUNCIÓN]: Cerrar Sesión ---
function logout() {
    console.log(">>> [ACCIÓN]: Cerrando sesión...");
    localStorage.removeItem('userId');
    alert("You have logged out successfully.");
    window.location.href = "/Final_Project_QT_SW_UNIT_3/Main_index/index.html";
}

function updateCartBadge(userId) {
    fetch(`http://localhost:3000/api/cart/count?userId=${userId}`)
        .then(response => response.json())
        .then(result => {
            const badge = document.getElementById('cart-count');
            // --- [OBJETO]: Accediendo a propiedad del objeto respuesta ---
            if (result.status === 'success' && badge) {
                console.log(">>> [DATOS]: Items en carrito:", result.count);
                badge.textContent = result.count;
            }
        })
        .catch(error => console.error('Error loading cart count:', error));
}

// --- [FUNCIÓN]: Resaltar página actual ---
function highlightCurrentPage() {
    // --- [ARREGLO]: Convertir ruta en arreglo y tomar el último elemento ---
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll('.indice nav a');

    // --- [CICLO]: Recorrer enlaces (ForEach) ---
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

}
function loadNavCategories() {
    const container = document.getElementById('nav-categories');
    if (!container) return;

    // 1. LEER LA URL: ¿En qué categoría estamos?
    const urlParams = new URLSearchParams(window.location.search);
    const currentCatId = urlParams.get('category'); // Ejemplo: "1", "2"

    // Llamamos a la API
    fetch('http://localhost:3000/api/categories')
        .then(res => res.json())
        .then(result => {
            if (result.status === 'success') {
                container.innerHTML = ''; // Limpiar

                // Opción "All Products"
                // Si estamos en productos pero SIN categoría, marcamos este
                const isAllActive = (window.location.pathname.includes('products.html') && !currentCatId) ? 'active' : '';
                
                container.innerHTML += `<li><a href="products.html" class="${isAllActive}">All Products</a></li>`;

                // Llenar con la BD
                result.data.forEach(cat => {
                    
                    // 2. COMPARACIÓN: Si el ID de la URL coincide con el de la BD
                    // Usamos '==' para que coincida texto "1" con número 1
                    const activeClass = (cat.category_id == currentCatId) ? 'active' : '';

                    container.innerHTML += `
                        <li>
                            <a href="products.html?category=${cat.category_id}" class="${activeClass}">
                                ${cat.category_name}
                            </a>
                        </li>
                    `;
                });
            }
        })
        .catch(err => console.error("Error cargando menú:", err));
}
function highlightProfileMenu() {
    // 1. Verificamos si estamos en la página de perfil
    if (!window.location.pathname.includes('profile.html')) return;

    // 2. Leemos la URL para ver qué pestaña pide (?tab=...)
    const urlParams = new URLSearchParams(window.location.search);
    const currentTab = urlParams.get('tab'); 

    // 3. Obtenemos los enlaces por su ID (asegúrate de tener estos IDs en el HTML)
    const linkOrders = document.getElementById('link-orders');
    const linkQuotes = document.getElementById('link-quotes');
    const linkMain = document.querySelector('#nav-profile > a'); // El botón principal "My Profile"

    // 4. Limpieza inicial: Quitamos la clase 'active' de todos
    if(linkOrders) linkOrders.classList.remove('active');
    if(linkQuotes) linkQuotes.classList.remove('active');
    if(linkMain) linkMain.classList.remove('active');

    // 5. Lógica de pintado
    if (currentTab === 'quotes') {
        // Si estamos en Cotizaciones
        if (linkQuotes) linkQuotes.classList.add('active');
        if (linkMain) linkMain.classList.add('active'); // Mantenemos el padre encendido
    } else {
        // Por defecto (Orders) o si el tab es 'orders'
        if (linkOrders) linkOrders.classList.add('active');
        if (linkMain) linkMain.classList.add('active');
    }
}