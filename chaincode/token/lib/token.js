'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Contrato de Token para la Blockchain Simbiótica
 * Implementa el token $SIMB con funcionalidades compatibles con ERC-20
 */
class TokenContract extends Contract {
    
    /**
     * Inicializa el contrato con los valores predeterminados
     * @param {Context} ctx - Contexto de transacción
     */
    async init(ctx) {
        console.info('============= Inicializando Contrato de Token =============');
        
        // Configuración del token
        const tokenConfig = {
            name: 'Simbiótica Token',
            symbol: 'SIMB',
            decimals: 18,
            totalSupply: '1000000000000000000000000', // 1,000,000 tokens con 18 decimales
            owner: 'admin'
        };
        
        await ctx.stub.putState('tokenConfig', Buffer.from(JSON.stringify(tokenConfig)));
        
        // Asignar todos los tokens al propietario inicial
        const ownerBalance = {
            address: tokenConfig.owner,
            balance: tokenConfig.totalSupply
        };
        
        await ctx.stub.putState(`balance_${tokenConfig.owner}`, Buffer.from(JSON.stringify(ownerBalance)));
        
        console.info('============= Token inicializado correctamente =============');
        return JSON.stringify(tokenConfig);
    }
    
    /**
     * Obtiene la configuración del token
     * @param {Context} ctx - Contexto de transacción
     * @returns {Object} - Configuración del token
     */
    async getTokenInfo(ctx) {
        const tokenConfigBuffer = await ctx.stub.getState('tokenConfig');
        if (!tokenConfigBuffer || tokenConfigBuffer.length === 0) {
            throw new Error('El token no ha sido inicializado');
        }
        return JSON.parse(tokenConfigBuffer.toString());
    }
    
    /**
     * Obtiene el saldo de una dirección
     * @param {Context} ctx - Contexto de transacción
     * @param {String} address - Dirección del usuario
     * @returns {String} - Saldo del usuario
     */
    async balanceOf(ctx, address) {
        const balanceBuffer = await ctx.stub.getState(`balance_${address}`);
        if (!balanceBuffer || balanceBuffer.length === 0) {
            return '0';
        }
        const balance = JSON.parse(balanceBuffer.toString());
        return balance.balance;
    }
    
    /**
     * Transfiere tokens de la dirección del remitente a la dirección del destinatario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} to - Dirección del destinatario
     * @param {String} amount - Cantidad a transferir
     * @returns {Boolean} - Resultado de la transferencia
     */
    async transfer(ctx, to, amount) {
        // Obtener la identidad del remitente
        const clientIdentity = ctx.clientIdentity;
        const sender = clientIdentity.getID();
        
        // Validar parámetros
        if (!to || !amount) {
            throw new Error('Parámetros inválidos: se requiere destinatario y cantidad');
        }
        
        // Convertir cantidad a BigInt para evitar problemas con números grandes
        const amountBigInt = BigInt(amount);
        if (amountBigInt <= BigInt(0)) {
            throw new Error('La cantidad debe ser mayor que cero');
        }
        
        // Obtener saldo del remitente
        const senderBalanceBuffer = await ctx.stub.getState(`balance_${sender}`);
        if (!senderBalanceBuffer || senderBalanceBuffer.length === 0) {
            throw new Error('El remitente no tiene saldo');
        }
        const senderBalance = JSON.parse(senderBalanceBuffer.toString());
        
        // Verificar saldo suficiente
        const senderBalanceBigInt = BigInt(senderBalance.balance);
        if (senderBalanceBigInt < amountBigInt) {
            throw new Error('Saldo insuficiente');
        }
        
        // Actualizar saldo del remitente
        const newSenderBalance = senderBalanceBigInt - amountBigInt;
        senderBalance.balance = newSenderBalance.toString();
        await ctx.stub.putState(`balance_${sender}`, Buffer.from(JSON.stringify(senderBalance)));
        
        // Actualizar saldo del destinatario
        let recipientBalance;
        const recipientBalanceBuffer = await ctx.stub.getState(`balance_${to}`);
        if (!recipientBalanceBuffer || recipientBalanceBuffer.length === 0) {
            recipientBalance = {
                address: to,
                balance: amountBigInt.toString()
            };
        } else {
            recipientBalance = JSON.parse(recipientBalanceBuffer.toString());
            const recipientBalanceBigInt = BigInt(recipientBalance.balance);
            recipientBalance.balance = (recipientBalanceBigInt + amountBigInt).toString();
        }
        await ctx.stub.putState(`balance_${to}`, Buffer.from(JSON.stringify(recipientBalance)));
        
        // Emitir evento de transferencia
        const transferEvent = {
            from: sender,
            to: to,
            amount: amount
        };
        await ctx.stub.setEvent('Transfer', Buffer.from(JSON.stringify(transferEvent)));
        
        return true;
    }
    
    /**
     * Permite que un propietario apruebe a un gastador para gastar una cantidad específica de tokens
     * @param {Context} ctx - Contexto de transacción
     * @param {String} spender - Dirección del gastador
     * @param {String} amount - Cantidad a aprobar
     * @returns {Boolean} - Resultado de la aprobación
     */
    async approve(ctx, spender, amount) {
        // Obtener la identidad del propietario
        const clientIdentity = ctx.clientIdentity;
        const owner = clientIdentity.getID();
        
        // Validar parámetros
        if (!spender || !amount) {
            throw new Error('Parámetros inválidos: se requiere gastador y cantidad');
        }
        
        // Crear o actualizar la asignación
        const allowance = {
            owner: owner,
            spender: spender,
            amount: amount
        };
        
        await ctx.stub.putState(`allowance_${owner}_${spender}`, Buffer.from(JSON.stringify(allowance)));
        
        // Emitir evento de aprobación
        const approvalEvent = {
            owner: owner,
            spender: spender,
            amount: amount
        };
        await ctx.stub.setEvent('Approval', Buffer.from(JSON.stringify(approvalEvent)));
        
        return true;
    }
    
    /**
     * Obtiene la cantidad que un gastador está autorizado a gastar en nombre de un propietario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} owner - Dirección del propietario
     * @param {String} spender - Dirección del gastador
     * @returns {String} - Cantidad aprobada
     */
    async allowance(ctx, owner, spender) {
        const allowanceBuffer = await ctx.stub.getState(`allowance_${owner}_${spender}`);
        if (!allowanceBuffer || allowanceBuffer.length === 0) {
            return '0';
        }
        const allowance = JSON.parse(allowanceBuffer.toString());
        return allowance.amount;
    }
    
    /**
     * Permite que un gastador transfiera tokens en nombre de un propietario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} from - Dirección del propietario
     * @param {String} to - Dirección del destinatario
     * @param {String} amount - Cantidad a transferir
     * @returns {Boolean} - Resultado de la transferencia
     */
    async transferFrom(ctx, from, to, amount) {
        // Obtener la identidad del gastador
        const clientIdentity = ctx.clientIdentity;
        const spender = clientIdentity.getID();
        
        // Validar parámetros
        if (!from || !to || !amount) {
            throw new Error('Parámetros inválidos: se requiere remitente, destinatario y cantidad');
        }
        
        // Convertir cantidad a BigInt
        const amountBigInt = BigInt(amount);
        if (amountBigInt <= BigInt(0)) {
            throw new Error('La cantidad debe ser mayor que cero');
        }
        
        // Verificar asignación
        const allowanceBuffer = await ctx.stub.getState(`allowance_${from}_${spender}`);
        if (!allowanceBuffer || allowanceBuffer.length === 0) {
            throw new Error('No hay asignación para este gastador');
        }
        const allowance = JSON.parse(allowanceBuffer.toString());
        const allowanceBigInt = BigInt(allowance.amount);
        
        if (allowanceBigInt < amountBigInt) {
            throw new Error('Asignación insuficiente');
        }
        
        // Obtener saldo del remitente
        const fromBalanceBuffer = await ctx.stub.getState(`balance_${from}`);
        if (!fromBalanceBuffer || fromBalanceBuffer.length === 0) {
            throw new Error('El remitente no tiene saldo');
        }
        const fromBalance = JSON.parse(fromBalanceBuffer.toString());
        
        // Verificar saldo suficiente
        const fromBalanceBigInt = BigInt(fromBalance.balance);
        if (fromBalanceBigInt < amountBigInt) {
            throw new Error('Saldo insuficiente');
        }
        
        // Actualizar saldo del remitente
        const newFromBalance = fromBalanceBigInt - amountBigInt;
        fromBalance.balance = newFromBalance.toString();
        await ctx.stub.putState(`balance_${from}`, Buffer.from(JSON.stringify(fromBalance)));
        
        // Actualizar saldo del destinatario
        let toBalance;
        const toBalanceBuffer = await ctx.stub.getState(`balance_${to}`);
        if (!toBalanceBuffer || toBalanceBuffer.length === 0) {
            toBalance = {
                address: to,
                balance: amountBigInt.toString()
            };
        } else {
            toBalance = JSON.parse(toBalanceBuffer.toString());
            const toBalanceBigInt = BigInt(toBalance.balance);
            toBalance.balance = (toBalanceBigInt + amountBigInt).toString();
        }
        await ctx.stub.putState(`balance_${to}`, Buffer.from(JSON.stringify(toBalance)));
        
        // Actualizar asignación
        const newAllowanceBigInt = allowanceBigInt - amountBigInt;
        allowance.amount = newAllowanceBigInt.toString();
        await ctx.stub.putState(`allowance_${from}_${spender}`, Buffer.from(JSON.stringify(allowance)));
        
        // Emitir evento de transferencia
        const transferEvent = {
            from: from,
            to: to,
            amount: amount,
            spender: spender
        };
        await ctx.stub.setEvent('TransferFrom', Buffer.from(JSON.stringify(transferEvent)));
        
        return true;
    }
    
    /**
     * Acuña nuevos tokens y los asigna a una dirección
     * @param {Context} ctx - Contexto de transacción
     * @param {String} to - Dirección del destinatario
     * @param {String} amount - Cantidad a acuñar
     * @returns {Boolean} - Resultado de la acuñación
     */
    async mint(ctx, to, amount) {
        // Verificar que el llamante sea el propietario
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Obtener configuración del token
        const tokenConfigBuffer = await ctx.stub.getState('tokenConfig');
        if (!tokenConfigBuffer || tokenConfigBuffer.length === 0) {
            throw new Error('El token no ha sido inicializado');
        }
        const tokenConfig = JSON.parse(tokenConfigBuffer.toString());
        
        // Verificar que el llamante sea el propietario
        if (caller !== tokenConfig.owner) {
            throw new Error('Solo el propietario puede acuñar tokens');
        }
        
        // Validar parámetros
        if (!to || !amount) {
            throw new Error('Parámetros inválidos: se requiere destinatario y cantidad');
        }
        
        // Convertir cantidad a BigInt
        const amountBigInt = BigInt(amount);
        if (amountBigInt <= BigInt(0)) {
            throw new Error('La cantidad debe ser mayor que cero');
        }
        
        // Actualizar saldo del destinatario
        let recipientBalance;
        const recipientBalanceBuffer = await ctx.stub.getState(`balance_${to}`);
        if (!recipientBalanceBuffer || recipientBalanceBuffer.length === 0) {
            recipientBalance = {
                address: to,
                balance: amountBigInt.toString()
            };
        } else {
            recipientBalance = JSON.parse(recipientBalanceBuffer.toString());
            const recipientBalanceBigInt = BigInt(recipientBalance.balance);
            recipientBalance.balance = (recipientBalanceBigInt + amountBigInt).toString();
        }
        await ctx.stub.putState(`balance_${to}`, Buffer.from(JSON.stringify(recipientBalance)));
        
        // Actualizar suministro total
        const totalSupplyBigInt = BigInt(tokenConfig.totalSupply);
        tokenConfig.totalSupply = (totalSupplyBigInt + amountBigInt).toString();
        await ctx.stub.putState('tokenConfig', Buffer.from(JSON.stringify(tokenConfig)));
        
        // Emitir evento de acuñación
        const mintEvent = {
            to: to,
            amount: amount
        };
        await ctx.stub.setEvent('Mint', Buffer.from(JSON.stringify(mintEvent)));
        
        return true;
    }
    
    /**
     * Quema tokens de una dirección
     * @param {Context} ctx - Contexto de transacción
     * @param {String} amount - Cantidad a quemar
     * @returns {Boolean} - Resultado de la quema
     */
    async burn(ctx, amount) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!amount) {
            throw new Error('Parámetros inválidos: se requiere cantidad');
        }
        
        // Convertir cantidad a BigInt
        const amountBigInt = BigInt(amount);
        if (amountBigInt <= BigInt(0)) {
            throw new Error('La cantidad debe ser mayor que cero');
        }
        
        // Obtener saldo del llamante
        const callerBalanceBuffer = await ctx.stub.getState(`balance_${caller}`);
        if (!callerBalanceBuffer || callerBalanceBuffer.length === 0) {
            throw new Error('El llamante no tiene saldo');
        }
        const callerBalance = JSON.parse(callerBalanceBuffer.toString());
        
        // Verificar saldo suficiente
        const callerBalanceBigInt = BigInt(callerBalance.balance);
        if (callerBalanceBigInt < amountBigInt) {
            throw new Error('Saldo insuficiente');
        }
        
        // Actualizar saldo del llamante
        const newCallerBalance = callerBalanceBigInt - amountBigInt;
        callerBalance.balance = newCallerBalance.toString();
        await ctx.stub.putState(`balance_${caller}`, Buffer.from(JSON.stringify(callerBalance)));
        
        // Actualizar suministro total
        const tokenConfigBuffer = await ctx.stub.getState('tokenConfig');
        const tokenConfig = JSON.parse(tokenConfigBuffer.toString());
        const totalSupplyBigInt = BigInt(tokenConfig.totalSupply);
        tokenConfig.totalSupply = (totalSupplyBigInt - amountBigInt).toString();
        await ctx.stub.putState('tokenConfig', Buffer.from(JSON.stringify(tokenConfig)));
        
        // Emitir evento de quema
        const burnEvent = {
            from: caller,
            amount: amount
        };
        await ctx.stub.setEvent('Burn', Buffer.from(JSON.stringify(burnEvent)));
        
        return true;
    }
    
    /**
     * Bloquea tokens para staking
     * @param {Context} ctx - Contexto de transacción
     * @param {String} amount - Cantidad a bloquear
     * @param {Number} duration - Duración del bloqueo en días
     * @returns {String} - ID del stake
     */
    async stake(ctx, amount, duration) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!amount || !duration) {
            throw new Error('Parámetros inválidos: se requiere cantidad y duración');
        }
        
        // Convertir cantidad a BigInt y duración a Number
        const amountBigInt = BigInt(amount);
        const durationNum = parseInt(duration);
        
        if (amountBigInt <= BigInt(0)) {
            throw new Error('La cantidad debe ser mayor que cero');
        }
        
        if (durationNum < 30) {
            throw new Error('La duración mínima de staking es de 30 días');
        }
        
        // Obtener saldo del llamante
        const callerBalanceBuffer = await ctx.stub.getState(`balance_${caller}`);
        if (!callerBalanceBuffer || callerBalanceBuffer.length === 0) {
            throw new Error('El llamante no tiene saldo');
        }
        const callerBalance = JSON.parse(callerBalanceBuffer.toString());
        
        // Verificar saldo suficiente
        const callerBalanceBigInt = BigInt(callerBalance.balance);
        if (callerBalanceBigInt < amountBigInt) {
            throw new Error('Saldo insuficiente');
        }
        
        // Actualizar saldo del llamante
        const newCallerBalance = callerBalanceBigInt - amountBigInt;
        callerBalance.balance = newCallerBalance.toString();
        await ctx.stub.putState(`balance_${caller}`, Buffer.from(JSON.stringify(callerBalance)));
        
        // Crear registro de staking
        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + durationNum);
        
        const stakeId = `stake_${caller}_${now.getTime()}`;
        const stake = {
            id: stakeId,
            owner: caller,
            amount: amount,
            startDate: now.toISOString(),
            endDate: endDate.toISOString(),
            duration: durationNum,
            claimed: false
        };
        
        await ctx.stub.putState(stakeId, Buffer.from(JSON.stringify(stake)));
        
        // Emitir evento de staking
        const stakeEvent = {
            owner: caller,
            amount: amount,
            duration: durationNum,
            stakeId: stakeId
        };
        await ctx.stub.setEvent('Stake', Buffer.from(JSON.stringify(stakeEvent)));
        
        return stakeId;
    }
    
    /**
     * Reclama tokens bloqueados y recompensas después del período de staking
     * @param {Context} ctx - Contexto de transacción
     * @param {String} stakeId - ID del stake
     * @returns {Boolean} - Resultado del reclamo
     */
    async unstake(ctx, stakeId) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!stakeId) {
            throw new Error('Parámetros inválidos: se requiere ID de stake');
        }
        
        // Obtener registro de staking
        const stakeBuffer = await ctx.stub.getState(stakeId);
        if (!stakeBuffer || stakeBuffer.length === 0) {
            throw new Error('Stake no encontrado');
        }
        const stake = JSON.parse(stakeBuffer.toString());
        
        // Verificar que el llamante sea el propietario
        if (stake.owner !== caller) {
            throw new Error('Solo el propietario puede reclamar este stake');
        }
        
        // Verificar que el stake no haya sido reclamado
        if (stake.claimed) {
            throw new Error('Este stake ya ha sido reclamado');
        }
        
        // Verificar que el período de staking haya terminado
        const now = new Date();
        const endDate = new Date(stake.endDate);
        
        if (now < endDate) {
            throw new Error('El período de staking aún no ha terminado');
        }
        
        // Calcular recompensa (5% anual prorrateado por duración)
        const amountBigInt = BigInt(stake.amount);
        const durationDays = stake.duration;
        const annualRate = 5; // 5% anual
        
        // Calcular recompensa: amount * (annualRate / 100) * (durationDays / 365)
        const rewardBigInt = amountBigInt * BigInt(annualRate) * BigInt(durationDays) / BigInt(100) / BigInt(365);
        
        // Actualizar saldo del llamante
        let callerBalance;
        const callerBalanceBuffer = await ctx.stub.getState(`balance_${caller}`);
        if (!callerBalanceBuffer || callerBalanceBuffer.length === 0) {
            callerBalance = {
                address: caller,
                balance: (amountBigInt + rewardBigInt).toString()
            };
        } else {
            callerBalance = JSON.parse(callerBalanceBuffer.toString());
            const callerBalanceBigInt = BigInt(callerBalance.balance);
            callerBalance.balance = (callerBalanceBigInt + amountBigInt + rewardBigInt).toString();
        }
        await ctx.stub.putState(`balance_${caller}`, Buffer.from(JSON.stringify(callerBalance)));
        
        // Actualizar registro de staking
        stake.claimed = true;
        stake.claimedDate = now.toISOString();
        stake.reward = rewardBigInt.toString();
        await ctx.stub.putState(stakeId, Buffer.from(JSON.stringify(stake)));
        
        // Actualizar suministro total (para reflejar las recompensas acuñadas)
        const tokenConfigBuffer = await ctx.stub.getState('tokenConfig');
        const tokenConfig = JSON.parse(tokenConfigBuffer.toString());
        const totalSupplyBigInt = BigInt(tokenConfig.totalSupply);
        tokenConfig.totalSupply = (totalSupplyBigInt + rewardBigInt).toString();
        await ctx.stub.putState('tokenConfig', Buffer.from(JSON.stringify(tokenConfig)));
        
        // Emitir evento de unstaking
        const unstakeEvent = {
            owner: caller,
            amount: stake.amount,
            reward: rewardBigInt.toString(),
            stakeId: stakeId
        };
        await ctx.stub.setEvent('Unstake', Buffer.from(JSON.stringify(unstakeEvent)));
        
        return true;
    }
    
    /**
     * Obtiene todos los stakes de un usuario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} owner - Dirección del propietario (opcional, si no se proporciona, se usa el llamante)
     * @returns {Array} - Lista de stakes
     */
    async getStakes(ctx, owner) {
        // Determinar el propietario
        let stakeOwner;
        if (!owner) {
            const clientIdentity = ctx.clientIdentity;
            stakeOwner = clientIdentity.getID();
        } else {
            stakeOwner = owner;
        }
        
        // Consultar todos los stakes
        const query = {
            selector: {
                owner: stakeOwner
            },
            use_index: ['_design/indexOwnerDoc', 'indexOwner']
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const stakes = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const stake = JSON.parse(result.value.value.toString());
            stakes.push(stake);
            result = await iterator.next();
        }
        
        return stakes;
    }
    
    /**
     * Obtiene el historial de transacciones de una dirección
     * @param {Context} ctx - Contexto de transacción
     * @param {String} address - Dirección del usuario
     * @returns {Array} - Historial de transacciones
     */
    async getTransactionHistory(ctx, address) {
        // Validar parámetros
        if (!address) {
            throw new Error('Parámetros inválidos: se requiere dirección');
        }
        
        // Obtener historial de la dirección
        const iterator = await ctx.stub.getHistoryForKey(`balance_${address}`);
        const history = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const modification = {
                txId: result.value.txId,
                timestamp: new Date(result.value.timestamp.getSeconds() * 1000).toISOString(),
                value: JSON.parse(result.value.value.toString())
            };
            history.push(modification);
            result = await iterator.next();
        }
        
        return history;
    }
}

module.exports = TokenContract;
