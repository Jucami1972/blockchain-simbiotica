// Este archivo está listo para ser editado con el contenido del controlador de verificaciones. 

const { connectToNetwork, disconnectFromNetwork } = require('../fabric/network');

// Verificar una contribución
exports.verifyContribution = async (req, res) => {
    try {
        const { contributionId, verifierId, approved, score, comment } = req.body;
        
        // Validar datos
        if (!contributionId || !verifierId || approved === undefined || score === undefined) {
            return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
        }

        // Conectar a la red
        const networkObj = await connectToNetwork(verifierId);
        if (!networkObj.success) {
            return res.status(500).json({ success: false, message: networkObj.message });
        }

        // Verificar contribución en el chaincode
        const { contract, gateway } = networkObj;
        await contract.submitTransaction('VerifyContribution', contributionId, verifierId, approved.toString(), score.toString(), comment || '');

        // Desconectar de la red
        await disconnectFromNetwork(gateway);

        res.status(200).json({ success: true, message: 'Contribución verificada correctamente' });
    } catch (error) {
        console.error(`Error al verificar contribución: ${error}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Disputar una verificación
exports.disputeVerification = async (req, res) => {
    try {
        const { contributionId, reason } = req.body;
        
        // Validar datos
        if (!contributionId || !reason) {
            return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
        }

        // Conectar a la red
        const networkObj = await connectToNetwork('admin');
        if (!networkObj.success) {
            return res.status(500).json({ success: false, message: networkObj.message });
        }

        // Disputar verificación en el chaincode
        const { contract, gateway } = networkObj;
        await contract.submitTransaction('DisputeVerification', contributionId, reason);

        // Desconectar de la red
        await disconnectFromNetwork(gateway);

        res.status(200).json({ success: true, message: 'Verificación disputada correctamente' });
    } catch (error) {
        console.error(`Error al disputar verificación: ${error}`);
        res.status(500).json({ success: false, message: error.message });
    }
}; 