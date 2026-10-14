'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Contrato de Identidad para la Blockchain Simbiótica
 * Implementa funcionalidades de identidad descentralizada (DID)
 */
class IdentityContract extends Contract {
    
    /**
     * Inicializa el contrato con los valores predeterminados
     * @param {Context} ctx - Contexto de transacción
     */
    async init(ctx) {
        console.info('============= Inicializando Contrato de Identidad =============');
        
        // Configuración del contrato de identidad
        const identityConfig = {
            version: '1.0',
            admin: 'admin',
            verificationMethods: ['ed25519', 'secp256k1', 'rsa'],
            trustedIssuers: []
        };
        
        await ctx.stub.putState('identityConfig', Buffer.from(JSON.stringify(identityConfig)));
        
        console.info('============= Contrato de Identidad inicializado correctamente =============');
        return JSON.stringify(identityConfig);
    }
    
    /**
     * Crea una nueva identidad descentralizada (DID)
     * @param {Context} ctx - Contexto de transacción
     * @param {String} controller - Controlador de la identidad
     * @param {String} publicKey - Clave pública en formato JSON
     * @param {String} metadata - Metadatos adicionales en formato JSON (opcional)
     * @returns {Object} - Información de la identidad creada
     */
    async createIdentity(ctx, controller, publicKey, metadata) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!controller || !publicKey) {
            throw new Error('Parámetros inválidos: se requiere controlador y clave pública');
        }
        
        // Verificar que la clave pública sea JSON válido
        let publicKeyObj;
        try {
            publicKeyObj = JSON.parse(publicKey);
        } catch (error) {
            throw new Error('La clave pública debe estar en formato JSON válido');
        }
        
        // Verificar campos requeridos de la clave pública
        if (!publicKeyObj.id || !publicKeyObj.type || !publicKeyObj.value) {
            throw new Error('La clave pública debe incluir id, type y value');
        }
        
        // Verificar que el tipo de clave sea válido
        const configBuffer = await ctx.stub.getState('identityConfig');
        const config = JSON.parse(configBuffer.toString());
        
        if (!config.verificationMethods.includes(publicKeyObj.type)) {
            throw new Error(`Tipo de clave inválido. Debe ser uno de: ${config.verificationMethods.join(', ')}`);
        }
        
        // Procesar metadatos si se proporcionan
        let metadataObj = {};
        if (metadata) {
            try {
                metadataObj = JSON.parse(metadata);
            } catch (error) {
                throw new Error('Los metadatos deben estar en formato JSON válido');
            }
        }
        
        // Crear DID
        const now = new Date();
        const didId = `did:simbiotica:${controller.replace(/[^a-zA-Z0-9]/g, '')}:${now.getTime()}`;
        
        const did = {
            id: didId,
            controller: controller,
            created: now.toISOString(),
            updated: now.toISOString(),
            createdBy: caller,
            verificationMethod: [publicKeyObj],
            authentication: [publicKeyObj.id],
            assertionMethod: [publicKeyObj.id],
            status: 'active',
            metadata: metadataObj
        };
        
        // Guardar DID
        await ctx.stub.putState(didId, Buffer.from(JSON.stringify(did)));
        
        // Emitir evento de identidad creada
        const didEvent = {
            type: 'create',
            did: didId,
            controller: controller,
            createdBy: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('IdentityCreated', Buffer.from(JSON.stringify(didEvent)));
        
        return did;
    }
    
    /**
     * Añade un método de verificación a una identidad existente
     * @param {Context} ctx - Contexto de transacción
     * @param {String} didId - ID de la identidad
     * @param {String} publicKey - Clave pública en formato JSON
     * @returns {Object} - Información de la identidad actualizada
     */
    async addVerificationMethod(ctx, didId, publicKey) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!didId || !publicKey) {
            throw new Error('Parámetros inválidos: se requiere ID de identidad y clave pública');
        }
        
        // Verificar que la clave pública sea JSON válido
        let publicKeyObj;
        try {
            publicKeyObj = JSON.parse(publicKey);
        } catch (error) {
            throw new Error('La clave pública debe estar en formato JSON válido');
        }
        
        // Verificar campos requeridos de la clave pública
        if (!publicKeyObj.id || !publicKeyObj.type || !publicKeyObj.value) {
            throw new Error('La clave pública debe incluir id, type y value');
        }
        
        // Obtener DID
        const didBuffer = await ctx.stub.getState(didId);
        if (!didBuffer || didBuffer.length === 0) {
            throw new Error(`Identidad con ID ${didId} no encontrada`);
        }
        
        const did = JSON.parse(didBuffer.toString());
        
        // Verificar que el llamante sea el controlador
        if (caller !== did.controller && caller !== did.createdBy) {
            throw new Error('Solo el controlador o creador puede modificar la identidad');
        }
        
        // Verificar que el método de verificación no exista
        const existingMethod = did.verificationMethod.find(method => method.id === publicKeyObj.id);
        if (existingMethod) {
            throw new Error(`Ya existe un método de verificación con ID ${publicKeyObj.id}`);
        }
        
        // Verificar que el tipo de clave sea válido
        const configBuffer = await ctx.stub.getState('identityConfig');
        const config = JSON.parse(configBuffer.toString());
        
        if (!config.verificationMethods.includes(publicKeyObj.type)) {
            throw new Error(`Tipo de clave inválido. Debe ser uno de: ${config.verificationMethods.join(', ')}`);
        }
        
        // Añadir método de verificación
        did.verificationMethod.push(publicKeyObj);
        did.authentication.push(publicKeyObj.id);
        did.assertionMethod.push(publicKeyObj.id);
        did.updated = new Date().toISOString();
        
        // Guardar DID actualizado
        await ctx.stub.putState(didId, Buffer.from(JSON.stringify(did)));
        
        // Emitir evento de método de verificación añadido
        const methodEvent = {
            type: 'addMethod',
            did: didId,
            methodId: publicKeyObj.id,
            updatedBy: caller,
            timestamp: did.updated
        };
        await ctx.stub.setEvent('VerificationMethodAdded', Buffer.from(JSON.stringify(methodEvent)));
        
        return did;
    }
    
    /**
     * Revoca un método de verificación de una identidad
     * @param {Context} ctx - Contexto de transacción
     * @param {String} didId - ID de la identidad
     * @param {String} methodId - ID del método de verificación
     * @returns {Object} - Información de la identidad actualizada
     */
    async revokeVerificationMethod(ctx, didId, methodId) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!didId || !methodId) {
            throw new Error('Parámetros inválidos: se requiere ID de identidad e ID del método de verificación');
        }
        
        // Obtener DID
        const didBuffer = await ctx.stub.getState(didId);
        if (!didBuffer || didBuffer.length === 0) {
            throw new Error(`Identidad con ID ${didId} no encontrada`);
        }
        
        const did = JSON.parse(didBuffer.toString());
        
        // Verificar que el llamante sea el controlador
        if (caller !== did.controller && caller !== did.createdBy) {
            throw new Error('Solo el controlador o creador puede modificar la identidad');
        }
        
        // Verificar que el método de verificación exista
        const methodIndex = did.verificationMethod.findIndex(method => method.id === methodId);
        if (methodIndex === -1) {
            throw new Error(`No existe un método de verificación con ID ${methodId}`);
        }
        
        // Verificar que no sea el único método de verificación
        if (did.verificationMethod.length === 1) {
            throw new Error('No se puede revocar el único método de verificación');
        }
        
        // Revocar método de verificación
        did.verificationMethod.splice(methodIndex, 1);
        did.authentication = did.authentication.filter(id => id !== methodId);
        did.assertionMethod = did.assertionMethod.filter(id => id !== methodId);
        did.updated = new Date().toISOString();
        
        // Guardar DID actualizado
        await ctx.stub.putState(didId, Buffer.from(JSON.stringify(did)));
        
        // Emitir evento de método de verificación revocado
        const methodEvent = {
            type: 'revokeMethod',
            did: didId,
            methodId: methodId,
            updatedBy: caller,
            timestamp: did.updated
        };
        await ctx.stub.setEvent('VerificationMethodRevoked', Buffer.from(JSON.stringify(methodEvent)));
        
        return did;
    }
    
    /**
     * Actualiza el estado de una identidad
     * @param {Context} ctx - Contexto de transacción
     * @param {String} didId - ID de la identidad
     * @param {String} status - Nuevo estado (active, suspended, revoked)
     * @returns {Object} - Información de la identidad actualizada
     */
    async updateIdentityStatus(ctx, didId, status) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!didId || !status) {
            throw new Error('Parámetros inválidos: se requiere ID de identidad y estado');
        }
        
        // Verificar estado válido
        const validStatus = ['active', 'suspended', 'revoked'];
        if (!validStatus.includes(status)) {
            throw new Error(`Estado inválido. Debe ser uno de: ${validStatus.join(', ')}`);
        }
        
        // Obtener DID
        const didBuffer = await ctx.stub.getState(didId);
        if (!didBuffer || didBuffer.length === 0) {
            throw new Error(`Identidad con ID ${didId} no encontrada`);
        }
        
        const did = JSON.parse(didBuffer.toString());
        
        // Verificar que el llamante sea el controlador o administrador
        const configBuffer = await ctx.stub.getState('identityConfig');
        const config = JSON.parse(configBuffer.toString());
        
        if (caller !== did.controller && caller !== did.createdBy && caller !== config.admin) {
            throw new Error('Solo el controlador, creador o administrador puede actualizar el estado de la identidad');
        }
        
        // Verificar que el estado sea diferente
        if (did.status === status) {
            throw new Error(`La identidad ya tiene el estado ${status}`);
        }
        
        // Actualizar estado
        did.status = status;
        did.updated = new Date().toISOString();
        
        // Guardar DID actualizado
        await ctx.stub.putState(didId, Buffer.from(JSON.stringify(did)));
        
        // Emitir evento de estado actualizado
        const statusEvent = {
            type: 'updateStatus',
            did: didId,
            status: status,
            updatedBy: caller,
            timestamp: did.updated
        };
        await ctx.stub.setEvent('IdentityStatusUpdated', Buffer.from(JSON.stringify(statusEvent)));
        
        return did;
    }
    
    /**
     * Actualiza los metadatos de una identidad
     * @param {Context} ctx - Contexto de transacción
     * @param {String} didId - ID de la identidad
     * @param {String} metadata - Nuevos metadatos en formato JSON
     * @returns {Object} - Información de la identidad actualizada
     */
    async updateMetadata(ctx, didId, metadata) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!didId || !metadata) {
            throw new Error('Parámetros inválidos: se requiere ID de identidad y metadatos');
        }
        
        // Verificar que los metadatos sean JSON válido
        let metadataObj;
        try {
            metadataObj = JSON.parse(metadata);
        } catch (error) {
            throw new Error('Los metadatos deben estar en formato JSON válido');
        }
        
        // Obtener DID
        const didBuffer = await ctx.stub.getState(didId);
        if (!didBuffer || didBuffer.length === 0) {
            throw new Error(`Identidad con ID ${didId} no encontrada`);
        }
        
        const did = JSON.parse(didBuffer.toString());
        
        // Verificar que el llamante sea el controlador
        if (caller !== did.controller && caller !== did.createdBy) {
            throw new Error('Solo el controlador o creador puede modificar la identidad');
        }
        
        // Actualizar metadatos
        did.metadata = metadataObj;
        did.updated = new Date().toISOString();
        
        // Guardar DID actualizado
        await ctx.stub.putState(didId, Buffer.from(JSON.stringify(did)));
        
        // Emitir evento de metadatos actualizados
        const metadataEvent = {
            type: 'updateMetadata',
            did: didId,
            updatedBy: caller,
            timestamp: did.updated
        };
        await ctx.stub.setEvent('MetadataUpdated', Buffer.from(JSON.stringify(metadataEvent)));
        
        return did;
    }
    
    /**
     * Crea una credencial verificable
     * @param {Context} ctx - Contexto de transacción
     * @param {String} issuer - ID del emisor
     * @param {String} subject - ID del sujeto
     * @param {String} credentialData - Datos de la credencial en formato JSON
     * @returns {Object} - Información de la credencial creada
     */
    async issueCredential(ctx, issuer, subject, credentialData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!issuer || !subject || !credentialData) {
            throw new Error('Parámetros inválidos: se requiere emisor, sujeto y datos de la credencial');
        }
        
        // Verificar que los datos sean JSON válido
        let credentialDataObj;
        try {
            credentialDataObj = JSON.parse(credentialData);
        } catch (error) {
            throw new Error('Los datos de la credencial deben estar en formato JSON válido');
        }
        
        // Verificar campos requeridos de la credencial
        if (!credentialDataObj.type || !credentialDataObj.claims) {
            throw new Error('Los datos de la credencial deben incluir type y claims');
        }
        
        // Obtener DID del emisor
        const issuerBuffer = await ctx.stub.getState(issuer);
        if (!issuerBuffer || issuerBuffer.length === 0) {
            throw new Error(`Emisor con ID ${issuer} no encontrado`);
        }
        
        const issuerDid = JSON.parse(issuerBuffer.toString());
        
        // Verificar que el llamante sea el controlador del emisor
        if (caller !== issuerDid.controller && caller !== issuerDid.createdBy) {
            throw new Error('Solo el controlador o creador del emisor puede emitir credenciales');
        }
        
        // Verificar que el emisor esté activo
        if (issuerDid.status !== 'active') {
            throw new Error('El emisor debe estar activo para emitir credenciales');
        }
        
        // Obtener DID del sujeto
        const subjectBuffer = await ctx.stub.getState(subject);
        if (!subjectBuffer || subjectBuffer.length === 0) {
            throw new Error(`Sujeto con ID ${subject} no encontrado`);
        }
        
        const subjectDid = JSON.parse(subjectBuffer.toString());
        
        // Verificar que el sujeto esté activo
        if (subjectDid.status !== 'active') {
            throw new Error('El sujeto debe estar activo para recibir credenciales');
        }
        
        // Crear credencial verificable
        const now = new Date();
        const credentialId = `vc:simbiotica:${issuer.split(':').pop()}:${now.getTime()}`;
        
        const credential = {
            id: credentialId,
            type: ['VerifiableCredential', ...credentialDataObj.type],
            issuer: issuer,
            issuanceDate: now.toISOString(),
            expirationDate: credentialDataObj.expirationDate || null,
            credentialSubject: {
                id: subject,
                ...credentialDataObj.claims
            },
            status: 'valid',
            proof: {
                type: issuerDid.verificationMethod[0].type,
                created: now.toISOString(),
                verificationMethod: `${issuer}#${issuerDid.verificationMethod[0].id}`,
                proofPurpose: 'assertionMethod',
                // En un sistema real, aquí se incluiría una firma digital
                proofValue: 'placeholder_for_digital_signature'
            }
        };
        
        // Guardar credencial
        await ctx.stub.putState(credentialId, Buffer.from(JSON.stringify(credential)));
        
        // Emitir evento de credencial emitida
        const credentialEvent = {
            type: 'issue',
            credentialId: credentialId,
            issuer: issuer,
            subject: subject,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('CredentialIssued', Buffer.from(JSON.stringify(credentialEvent)));
        
        return credential;
    }
    
    /**
     * Revoca una credencial verificable
     * @param {Context} ctx - Contexto de transacción
     * @param {String} credentialId - ID de la credencial
     * @param {String} reason - Razón de la revocación
     * @returns {Object} - Información de la credencial revocada
     */
    async revokeCredential(ctx, credentialId, reason) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!credentialId) {
            throw new Error('Parámetros inválidos: se requiere ID de la credencial');
        }
        
        // Obtener credencial
        const credentialBuffer = await ctx.stub.getState(credentialId);
        if (!credentialBuffer || credentialBuffer.length === 0) {
            throw new Error(`Credencial con ID ${credentialId} no encontrada`);
        }
        
        const credential = JSON.parse(credentialBuffer.toString());
        
        // Obtener DID del emisor
        const issuerBuffer = await ctx.stub.getState(credential.issuer);
        if (!issuerBuffer || issuerBuffer.length === 0) {
            throw new Error(`Emisor con ID ${credential.issuer} no encontrado`);
        }
        
        const issuerDid = JSON.parse(issuerBuffer.toString());
        
        // Verificar que el llamante sea el controlador del emisor
        if (caller !== issuerDid.controller && caller !== issuerDid.createdBy) {
            throw new Error('Solo el controlador o creador del emisor puede revocar credenciales');
        }
        
        // Verificar que la credencial no esté ya revocada
        if (credential.status === 'revoked') {
            throw new Error('La credencial ya está revocada');
        }
        
        // Revocar credencial
        const now = new Date();
        credential.status = 'revoked';
        credential.revocationDate = now.toISOString();
        credential.revocationReason = reason || 'No se proporcionó razón';
        
        // Guardar credencial actualizada
        await ctx.stub.putState(credentialId, Buffer.from(JSON.stringify(credential)));
        
        // Emitir evento de credencial revocada
        const credentialEvent = {
            type: 'revoke',
            credentialId: credentialId,
            issuer: credential.issuer,
            subject: credential.credentialSubject.id,
            reason: credential.revocationReason,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('CredentialRevoked', Buffer.from(JSON.stringify(credentialEvent)));
        
        return credential;
    }
    
    /**
     * Verifica una credencial
     * @param {Context} ctx - Contexto de transacción
     * @param {String} credentialId - ID de la credencial
     * @returns {Object} - Resultado de la verificación
     */
    async verifyCredential(ctx, credentialId) {
        // Validar parámetros
        if (!credentialId) {
            throw new Error('Parámetros inválidos: se requiere ID de la credencial');
        }
        
        // Obtener credencial
        const credentialBuffer = await ctx.stub.getState(credentialId);
        if (!credentialBuffer || credentialBuffer.length === 0) {
            throw new Error(`Credencial con ID ${credentialId} no encontrada`);
        }
        
        const credential = JSON.parse(credentialBuffer.toString());
        
        // Verificar estado de la credencial
        if (credential.status !== 'valid') {
            return {
                verified: false,
                error: `La credencial está ${credential.status}`,
                credential: credential
            };
        }
        
        // Verificar fecha de expiración
        if (credential.expirationDate) {
            const now = new Date();
            const expirationDate = new Date(credential.expirationDate);
            
            if (now > expirationDate) {
                return {
                    verified: false,
                    error: 'La credencial ha expirado',
                    credential: credential
                };
            }
        }
        
        // Obtener DID del emisor
        const issuerBuffer = await ctx.stub.getState(credential.issuer);
        if (!issuerBuffer || issuerBuffer.length === 0) {
            return {
                verified: false,
                error: 'El emisor no existe',
                credential: credential
            };
        }
        
        const issuerDid = JSON.parse(issuerBuffer.toString());
        
        // Verificar que el emisor esté activo
        if (issuerDid.status !== 'active') {
            return {
                verified: false,
                error: 'El emisor no está activo',
                credential: credential
            };
        }
        
        // Verificar método de verificación
        const methodId = credential.proof.verificationMethod.split('#')[1];
        const method = issuerDid.verificationMethod.find(m => m.id === methodId);
        
        if (!method) {
            return {
                verified: false,
                error: 'El método de verificación no existe',
                credential: credential
            };
        }
        
        // En un sistema real, aquí se verificaría la firma digital
        // Para este ejemplo, asumimos que la verificación es exitosa
        
        return {
            verified: true,
            credential: credential
        };
    }
    
    /**
     * Obtiene una identidad
     * @param {Context} ctx - Contexto de transacción
     * @param {String} didId - ID de la identidad
     * @returns {Object} - Información de la identidad
     */
    async getIdentity(ctx, didId) {
        // Validar parámetros
        if (!didId) {
            throw new Error('Parámetros inválidos: se requiere ID de la identidad');
        }
        
        // Obtener DID
        const didBuffer = await ctx.stub.getState(didId);
        if (!didBuffer || didBuffer.length === 0) {
            throw new Error(`Identidad con ID ${didId} no encontrada`);
        }
        
        return JSON.parse(didBuffer.toString());
    }
    
    /**
     * Obtiene una credencial
     * @param {Context} ctx - Contexto de transacción
     * @param {String} credentialId - ID de la credencial
     * @returns {Object} - Información de la credencial
     */
    async getCredential(ctx, credentialId) {
        // Validar parámetros
        if (!credentialId) {
            throw new Error('Parámetros inválidos: se requiere ID de la credencial');
        }
        
        // Obtener credencial
        const credentialBuffer = await ctx.stub.getState(credentialId);
        if (!credentialBuffer || credentialBuffer.length === 0) {
            throw new Error(`Credencial con ID ${credentialId} no encontrada`);
        }
        
        return JSON.parse(credentialBuffer.toString());
    }
    
    /**
     * Obtiene todas las credenciales de un sujeto
     * @param {Context} ctx - Contexto de transacción
     * @param {String} subjectId - ID del sujeto
     * @returns {Array} - Lista de credenciales del sujeto
     */
    async getSubjectCredentials(ctx, subjectId) {
        // Validar parámetros
        if (!subjectId) {
            throw new Error('Parámetros inválidos: se requiere ID del sujeto');
        }
        
        // Consultar credenciales del sujeto
        const query = {
            selector: {
                'credentialSubject.id': subjectId
            },
            use_index: ['_design/indexSubjectDoc', 'indexSubject']
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const credentials = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const credential = JSON.parse(result.value.value.toString());
            credentials.push(credential);
            result = await iterator.next();
        }
        
        return credentials;
    }
    
    /**
     * Obtiene todas las credenciales emitidas por un emisor
     * @param {Context} ctx - Contexto de transacción
     * @param {String} issuerId - ID del emisor
     * @returns {Array} - Lista de credenciales emitidas por el emisor
     */
    async getIssuerCredentials(ctx, issuerId) {
        // Validar parámetros
        if (!issuerId) {
            throw new Error('Parámetros inválidos: se requiere ID del emisor');
        }
        
        // Consultar credenciales del emisor
        const query = {
            selector: {
                issuer: issuerId
            },
            use_index: ['_design/indexIssuerDoc', 'indexIssuer']
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const credentials = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const credential = JSON.parse(result.value.value.toString());
            credentials.push(credential);
            result = await iterator.next();
        }
        
        return credentials;
    }
    
    /**
     * Añade un emisor de confianza
     * @param {Context} ctx - Contexto de transacción
     * @param {String} issuerId - ID del emisor
     * @returns {Object} - Configuración actualizada
     */
    async addTrustedIssuer(ctx, issuerId) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!issuerId) {
            throw new Error('Parámetros inválidos: se requiere ID del emisor');
        }
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('identityConfig');
        if (!configBuffer || configBuffer.length === 0) {
            throw new Error('La configuración de identidad no ha sido inicializada');
        }
        
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== config.admin) {
            throw new Error('Solo el administrador puede añadir emisores de confianza');
        }
        
        // Verificar que el emisor exista
        const issuerBuffer = await ctx.stub.getState(issuerId);
        if (!issuerBuffer || issuerBuffer.length === 0) {
            throw new Error(`Emisor con ID ${issuerId} no encontrado`);
        }
        
        // Verificar que el emisor no esté ya en la lista
        if (config.trustedIssuers.includes(issuerId)) {
            throw new Error(`El emisor ${issuerId} ya está en la lista de emisores de confianza`);
        }
        
        // Añadir emisor a la lista
        config.trustedIssuers.push(issuerId);
        
        // Guardar configuración actualizada
        await ctx.stub.putState('identityConfig', Buffer.from(JSON.stringify(config)));
        
        // Emitir evento de emisor añadido
        const issuerEvent = {
            type: 'addIssuer',
            issuerId: issuerId,
            addedBy: caller,
            timestamp: new Date().toISOString()
        };
        await ctx.stub.setEvent('TrustedIssuerAdded', Buffer.from(JSON.stringify(issuerEvent)));
        
        return config;
    }
    
    /**
     * Elimina un emisor de confianza
     * @param {Context} ctx - Contexto de transacción
     * @param {String} issuerId - ID del emisor
     * @returns {Object} - Configuración actualizada
     */
    async removeTrustedIssuer(ctx, issuerId) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!issuerId) {
            throw new Error('Parámetros inválidos: se requiere ID del emisor');
        }
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('identityConfig');
        if (!configBuffer || configBuffer.length === 0) {
            throw new Error('La configuración de identidad no ha sido inicializada');
        }
        
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== config.admin) {
            throw new Error('Solo el administrador puede eliminar emisores de confianza');
        }
        
        // Verificar que el emisor esté en la lista
        const index = config.trustedIssuers.indexOf(issuerId);
        if (index === -1) {
            throw new Error(`El emisor ${issuerId} no está en la lista de emisores de confianza`);
        }
        
        // Eliminar emisor de la lista
        config.trustedIssuers.splice(index, 1);
        
        // Guardar configuración actualizada
        await ctx.stub.putState('identityConfig', Buffer.from(JSON.stringify(config)));
        
        // Emitir evento de emisor eliminado
        const issuerEvent = {
            type: 'removeIssuer',
            issuerId: issuerId,
            removedBy: caller,
            timestamp: new Date().toISOString()
        };
        await ctx.stub.setEvent('TrustedIssuerRemoved', Buffer.from(JSON.stringify(issuerEvent)));
        
        return config;
    }

    /**
     * Registra un nuevo usuario (cuenta de aplicacion)
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID único del usuario
     * @param {String} userData - Datos del usuario en formato JSON (username, email, passwordHash, role...)
     * @returns {Object} - Información del usuario registrado
     */
    async registerUser(ctx, userId, userData) {
        const caller = ctx.clientIdentity.getID();

        // Validar parámetros
        if (!userId || !userData) {
            throw new Error('Parámetros inválidos: se requiere ID del usuario y datos del usuario');
        }

        let userDataObj;
        try {
            userDataObj = JSON.parse(userData);
        } catch (error) {
            throw new Error('Los datos del usuario deben estar en formato JSON válido');
        }

        if (!userDataObj.username || !userDataObj.email) {
            throw new Error('Los datos del usuario deben incluir username y email');
        }

        // Verificar que el usuario no exista
        const existingBuffer = await ctx.stub.getState(`user_${userId}`);
        if (existingBuffer && existingBuffer.length > 0) {
            throw new Error(`El usuario con ID ${userId} ya existe`);
        }

        // Verificar unicidad de username y email
        const dupQuery = {
            selector: {
                docType: 'user',
                $or: [{ username: userDataObj.username }, { email: userDataObj.email }]
            }
        };
        const dupIter = await ctx.stub.getQueryResult(JSON.stringify(dupQuery));
        const dupRes = await dupIter.next();
        await dupIter.close();
        if (!dupRes.done) {
            throw new Error('El username o email ya está registrado');
        }

        const now = new Date();
        const user = {
            docType: 'user',
            userId: userId,
            username: userDataObj.username,
            email: userDataObj.email,
            fullName: userDataObj.fullName || '',
            passwordHash: userDataObj.passwordHash || '',
            role: userDataObj.role || 'user',
            status: 'active',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            createdBy: caller
        };

        await ctx.stub.putState(`user_${userId}`, Buffer.from(JSON.stringify(user)));

        const userEvent = {
            type: 'registerUser',
            userId: userId,
            username: user.username,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('UserRegistered', Buffer.from(JSON.stringify(userEvent)));

        return user;
    }

    /**
     * Obtiene un usuario por su ID
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @returns {Object} - Información del usuario
     */
    async getUser(ctx, userId) {
        if (!userId) {
            throw new Error('Parámetros inválidos: se requiere ID del usuario');
        }

        const userBuffer = await ctx.stub.getState(`user_${userId}`);
        if (!userBuffer || userBuffer.length === 0) {
            throw new Error(`Usuario con ID ${userId} no encontrado`);
        }

        return JSON.parse(userBuffer.toString());
    }

    /**
     * Busca un usuario por nombre de usuario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} username - Nombre de usuario
     * @returns {Object} - Información del usuario
     */
    async getUserByUsername(ctx, username) {
        if (!username) {
            throw new Error('Parámetros inválidos: se requiere nombre de usuario');
        }

        const query = { selector: { docType: 'user', username: username } };
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const result = await iterator.next();
        await iterator.close();

        if (result.done) {
            throw new Error(`Usuario con username ${username} no encontrado`);
        }

        return JSON.parse(result.value.value.toString());
    }

    /**
     * Busca un usuario por correo electrónico
     * @param {Context} ctx - Contexto de transacción
     * @param {String} email - Correo electrónico
     * @returns {Object} - Información del usuario
     */
    async getUserByEmail(ctx, email) {
        if (!email) {
            throw new Error('Parámetros inválidos: se requiere correo electrónico');
        }

        const query = { selector: { docType: 'user', email: email } };
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const result = await iterator.next();
        await iterator.close();

        if (result.done) {
            throw new Error(`Usuario con email ${email} no encontrado`);
        }

        return JSON.parse(result.value.value.toString());
    }

    /**
     * Lista usuarios con paginación
     * @param {Context} ctx - Contexto de transacción
     * @param {String} limit - Límite de resultados (opcional)
     * @param {String} offset - Desplazamiento (opcional)
     * @returns {Array} - Lista de usuarios
     */
    async getUsers(ctx, limit, offset) {
        const query = { selector: { docType: 'user' } };
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));

        const maxResults = limit ? parseInt(limit, 10) : 100;
        const skip = offset ? parseInt(offset, 10) : 0;
        const users = [];
        let skipped = 0;

        let result = await iterator.next();
        while (!result.done && users.length < maxResults) {
            if (skipped < skip) {
                skipped++;
            } else {
                users.push(JSON.parse(result.value.value.toString()));
            }
            result = await iterator.next();
        }
        await iterator.close();

        return users;
    }

    /**
     * Actualiza los datos de un usuario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @param {String} userData - Datos a actualizar en formato JSON
     * @returns {Object} - Información del usuario actualizada
     */
    async updateUser(ctx, userId, userData) {
        const caller = ctx.clientIdentity.getID();

        if (!userId || !userData) {
            throw new Error('Parámetros inválidos: se requiere ID del usuario y datos');
        }

        let userDataObj;
        try {
            userDataObj = JSON.parse(userData);
        } catch (error) {
            throw new Error('Los datos del usuario deben estar en formato JSON válido');
        }

        const userBuffer = await ctx.stub.getState(`user_${userId}`);
        if (!userBuffer || userBuffer.length === 0) {
            throw new Error(`Usuario con ID ${userId} no encontrado`);
        }

        const user = JSON.parse(userBuffer.toString());

        // No permitir cambiar el userId
        delete userDataObj.userId;
        delete userDataObj.docType;

        Object.assign(user, userDataObj);
        user.updatedAt = new Date().toISOString();

        await ctx.stub.putState(`user_${userId}`, Buffer.from(JSON.stringify(user)));

        const userEvent = {
            type: 'updateUser',
            userId: userId,
            updatedBy: caller,
            timestamp: user.updatedAt
        };
        await ctx.stub.setEvent('UserUpdated', Buffer.from(JSON.stringify(userEvent)));

        return user;
    }

    /**
     * Elimina un usuario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @returns {Object} - Confirmación de eliminación
     */
    async deleteUser(ctx, userId) {
        const caller = ctx.clientIdentity.getID();

        if (!userId) {
            throw new Error('Parámetros inválidos: se requiere ID del usuario');
        }

        const userBuffer = await ctx.stub.getState(`user_${userId}`);
        if (!userBuffer || userBuffer.length === 0) {
            throw new Error(`Usuario con ID ${userId} no encontrado`);
        }

        await ctx.stub.deleteState(`user_${userId}`);

        const userEvent = {
            type: 'deleteUser',
            userId: userId,
            deletedBy: caller,
            timestamp: new Date().toISOString()
        };
        await ctx.stub.setEvent('UserDeleted', Buffer.from(JSON.stringify(userEvent)));

        return { userId: userId, deleted: true };
    }

    /**
     * Registra una credencial con ID específico para un usuario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} credentialId - ID de la credencial
     * @param {String} userId - ID del usuario sujeto
     * @param {String} issuer - Emisor de la credencial
     * @param {String} credentialData - Datos de la credencial en formato JSON
     * @returns {Object} - Información de la credencial registrada
     */
    async registerCredential(ctx, credentialId, userId, issuer, credentialData) {
        const caller = ctx.clientIdentity.getID();

        // Validar parámetros
        if (!credentialId || !userId || !issuer || !credentialData) {
            throw new Error('Parámetros inválidos: se requiere credentialId, userId, issuer y credentialData');
        }

        let credentialDataObj;
        try {
            credentialDataObj = JSON.parse(credentialData);
        } catch (error) {
            throw new Error('Los datos de la credencial deben estar en formato JSON válido');
        }

        // Verificar que la credencial no exista
        const existingBuffer = await ctx.stub.getState(credentialId);
        if (existingBuffer && existingBuffer.length > 0) {
            throw new Error(`La credencial con ID ${credentialId} ya existe`);
        }

        const now = new Date();
        const credential = {
            docType: 'credential',
            id: credentialId,
            issuer: issuer,
            credentialSubject: {
                id: userId,
                claims: credentialDataObj.claims || credentialDataObj
            },
            issuanceDate: now.toISOString(),
            status: 'active',
            createdBy: caller
        };

        await ctx.stub.putState(credentialId, Buffer.from(JSON.stringify(credential)));

        const credentialEvent = {
            type: 'registerCredential',
            credentialId: credentialId,
            subject: userId,
            issuer: issuer,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('CredentialRegistered', Buffer.from(JSON.stringify(credentialEvent)));

        return credential;
    }
}

module.exports = IdentityContract;
