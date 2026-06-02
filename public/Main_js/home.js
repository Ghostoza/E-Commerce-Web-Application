// js/home.js

document.addEventListener('DOMContentLoaded', () => {
    console.log(">>> [INICIO]: Cargando Productos Destacados...");
    const grid = document.getElementById('featured-products-grid');

    fetch('http://localhost:3000/api/products?limit=3')
        .then(response => response.json())
        .then(result => {
            // --- [ESTRUCTURA DE CONTROL] ---
            if (result.status === 'success' && result.data.length > 0) {
                grid.innerHTML = ''; 
                
                const products = result.data;

                // --- [ARREGLO]: Imprimir el arreglo recibido de la BD ---
                console.log(">>> [ARREGLO]: Productos recibidos del servidor:", products);

                // --- [CICLO]: Iterar sobre el arreglo (ForEach) ---
                products.forEach((product, index) => {
                    console.log(`   > [CICLO Vuelta ${index + 1}]: Renderizando ${product.product_name}`);

                    // --- [OBJETO]: Accediendo a propiedades del objeto 'product' ---
                    const image = product.image_url || './images/default.jpg';

                    const card = document.createElement('div');
                    card.className = 'product-card';
                    
                    card.innerHTML = `
                        <div class="product-image" style="background-image: url('${image}');"></div>
                        <div class="product-info">
                            <h3>${product.product_name}</h3>
                            <p>$${product.price}</p>
                            <a href="products.html" class="btn">View Details</a>
                        </div>
                    `;
                    grid.appendChild(card);
                });
            } else {
                console.warn(">>> [ALERTA]: No se encontraron productos destacados.");
                grid.innerHTML = '<p style="text-align:center; width:100%;">No featured products found.</p>';
            }
        })
        .catch(error => console.error('Error:', error));
});