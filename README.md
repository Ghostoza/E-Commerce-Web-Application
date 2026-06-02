# E-Commerce & Business Management Platform 🛒🏗️

## Descripción del Proyecto
Plataforma integral *Full-Stack* desarrollada para la gestión de ventas y logística de una empresa de materiales de construcción (Johnny Inc.). El ecosistema está compuesto por una aplicación web interactiva orientada al consumidor, una arquitectura robusta de servicios Backend y módulos de administración interna.

## Stack Tecnológico y Herramientas
* **Backend:** Node.js, Express.js (Creación y consumo de APIs RESTful).
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (Diseño responsivo, validación asíncrona y DOM dinámico).
* **Software de Administración:** Java (Aplicación de escritorio para control de inventarios y reportes gerenciales conectados por JDBC).
* **Base de Datos:** MySQL (Diseño relacional para usuarios, productos, cotizaciones, carrito de compras y control de stock).
* **Seguridad:** Encriptación de datos y contraseñas mediante la librería `bcrypt`.

## Características Técnicas Principales
1. **Arquitectura RESTful:** Desarrollo de múltiples *endpoints* HTTP (GET, POST, PUT, DELETE) para interconectar el *frontend* con el servidor.
2. **Sistema de Autenticación:** Lógica de registro y *login* seguro con validación de roles (Cliente vs. Personal Interno).
3. **Gestión Dinámica de Datos:** Filtros avanzados de búsqueda en la base de datos (por precio, categoría y stock), junto con un carrito de compras persistente.
4. **Documentación:** Se incluye el archivo `Final_Document_QT_SW_UNIT_3.pdf` dentro del repositorio con el mapeo, lógica y manuales técnicos de la arquitectura del proyecto.

## Inicialización del Proyecto
Para ejecutar este entorno de manera local:
1. Clonar el repositorio.
2. Ejecutar `npm install` en la terminal para que Node.js descargue automáticamente las dependencias declaradas en el `package.json`.
3. Configurar la cadena de conexión de MySQL en el Backend.
4. Inicializar la API ejecutando `node server.js`.
