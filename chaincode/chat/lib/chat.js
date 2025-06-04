'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Contrato de Chat para la Blockchain Simbiótica
 * Implementa funcionalidades para mensajería segura y comunicación entre usuarios
 */
class ChatContract extends Contract {
    
    /**
     * Inicializa el contrato con los valores predeterminados
     * @param {Context} ctx - Contexto de transacción
     */
    async init(ctx) {
        console.info('============= Inicializando Contrato de Chat =============');
        
        // Configuración del contrato de chat
        const chatConfig = {
            version: '1.0',
            admin: 'admin',
            encryptionEnabled: true,
            messageRetentionDays: 365,
            maxMessageSize: 1024 * 10, // 10KB
            supportedMessageTypes: ['text', 'image', 'file', 'location', 'contact']
        };
        
        await ctx.stub.putState('chatConfig', Buffer.from(JSON.stringify(chatConfig)));
        
        console.info('============= Contrato de Chat inicializado correctamente =============');
        return JSON.stringify(chatConfig);
    }
    
    /**
     * Crea un nuevo canal de chat
     * @param {Context} ctx - Contexto de transacción
     * @param {String} channelType - Tipo de canal (direct, group, broadcast)
     * @param {String} participants - Lista de participantes en formato JSON
     * @param {String} metadata - Metadatos adicionales en formato JSON (opcional)
     * @returns {Object} - Información del canal creado
     */
    async createChannel(ctx, channelType, participants, metadata) {
        // Obtener la identidad del creador
        const clientIdentity = ctx.clientIdentity;
        const creator = clientIdentity.getID();
        
        // Validar parámetros
        if (!channelType || !participants) {
            throw new Error('Parámetros inválidos: se requiere tipo de canal y participantes');
        }
        
        // Verificar tipo de canal válido
        const validTypes = ['direct', 'group', 'broadcast'];
        if (!validTypes.includes(channelType)) {
            throw new Error(`Tipo de canal inválido. Debe ser uno de: ${validTypes.join(', ')}`);
        }
        
        // Verificar que los participantes sean JSON válido
        let participantsArray;
        try {
            participantsArray = JSON.parse(participants);
            if (!Array.isArray(participantsArray)) {
                throw new Error('Los participantes deben ser un array');
            }
        } catch (error) {
            throw new Error('Los participantes deben estar en formato JSON válido como array');
        }
        
        // Verificar que haya al menos un participante además del creador
        if (participantsArray.length === 0) {
            throw new Error('Debe haber al menos un participante');
        }
        
        // Verificar que el creador esté en la lista de participantes
        if (!participantsArray.includes(creator)) {
            participantsArray.push(creator);
        }
        
        // Verificar restricciones según el tipo de canal
        if (channelType === 'direct' && participantsArray.length !== 2) {
            throw new Error('Los canales directos deben tener exactamente 2 participantes');
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
        
        // Crear canal
        const now = new Date();
        const channelId = `channel_${channelType}_${now.getTime()}`;
        
        const channel = {
            id: channelId,
            type: channelType,
            participants: participantsArray,
            admin: creator,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            metadata: metadataObj,
            messageCount: 0,
            lastMessageAt: null,
            lastMessagePreview: null,
            active: true
        };
        
        // Guardar canal
        await ctx.stub.putState(channelId, Buffer.from(JSON.stringify(channel)));
        
        // Emitir evento de canal creado
        const channelEvent = {
            type: 'create',
            channelId: channelId,
            channelType: channelType,
            creator: creator,
            participantCount: participantsArray.length,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('ChannelCreated', Buffer.from(JSON.stringify(channelEvent)));
        
        return channel;
    }
    
    /**
     * Envía un mensaje a un canal
     * @param {Context} ctx - Contexto de transacción
     * @param {String} channelId - ID del canal
     * @param {String} messageType - Tipo de mensaje (text, image, file, location, contact)
     * @param {String} content - Contenido del mensaje (encriptado si es necesario)
     * @param {String} metadata - Metadatos adicionales en formato JSON (opcional)
     * @returns {Object} - Información del mensaje enviado
     */
    async sendMessage(ctx, channelId, messageType, content, metadata) {
        // Obtener la identidad del remitente
        const clientIdentity = ctx.clientIdentity;
        const sender = clientIdentity.getID();
        
        // Validar parámetros
        if (!channelId || !messageType || !content) {
            throw new Error('Parámetros inválidos: se requiere ID del canal, tipo de mensaje y contenido');
        }
        
        // Verificar que el canal exista
        const channelBuffer = await ctx.stub.getState(channelId);
        if (!channelBuffer || channelBuffer.length === 0) {
            throw new Error(`Canal con ID ${channelId} no encontrado`);
        }
        
        const channel = JSON.parse(channelBuffer.toString());
        
        // Verificar que el canal esté activo
        if (!channel.active) {
            throw new Error('El canal no está activo');
        }
        
        // Verificar que el remitente sea participante del canal
        if (!channel.participants.includes(sender)) {
            throw new Error('No eres participante de este canal');
        }
        
        // Verificar tipo de mensaje válido
        const configBuffer = await ctx.stub.getState('chatConfig');
        const config = JSON.parse(configBuffer.toString());
        
        if (!config.supportedMessageTypes.includes(messageType)) {
            throw new Error(`Tipo de mensaje inválido. Debe ser uno de: ${config.supportedMessageTypes.join(', ')}`);
        }
        
        // Verificar tamaño del mensaje
        if (content.length > config.maxMessageSize) {
            throw new Error(`El mensaje excede el tamaño máximo permitido de ${config.maxMessageSize} bytes`);
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
        
        // Crear mensaje
        const now = new Date();
        const messageId = `message_${channelId}_${now.getTime()}`;
        
        const message = {
            id: messageId,
            channelId: channelId,
            sender: sender,
            type: messageType,
            content: content,
            metadata: metadataObj,
            timestamp: now.toISOString(),
            readBy: [sender],
            reactions: {},
            edited: false,
            editHistory: [],
            deleted: false
        };
        
        // Actualizar canal
        channel.messageCount += 1;
        channel.lastMessageAt = now.toISOString();
        channel.lastMessagePreview = messageType === 'text' ? 
            (content.length > 50 ? content.substring(0, 50) + '...' : content) : 
            `[${messageType}]`;
        channel.updatedAt = now.toISOString();
        
        // Guardar mensaje y canal actualizado
        await ctx.stub.putState(messageId, Buffer.from(JSON.stringify(message)));
        await ctx.stub.putState(channelId, Buffer.from(JSON.stringify(channel)));
        
        // Emitir evento de mensaje enviado
        const messageEvent = {
            type: 'send',
            messageId: messageId,
            channelId: channelId,
            sender: sender,
            messageType: messageType,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('MessageSent', Buffer.from(JSON.stringify(messageEvent)));
        
        return message;
    }
    
    /**
     * Marca un mensaje como leído
     * @param {Context} ctx - Contexto de transacción
     * @param {String} messageId - ID del mensaje
     * @returns {Object} - Información del mensaje actualizado
     */
    async markAsRead(ctx, messageId) {
        // Obtener la identidad del lector
        const clientIdentity = ctx.clientIdentity;
        const reader = clientIdentity.getID();
        
        // Validar parámetros
        if (!messageId) {
            throw new Error('Parámetros inválidos: se requiere ID del mensaje');
        }
        
        // Verificar que el mensaje exista
        const messageBuffer = await ctx.stub.getState(messageId);
        if (!messageBuffer || messageBuffer.length === 0) {
            throw new Error(`Mensaje con ID ${messageId} no encontrado`);
        }
        
        const message = JSON.parse(messageBuffer.toString());
        
        // Verificar que el mensaje no esté eliminado
        if (message.deleted) {
            throw new Error('El mensaje ha sido eliminado');
        }
        
        // Verificar que el canal exista
        const channelBuffer = await ctx.stub.getState(message.channelId);
        if (!channelBuffer || channelBuffer.length === 0) {
            throw new Error(`Canal con ID ${message.channelId} no encontrado`);
        }
        
        const channel = JSON.parse(channelBuffer.toString());
        
        // Verificar que el lector sea participante del canal
        if (!channel.participants.includes(reader)) {
            throw new Error('No eres participante de este canal');
        }
        
        // Verificar si el mensaje ya está marcado como leído por el lector
        if (message.readBy.includes(reader)) {
            return message; // El mensaje ya está marcado como leído
        }
        
        // Marcar mensaje como leído
        message.readBy.push(reader);
        
        // Guardar mensaje actualizado
        await ctx.stub.putState(messageId, Buffer.from(JSON.stringify(message)));
        
        // Emitir evento de mensaje leído
        const readEvent = {
            type: 'read',
            messageId: messageId,
            channelId: message.channelId,
            reader: reader,
            timestamp: new Date().toISOString()
        };
        await ctx.stub.setEvent('MessageRead', Buffer.from(JSON.stringify(readEvent)));
        
        return message;
    }
    
    /**
     * Edita un mensaje existente
     * @param {Context} ctx - Contexto de transacción
     * @param {String} messageId - ID del mensaje
     * @param {String} newContent - Nuevo contenido del mensaje
     * @returns {Object} - Información del mensaje actualizado
     */
    async editMessage(ctx, messageId, newContent) {
        // Obtener la identidad del editor
        const clientIdentity = ctx.clientIdentity;
        const editor = clientIdentity.getID();
        
        // Validar parámetros
        if (!messageId || !newContent) {
            throw new Error('Parámetros inválidos: se requiere ID del mensaje y nuevo contenido');
        }
        
        // Verificar que el mensaje exista
        const messageBuffer = await ctx.stub.getState(messageId);
        if (!messageBuffer || messageBuffer.length === 0) {
            throw new Error(`Mensaje con ID ${messageId} no encontrado`);
        }
        
        const message = JSON.parse(messageBuffer.toString());
        
        // Verificar que el mensaje no esté eliminado
        if (message.deleted) {
            throw new Error('El mensaje ha sido eliminado');
        }
        
        // Verificar que el editor sea el remitente original
        if (editor !== message.sender) {
            throw new Error('Solo el remitente original puede editar el mensaje');
        }
        
        // Verificar tamaño del mensaje
        const configBuffer = await ctx.stub.getState('chatConfig');
        const config = JSON.parse(configBuffer.toString());
        
        if (newContent.length > config.maxMessageSize) {
            throw new Error(`El mensaje excede el tamaño máximo permitido de ${config.maxMessageSize} bytes`);
        }
        
        // Guardar versión anterior en el historial de ediciones
        const now = new Date();
        const editRecord = {
            content: message.content,
            editedAt: now.toISOString()
        };
        
        message.editHistory.push(editRecord);
        message.content = newContent;
        message.edited = true;
        
        // Actualizar canal si es necesario
        if (message.type === 'text') {
            const channelBuffer = await ctx.stub.getState(message.channelId);
            if (channelBuffer && channelBuffer.length > 0) {
                const channel = JSON.parse(channelBuffer.toString());
                
                // Actualizar vista previa del último mensaje si este es el último mensaje
                if (channel.lastMessageAt === message.timestamp) {
                    channel.lastMessagePreview = newContent.length > 50 ? 
                        newContent.substring(0, 50) + '...' : 
                        newContent;
                    channel.updatedAt = now.toISOString();
                    
                    await ctx.stub.putState(message.channelId, Buffer.from(JSON.stringify(channel)));
                }
            }
        }
        
        // Guardar mensaje actualizado
        await ctx.stub.putState(messageId, Buffer.from(JSON.stringify(message)));
        
        // Emitir evento de mensaje editado
        const editEvent = {
            type: 'edit',
            messageId: messageId,
            channelId: message.channelId,
            editor: editor,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('MessageEdited', Buffer.from(JSON.stringify(editEvent)));
        
        return message;
    }
    
    /**
     * Elimina un mensaje
     * @param {Context} ctx - Contexto de transacción
     * @param {String} messageId - ID del mensaje
     * @returns {Object} - Información del mensaje eliminado
     */
    async deleteMessage(ctx, messageId) {
        // Obtener la identidad del eliminador
        const clientIdentity = ctx.clientIdentity;
        const deleter = clientIdentity.getID();
        
        // Validar parámetros
        if (!messageId) {
            throw new Error('Parámetros inválidos: se requiere ID del mensaje');
        }
        
        // Verificar que el mensaje exista
        const messageBuffer = await ctx.stub.getState(messageId);
        if (!messageBuffer || messageBuffer.length === 0) {
            throw new Error(`Mensaje con ID ${messageId} no encontrado`);
        }
        
        const message = JSON.parse(messageBuffer.toString());
        
        // Verificar que el mensaje no esté ya eliminado
        if (message.deleted) {
            throw new Error('El mensaje ya ha sido eliminado');
        }
        
        // Verificar que el canal exista
        const channelBuffer = await ctx.stub.getState(message.channelId);
        if (!channelBuffer || channelBuffer.length === 0) {
            throw new Error(`Canal con ID ${message.channelId} no encontrado`);
        }
        
        const channel = JSON.parse(channelBuffer.toString());
        
        // Verificar que el eliminador sea el remitente original o el administrador del canal
        if (deleter !== message.sender && deleter !== channel.admin) {
            throw new Error('Solo el remitente original o el administrador del canal puede eliminar el mensaje');
        }
        
        // Marcar mensaje como eliminado
        const now = new Date();
        message.deleted = true;
        message.content = '[Mensaje eliminado]';
        message.deletedAt = now.toISOString();
        message.deletedBy = deleter;
        
        // Actualizar canal si es necesario
        if (channel.lastMessageAt === message.timestamp) {
            channel.lastMessagePreview = '[Mensaje eliminado]';
            channel.updatedAt = now.toISOString();
            
            await ctx.stub.putState(message.channelId, Buffer.from(JSON.stringify(channel)));
        }
        
        // Guardar mensaje actualizado
        await ctx.stub.putState(messageId, Buffer.from(JSON.stringify(message)));
        
        // Emitir evento de mensaje eliminado
        const deleteEvent = {
            type: 'delete',
            messageId: messageId,
            channelId: message.channelId,
            deleter: deleter,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('MessageDeleted', Buffer.from(JSON.stringify(deleteEvent)));
        
        return message;
    }
    
    /**
     * Añade una reacción a un mensaje
     * @param {Context} ctx - Contexto de transacción
     * @param {String} messageId - ID del mensaje
     * @param {String} reaction - Emoji o código de reacción
     * @returns {Object} - Información del mensaje actualizado
     */
    async addReaction(ctx, messageId, reaction) {
        // Obtener la identidad del usuario
        const clientIdentity = ctx.clientIdentity;
        const user = clientIdentity.getID();
        
        // Validar parámetros
        if (!messageId || !reaction) {
            throw new Error('Parámetros inválidos: se requiere ID del mensaje y reacción');
        }
        
        // Verificar que el mensaje exista
        const messageBuffer = await ctx.stub.getState(messageId);
        if (!messageBuffer || messageBuffer.length === 0) {
            throw new Error(`Mensaje con ID ${messageId} no encontrado`);
        }
        
        const message = JSON.parse(messageBuffer.toString());
        
        // Verificar que el mensaje no esté eliminado
        if (message.deleted) {
            throw new Error('El mensaje ha sido eliminado');
        }
        
        // Verificar que el canal exista
        const channelBuffer = await ctx.stub.getState(message.channelId);
        if (!channelBuffer || channelBuffer.length === 0) {
            throw new Error(`Canal con ID ${message.channelId} no encontrado`);
        }
        
        const channel = JSON.parse(channelBuffer.toString());
        
        // Verificar que el usuario sea participante del canal
        if (!channel.participants.includes(user)) {
            throw new Error('No eres participante de este canal');
        }
        
        // Añadir reacción
        if (!message.reactions[reaction]) {
            message.reactions[reaction] = [];
        }
        
        // Verificar si el usuario ya ha añadido esta reacción
        if (!message.reactions[reaction].includes(user)) {
            message.reactions[reaction].push(user);
        }
        
        // Guardar mensaje actualizado
        await ctx.stub.putState(messageId, Buffer.from(JSON.stringify(message)));
        
        // Emitir evento de reacción añadida
        const reactionEvent = {
            type: 'reaction',
            messageId: messageId,
            channelId: message.channelId,
            user: user,
            reaction: reaction,
            timestamp: new Date().toISOString()
        };
        await ctx.stub.setEvent('ReactionAdded', Buffer.from(JSON.stringify(reactionEvent)));
        
        return message;
    }
    
    /**
     * Elimina una reacción de un mensaje
     * @param {Context} ctx - Contexto de transacción
     * @param {String} messageId - ID del mensaje
     * @param {String} reaction - Emoji o código de reacción
     * @returns {Object} - Información del mensaje actualizado
     */
    async removeReaction(ctx, messageId, reaction) {
        // Obtener la identidad del usuario
        const clientIdentity = ctx.clientIdentity;
        const user = clientIdentity.getID();
        
        // Validar parámetros
        if (!messageId || !reaction) {
            throw new Error('Parámetros inválidos: se requiere ID del mensaje y reacción');
        }
        
        // Verificar que el mensaje exista
        const messageBuffer = await ctx.stub.getState(messageId);
        if (!messageBuffer || messageBuffer.length === 0) {
            throw new Error(`Mensaje con ID ${messageId} no encontrado`);
        }
        
        const message = JSON.parse(messageBuffer.toString());
        
        // Verificar que el mensaje no esté eliminado
        if (message.deleted) {
            throw new Error('El mensaje ha sido eliminado');
        }
        
        // Verificar que la reacción exista
        if (!message.reactions[reaction] || !message.reactions[reaction].includes(user)) {
            throw new Error('No has añadido esta reacción al mensaje');
        }
        
        // Eliminar reacción
        message.reactions[reaction] = message.reactions[reaction].filter(u => u !== user);
        
        // Eliminar la entrada si no quedan usuarios con esa reacción
        if (message.reactions[reaction].length === 0) {
            delete message.reactions[reaction];
        }
        
        // Guardar mensaje actualizado
        await ctx.stub.putState(messageId, Buffer.from(JSON.stringify(message)));
        
        // Emitir evento de reacción eliminada
        const reactionEvent = {
            type: 'removeReaction',
            messageId: messageId,
            channelId: message.channelId,
            user: user,
            reaction: reaction,
            timestamp: new Date().toISOString()
        };
        await ctx.stub.setEvent('ReactionRemoved', Buffer.from(JSON.stringify(reactionEvent)));
        
        return message;
    }
    
    /**
     * Añade un participante a un canal
     * @param {Context} ctx - Contexto de transacción
     * @param {String} channelId - ID del canal
     * @param {String} participantId - ID del nuevo participante
     * @returns {Object} - Información del canal actualizado
     */
    async addParticipant(ctx, channelId, participantId) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!channelId || !participantId) {
            throw new Error('Parámetros inválidos: se requiere ID del canal e ID del participante');
        }
        
        // Verificar que el canal exista
        const channelBuffer = await ctx.stub.getState(channelId);
        if (!channelBuffer || channelBuffer.length === 0) {
            throw new Error(`Canal con ID ${channelId} no encontrado`);
        }
        
        const channel = JSON.parse(channelBuffer.toString());
        
        // Verificar que el canal no sea de tipo directo
        if (channel.type === 'direct') {
            throw new Error('No se pueden añadir participantes a canales directos');
        }
        
        // Verificar que el llamante sea el administrador del canal
        if (caller !== channel.admin) {
            throw new Error('Solo el administrador del canal puede añadir participantes');
        }
        
        // Verificar que el participante no esté ya en el canal
        if (channel.participants.includes(participantId)) {
            throw new Error(`El participante con ID ${participantId} ya está en el canal`);
        }
        
        // Añadir participante
        channel.participants.push(participantId);
        channel.updatedAt = new Date().toISOString();
        
        // Guardar canal actualizado
        await ctx.stub.putState(channelId, Buffer.from(JSON.stringify(channel)));
        
        // Emitir evento de participante añadido
        const participantEvent = {
            type: 'addParticipant',
            channelId: channelId,
            participantId: participantId,
            addedBy: caller,
            timestamp: channel.updatedAt
        };
        await ctx.stub.setEvent('ParticipantAdded', Buffer.from(JSON.stringify(participantEvent)));
        
        return channel;
    }
    
    /**
     * Elimina un participante de un canal
     * @param {Context} ctx - Contexto de transacción
     * @param {String} channelId - ID del canal
     * @param {String} participantId - ID del participante a eliminar
     * @returns {Object} - Información del canal actualizado
     */
    async removeParticipant(ctx, channelId, participantId) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!channelId || !participantId) {
            throw new Error('Parámetros inválidos: se requiere ID del canal e ID del participante');
        }
        
        // Verificar que el canal exista
        const channelBuffer = await ctx.stub.getState(channelId);
        if (!channelBuffer || channelBuffer.length === 0) {
            throw new Error(`Canal con ID ${channelId} no encontrado`);
        }
        
        const channel = JSON.parse(channelBuffer.toString());
        
        // Verificar que el canal no sea de tipo directo
        if (channel.type === 'direct') {
            throw new Error('No se pueden eliminar participantes de canales directos');
        }
        
        // Verificar que el llamante sea el administrador del canal o el propio participante
        if (caller !== channel.admin && caller !== participantId) {
            throw new Error('Solo el administrador del canal o el propio participante puede realizar esta acción');
        }
        
        // Verificar que el participante esté en el canal
        if (!channel.participants.includes(participantId)) {
            throw new Error(`El participante con ID ${participantId} no está en el canal`);
        }
        
        // Verificar que no se esté eliminando al administrador
        if (participantId === channel.admin) {
            throw new Error('No se puede eliminar al administrador del canal');
        }
        
        // Eliminar participante
        channel.participants = channel.participants.filter(p => p !== participantId);
        channel.updatedAt = new Date().toISOString();
        
        // Guardar canal actualizado
        await ctx.stub.putState(channelId, Buffer.from(JSON.stringify(channel)));
        
        // Emitir evento de participante eliminado
        const participantEvent = {
            type: 'removeParticipant',
            channelId: channelId,
            participantId: participantId,
            removedBy: caller,
            timestamp: channel.updatedAt
        };
        await ctx.stub.setEvent('ParticipantRemoved', Buffer.from(JSON.stringify(participantEvent)));
        
        return channel;
    }
    
    /**
     * Cambia el administrador de un canal
     * @param {Context} ctx - Contexto de transacción
     * @param {String} channelId - ID del canal
     * @param {String} newAdminId - ID del nuevo administrador
     * @returns {Object} - Información del canal actualizado
     */
    async changeAdmin(ctx, channelId, newAdminId) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!channelId || !newAdminId) {
            throw new Error('Parámetros inválidos: se requiere ID del canal e ID del nuevo administrador');
        }
        
        // Verificar que el canal exista
        const channelBuffer = await ctx.stub.getState(channelId);
        if (!channelBuffer || channelBuffer.length === 0) {
            throw new Error(`Canal con ID ${channelId} no encontrado`);
        }
        
        const channel = JSON.parse(channelBuffer.toString());
        
        // Verificar que el canal no sea de tipo directo
        if (channel.type === 'direct') {
            throw new Error('Los canales directos no tienen administrador');
        }
        
        // Verificar que el llamante sea el administrador actual
        if (caller !== channel.admin) {
            throw new Error('Solo el administrador actual puede cambiar el administrador');
        }
        
        // Verificar que el nuevo administrador sea participante del canal
        if (!channel.participants.includes(newAdminId)) {
            throw new Error('El nuevo administrador debe ser participante del canal');
        }
        
        // Cambiar administrador
        channel.admin = newAdminId;
        channel.updatedAt = new Date().toISOString();
        
        // Guardar canal actualizado
        await ctx.stub.putState(channelId, Buffer.from(JSON.stringify(channel)));
        
        // Emitir evento de administrador cambiado
        const adminEvent = {
            type: 'changeAdmin',
            channelId: channelId,
            oldAdmin: caller,
            newAdmin: newAdminId,
            timestamp: channel.updatedAt
        };
        await ctx.stub.setEvent('AdminChanged', Buffer.from(JSON.stringify(adminEvent)));
        
        return channel;
    }
    
    /**
     * Actualiza los metadatos de un canal
     * @param {Context} ctx - Contexto de transacción
     * @param {String} channelId - ID del canal
     * @param {String} metadata - Nuevos metadatos en formato JSON
     * @returns {Object} - Información del canal actualizado
     */
    async updateChannelMetadata(ctx, channelId, metadata) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!channelId || !metadata) {
            throw new Error('Parámetros inválidos: se requiere ID del canal y metadatos');
        }
        
        // Verificar que los metadatos sean JSON válido
        let metadataObj;
        try {
            metadataObj = JSON.parse(metadata);
        } catch (error) {
            throw new Error('Los metadatos deben estar en formato JSON válido');
        }
        
        // Verificar que el canal exista
        const channelBuffer = await ctx.stub.getState(channelId);
        if (!channelBuffer || channelBuffer.length === 0) {
            throw new Error(`Canal con ID ${channelId} no encontrado`);
        }
        
        const channel = JSON.parse(channelBuffer.toString());
        
        // Verificar que el llamante sea participante del canal
        if (!channel.participants.includes(caller)) {
            throw new Error('No eres participante de este canal');
        }
        
        // Verificar que el llamante sea el administrador para canales que no son directos
        if (channel.type !== 'direct' && caller !== channel.admin) {
            throw new Error('Solo el administrador puede actualizar los metadatos del canal');
        }
        
        // Actualizar metadatos
        channel.metadata = metadataObj;
        channel.updatedAt = new Date().toISOString();
        
        // Guardar canal actualizado
        await ctx.stub.putState(channelId, Buffer.from(JSON.stringify(channel)));
        
        // Emitir evento de metadatos actualizados
        const metadataEvent = {
            type: 'updateMetadata',
            channelId: channelId,
            updatedBy: caller,
            timestamp: channel.updatedAt
        };
        await ctx.stub.setEvent('ChannelMetadataUpdated', Buffer.from(JSON.stringify(metadataEvent)));
        
        return channel;
    }
    
    /**
     * Activa o desactiva un canal
     * @param {Context} ctx - Contexto de transacción
     * @param {String} channelId - ID del canal
     * @param {String} active - Estado activo (true o false)
     * @returns {Object} - Información del canal actualizado
     */
    async setChannelActive(ctx, channelId, active) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!channelId || active === undefined) {
            throw new Error('Parámetros inválidos: se requiere ID del canal y estado activo');
        }
        
        // Convertir active a booleano
        const isActive = active === 'true';
        
        // Verificar que el canal exista
        const channelBuffer = await ctx.stub.getState(channelId);
        if (!channelBuffer || channelBuffer.length === 0) {
            throw new Error(`Canal con ID ${channelId} no encontrado`);
        }
        
        const channel = JSON.parse(channelBuffer.toString());
        
        // Verificar que el llamante sea el administrador para canales que no son directos
        if (channel.type !== 'direct' && caller !== channel.admin) {
            throw new Error('Solo el administrador puede activar o desactivar el canal');
        }
        
        // Para canales directos, verificar que el llamante sea participante
        if (channel.type === 'direct' && !channel.participants.includes(caller)) {
            throw new Error('No eres participante de este canal');
        }
        
        // Verificar que el estado sea diferente
        if (channel.active === isActive) {
            return channel; // El estado ya es el deseado
        }
        
        // Actualizar estado
        channel.active = isActive;
        channel.updatedAt = new Date().toISOString();
        
        // Guardar canal actualizado
        await ctx.stub.putState(channelId, Buffer.from(JSON.stringify(channel)));
        
        // Emitir evento de estado actualizado
        const statusEvent = {
            type: 'setActive',
            channelId: channelId,
            active: isActive,
            updatedBy: caller,
            timestamp: channel.updatedAt
        };
        await ctx.stub.setEvent('ChannelStatusUpdated', Buffer.from(JSON.stringify(statusEvent)));
        
        return channel;
    }
    
    /**
     * Obtiene un canal
     * @param {Context} ctx - Contexto de transacción
     * @param {String} channelId - ID del canal
     * @returns {Object} - Información del canal
     */
    async getChannel(ctx, channelId) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!channelId) {
            throw new Error('Parámetros inválidos: se requiere ID del canal');
        }
        
        // Verificar que el canal exista
        const channelBuffer = await ctx.stub.getState(channelId);
        if (!channelBuffer || channelBuffer.length === 0) {
            throw new Error(`Canal con ID ${channelId} no encontrado`);
        }
        
        const channel = JSON.parse(channelBuffer.toString());
        
        // Verificar que el llamante sea participante del canal
        if (!channel.participants.includes(caller)) {
            throw new Error('No tienes acceso a este canal');
        }
        
        return channel;
    }
    
    /**
     * Obtiene un mensaje
     * @param {Context} ctx - Contexto de transacción
     * @param {String} messageId - ID del mensaje
     * @returns {Object} - Información del mensaje
     */
    async getMessage(ctx, messageId) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!messageId) {
            throw new Error('Parámetros inválidos: se requiere ID del mensaje');
        }
        
        // Verificar que el mensaje exista
        const messageBuffer = await ctx.stub.getState(messageId);
        if (!messageBuffer || messageBuffer.length === 0) {
            throw new Error(`Mensaje con ID ${messageId} no encontrado`);
        }
        
        const message = JSON.parse(messageBuffer.toString());
        
        // Verificar que el canal exista
        const channelBuffer = await ctx.stub.getState(message.channelId);
        if (!channelBuffer || channelBuffer.length === 0) {
            throw new Error(`Canal con ID ${message.channelId} no encontrado`);
        }
        
        const channel = JSON.parse(channelBuffer.toString());
        
        // Verificar que el llamante sea participante del canal
        if (!channel.participants.includes(caller)) {
            throw new Error('No tienes acceso a este mensaje');
        }
        
        return message;
    }
    
    /**
     * Obtiene los mensajes de un canal
     * @param {Context} ctx - Contexto de transacción
     * @param {String} channelId - ID del canal
     * @param {String} limit - Número máximo de mensajes a devolver
     * @param {String} bookmark - Marcador para paginación
     * @returns {Object} - Lista de mensajes y marcador para la siguiente página
     */
    async getChannelMessages(ctx, channelId, limit, bookmark) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!channelId) {
            throw new Error('Parámetros inválidos: se requiere ID del canal');
        }
        
        // Convertir limit a número
        const pageSize = limit ? parseInt(limit) : 20;
        if (isNaN(pageSize) || pageSize <= 0) {
            throw new Error('El límite debe ser un número positivo');
        }
        
        // Verificar que el canal exista
        const channelBuffer = await ctx.stub.getState(channelId);
        if (!channelBuffer || channelBuffer.length === 0) {
            throw new Error(`Canal con ID ${channelId} no encontrado`);
        }
        
        const channel = JSON.parse(channelBuffer.toString());
        
        // Verificar que el llamante sea participante del canal
        if (!channel.participants.includes(caller)) {
            throw new Error('No tienes acceso a este canal');
        }
        
        // Consultar mensajes del canal
        const query = {
            selector: {
                channelId: channelId
            },
            sort: [{ timestamp: 'desc' }],
            use_index: ['_design/indexChannelIdDoc', 'indexChannelId']
        };
        
        const { iterator, metadata } = await ctx.stub.getQueryResultWithPagination(JSON.stringify(query), pageSize, bookmark);
        const messages = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const message = JSON.parse(result.value.value.toString());
            messages.push(message);
            result = await iterator.next();
        }
        
        return {
            messages: messages,
            nextBookmark: metadata.bookmark
        };
    }
    
    /**
     * Obtiene todos los canales de un usuario
     * @param {Context} ctx - Contexto de transacción
     * @returns {Array} - Lista de canales del usuario
     */
    async getUserChannels(ctx) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Consultar canales del usuario
        const query = {
            selector: {
                participants: {
                    $elemMatch: {
                        $eq: caller
                    }
                }
            },
            use_index: ['_design/indexParticipantsDoc', 'indexParticipants']
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const channels = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const channel = JSON.parse(result.value.value.toString());
            channels.push(channel);
            result = await iterator.next();
        }
        
        return channels;
    }
    
    /**
     * Busca mensajes en un canal
     * @param {Context} ctx - Contexto de transacción
     * @param {String} channelId - ID del canal
     * @param {String} query - Texto a buscar
     * @returns {Array} - Lista de mensajes que coinciden con la búsqueda
     */
    async searchMessages(ctx, channelId, query) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!channelId || !query) {
            throw new Error('Parámetros inválidos: se requiere ID del canal y texto de búsqueda');
        }
        
        // Verificar que el canal exista
        const channelBuffer = await ctx.stub.getState(channelId);
        if (!channelBuffer || channelBuffer.length === 0) {
            throw new Error(`Canal con ID ${channelId} no encontrado`);
        }
        
        const channel = JSON.parse(channelBuffer.toString());
        
        // Verificar que el llamante sea participante del canal
        if (!channel.participants.includes(caller)) {
            throw new Error('No tienes acceso a este canal');
        }
        
        // Consultar mensajes del canal
        // Nota: En un entorno real, aquí se implementaría una búsqueda de texto completo
        // Para este ejemplo, hacemos una búsqueda simple
        const allMessagesQuery = {
            selector: {
                channelId: channelId,
                type: 'text',
                deleted: false
            },
            use_index: ['_design/indexChannelIdDoc', 'indexChannelId']
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(allMessagesQuery));
        const matchingMessages = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const message = JSON.parse(result.value.value.toString());
            
            // Búsqueda simple de texto
            if (message.content.toLowerCase().includes(query.toLowerCase())) {
                matchingMessages.push(message);
            }
            
            result = await iterator.next();
        }
        
        return matchingMessages;
    }
}

module.exports = ChatContract;
