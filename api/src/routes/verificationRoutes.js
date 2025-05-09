// Este archivo está listo para ser editado con las rutas de verificaciones. 

const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');

// Rutas de verificaciones
router.post('/verify', verificationController.verifyContribution);
router.post('/dispute', verificationController.disputeVerification);

module.exports = router; 