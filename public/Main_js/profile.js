// VARIABLES GLOBALES
let g_orderStatus = '';
let g_orderTime = '';
let g_orderSearch = '';
let g_quoteStatus = '';

document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    if (!userId) { window.location.href = "login.html"; return; }

    // 1. Cargar datos
    loadOrders(userId);
    loadQuotes(userId);
    loadUserInfo(userId);

    // 2. Lógica de URL para abrir acordeón inicial
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab'); 

    setTimeout(() => {
        const accOrders = document.getElementById('acc-orders');
        const accQuotes = document.getElementById('acc-quotes');

        if (accOrders && accQuotes) {
            // Limpieza inicial
            accOrders.classList.remove('active');
            accQuotes.classList.remove('active');

            // Abrir según URL
            if (tab === 'quotes') {
                accQuotes.classList.add('active');
            } else {
                accOrders.classList.add('active'); // Default
            }
            
            // ACTUALIZAR TODO VISUALMENTE
            updateFilterVisibility();
            syncNavbar(); // <--- ¡ESTA ES LA CLAVE AL INICIO!
        }
    }, 100);
});

// --- NUEVA FUNCIÓN: SINCRONIZAR NAV CON ACORDEÓN ---
function syncNavbar() {
    // 1. Identificar los Acordeones
    const accOrders = document.getElementById('acc-orders');
    const accQuotes = document.getElementById('acc-quotes');
    
    // 2. Identificar los Enlaces del Menú de Arriba
    const linkOrders = document.getElementById('link-orders');
    const linkQuotes = document.getElementById('link-quotes');
    const linkMain = document.querySelector('#nav-profile > a'); // El padre "My Profile"

    let activeCount = 0;

    // 3. Sincronizar Pedidos
    if (accOrders && linkOrders) {
        if (accOrders.classList.contains('active')) {
            linkOrders.classList.add('active'); // Pintar naranja
            activeCount++;
        } else {
            linkOrders.classList.remove('active'); // Despintar
        }
    }

    // 4. Sincronizar Cotizaciones
    if (accQuotes && linkQuotes) {
        if (accQuotes.classList.contains('active')) {
            linkQuotes.classList.add('active'); // Pintar naranja
            activeCount++;
        } else {
            linkQuotes.classList.remove('active'); // Despintar
        }
    }

    // 5. Sincronizar el Padre (My Profile)
    // Si hay al menos uno abierto, el padre se queda encendido
    if (linkMain) {
        if (activeCount > 0) linkMain.classList.add('active');
        else linkMain.classList.remove('active');
    }
}

// --- CONTROL DE VISIBILIDAD DE FILTROS ---
function updateFilterVisibility() {
    const accOrders = document.getElementById('acc-orders');
    const accQuotes = document.getElementById('acc-quotes');
    const filtersOrders = document.getElementById('filters-orders');
    const filtersQuotes = document.getElementById('filters-quotes');

    if (accOrders && filtersOrders) {
        filtersOrders.style.display = accOrders.classList.contains('active') ? 'block' : 'none';
    }
    if (accQuotes && filtersQuotes) {
        filtersQuotes.style.display = accQuotes.classList.contains('active') ? 'block' : 'none';
    }
}

// --- FUNCIÓN ACORDEÓN (OnClick) ---
function toggleAccordion(headerElement) {
    const item = headerElement.parentElement;
    
    // Alternar estado abierto/cerrado
    item.classList.toggle('active');
    
    // ¡ACTUALIZAR TODO!
    updateFilterVisibility(); // Muestra/Oculta filtros laterales
    syncNavbar();             // <--- ¡ACTUALIZA EL MENÚ DE ARRIBA!
}

// --- GESTIÓN DE FILTROS (Igual que antes) ---
function setOrderFilter(type, value, element) {
    const userId = localStorage.getItem('userId');
    if (type === 'status') g_orderStatus = value;
    if (type === 'time') g_orderTime = value;

    const parentList = element.parentElement;
    const items = parentList.getElementsByTagName('li');
    for (let li of items) { li.classList.remove('active'); }
    element.classList.add('active');

    loadOrders(userId);
}

function applySearch() {
    const userId = localStorage.getItem('userId');
    g_orderSearch = document.getElementById('orderSearch').value;
    loadOrders(userId);
}

function setQuoteFilter(value, element) {
    const userId = localStorage.getItem('userId');
    g_quoteStatus = value;

    const list = document.getElementById('quote-status-list');
    const items = list.getElementsByTagName('li');
    for (let li of items) { li.classList.remove('active'); }
    element.classList.add('active');

    loadQuotes(userId);
}

function resetFilters() {
    window.location.href = "profile.html";
}

// --- CARGA DE DATOS (Igual que antes) ---
function loadOrders(userId) {
    const tableBody = document.getElementById('orders-list');
    if (!tableBody) return;

    const url = `http://localhost:3000/api/orders?userId=${userId}&status=${g_orderStatus}&time=${g_orderTime}&search=${g_orderSearch}`;

    fetch(url)
        .then(res => res.json())
        .then(result => {
            if (result.status === 'success') {
                const orders = result.data;
                tableBody.innerHTML = ''; 
                if (orders.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:gray;">No orders match your filters.</td></tr>';
                    return;
                }
                orders.forEach(order => {
                    const date = new Date(order.order_date).toLocaleDateString();
                    const row = `
                        <tr>
                            <td>#${order.order_id}</td>
                            <td>${date}</td>
                            <td>${order.shipping_address}</td>
                            <td style="font-weight:bold;">$${parseFloat(order.total).toFixed(2)}</td>
                            <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
                        </tr>`;
                    tableBody.innerHTML += row;
                });
            }
        });
}
function loadQuotes(userId) {
    const tableBody = document.getElementById('quotes-list');
    if (!tableBody) return;

    let url = `http://localhost:3000/api/quotes/user?userId=${userId}`;
    if (g_quoteStatus !== '') url += `&status=${g_quoteStatus}`;

    fetch(url)
        .then(res => res.json())
        .then(result => {
            tableBody.innerHTML = ''; 
            if (result.status === 'success') {
                const quotes = result.data;
                
                if (quotes.length === 0) {
                    // Ajustamos el colspan a 8 porque agregamos una columna
                    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:gray;">No service requests found.</td></tr>';
                    return;
                }

                quotes.forEach(quote => {
                    const priceVal = parseFloat(quote.quote_price || 0);
                    let priceDisplay = priceVal > 0 ? `$${priceVal.toFixed(2)}` : '-';
                    
                    // Respuesta del Gerente (Si es null, ponemos un guion)
                    const responseMsg = quote.manager_response ? quote.manager_response : '<span style="color:#ccc;">-</span>';

                    let actionBtn = '<span style="color:#999; font-size:0.85rem;">Reviewing...</span>';
                    if (quote.status === 'completed') {
                        actionBtn = '<span style="color:green; font-weight:bold;">Paid <i class="fas fa-check"></i></span>';
                    } else if (quote.status === 'contacted' && priceVal > 0) {
                        actionBtn = `<button class="btn-pay-service" style="background-color:#27ae60; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" onclick="payQuote(${quote.quote_id}, ${priceVal})">Pay Now</button>`;
                    }

                    const row = `
                        <tr>
                            <td>#${quote.quote_id}</td>
                            <td><strong>${quote.service_type}</strong></td>
                            <td>${new Date(quote.preferred_date).toLocaleDateString()}</td>
                            <td style="font-size:0.9rem; color:#555;">${quote.description.substring(0, 20)}...</td>
                            <td style="font-weight:bold;">${priceDisplay}</td>
                            <td><span class="status-badge status-${quote.status.toLowerCase()}">${quote.status}</span></td>
                            
                            <td style="font-size:0.9rem; color:#2980b9; font-style:italic; max-width: 150px;">
                                ${responseMsg}
                            </td>

                            <td>${actionBtn}</td>
                        </tr>`;
                    tableBody.innerHTML += row;
                });
            }
        })
        .catch(err => console.error(err));
}

function payQuote(quoteId, amount) {
    const userId = localStorage.getItem('userId');
    if (!confirm(`Do you want to pay $${amount} for this service?`)) return;

    fetch('http://localhost:3000/api/quotes/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, quoteId, amount })
    })
    .then(res => res.json())
    .then(result => {
        if (result.status === 'success') {
            alert("Payment successful!");
            window.location.reload();
        } else {
            alert("Error: " + result.message);
        }
    });
}
// --- FUNCIÓN: CARGAR NOMBRE DEL USUARIO ---
function loadUserInfo(userId) {
    // Pedimos TODA la info: nombre, apellido, email, telefono, direccion
    // (Asegúrate de que tu ruta /api/user/info en server.js devuelva todo esto)
    // Si tu ruta actual solo devuelve first_name y last_name, actualízala abajo*.
    
    fetch(`http://localhost:3000/api/user/info?userId=${userId}`)
        .then(res => res.json())
        .then(result => {
            if (result.status === 'success') {
                const user = result.data;
                
                // Llenar Título de Bienvenida
                const titleLabel = document.getElementById('user-welcome');
                if (titleLabel) titleLabel.textContent = `Welcome, ${user.first_name}`;

                // LLENAR FORMULARIO
                // Usamos 'value' para inputs y 'textContent' para etiquetas
                if(document.getElementById('profEmail')) 
                    document.getElementById('profEmail').value = user.email || '';
                
                if(document.getElementById('profName')) 
                    document.getElementById('profName').value = user.first_name || '';
                
                if(document.getElementById('profLastName')) 
                    document.getElementById('profLastName').value = user.last_name || '';
                
                if(document.getElementById('profPhone')) 
                    document.getElementById('profPhone').value = user.phone || '';
                
                if(document.getElementById('profAddress')) 
                    document.getElementById('profAddress').value = user.address || '';
            }
        })
        .catch(err => console.error(err));
}
function updateUserProfile(event) {
    event.preventDefault(); // Evitar recarga
    const userId = localStorage.getItem('userId');

    const data = {
        userId: userId,
        firstName: document.getElementById('profName').value,
        lastName: document.getElementById('profLastName').value,
        phone: document.getElementById('profPhone').value,
        address: document.getElementById('profAddress').value
    };

    fetch('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.status === 'success') {
            alert("Information updated successfully!");
            // Opcional: Recargar para ver cambios en el header
            // window.location.reload(); 
        } else {
            alert("Error: " + result.message);
        }
    })
    .catch(err => console.error(err));
}