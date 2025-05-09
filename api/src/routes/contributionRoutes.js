// Este archivo está listo para ser editado con las rutas de contribuciones. 

const express = require('express');
const router = express.Router();
const contributionController = require('../controllers/contributionController');

// Rutas de contribuciones
router.post('/', contributionController.createContribution);
router.get('/:id', contributionController.getContribution);
router.get('/', contributionController.getAllContributions);
router.get('/status/:status', contributionController.getContributionsByStatus);

module.exports = router; 