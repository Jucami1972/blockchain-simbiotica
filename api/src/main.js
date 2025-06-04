/**
 * Copyright 2025 Blockchain Simbiótica
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const telemedicinRoutes = require('./routes/telemedicina.routes');
const achievexRoutes = require('./routes/achievex.routes');
const chatRoutes = require('./routes/chat.routes');
const iaRoutes = require('./routes/ia.routes');
const walletRoutes = require('./routes/wallet.routes');

// Importar middlewares
const { errorHandler } = require('./middleware/error.middleware');
const { authMiddleware } = require('./middleware/auth.middleware');
const { validationMiddleware } = require('./middleware/validation.middleware');

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Blockchain Simbiótica',
      version: '1.0.0',
      description: 'API para la plataforma Blockchain Simbiótica',
      contact: {
        name: 'Equipo Blockchain Simbiótica',
        email: 'info@blockchainsimbiotica.org'
      },
      license: {
        name: 'Apache 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      },
      {
        url: 'https://api.blockchainsimbiotica.org',
        description: 'Servidor de producción'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Inicializar aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuración de rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 solicitudes por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiadas solicitudes desde esta IP, por favor intente nuevamente después de 15 minutos'
});

// Aplicar rate limiting a todas las rutas de la API
app.use('/api', apiLimiter);

// Rutas de documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Ruta de estado
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/telemedicina', authMiddleware, telemedicinRoutes);
app.use('/api/achievex', authMiddleware, achievexRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/ia', authMiddleware, iaRoutes);
app.use('/api/wallet', authMiddleware, walletRoutes);

// Middleware de manejo de errores
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Iniciar servidor
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`Documentación Swagger disponible en http://0.0.0.0:${PORT}/api-docs`);
  });
}

// Manejo de señales para cierre graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

module.exports = app;
