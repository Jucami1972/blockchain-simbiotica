'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Contrato de Transacción para la Blockchain Simbiótica
 * Implementa funcionalidades para gestionar transacciones avanzadas
 */
class TransactionContract extends Contract {
    
    /**
     * Inicializa el contrato con los valores predeterminados
     * @param {Context} ctx - Contexto de transacción
     */
    async init(ctx) {
        console.info('============= Inicializando Contrato de Transacción =============');
        
        // Configuración de transacciones
        const transactionConfig = {
            version: '1.0',
            minFee: '100000000000000', // 0.0001 tokens con 18 decimales
            maxTransactionSize: '1000000000000000000000', // 1000 tokens con 18 decimales
            admin: 'admin'
        };
        
        await ctx.stub.putState('transactionConfig', Buffer.from(JSON.stringify(transactionConfig)));
        
        console.info('============= Contrato de Transacción inicializado correctamente =============');
        return JSON.stringify(transactionConfig);
    }
    
    /**
     * Crea una nueva transacción programada
     * @param {Context} ctx - Contexto de transacción
     * @param {String} from - Dirección del remitente
     * @param {String} to - Dirección del destinatario
     * @param {String} amount - Cantidad a transferir
     * @param {String} executionDate - Fecha de ejecución (ISO 8601)
     * @param {String} description - Descripción de la transacción
     * @returns {Object} - Información de la transacción programada
     */
    async scheduleTransaction(ctx, from, to, amount, executionDate, description) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!from || !to || !amount || !executionDate) {
            throw new Error('Parámetros inválidos: se requiere remitente, destinatario, cantidad y fecha de ejecución');
        }
        
        // Verificar que el llamante sea el remitente
        if (caller !== from) {
            throw new Error('Solo el remitente puede programar una transacción');
        }
        
        // Convertir cantidad a BigInt
        const amountBigInt = BigInt(amount);
        if (amountBigInt <= BigInt(0)) {
            throw new Error('La cantidad debe ser mayor que cero');
        }
        
        // Verificar fecha de ejecución
        const now = new Date();
        const execDate = new Date(executionDate);
        
        if (isNaN(execDate.getTime())) {
            throw new Error('Formato de fecha inválido. Use formato ISO 8601');
        }
        
        if (execDate <= now) {
            throw new Error('La fecha de ejecución debe ser futura');
        }
        
        // Obtener configuración de transacciones
        const configBuffer = await ctx.stub.getState('transactionConfig');
        if (!configBuffer || configBuffer.length === 0) {
            throw new Error('La configuración de transacciones no ha sido inicializada');
        }
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar tamaño máximo de transacción
        const maxSizeBigInt = BigInt(config.maxTransactionSize);
        if (amountBigInt > maxSizeBigInt) {
            throw new Error(`La cantidad excede el tamaño máximo de transacción (${config.maxTransactionSize})`);
        }
        
        // Crear transacción programada
        const transactionId = `scheduled_tx_${from}_${now.getTime()}`;
        const scheduledTx = {
            id: transactionId,
            from: from,
            to: to,
            amount: amount,
            scheduledDate: now.toISOString(),
            executionDate: executionDate,
            description: description || '',
            status: 'scheduled',
            fee: config.minFee
        };
        
        // Guardar transacción programada
        await ctx.stub.putState(transactionId, Buffer.from(JSON.stringify(scheduledTx)));
        
        // Emitir evento de transacción programada
        const scheduledEvent = {
            id: transactionId,
            from: from,
            to: to,
            amount: amount,
            executionDate: executionDate
        };
        await ctx.stub.setEvent('TransactionScheduled', Buffer.from(JSON.stringify(scheduledEvent)));
        
        return scheduledTx;
    }
    
    /**
     * Cancela una transacción programada
     * @param {Context} ctx - Contexto de transacción
     * @param {String} transactionId - ID de la transacción programada
     * @returns {Boolean} - Resultado de la cancelación
     */
    async cancelScheduledTransaction(ctx, transactionId) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!transactionId) {
            throw new Error('Parámetros inválidos: se requiere ID de transacción');
        }
        
        // Obtener transacción programada
        const txBuffer = await ctx.stub.getState(transactionId);
        if (!txBuffer || txBuffer.length === 0) {
            throw new Error('Transacción programada no encontrada');
        }
        
        const scheduledTx = JSON.parse(txBuffer.toString());
        
        // Verificar que el llamante sea el remitente
        if (caller !== scheduledTx.from) {
            throw new Error('Solo el remitente puede cancelar la transacción programada');
        }
        
        // Verificar que la transacción esté programada
        if (scheduledTx.status !== 'scheduled') {
            throw new Error('La transacción no está en estado programado');
        }
        
        // Actualizar estado de la transacción
        scheduledTx.status = 'cancelled';
        scheduledTx.cancelledDate = new Date().toISOString();
        
        // Guardar transacción actualizada
        await ctx.stub.putState(transactionId, Buffer.from(JSON.stringify(scheduledTx)));
        
        // Emitir evento de cancelación
        const cancelEvent = {
            id: transactionId,
            from: scheduledTx.from,
            to: scheduledTx.to,
            amount: scheduledTx.amount
        };
        await ctx.stub.setEvent('TransactionCancelled', Buffer.from(JSON.stringify(cancelEvent)));
        
        return true;
    }
    
    /**
     * Ejecuta una transacción programada
     * @param {Context} ctx - Contexto de transacción
     * @param {String} transactionId - ID de la transacción programada
     * @returns {Boolean} - Resultado de la ejecución
     */
    async executeScheduledTransaction(ctx, transactionId) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!transactionId) {
            throw new Error('Parámetros inválidos: se requiere ID de transacción');
        }
        
        // Obtener transacción programada
        const txBuffer = await ctx.stub.getState(transactionId);
        if (!txBuffer || txBuffer.length === 0) {
            throw new Error('Transacción programada no encontrada');
        }
        
        const scheduledTx = JSON.parse(txBuffer.toString());
        
        // Verificar que la transacción esté programada
        if (scheduledTx.status !== 'scheduled') {
            throw new Error('La transacción no está en estado programado');
        }
        
        // Verificar fecha de ejecución
        const now = new Date();
        const execDate = new Date(scheduledTx.executionDate);
        
        // Solo el remitente puede ejecutar antes de tiempo, cualquiera puede ejecutar después de la fecha programada
        if (execDate > now && caller !== scheduledTx.from) {
            throw new Error('Solo el remitente puede ejecutar la transacción antes de la fecha programada');
        }
        
        // Obtener configuración de transacciones
        const configBuffer = await ctx.stub.getState('transactionConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Ejecutar la transferencia (llamar al contrato de token)
        try {
            // En un entorno real, aquí se llamaría al contrato de token
            // Para este ejemplo, simplemente actualizamos el estado de la transacción
            
            // Actualizar estado de la transacción
            scheduledTx.status = 'executed';
            scheduledTx.executedDate = now.toISOString();
            scheduledTx.executedBy = caller;
            
            // Guardar transacción actualizada
            await ctx.stub.putState(transactionId, Buffer.from(JSON.stringify(scheduledTx)));
            
            // Emitir evento de ejecución
            const executeEvent = {
                id: transactionId,
                from: scheduledTx.from,
                to: scheduledTx.to,
                amount: scheduledTx.amount,
                executedBy: caller
            };
            await ctx.stub.setEvent('TransactionExecuted', Buffer.from(JSON.stringify(executeEvent)));
            
            return true;
        } catch (error) {
            // Actualizar estado de la transacción en caso de error
            scheduledTx.status = 'failed';
            scheduledTx.failedDate = now.toISOString();
            scheduledTx.failureReason = error.message;
            
            // Guardar transacción actualizada
            await ctx.stub.putState(transactionId, Buffer.from(JSON.stringify(scheduledTx)));
            
            // Emitir evento de fallo
            const failEvent = {
                id: transactionId,
                from: scheduledTx.from,
                to: scheduledTx.to,
                amount: scheduledTx.amount,
                reason: error.message
            };
            await ctx.stub.setEvent('TransactionFailed', Buffer.from(JSON.stringify(failEvent)));
            
            throw new Error(`Error al ejecutar la transacción: ${error.message}`);
        }
    }
    
    /**
     * Crea una transacción recurrente
     * @param {Context} ctx - Contexto de transacción
     * @param {String} from - Dirección del remitente
     * @param {String} to - Dirección del destinatario
     * @param {String} amount - Cantidad a transferir
     * @param {String} frequency - Frecuencia (daily, weekly, monthly)
     * @param {String} startDate - Fecha de inicio (ISO 8601)
     * @param {String} endDate - Fecha de fin (ISO 8601, opcional)
     * @param {String} description - Descripción de la transacción
     * @returns {Object} - Información de la transacción recurrente
     */
    async createRecurringTransaction(ctx, from, to, amount, frequency, startDate, endDate, description) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!from || !to || !amount || !frequency || !startDate) {
            throw new Error('Parámetros inválidos: se requiere remitente, destinatario, cantidad, frecuencia y fecha de inicio');
        }
        
        // Verificar que el llamante sea el remitente
        if (caller !== from) {
            throw new Error('Solo el remitente puede crear una transacción recurrente');
        }
        
        // Convertir cantidad a BigInt
        const amountBigInt = BigInt(amount);
        if (amountBigInt <= BigInt(0)) {
            throw new Error('La cantidad debe ser mayor que cero');
        }
        
        // Verificar frecuencia válida
        const validFrequencies = ['daily', 'weekly', 'monthly'];
        if (!validFrequencies.includes(frequency)) {
            throw new Error(`Frecuencia inválida. Debe ser una de: ${validFrequencies.join(', ')}`);
        }
        
        // Verificar fechas
        const now = new Date();
        const start = new Date(startDate);
        
        if (isNaN(start.getTime())) {
            throw new Error('Formato de fecha de inicio inválido. Use formato ISO 8601');
        }
        
        if (start <= now) {
            throw new Error('La fecha de inicio debe ser futura');
        }
        
        let end = null;
        if (endDate) {
            end = new Date(endDate);
            
            if (isNaN(end.getTime())) {
                throw new Error('Formato de fecha de fin inválido. Use formato ISO 8601');
            }
            
            if (end <= start) {
                throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
            }
        }
        
        // Obtener configuración de transacciones
        const configBuffer = await ctx.stub.getState('transactionConfig');
        if (!configBuffer || configBuffer.length === 0) {
            throw new Error('La configuración de transacciones no ha sido inicializada');
        }
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar tamaño máximo de transacción
        const maxSizeBigInt = BigInt(config.maxTransactionSize);
        if (amountBigInt > maxSizeBigInt) {
            throw new Error(`La cantidad excede el tamaño máximo de transacción (${config.maxTransactionSize})`);
        }
        
        // Crear transacción recurrente
        const recurringId = `recurring_tx_${from}_${now.getTime()}`;
        const recurringTx = {
            id: recurringId,
            from: from,
            to: to,
            amount: amount,
            frequency: frequency,
            startDate: startDate,
            endDate: endDate || null,
            description: description || '',
            status: 'active',
            createdDate: now.toISOString(),
            lastExecutionDate: null,
            nextExecutionDate: startDate,
            executionCount: 0
        };
        
        // Guardar transacción recurrente
        await ctx.stub.putState(recurringId, Buffer.from(JSON.stringify(recurringTx)));
        
        // Emitir evento de transacción recurrente creada
        const recurringEvent = {
            id: recurringId,
            from: from,
            to: to,
            amount: amount,
            frequency: frequency,
            startDate: startDate,
            endDate: endDate || null
        };
        await ctx.stub.setEvent('RecurringTransactionCreated', Buffer.from(JSON.stringify(recurringEvent)));
        
        return recurringTx;
    }
    
    /**
     * Cancela una transacción recurrente
     * @param {Context} ctx - Contexto de transacción
     * @param {String} recurringId - ID de la transacción recurrente
     * @returns {Boolean} - Resultado de la cancelación
     */
    async cancelRecurringTransaction(ctx, recurringId) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!recurringId) {
            throw new Error('Parámetros inválidos: se requiere ID de transacción recurrente');
        }
        
        // Obtener transacción recurrente
        const txBuffer = await ctx.stub.getState(recurringId);
        if (!txBuffer || txBuffer.length === 0) {
            throw new Error('Transacción recurrente no encontrada');
        }
        
        const recurringTx = JSON.parse(txBuffer.toString());
        
        // Verificar que el llamante sea el remitente
        if (caller !== recurringTx.from) {
            throw new Error('Solo el remitente puede cancelar la transacción recurrente');
        }
        
        // Verificar que la transacción esté activa
        if (recurringTx.status !== 'active') {
            throw new Error('La transacción recurrente no está activa');
        }
        
        // Actualizar estado de la transacción
        recurringTx.status = 'cancelled';
        recurringTx.cancelledDate = new Date().toISOString();
        
        // Guardar transacción actualizada
        await ctx.stub.putState(recurringId, Buffer.from(JSON.stringify(recurringTx)));
        
        // Emitir evento de cancelación
        const cancelEvent = {
            id: recurringId,
            from: recurringTx.from,
            to: recurringTx.to,
            amount: recurringTx.amount
        };
        await ctx.stub.setEvent('RecurringTransactionCancelled', Buffer.from(JSON.stringify(cancelEvent)));
        
        return true;
    }
    
    /**
     * Obtiene todas las transacciones programadas de un usuario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @returns {Array} - Lista de transacciones programadas
     */
    async getScheduledTransactions(ctx, userId) {
        // Validar parámetros
        if (!userId) {
            throw new Error('Parámetros inválidos: se requiere ID de usuario');
        }
        
        // Consultar transacciones programadas
        const query = {
            selector: {
                from: userId,
                status: 'scheduled'
            },
            use_index: ['_design/indexFromStatusDoc', 'indexFromStatus']
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const transactions = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const tx = JSON.parse(result.value.value.toString());
            transactions.push(tx);
            result = await iterator.next();
        }
        
        return transactions;
    }
    
    /**
     * Obtiene todas las transacciones recurrentes de un usuario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @returns {Array} - Lista de transacciones recurrentes
     */
    async getRecurringTransactions(ctx, userId) {
        // Validar parámetros
        if (!userId) {
            throw new Error('Parámetros inválidos: se requiere ID de usuario');
        }
        
        // Consultar transacciones recurrentes
        const query = {
            selector: {
                from: userId
            },
            use_index: ['_design/indexFromDoc', 'indexFrom']
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const transactions = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const tx = JSON.parse(result.value.value.toString());
            if (tx.id.startsWith('recurring_tx_')) {
                transactions.push(tx);
            }
            result = await iterator.next();
        }
        
        return transactions;
    }
}

module.exports = TransactionContract;
