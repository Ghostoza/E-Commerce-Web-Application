// js/products.js

// Variables globales

// VARIABLES GLOBALES (Estado de los filtros)

let minPrice = null;
let maxPrice = null;
let minStock = 0;
let currentSearch = "";
let currentCategory = ""; // Aquí guardaremos el ID activo

document.addEventListener("DOMContentLoaded", () => {
  console.log(">>> [SISTEMA]: Iniciando módulo de Productos...");

  // 1. LEER URL (Lo primero que hacemos)
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromUrl = urlParams.get("category");

  // 2. Configurar estado inicial basado en la URL
  if (categoryFromUrl) {
    console.log(">>> [FILTRO]: Categoría detectada desde URL ID:", categoryFromUrl);
    currentCategory = categoryFromUrl; // Guardamos el ID
  } else {
    currentCategory = ""; // "All Products"
  }

  // 3. Cargar Interfaz
  // Pasamos el ID actual a loadCategories para que sepa cuál pintar de naranja
  loadCategories(currentCategory); 
  loadProducts();

  // 4. Configurar Buscador
  const searchBar = document.getElementById("search-bar");
  if (searchBar) {
    searchBar.addEventListener("input", (e) => {
      currentSearch = e.target.value;
      loadProducts();
    });
  }
});

// --- FUNCIÓN: CARGAR CATEGORÍAS (Modificada para resaltar la activa) ---
function loadCategories(activeId) {
  fetch("http://localhost:3000/api/categories")
    .then((res) => res.json())
    .then((result) => {
      const list = document.getElementById("category-list");
      
      if (result.status === "success") {
        list.innerHTML = ""; // Limpiar "Loading..."

        // A) Opción "All Products"
        const allItem = document.createElement("li");
        allItem.textContent = "All Products";
        
        // VERIFICACIÓN: ¿Es esta la activa? (Si activeId está vacío)
        if (activeId === "" || activeId === null) {
            allItem.className = "active";
        }
        
        allItem.onclick = () => selectCategory("", allItem);
        list.appendChild(allItem);

        // B) Categorías de la BD
        result.data.forEach((cat) => {
          const item = document.createElement("li");
          item.textContent = cat.category_name;
          
          // VERIFICACIÓN: ¿Es esta la activa? (Comparamos IDs)
          // Convertimos a String ambos para asegurar que "1" sea igual a 1
          if (String(cat.category_id) === String(activeId)) {
              item.className = "active";
          }

          item.onclick = () => selectCategory(cat.category_id, item);
          list.appendChild(item);
        });
      }
    })
    .catch(err => console.error("Error loading categories:", err));
}

// --- FUNCIÓN: SELECCIONAR CATEGORÍA (Click Manual) ---
function selectCategory(categoryId, elementHTML) {
  console.log(`>>> [FUNCIÓN]: Categoría seleccionada ID: ${categoryId}`);
  
  // 1. Actualizar variable
  currentCategory = categoryId;

  // 2. Actualizar visualmente (Quitar naranja a todos, poner al nuevo)
  document
    .querySelectorAll("#category-list li")
    .forEach((li) => li.classList.remove("active"));
    
  if (elementHTML) elementHTML.classList.add("active");

  // 3. Recargar productos
  loadProducts();
  
  // (Opcional) Actualizar la URL sin recargar la página para que se vea profesional
  const newUrl = categoryId ? `?category=${categoryId}` : window.location.pathname;
  window.history.pushState({path: newUrl}, '', newUrl);
}



// --- FUNCIÓN: AGREGAR AL CARRITO ---
function addToCart(productId) {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    alert("Please log in to add items.");
    window.location.href = "login.html";
    return;
  }

  fetch("http://localhost:3000/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId, quantity: 1 }),
  })
    .then((res) => res.json())
    .then((result) => {
      if (result.status === "success") {
        if (typeof updateCartBadge === "function") updateCartBadge(userId);
        alert("Product added to cart!");
      }
    });
}

// --- 1. FUNCIÓN PARA FILTRAR PRECIO ---
function setPriceFilter(min, max, elementHTML) {
    minPrice = min;
    maxPrice = max;

    // Visual: Pintar el seleccionado
    updateActiveFilter('price-filters', elementHTML);
    
    loadProducts(); // Recargar con nuevos datos
}

// --- 2. FUNCIÓN PARA FILTRAR STOCK ---
function setStockFilter(min, elementHTML) {
    minStock = min;

    // Visual: Pintar el seleccionado
    updateActiveFilter('stock-filters', elementHTML);
    
    loadProducts();
}

// --- 3. AUXILIAR VISUAL (Quita naranja a todos, pone al nuevo) ---
function updateActiveFilter(listId, activeElement) {
    const listItems = document.querySelectorAll(`#${listId} li`);
    listItems.forEach(li => li.classList.remove('active'));
    activeElement.classList.add('active');
}

// --- 4. LIMPIAR TODO ---
function clearAllFilters() {
    minPrice = null;
    maxPrice = null;
    minStock = 0;
    currentSearch = "";
    currentCategory = "";
    
    // Resetear visualmente (Esto requiere recargar o limpiar clases manualmente)
    location.href = "products.html"; // La forma más fácil es recargar limpio
}

// --- 5. LOAD PRODUCTS (ACTUALIZADO CON NUEVOS PARÁMETROS) ---
function loadProducts() {
    const container = document.getElementById("product-list");
    if (!container) return;
    
    container.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    // CONSTRUIMOS LA URL CON TODOS LOS FILTROS
    let url = `http://localhost:3000/api/products?`;
    const params = new URLSearchParams();
    
    if (currentSearch) params.append("search", currentSearch);
    if (currentCategory) params.append("category", currentCategory);
    
    // NUEVOS PARAMETROS
    if (minPrice !== null) params.append("minPrice", minPrice);
    if (maxPrice !== null) params.append("maxPrice", maxPrice);
    if (minStock > 0) params.append("minStock", minStock);

    fetch(url + params.toString())
        .then((res) => res.json())
        .then((result) => {
            container.innerHTML = ""; 

            if (result.status === "success") {
                const products = result.data;
                
                if (products.length === 0) {
                    container.innerHTML = '<p class="error-message">No products match your filters.</p>';
                    return;
                }

                // ... (Tu ciclo forEach para pintar las tarjetas sigue igual) ...
                 products.forEach((product) => {
                    // ... crear card ...
                     const card = document.createElement("div");
                     card.className = "product-card";
                     card.innerHTML = `
                        <img src="${product.image_url || "./images/default-image.png"}" alt="${product.product_name}" referrerpolicy="no-referrer">
                        <div class="product-card-content">
                            <h3>${product.product_name}</h3>
                            <div class="price">$${product.price}</div>
                            
                            <div class="stock" style="${product.stock_quantity < 10 ? 'color:red' : 'color:green'}">
                                <i class="fas fa-layer-group"></i> Stock: ${product.stock_quantity}
                            </div>
                            
                            <button class="btn-add-cart" onclick="addToCart(${product.product_id})">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                        </div>`;
                    container.appendChild(card);
                 });
            }
        })
        .catch(err => console.error(err));
}