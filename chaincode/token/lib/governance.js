'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Contrato de Gobernanza para la Blockchain Simbiótica
 * Implementa funcionalidades de gobernanza DAO para la plataforma
 */
class GovernanceContract extends Contract {
    
    /**
     * Inicializa el contrato con los valores predeterminados
     * @param {Context} ctx - Contexto de transacción
     */
    async init(ctx) {
        console.info('============= Inicializando Contrato de Gobernanza =============');
        
        // Configuración de gobernanza
        const governanceConfig = {
            version: '1.0',
            quorum: 51, // Porcentaje mínimo para aprobar propuestas (51%)
            votingPeriod: 7, // Días que dura una votación
            executionDelay: 2, // Días de espera antes de ejecutar una propuesta aprobada
            minTokensToPropose: '100000000000000000000', // 100 tokens con 18 decimales
            minTokensToVote: '10000000000000000000', // 10 tokens con 18 decimales
            admin: 'admin'
        };
        
        await ctx.stub.putState('governanceConfig', Buffer.from(JSON.stringify(governanceConfig)));
        
        console.info('============= Contrato de Gobernanza inicializado correctamente =============');
        return JSON.stringify(governanceConfig);
    }
    
    /**
     * Crea una nueva propuesta de gobernanza
     * @param {Context} ctx - Contexto de transacción
     * @param {String} title - Título de la propuesta
     * @param {String} description - Descripción detallada de la propuesta
     * @param {String} actions - Acciones a ejecutar en formato JSON
     * @returns {Object} - Información de la propuesta creada
     */
    async createProposal(ctx, title, description, actions) {
        // Obtener la identidad del proponente
        const clientIdentity = ctx.clientIdentity;
        const proposer = clientIdentity.getID();
        
        // Validar parámetros
        if (!title || !description || !actions) {
            throw new Error('Parámetros inválidos: se requiere título, descripción y acciones');
        }
        
        // Verificar que las acciones sean JSON válido
        let actionsObj;
        try {
            actionsObj = JSON.parse(actions);
        } catch (error) {
            throw new Error('Las acciones deben estar en formato JSON válido');
        }
        
        // Obtener configuración de gobernanza
        const configBuffer = await ctx.stub.getState('governanceConfig');
        if (!configBuffer || configBuffer.length === 0) {
            throw new Error('La configuración de gobernanza no ha sido inicializada');
        }
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el proponente tenga suficientes tokens
        // En un entorno real, aquí se verificaría el balance del proponente
        // Para este ejemplo, asumimos que el proponente tiene suficientes tokens
        
        // Crear propuesta
        const now = new Date();
        const votingEndDate = new Date(now);
        votingEndDate.setDate(votingEndDate.getDate() + config.votingPeriod);
        
        const executionDate = new Date(votingEndDate);
        executionDate.setDate(executionDate.getDate() + config.executionDelay);
        
        const proposalId = `proposal_${now.getTime()}`;
        const proposal = {
            id: proposalId,
            title: title,
            description: description,
            actions: actionsObj,
            proposer: proposer,
            status: 'active',
            createdAt: now.toISOString(),
            votingEndDate: votingEndDate.toISOString(),
            executionDate: executionDate.toISOString(),
            votesFor: '0',
            votesAgainst: '0',
            votesAbstain: '0',
            voters: {},
            executed: false,
            executionResult: null
        };
        
        // Guardar propuesta
        await ctx.stub.putState(proposalId, Buffer.from(JSON.stringify(proposal)));
        
        // Emitir evento de propuesta creada
        const proposalEvent = {
            id: proposalId,
            title: title,
            proposer: proposer,
            votingEndDate: votingEndDate.toISOString()
        };
        await ctx.stub.setEvent('ProposalCreated', Buffer.from(JSON.stringify(proposalEvent)));
        
        return proposal;
    }
    
    /**
     * Vota en una propuesta de gobernanza
     * @param {Context} ctx - Contexto de transacción
     * @param {String} proposalId - ID de la propuesta
     * @param {String} vote - Voto (for, against, abstain)
     * @param {String} weight - Peso del voto (cantidad de tokens)
     * @returns {Object} - Información de la propuesta actualizada
     */
    async voteOnProposal(ctx, proposalId, vote, weight) {
        // Obtener la identidad del votante
        const clientIdentity = ctx.clientIdentity;
        const voter = clientIdentity.getID();
        
        // Validar parámetros
        if (!proposalId || !vote || !weight) {
            throw new Error('Parámetros inválidos: se requiere ID de propuesta, voto y peso');
        }
        
        // Verificar voto válido
        const validVotes = ['for', 'against', 'abstain'];
        if (!validVotes.includes(vote)) {
            throw new Error(`Voto inválido. Debe ser uno de: ${validVotes.join(', ')}`);
        }
        
        // Convertir peso a BigInt
        const weightBigInt = BigInt(weight);
        if (weightBigInt <= BigInt(0)) {
            throw new Error('El peso del voto debe ser mayor que cero');
        }
        
        // Obtener configuración de gobernanza
        const configBuffer = await ctx.stub.getState('governanceConfig');
        if (!configBuffer || configBuffer.length === 0) {
            throw new Error('La configuración de gobernanza no ha sido inicializada');
        }
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el votante tenga suficientes tokens
        const minTokensToVoteBigInt = BigInt(config.minTokensToVote);
        if (weightBigInt < minTokensToVoteBigInt) {
            throw new Error(`Se requieren al menos ${config.minTokensToVote} tokens para votar`);
        }
        
        // Obtener propuesta
        const proposalBuffer = await ctx.stub.getState(proposalId);
        if (!proposalBuffer || proposalBuffer.length === 0) {
            throw new Error('Propuesta no encontrada');
        }
        
        const proposal = JSON.parse(proposalBuffer.toString());
        
        // Verificar que la propuesta esté activa
        if (proposal.status !== 'active') {
            throw new Error('La propuesta no está activa');
        }
        
        // Verificar que la votación no haya terminado
        const now = new Date();
        const votingEndDate = new Date(proposal.votingEndDate);
        
        if (now > votingEndDate) {
            throw new Error('El período de votación ha terminado');
        }
        
        // Verificar si el votante ya ha votado
        if (proposal.voters[voter]) {
            throw new Error('Ya has votado en esta propuesta');
        }
        
        // Registrar voto
        proposal.voters[voter] = {
            vote: vote,
            weight: weight,
            timestamp: now.toISOString()
        };
        
        // Actualizar conteo de votos
        if (vote === 'for') {
            proposal.votesFor = (BigInt(proposal.votesFor) + weightBigInt).toString();
        } else if (vote === 'against') {
            proposal.votesAgainst = (BigInt(proposal.votesAgainst) + weightBigInt).toString();
        } else {
            proposal.votesAbstain = (BigInt(proposal.votesAbstain) + weightBigInt).toString();
        }
        
        // Guardar propuesta actualizada
        await ctx.stub.putState(proposalId, Buffer.from(JSON.stringify(proposal)));
        
        // Emitir evento de voto registrado
        const voteEvent = {
            proposalId: proposalId,
            voter: voter,
            vote: vote,
            weight: weight
        };
        await ctx.stub.setEvent('VoteRegistered', Buffer.from(JSON.stringify(voteEvent)));
        
        return proposal;
    }
    
    /**
     * Finaliza una propuesta de gobernanza
     * @param {Context} ctx - Contexto de transacción
     * @param {String} proposalId - ID de la propuesta
     * @returns {Object} - Información de la propuesta finalizada
     */
    async finalizeProposal(ctx, proposalId) {
        // Validar parámetros
        if (!proposalId) {
            throw new Error('Parámetros inválidos: se requiere ID de propuesta');
        }
        
        // Obtener propuesta
        const proposalBuffer = await ctx.stub.getState(proposalId);
        if (!proposalBuffer || proposalBuffer.length === 0) {
            throw new Error('Propuesta no encontrada');
        }
        
        const proposal = JSON.parse(proposalBuffer.toString());
        
        // Verificar que la propuesta esté activa
        if (proposal.status !== 'active') {
            throw new Error('La propuesta ya ha sido finalizada');
        }
        
        // Verificar que la votación haya terminado
        const now = new Date();
        const votingEndDate = new Date(proposal.votingEndDate);
        
        if (now < votingEndDate) {
            throw new Error('El período de votación aún no ha terminado');
        }
        
        // Obtener configuración de gobernanza
        const configBuffer = await ctx.stub.getState('governanceConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Calcular resultado
        const votesForBigInt = BigInt(proposal.votesFor);
        const votesAgainstBigInt = BigInt(proposal.votesAgainst);
        const totalVotes = votesForBigInt + votesAgainstBigInt;
        
        let result;
        if (totalVotes === BigInt(0)) {
            result = 'rejected'; // No hay votos, se rechaza
        } else {
            const forPercentage = Number((votesForBigInt * BigInt(100)) / totalVotes);
            result = forPercentage >= config.quorum ? 'approved' : 'rejected';
        }
        
        // Actualizar estado de la propuesta
        proposal.status = result;
        proposal.finalizedAt = now.toISOString();
        
        // Guardar propuesta actualizada
        await ctx.stub.putState(proposalId, Buffer.from(JSON.stringify(proposal)));
        
        // Emitir evento de propuesta finalizada
        const finalizeEvent = {
            proposalId: proposalId,
            result: result,
            votesFor: proposal.votesFor,
            votesAgainst: proposal.votesAgainst,
            votesAbstain: proposal.votesAbstain
        };
        await ctx.stub.setEvent('ProposalFinalized', Buffer.from(JSON.stringify(finalizeEvent)));
        
        return proposal;
    }
    
    /**
     * Ejecuta una propuesta aprobada
     * @param {Context} ctx - Contexto de transacción
     * @param {String} proposalId - ID de la propuesta
     * @returns {Object} - Información de la propuesta ejecutada
     */
    async executeProposal(ctx, proposalId) {
        // Validar parámetros
        if (!proposalId) {
            throw new Error('Parámetros inválidos: se requiere ID de propuesta');
        }
        
        // Obtener propuesta
        const proposalBuffer = await ctx.stub.getState(proposalId);
        if (!proposalBuffer || proposalBuffer.length === 0) {
            throw new Error('Propuesta no encontrada');
        }
        
        const proposal = JSON.parse(proposalBuffer.toString());
        
        // Verificar que la propuesta esté aprobada
        if (proposal.status !== 'approved') {
            throw new Error('Solo se pueden ejecutar propuestas aprobadas');
        }
        
        // Verificar que la propuesta no haya sido ejecutada
        if (proposal.executed) {
            throw new Error('La propuesta ya ha sido ejecutada');
        }
        
        // Verificar que haya pasado el período de espera
        const now = new Date();
        const executionDate = new Date(proposal.executionDate);
        
        if (now < executionDate) {
            throw new Error('Aún no se ha cumplido el período de espera para la ejecución');
        }
        
        // Ejecutar acciones
        // En un entorno real, aquí se ejecutarían las acciones definidas en la propuesta
        // Para este ejemplo, simplemente marcamos la propuesta como ejecutada
        
        // Actualizar estado de la propuesta
        proposal.executed = true;
        proposal.executedAt = now.toISOString();
        proposal.executionResult = 'success';
        
        // Guardar propuesta actualizada
        await ctx.stub.putState(proposalId, Buffer.from(JSON.stringify(proposal)));
        
        // Emitir evento de propuesta ejecutada
        const executeEvent = {
            proposalId: proposalId,
            executedAt: now.toISOString(),
            result: 'success'
        };
        await ctx.stub.setEvent('ProposalExecuted', Buffer.from(JSON.stringify(executeEvent)));
        
        return proposal;
    }
    
    /**
     * Obtiene todas las propuestas activas
     * @param {Context} ctx - Contexto de transacción
     * @returns {Array} - Lista de propuestas activas
     */
    async getActiveProposals(ctx) {
        // Consultar propuestas activas
        const query = {
            selector: {
                status: 'active'
            },
            use_index: ['_design/indexStatusDoc', 'indexStatus']
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const proposals = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const proposal = JSON.parse(result.value.value.toString());
            proposals.push(proposal);
            result = await iterator.next();
        }
        
        return proposals;
    }
    
    /**
     * Obtiene todas las propuestas de un usuario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @returns {Array} - Lista de propuestas del usuario
     */
    async getUserProposals(ctx, userId) {
        // Validar parámetros
        if (!userId) {
            throw new Error('Parámetros inválidos: se requiere ID de usuario');
        }
        
        // Consultar propuestas del usuario
        const query = {
            selector: {
                proposer: userId
            },
            use_index: ['_design/indexProposerDoc', 'indexProposer']
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const proposals = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const proposal = JSON.parse(result.value.value.toString());
            proposals.push(proposal);
            result = await iterator.next();
        }
        
        return proposals;
    }
    
    /**
     * Actualiza la configuración de gobernanza
     * @param {Context} ctx - Contexto de transacción
     * @param {String} configJson - Nueva configuración en formato JSON
     * @returns {Object} - Configuración actualizada
     */
    async updateGovernanceConfig(ctx, configJson) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Obtener configuración actual
        const configBuffer = await ctx.stub.getState('governanceConfig');
        if (!configBuffer || configBuffer.length === 0) {
            throw new Error('La configuración de gobernanza no ha sido inicializada');
        }
        const currentConfig = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== currentConfig.admin) {
            throw new Error('Solo el administrador puede actualizar la configuración de gobernanza');
        }
        
        // Validar parámetros
        if (!configJson) {
            throw new Error('Parámetros inválidos: se requiere configuración en formato JSON');
        }
        
        // Verificar que la configuración sea JSON válido
        let newConfig;
        try {
            newConfig = JSON.parse(configJson);
        } catch (error) {
            throw new Error('La configuración debe estar en formato JSON válido');
        }
        
        // Validar campos requeridos
        const requiredFields = ['quorum', 'votingPeriod', 'executionDelay', 'minTokensToPropose', 'minTokensToVote'];
        for (const field of requiredFields) {
            if (!newConfig[field]) {
                throw new Error(`Campo requerido faltante: ${field}`);
            }
        }
        
        // Validar valores
        if (newConfig.quorum < 1 || newConfig.quorum > 100) {
            throw new Error('El quórum debe estar entre 1 y 100');
        }
        
        if (newConfig.votingPeriod < 1) {
            throw new Error('El período de votación debe ser al menos 1 día');
        }
        
        if (newConfig.executionDelay < 0) {
            throw new Error('El retraso de ejecución no puede ser negativo');
        }
        
        // Mantener campos que no se pueden cambiar
        newConfig.version = currentConfig.version;
        newConfig.admin = currentConfig.admin;
        
        // Guardar nueva configuración
        await ctx.stub.putState('governanceConfig', Buffer.from(JSON.stringify(newConfig)));
        
        // Emitir evento de configuración actualizada
        const configEvent = {
            updatedBy: caller,
            timestamp: new Date().toISOString()
        };
        await ctx.stub.setEvent('GovernanceConfigUpdated', Buffer.from(JSON.stringify(configEvent)));
        
        return newConfig;
    }
}

module.exports = GovernanceContract;
