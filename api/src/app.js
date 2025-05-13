const express = require('express');
const cors = require('cors');
const { enrollAdmin } = require('./fabric/network');

// Cargar variables de entorno
require('dotenv').config({ path: __dirname + '/../.env' });

// Crear aplicación Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rutas
app.use('/api', require('./routes'));

// Puerto
const PORT = process.env.API_PORT || 3000;

// Iniciar el servidor
const startServer = async () => {
  try {
    // Matricular admin si no existe
    await enrollAdmin();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`Servidor iniciado en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error(`Error al iniciar el servidor: ${error}`);
    process.exit(1);
  }
};

startServer();
