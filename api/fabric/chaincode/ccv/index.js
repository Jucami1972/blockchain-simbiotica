'use strict';

const { Contract } = require('fabric-contract-api');

class TelemedicinaContract extends Contract {
    constructor() {
        super('TelemedicinaContract');
    }

    async initLedger(ctx) {
        console.log('Inicializando el ledger');
        return 'Ledger inicializado';
    }

    async ping(ctx) {
        console.log('Ping recibido');
        return 'Pong';
    }

    async createUser(ctx, userId, name, role) {
        console.log('Creando usuario:', userId);
        
        // Verificar si el usuario ya existe
        const userExists = await ctx.stub.getState(userId);
        if (userExists && userExists.length > 0) {
            throw new Error(`El usuario ${userId} ya existe`);
        }

        // Crear el objeto usuario
        const user = {
            userId,
            name,
            role,
            createdAt: new Date().toISOString()
        };

        // Guardar el usuario en el ledger
        await ctx.stub.putState(userId, Buffer.from(JSON.stringify(user)));
        
        return JSON.stringify(user);
    }

    async GetUser(ctx, username) {
        console.log('Obteniendo usuario:', username);
        
        const userBytes = await ctx.stub.getState(username);
        if (!userBytes || userBytes.length === 0) {
            throw new Error(`El usuario ${username} no existe`);
        }

        return userBytes.toString();
    }

    async GetAllUsers(ctx) {
        console.log('Obteniendo todos los usuarios');
        
        const startKey = '';
        const endKey = '';
        const allResults = [];

        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
        }

        return JSON.stringify(allResults);
    }
}

module.exports = TelemedicinaContract; 