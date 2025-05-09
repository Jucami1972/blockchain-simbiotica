// Este archivo está listo para ser editado con el contenido del controlador de contribuciones. 

const { connectToNetwork, disconnectFromNetwork } = require('../fabric/network');
const { v4: uuidv4 } = require('uuid');

// Crear una nueva contribución
exports.createContribution = async (req, res) => {
    try {
        const { contributorId, type, title, description, evidence } = req.body;
        
        // Validar datos
        if (!contributorId || !type || !title || !description) {
            return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
        }

        // Generar ID único
        const id = `CONTRIB-${uuidv4()}`;

        // Conectar a la red
        const networkObj = await connectToNetwork(contributorId);
        if (!networkObj.success) {
            return res.status(500).json({ success: false, message: networkObj.message });
        }

        // Crear contribución en el chaincode
        const { contract, gateway } = networkObj;
        await contract.submitTransaction('CreateContribution', id, contributorId, type, title, description, evidence || '');

        // Desconectar de la red
        await disconnectFromNetwork(gateway);

        res.status(201).json({ success: true, message: 'Contribución creada correctamente', id });
    } catch (error) {
        console.error(`Error al crear contribución: ${error}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Obtener una contribución por ID
exports.getContribution = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Conectar a la red
        const networkObj = await connectToNetwork('admin');
        if (!networkObj.success) {
            return res.status(500).json({ success: false, message: networkObj.message });
        }

        // Obtener contribución del chaincode
        const { contract, gateway } = networkObj;
        const contributionBuffer = await contract.evaluateTransaction('GetContribution', id);
        const contribution = JSON.parse(contributionBuffer.toString());

        // Desconectar de la red
        await disconnectFromNetwork(gateway);

        res.status(200).json({ success: true, contribution });
    } catch (error) {
        console.error(`Error al obtener contribución: ${error}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Obtener todas las contribuciones
exports.getAllContributions = async (req, res) => {
    try {
        // Conectar a la red
        const networkObj = await connectToNetwork('admin');
        if (!networkObj.success) {
            return res.status(500).json({ success: false, message: networkObj.message });
        }

        // Obtener contribuciones del chaincode
        const { contract, gateway } = networkObj;
        const contributionsBuffer = await contract.evaluateTransaction('GetAllContributions');
        const contributions = JSON.parse(contributionsBuffer.toString());

        // Desconectar de la red
        await disconnectFromNetwork(gateway);

        res.status(200).json({ success: true, contributions });
    } catch (error) {
        console.error(`Error al obtener contribuciones: ${error}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Obtener contribuciones por estado
exports.getContributionsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        
        // Conectar a la red
        const networkObj = await connectToNetwork('admin');
        if (!networkObj.success) {
            return res.status(500).json({ success: false, message: networkObj.message });
        }

        // Obtener contribuciones del chaincode
        const { contract, gateway } = networkObj;
        const contributionsBuffer = await contract.evaluateTransaction('GetContributionsByStatus', status);
        const contributions = JSON.parse(contributionsBuffer.toString());

        // Desconectar de la red
        await disconnectFromNetwork(gateway);

        res.status(200).json({ success: true, contributions });
    } catch (error) {
        console.error(`Error al obtener contribuciones por estado: ${error}`);
        res.status(500).json({ success: false, message: error.message });
    }
}; 