// Este archivo está listo para ser editado

const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const contributionRoutes = require('./contributionRoutes');
const verificationRoutes = require('./verificationRoutes');

// Rutas de usuarios
router.use('/users', userRoutes);

// Rutas de contribuciones
router.use('/contributions', contributionRoutes);

// Rutas de verificaciones
router.use('/verify', verificationRoutes);

module.exports = router;
