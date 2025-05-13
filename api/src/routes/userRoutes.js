// Este archivo está listo para ser editado con las rutas de usuario.

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rutas de usuarios
router.post('/register', userController.register);
router.get('/:id', userController.getUser);
router.get('/', userController.getAllUsers);

module.exports = router;
