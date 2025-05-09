// Este archivo está listo para ser editado con el contenido del controlador de usuarios. 

const { connectToNetwork, disconnectFromNetwork, registerUser } = require('../fabric/network');

// Registrar un nuevo usuario
exports.register = async (req, res) => {
    try {
        const { username, name, role } = req.body;
        
        // Validar datos
        if (!username || !name || !role) {
            return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
        }

        // Registrar usuario en Fabric CA
        const registerResult = await registerUser(username, role);
        if (!registerResult.success) {
            return res.status(500).json({ success: false, message: registerResult.message });
        }

        // Conectar a la red
        const networkObj = await connectToNetwork('admin');
        if (!networkObj.success) {
            return res.status(500).json({ success: false, message: networkObj.message });
        }

        // Crear usuario en el chaincode
        const { contract, gateway } = networkObj;
        await contract.submitTransaction('createUser', username, name, role);

        // Desconectar de la red
        await disconnectFromNetwork(gateway);

        res.status(201).json({ success: true, message: 'Usuario registrado correctamente' });
    } catch (error) {
        console.error(`Error al registrar usuario: ${error}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Obtener un usuario por ID
exports.getUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Conectar a la red
        const networkObj = await connectToNetwork('admin');
        if (!networkObj.success) {
            return res.status(500).json({ success: false, message: networkObj.message });
        }

        // Obtener usuario del chaincode
        const { contract, gateway } = networkObj;
        const userBuffer = await contract.evaluateTransaction('GetUser', id);
        const user = JSON.parse(userBuffer.toString());

        // Desconectar de la red
        await disconnectFromNetwork(gateway);

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error(`Error al obtener usuario: ${error}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
    try {
        // Conectar a la red
        const networkObj = await connectToNetwork('admin');
        if (!networkObj.success) {
            return res.status(500).json({ success: false, message: networkObj.message });
        }

        // Obtener usuarios del chaincode
        const { contract, gateway } = networkObj;
        const usersBuffer = await contract.evaluateTransaction('GetAllUsers');
        const users = JSON.parse(usersBuffer.toString());

        // Desconectar de la red
        await disconnectFromNetwork(gateway);

        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error(`Error al obtener usuarios: ${error}`);
        res.status(500).json({ success: false, message: error.message });
    }
}; 