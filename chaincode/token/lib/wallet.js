'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Contrato de Wallet para la Blockchain Simbiótica
 * Implementa funcionalidades avanzadas para la gestión de wallets
 */
class WalletContract extends Contract {
    
    /**
     * Inicializa el contrato con los valores predeterminados
     * @param {Context} ctx - Contexto de transacción
     */
    async init(ctx) {
        console.info('============= Inicializando Contrato de Wallet =============');
        
        // Configuración del wallet
        const walletConfig = {
            version: '1.0',
            minTransactionFee: '0',
            maxDailyLimit: '1000000000000000000000', // 1000 tokens con 18 decimales
            admin: 'admin'
        };
        
        await ctx.stub.putState('walletConfig', Buffer.from(JSON.stringify(walletConfig)));
        
        console.info('============= Wallet inicializado correctamente =============');
        return JSON.stringify(walletConfig);
    }
    
    /**
     * Crea un nuevo wallet para un usuario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @param {String} walletType - Tipo de wallet (personal, business, custodial)
     * @returns {Object} - Información del wallet creado
     */
    async createWallet(ctx, userId, walletType) {
        // Validar parámetros
        if (!userId || !walletType) {
            throw new Error('Parámetros inválidos: se requiere ID de usuario y tipo de wallet');
        }
        
        // Verificar tipos válidos
        const validTypes = ['personal', 'business', 'custodial'];
        if (!validTypes.includes(walletType)) {
            throw new Error(`Tipo de wallet inválido. Debe ser uno de: ${validTypes.join(', ')}`);
        }
        
        // Verificar si el wallet ya existe
        const walletKey = `wallet_${userId}`;
        const existingWalletBuffer = await ctx.stub.getState(walletKey);
        if (existingWalletBuffer && existingWalletBuffer.length > 0) {
            throw new Error(`El usuario ${userId} ya tiene un wallet`);
        }
        
        // Crear nuevo wallet
        const now = new Date();
        const walletId = `${userId}_${now.getTime()}`;
        
        const wallet = {
            id: walletId,
            userId: userId,
            type: walletType,
            status: 'active',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            dailyLimit: walletType === 'business' ? '1000000000000000000000' : '100000000000000000000', // 1000 o 100 tokens
            dailyUsed: '0',
            lastResetDate: now.toISOString()
        };
        
        // Guardar wallet
        await ctx.stub.putState(walletKey, Buffer.from(JSON.stringify(wallet)));
        
        // Emitir evento de creación de wallet
        const walletEvent = {
            type: 'create',
            walletId: walletId,
            userId: userId,
            walletType: walletType
        };
        await ctx.stub.setEvent('WalletCreated', Buffer.from(JSON.stringify(walletEvent)));
        
        return wallet;
    }
    
    /**
     * Obtiene información de un wallet
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @returns {Object} - Información del wallet
     */
    async getWallet(ctx, userId) {
        // Validar parámetros
        if (!userId) {
            throw new Error('Parámetros inválidos: se requiere ID de usuario');
        }
        
        // Obtener wallet
        const walletKey = `wallet_${userId}`;
        const walletBuffer = await ctx.stub.getState(walletKey);
        if (!walletBuffer || walletBuffer.length === 0) {
            throw new Error(`No se encontró wallet para el usuario ${userId}`);
        }
        
        return JSON.parse(walletBuffer.toString());
    }
    
    /**
     * Actualiza el estado de un wallet
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @param {String} status - Nuevo estado (active, suspended, closed)
     * @returns {Object} - Información del wallet actualizado
     */
    async updateWalletStatus(ctx, userId, status) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Verificar que el llamante sea administrador
        const walletConfigBuffer = await ctx.stub.getState('walletConfig');
        if (!walletConfigBuffer || walletConfigBuffer.length === 0) {
            throw new Error('La configuración del wallet no ha sido inicializada');
        }
        const walletConfig = JSON.parse(walletConfigBuffer.toString());
        
        if (caller !== walletConfig.admin && caller !== userId) {
            throw new Error('Solo el administrador o el propietario pueden actualizar el estado del wallet');
        }
        
        // Validar parámetros
        if (!userId || !status) {
            throw new Error('Parámetros inválidos: se requiere ID de usuario y estado');
        }
        
        // Verificar estados válidos
        const validStatus = ['active', 'suspended', 'closed'];
        if (!validStatus.includes(status)) {
            throw new Error(`Estado inválido. Debe ser uno de: ${validStatus.join(', ')}`);
        }
        
        // Obtener wallet
        const walletKey = `wallet_${userId}`;
        const walletBuffer = await ctx.stub.getState(walletKey);
        if (!walletBuffer || walletBuffer.length === 0) {
            throw new Error(`No se encontró wallet para el usuario ${userId}`);
        }
        
        const wallet = JSON.parse(walletBuffer.toString());
        
        // Actualizar estado
        wallet.status = status;
        wallet.updatedAt = new Date().toISOString();
        
        // Guardar wallet actualizado
        await ctx.stub.putState(walletKey, Buffer.from(JSON.stringify(wallet)));
        
        // Emitir evento de actualización de wallet
        const walletEvent = {
            type: 'update',
            walletId: wallet.id,
            userId: userId,
            status: status
        };
        await ctx.stub.setEvent('WalletUpdated', Buffer.from(JSON.stringify(walletEvent)));
        
        return wallet;
    }
    
    /**
     * Actualiza el límite diario de un wallet
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @param {String} dailyLimit - Nuevo límite diario
     * @returns {Object} - Información del wallet actualizado
     */
    async updateDailyLimit(ctx, userId, dailyLimit) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Verificar que el llamante sea administrador
        const walletConfigBuffer = await ctx.stub.getState('walletConfig');
        if (!walletConfigBuffer || walletConfigBuffer.length === 0) {
            throw new Error('La configuración del wallet no ha sido inicializada');
        }
        const walletConfig = JSON.parse(walletConfigBuffer.toString());
        
        if (caller !== walletConfig.admin && caller !== userId) {
            throw new Error('Solo el administrador o el propietario pueden actualizar el límite diario');
        }
        
        // Validar parámetros
        if (!userId || !dailyLimit) {
            throw new Error('Parámetros inválidos: se requiere ID de usuario y límite diario');
        }
        
        // Convertir límite a BigInt
        const dailyLimitBigInt = BigInt(dailyLimit);
        const maxDailyLimitBigInt = BigInt(walletConfig.maxDailyLimit);
        
        if (dailyLimitBigInt <= BigInt(0)) {
            throw new Error('El límite diario debe ser mayor que cero');
        }
        
        if (dailyLimitBigInt > maxDailyLimitBigInt) {
            throw new Error(`El límite diario no puede exceder ${walletConfig.maxDailyLimit}`);
        }
        
        // Obtener wallet
        const walletKey = `wallet_${userId}`;
        const walletBuffer = await ctx.stub.getState(walletKey);
        if (!walletBuffer || walletBuffer.length === 0) {
            throw new Error(`No se encontró wallet para el usuario ${userId}`);
        }
        
        const wallet = JSON.parse(walletBuffer.toString());
        
        // Actualizar límite diario
        wallet.dailyLimit = dailyLimit;
        wallet.updatedAt = new Date().toISOString();
        
        // Guardar wallet actualizado
        await ctx.stub.putState(walletKey, Buffer.from(JSON.stringify(wallet)));
        
        // Emitir evento de actualización de wallet
        const walletEvent = {
            type: 'updateLimit',
            walletId: wallet.id,
            userId: userId,
            dailyLimit: dailyLimit
        };
        await ctx.stub.setEvent('WalletLimitUpdated', Buffer.from(JSON.stringify(walletEvent)));
        
        return wallet;
    }
    
    /**
     * Registra una transacción en el wallet
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @param {String} amount - Monto de la transacción
     * @param {String} transactionType - Tipo de transacción (send, receive, stake, unstake)
     * @param {String} description - Descripción de la transacción
     * @returns {Object} - Información de la transacción
     */
    async recordTransaction(ctx, userId, amount, transactionType, description) {
        // Validar parámetros
        if (!userId || !amount || !transactionType) {
            throw new Error('Parámetros inválidos: se requiere ID de usuario, monto y tipo de transacción');
        }
        
        // Verificar tipos válidos
        const validTypes = ['send', 'receive', 'stake', 'unstake'];
        if (!validTypes.includes(transactionType)) {
            throw new Error(`Tipo de transacción inválido. Debe ser uno de: ${validTypes.join(', ')}`);
        }
        
        // Convertir monto a BigInt
        const amountBigInt = BigInt(amount);
        
        // Obtener wallet
        const walletKey = `wallet_${userId}`;
        const walletBuffer = await ctx.stub.getState(walletKey);
        if (!walletBuffer || walletBuffer.length === 0) {
            throw new Error(`No se encontró wallet para el usuario ${userId}`);
        }
        
        const wallet = JSON.parse(walletBuffer.toString());
        
        // Verificar estado del wallet
        if (wallet.status !== 'active') {
            throw new Error(`El wallet del usuario ${userId} no está activo`);
        }
        
        // Verificar límite diario para transacciones de envío
        if (transactionType === 'send') {
            // Verificar si se debe reiniciar el contador diario
            const now = new Date();
            const lastReset = new Date(wallet.lastResetDate);
            const diffDays = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 1) {
                // Reiniciar contador diario
                wallet.dailyUsed = '0';
                wallet.lastResetDate = now.toISOString();
            }
            
            // Verificar límite diario
            const dailyUsedBigInt = BigInt(wallet.dailyUsed);
            const dailyLimitBigInt = BigInt(wallet.dailyLimit);
            
            if (dailyUsedBigInt + amountBigInt > dailyLimitBigInt) {
                throw new Error('La transacción excede el límite diario');
            }
            
            // Actualizar uso diario
            wallet.dailyUsed = (dailyUsedBigInt + amountBigInt).toString();
        }
        
        // Crear registro de transacción
        const now = new Date();
        const transactionId = `tx_${userId}_${now.getTime()}`;
        
        const transaction = {
            id: transactionId,
            walletId: wallet.id,
            userId: userId,
            amount: amount,
            type: transactionType,
            description: description || '',
            timestamp: now.toISOString(),
            status: 'completed'
        };
        
        // Guardar transacción
        await ctx.stub.putState(transactionId, Buffer.from(JSON.stringify(transaction)));
        
        // Actualizar wallet
        wallet.updatedAt = now.toISOString();
        await ctx.stub.putState(walletKey, Buffer.from(JSON.stringify(wallet)));
        
        // Emitir evento de transacción
        const transactionEvent = {
            transactionId: transactionId,
            walletId: wallet.id,
            userId: userId,
            amount: amount,
            type: transactionType
        };
        await ctx.stub.setEvent('TransactionRecorded', Buffer.from(JSON.stringify(transactionEvent)));
        
        return transaction;
    }
    
    /**
     * Obtiene el historial de transacciones de un wallet
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @returns {Array} - Historial de transacciones
     */
    async getTransactionHistory(ctx, userId) {
        // Validar parámetros
        if (!userId) {
            throw new Error('Parámetros inválidos: se requiere ID de usuario');
        }
        
        // Obtener wallet
        const walletKey = `wallet_${userId}`;
        const walletBuffer = await ctx.stub.getState(walletKey);
        if (!walletBuffer || walletBuffer.length === 0) {
            throw new Error(`No se encontró wallet para el usuario ${userId}`);
        }
        
        const wallet = JSON.parse(walletBuffer.toString());
        
        // Consultar transacciones
        const query = {
            selector: {
                walletId: wallet.id
            },
            use_index: ['_design/indexWalletIdDoc', 'indexWalletId']
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const transactions = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const transaction = JSON.parse(result.value.value.toString());
            transactions.push(transaction);
            result = await iterator.next();
        }
        
        return transactions;
    }
}

module.exports = WalletContract;
