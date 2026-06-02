// Variables globales
let currentSubtotal = 0;

document.addEventListener('DOMContentLoaded', () => {
    console.log(">>> [SISTEMA]: JS del Carrito cargado correctamente.");
    loadCart();
});

// --- 1. CARGAR CARRITO ---
function loadCart() {
    const userId = localStorage.getItem('userId');
    const cartContainer = document.getElementById('cart-items-container');
    const btnCheckout = document.getElementById('btn-checkout');
    const emptyMsg = document.getElementById('empty-msg');

    if (!userId) { window.location.href = "login.html"; return; }

    fetch(`http://localhost:3000/api/cart?userId=${userId}`)
        .then(res => res.json())
        .then(result => {
            console.log(">>> [API]: Respuesta del carrito:", result);

            if (result.status === 'success') {
                const items = result.data;

                // SI ESTÁ VACÍO
                if (items.length === 0) {
                    cartContainer.innerHTML = '<div style="text-align:center; padding:40px;"><h3>Your cart is empty 🛒</h3><p>Go back to products to add something.</p></div>';
                    updateTotals(0);
                    
                    if(btnCheckout) {
                        btnCheckout.disabled = true;
                        btnCheckout.style.opacity = "0.5";
                        btnCheckout.style.cursor = "not-allowed";
                    }
                    return;
                } 
                
                // SI HAY PRODUCTOS -> ¡ACTIVAR BOTÓN!
                if(btnCheckout) {
                    console.log(">>> [UI]: Activando botón de pago...");
                    btnCheckout.disabled = false;
                    btnCheckout.removeAttribute('disabled'); // Fuerza bruta
                    btnCheckout.style.opacity = "1";
                    btnCheckout.style.cursor = "pointer";
                }
                
                if(emptyMsg) emptyMsg.style.display = "none";

                // RENDERIZAR ITEMS
                cartContainer.innerHTML = '';
                let subtotal = 0;

                items.forEach(item => {
                    const itemTotal = item.price * item.quantity;
                    subtotal += itemTotal;

                    const div = document.createElement('div');
                    div.className = 'cart-item';
                    // Aseguramos que la imagen tenga ruta
                    const imgUrl = item.image_url ? item.image_url : './images/default-image.png';
                    
                    div.innerHTML = `
                        <img src="${imgUrl}" alt="product" referrerpolicy="no-referrer" onerror="this.src='./images/default-image.png'">
                        <div class="item-details">
                            <h3>${item.product_name}</h3>
                            <p class="item-price">$${item.price}</p>
                        </div>
                        <div class="quantity-controls">
                            <button type="button" onclick="updateQuantity(${item.product_id}, ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button type="button" onclick="updateQuantity(${item.product_id}, ${item.quantity + 1})">+</button>
                        </div>
                        <div class="item-actions">
                            <div class="item-total-price">$${itemTotal.toFixed(2)}</div>
                            <button class="btn-delete" onclick="removeFromCart(${item.product_id})"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                    cartContainer.appendChild(div);
                });

                updateTotals(subtotal);
            }
        })
        .catch(err => {
            console.error("Error cargando carrito:", err);
            cartContainer.innerHTML = '<p style="color:red; text-align:center;">Error connecting to server. Check console.</p>';
        });
}

// --- 2. FUNCIONES DE ACTUALIZACIÓN ---

function updateQuantity(productId, newQuantity) {
    const userId = localStorage.getItem('userId');
    if (newQuantity < 1) { removeFromCart(productId); return; }

    fetch('http://localhost:3000/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId, quantity: newQuantity })
    }).then(res => res.json()).then(data => { 
        if(data.status==='success') loadCart(); 
    });
}

function removeFromCart(productId) {
    const userId = localStorage.getItem('userId');
    if(!confirm("Remove item?")) return;
    
    fetch('http://localhost:3000/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId })
    }).then(res => res.json()).then(data => { 
        if(data.status==='success') loadCart(); 
    });
}

function updateTotals(subtotal) {
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cart-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
}

// --- 3. LÓGICA DEL MODAL (VENTANA EMERGENTE) ---

// 2. ABRIR MODAL (Y PRE-LLENAR DATOS SI EXISTEN)
function openCheckoutModal() {
    const userId = localStorage.getItem('userId');
    const modal = document.getElementById('checkoutModal');
    
    // Mostramos el modal
    if(modal) modal.style.display = 'block';

    // Llamamos a la API para ver si ya tenemos datos guardados
    fetch(`http://localhost:3000/api/user/info?userId=${userId}`)
        .then(res => res.json())
        .then(result => {
            if (result.status === 'success') {
                const user = result.data;
                
                // Si la BD tiene dirección, la ponemos en el input
                if (user.address && user.address !== "null") {
                    document.getElementById('checkoutAddress').value = user.address;
                }
                
                // Si la BD tiene teléfono, lo ponemos en el input
                if (user.phone && user.phone !== "null") {
                    document.getElementById('checkoutPhone').value = user.phone;
                }
            }
        })
        .catch(err => console.error("Error cargando datos de usuario:", err));
}
window.closeModal = function() {
    const modal = document.getElementById('checkoutModal');
    if(modal) modal.style.display = 'none';
}

// --- 4. FINALIZAR ORDEN ---
window.finalizeOrder = function(event) {
    event.preventDefault(); 

    const userId = localStorage.getItem('userId');
    const address = document.getElementById('checkoutAddress').value;
    const phone = document.getElementById('checkoutPhone').value;
    const payment = document.getElementById('checkoutPayment').value;

    console.log(">>> [CHECKOUT]: Enviando orden...", { userId, address, phone, payment });

    fetch('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId, 
            shippingAddress: address, 
            phone: phone,       
            paymentMethod: payment 
        })
    })
    .then(res => res.json())
    .then(result => {
        console.log(">>> [CHECKOUT]: Respuesta:", result);
        if (result.status === 'success') {
            alert(`Order #${result.orderId} placed successfully!`);
            closeModal();
            loadCart(); 
        } else {
            alert("Error: " + result.message);
        }
    })
    .catch(err => console.error("Checkout Error:", err));
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('checkoutModal');
    if (event.target == modal) {
        closeModal();
    }
}