const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;


// CONFIGURACIÓN INICIAL (MIDDLEWARES)

app.use(cors());         // Permite que el Frontend (puerto 5500) hable con el Backend (puerto 3000)
app.use(express.json()); // Permite al servidor entender datos en formato JSON

// 1. Primero busca recursos (CSS, JS, IMG) en 'public'
app.use(express.static(path.join(__dirname, 'public')));

// 2. Luego busca páginas HTML en 'paginas'
app.use(express.static(path.join(__dirname, 'Main_index')));

// CONEXIÓN A LA BASE DE DATOS

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Fkkgry47__%4', // Tu contraseña de MySQL
    database: 'proyecto',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise(); // Usamos promesas para poder usar async/await


// RUTAS DE AUTENTICACIÓN (LOGIN Y REGISTRO)


// --- 1. REGISTRO (Solo para Clientes) ---
app.post('/api/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Validación de campos vacíos
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ status: 'error', message: 'Todos los campos son obligatorios.' });
        }
        // Validación de longitud de contraseña
        if (password.length < 8) {
            return res.status(400).json({ status: 'error', message: 'La contraseña debe tener al menos 8 caracteres.' });
        }

        // Verificar si el correo ya existe
        const [existingUsers] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ status: 'error', message: 'El correo electrónico ya está registrado.' });
        }

        // Encriptar la contraseña antes de guardarla
        const password_hash = await bcrypt.hash(password, 10);
        const role_id = 1; // Rol de Cliente

        // Insertar el nuevo usuario en la base de datos
        await db.execute(
            "INSERT INTO users (role_id, first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?, ?)",
            [role_id, firstName, lastName, email, password_hash]
        );

        res.status(201).json({ status: 'success', message: '¡Cuenta creada exitosamente!' });

    } catch (error) {
        console.error('Error en /api/register:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

// --- 2. INICIO DE SESIÓN (Solo para Clientes) ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Correo y contraseña requeridos.' });
        }

        // Buscar al usuario y su rol en la base de datos
        const [rows] = await db.execute(
            "SELECT users.*, roles.role_name FROM users JOIN roles ON users.role_id = roles.role_id WHERE users.email = ?",
            [email]
        );

        // Si no se encuentra el usuario
        if (rows.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Credenciales inválidas.' });
        }

        const user = rows[0];

        // Verificar si la contraseña coincide con la encriptada
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ status: 'error', message: 'Credenciales inválidas.' });
        }

        // Verificar el Rol (Solo permitimos entrar a Clientes aquí)
        if (user.role_name !== 'Client') {
            return res.status(403).json({ status: 'error', message: 'Acceso denegado. Portal exclusivo para clientes.' });
        }

        // ¡Éxito! Devolvemos los datos del usuario (sin la contraseña)
        res.status(200).json({
            status: 'success',
            message: 'Inicio de sesión exitoso.',
            user: {
                userId: user.user_id,
                email: user.email,
                firstName: user.first_name,
                role: user.role_name
            }
        });

    } catch (error) {
        console.error('Error en /api/login:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

// ==========================================
// RUTAS DE PRODUCTOS (CATÁLOGO)
// ==========================================

// --- 3. OBTENER CATEGORÍAS ---
app.get('/api/categories', async (req, res) => {
    try {
        const [categories] = await db.execute("SELECT * FROM categories ORDER BY category_name ASC");
        res.json({ status: 'success', data: categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error al obtener categorías.' });
    }
});

// --- 4. OBTENER PRODUCTOS (Con Filtros, Búsqueda y Límites) ---
app.get('/api/products', async (req, res) => {
    try {
        // Recibimos TODOS los parámetros nuevos
        const { search, category, limit, minPrice, maxPrice, minStock } = req.query;

        let sql = "SELECT * FROM products";
        let params = [];
        let conditions = []; // Arreglo para guardar los "WHERE"

        // 1. Filtro Búsqueda
        if (search) {
            conditions.push("product_name LIKE ?");
            params.push(`%${search}%`);
        }
        // 2. Filtro Categoría
        if (category) {
            conditions.push("category_id = ?");
            params.push(category);
        }
        
        // 3. NUEVO: Filtro Precio Mínimo
        if (minPrice) {
            conditions.push("price >= ?");
            params.push(minPrice);
        }
        // 4. NUEVO: Filtro Precio Máximo
        if (maxPrice) {
            conditions.push("price <= ?");
            params.push(maxPrice);
        }
        // 5. NUEVO: Filtro Stock (Para compras de mayoreo)
        if (minStock) {
            conditions.push("stock_quantity >= ?");
            params.push(minStock);
        }

        // UNIR TODOS LOS FILTROS CON "AND"
        if (conditions.length > 0) {
            sql += " WHERE " + conditions.join(" AND ");
        }

        // Orden y Límite
        if (limit) {
            sql += ` ORDER BY RAND() LIMIT ${parseInt(limit)}`;
        } else {
            sql += " ORDER BY product_name ASC";
        }

        const [products] = await db.execute(sql, params);
        res.json({ status: 'success', data: products });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

// ==========================================
// RUTAS DEL CARRITO DE COMPRAS
// ==========================================

// --- 5. AGREGAR PRODUCTO AL CARRITO ---
app.post('/api/cart', async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({ status: 'error', message: 'Faltan datos (ID de usuario o producto).' });
        }

        // Lógica especial: Si el producto ya está, actualiza la cantidad. Si no, lo inserta.
        const sql = `
            INSERT INTO shopping_cart (user_id, product_id, quantity) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE quantity = quantity + ?
        `;
        await db.execute(sql, [userId, productId, quantity, quantity]);

        res.status(200).json({ status: 'success', message: 'Producto agregado al carrito.' });

    } catch (error) {
        console.error('Error en /api/cart:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

// --- 6. VER PRODUCTOS DEL CARRITO ---
app.get('/api/cart', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ status: 'error', message: 'Se requiere ID de usuario.' });

        // Unimos las tablas 'shopping_cart' y 'products' para obtener los detalles
        const sql = `
            SELECT sc.cart_id, sc.product_id, sc.quantity, p.product_name, p.price, p.image_url 
            FROM shopping_cart sc
            JOIN products p ON sc.product_id = p.product_id
            WHERE sc.user_id = ?
        `;
        const [cartItems] = await db.execute(sql, [userId]);

        res.json({ status: 'success', data: cartItems });

    } catch (error) {
        console.error('Error en /api/cart:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

// --- 7. CONTAR PRODUCTOS EN EL CARRITO (Para el ícono del menú) ---
app.get('/api/cart/count', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.json({ status: 'success', count: 0 });

        // Sumamos la cantidad total de productos
        const [rows] = await db.execute("SELECT SUM(quantity) as total FROM shopping_cart WHERE user_id = ?", [userId]);
        const totalItems = rows[0].total || 0;

        res.json({ status: 'success', count: totalItems });

    } catch (error) {
        console.error('Error en /api/cart/count:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor.' });
    }
});

// --- RUTA: ACTUALIZAR CANTIDAD (PUT) ---
// -----------------------------------------------------------------
app.put('/api/cart', async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;

        if (!userId || !productId || quantity === undefined) {
            return res.status(400).json({ status: 'error', message: 'Faltan datos.' });
        }

        // Actualizamos la cantidad directamente
        const sql = "UPDATE shopping_cart SET quantity = ? WHERE user_id = ? AND product_id = ?";
        await db.execute(sql, [quantity, userId, productId]);

        res.json({ status: 'success', message: 'Cantidad actualizada' });

    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

// -----------------------------------------------------------------
// --- RUTA: ELIMINAR PRODUCTO (DELETE) ---
// -----------------------------------------------------------------
app.delete('/api/cart', async (req, res) => {
    try {
        const { userId, productId } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({ status: 'error', message: 'Faltan datos.' });
        }

        const sql = "DELETE FROM shopping_cart WHERE user_id = ? AND product_id = ?";
        await db.execute(sql, [userId, productId]);

        res.json({ status: 'success', message: 'Producto eliminado' });

    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

// --- 8. PROCESAR COMPRA (CHECKOUT) ---
// --- RUTA 8: CHECKOUT (CORREGIDA) ---
app.post('/api/checkout', async (req, res) => {
    try {
        const { userId, shippingAddress, phone, paymentMethod } = req.body;

        console.log(">>> [CHECKOUT] Iniciando para usuario:", userId);

        if (!userId) return res.status(400).json({ message: 'User ID required' });

        // 1. Obtener items del carrito (CORREGIDO: shopping_cart)
        const cartSql = `
            SELECT sc.quantity, p.price, sc.product_id 
            FROM shopping_cart sc 
            JOIN products p ON sc.product_id = p.product_id 
            WHERE sc.user_id = ?`;
            
        const [cartItems] = await db.execute(cartSql, [userId]);

        if (cartItems.length === 0) {
            console.log(">>> [CHECKOUT] Error: Carrito vacío");
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Calcular total
        let total = 0;
        cartItems.forEach(item => total += item.quantity * item.price);
        total = total * 1.16; // IVA

        // 2. Actualizar Usuario (Guardar dirección)
        // Asegúrate de haber corrido el script SQL para tener 'address' y 'phone'
        const updateUserSql = "UPDATE users SET address = ?, phone = ? WHERE user_id = ?";
        await db.execute(updateUserSql, [shippingAddress, phone, userId]);

        // 3. Crear Orden
        // Asegúrate de haber corrido el script SQL para tener 'payment_method'
        const orderSql = `INSERT INTO orders (user_id, status, total, shipping_address, payment_method, order_date) VALUES (?, 'pending', ?, ?, ?, NOW())`;
        const [orderResult] = await db.execute(orderSql, [userId, total, shippingAddress, paymentMethod]);
        
        const orderId = orderResult.insertId;
        console.log(">>> [CHECKOUT] Orden creada ID:", orderId);

        // 4. Mover a Detalles
        for (const item of cartItems) {
            await db.execute(
                "INSERT INTO order_details (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
                [orderId, item.product_id, item.quantity, item.price]
            );
        }

        // 5. Vaciar Carrito (CORREGIDO: shopping_cart)
        await db.execute("DELETE FROM shopping_cart WHERE user_id = ?", [userId]);

        res.json({ status: 'success', message: 'Order placed', orderId });

    } catch (error) {
        console.error("❌ Error CRÍTICO en Checkout:", error.message);
        // Devolvemos el mensaje real del error para que sepas qué columna falta
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ==========================================
// RUTAS DE PERFIL DE USUARIO
// ==========================================

// --- 9. OBTENER HISTORIAL DE PEDIDOS ---
// --- RUTA 9 MEJORADA: HISTORIAL CON FILTROS ---
app.get('/api/orders', async (req, res) => {
    try {
        const { userId, status, time, sort, search } = req.query;

        if (!userId) return res.status(400).json({ status: 'error', message: 'User ID required.' });

        let sql = "SELECT * FROM orders WHERE user_id = ?";
        let params = [userId];

        // 1. Filtro por Estatus
        if (status && status !== 'all') {
            sql += " AND status = ?";
            params.push(status);
        }

        // 2. Filtro por Tiempo (Días)
        if (time && time !== 'all') {
            sql += " AND order_date >= DATE_SUB(NOW(), INTERVAL ? DAY)";
            params.push(parseInt(time));
        }

        // 3. Búsqueda por ID
        if (search) {
            sql += " AND order_id LIKE ?";
            params.push(`%${search}%`);
        }

        // 4. Ordenamiento
        if (sort === 'oldest') sql += " ORDER BY order_date ASC";
        else if (sort === 'price_high') sql += " ORDER BY total DESC";
        else if (sort === 'price_low') sql += " ORDER BY total ASC";
        else sql += " ORDER BY order_date DESC"; // Default: Newest

        const [orders] = await db.execute(sql, params);
        res.json({ status: 'success', data: orders });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// -----------------------------------------------------------------
// --- RUTA 10: SOLICITAR COTIZACIÓN DE SERVICIO ---
// (Responde a POST 'http://localhost:3000/api/quotes/service')
// -----------------------------------------------------------------
app.post('/api/quotes/service', async (req, res) => {
    try {
        const { userId, serviceType, description, date } = req.body;

        if (!userId || !serviceType || !description) {
            return res.status(400).json({ status: 'error', message: 'Please fill all fields.' });
        }

        const sql = `
            INSERT INTO service_quotes (user_id, service_type, description, preferred_date) 
            VALUES (?, ?, ?, ?)
        `;
        
        await db.execute(sql, [userId, serviceType, description, date]);

        res.json({ status: 'success', message: 'Quote request sent successfully!' });

    } catch (error) {
        console.error('Error in /api/quotes/service:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

// --- RUTA 11 (ACTUALIZADA) ---
app.get('/api/quotes/user', async (req, res) => {
    try {
        const { userId, status } = req.query;
        if (!userId) return res.status(400).json({ status: 'error', message: 'User ID required.' });

        // AGREGAMOS 'manager_response' AQUÍ 👇
        let sql = `
            SELECT quote_id, service_type, preferred_date, status, description, created_at, quote_price, manager_response 
            FROM service_quotes 
            WHERE user_id = ? 
        `;
        
        let params = [userId];
        if (status && status !== '') {
            sql += " AND status = ?";
            params.push(status);
        }
        sql += " ORDER BY created_at DESC";
        
        const [quotes] = await db.execute(sql, params);
        res.json({ status: 'success', data: quotes });

    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});
// --- RUTA 12: PAGAR COTIZACIÓN ---
app.post('/api/quotes/pay', async (req, res) => {
    try {
        const { userId, quoteId, amount } = req.body;

        // 1. Crear la Orden
        const orderSql = "INSERT INTO orders (user_id, status, total, shipping_address) VALUES (?, 'processing', ?, 'Service Payment')";
        await db.execute(orderSql, [userId, amount]);

        // 2. Actualizar la Cotización a 'completed'
        const updateSql = "UPDATE service_quotes SET status = 'completed' WHERE quote_id = ?";
        await db.execute(updateSql, [quoteId]);

        res.json({ status: 'success', message: 'Payment successful!' });

    } catch (error) {
        console.error('Error in /api/quotes/pay:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});
// --- RUTA 13: OBTENER INFORMACIÓN COMPLETA DEL USUARIO ---
app.get('/api/user/info', async (req, res) => {
    try {
        const { userId } = req.query;
        
        // CAMBIO AQUÍ: Agregamos 'address' y 'phone' al SELECT
       // En server.js, ruta /api/user/info
const sql = "SELECT first_name, last_name, email, phone, address FROM users WHERE user_id = ?";
        
        const [rows] = await db.execute(sql, [userId]);

        if (rows.length > 0) {
            res.json({ status: 'success', data: rows[0] });
        } else {
            res.json({ status: 'error', message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});
// --- RUTA 14: ACTUALIZAR PERFIL DE USUARIO ---
app.put('/api/user/profile', async (req, res) => {
    try {
        const { userId, firstName, lastName, phone, address } = req.body;

        if (!userId) return res.status(400).json({ message: 'User ID required' });

        const sql = "UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ? WHERE user_id = ?";
        await db.execute(sql, [firstName, lastName, phone, address, userId]);

        res.json({ status: 'success', message: 'Profile updated successfully!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});
// --- RUTA 15: ENVIAR MENSAJE DE CONTACTO ---
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validación básica
        if (!name || !email || !message) {
            return res.status(400).json({ status: 'error', message: 'Please fill in all required fields.' });
        }

        const sql = "INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)";
        await db.execute(sql, [name, email, subject, message]);

        res.json({ status: 'success', message: 'Message sent successfully!' });

    } catch (error) {
        console.error('Contact Error:', error);
        res.status(500).json({ status: 'error', message: 'Server error, try again later.' });
    }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(port, () => {
    console.log(` Servidor API (para CLIENTES :3) corriendo en http://localhost:${port}`);
}).on('error', (err) => {
    console.error("❌ ERROR AL INICIAR SERVIDOR:", err.message);
});
