import { Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    this.logger.setContext('ChatService');
  }

  /**
   * Crea un nuevo canal de chat
   * @param channelType Tipo de canal (direct, group, broadcast)
   * @param participants Lista de participantes en formato JSON
   * @param metadata Metadatos adicionales en formato JSON (opcional)
   * @returns Información del canal creado
   */
  async createChannel(channelType: string, participants: string, metadata?: string): Promise<any> {
    try {
      this.logger.log(`Creando canal de tipo: ${channelType}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método createChannel del contrato chat
      const result = await this.blockchainService.submitTransaction(
        'chat',
        'createChannel',
        channelType,
        participants,
        metadata || ''
      );
      
      const channel = JSON.parse(result.toString());
      this.logger.log(`Canal creado: ${JSON.stringify(channel)}`);
      
      return channel;
    } catch (error) {
      this.logger.error(`Error al crear canal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envía un mensaje a un canal
   * @param channelId ID del canal
   * @param messageType Tipo de mensaje (text, image, file, location, contact)
   * @param content Contenido del mensaje
   * @param metadata Metadatos adicionales en formato JSON (opcional)
   * @returns Información del mensaje enviado
   */
  async sendMessage(channelId: string, messageType: string, content: string, metadata?: string): Promise<any> {
    try {
      this.logger.log(`Enviando mensaje de tipo ${messageType} al canal ${channelId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método sendMessage del contrato chat
      const result = await this.blockchainService.submitTransaction(
        'chat',
        'sendMessage',
        channelId,
        messageType,
        content,
        metadata || ''
      );
      
      const message = JSON.parse(result.toString());
      this.logger.log(`Mensaje enviado: ${JSON.stringify(message)}`);
      
      return message;
    } catch (error) {
      this.logger.error(`Error al enviar mensaje: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marca un mensaje como leído
   * @param messageId ID del mensaje
   * @returns Información del mensaje actualizado
   */
  async markAsRead(messageId: string): Promise<any> {
    try {
      this.logger.log(`Marcando mensaje ${messageId} como leído`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método markAsRead del contrato chat
      const result = await this.blockchainService.submitTransaction(
        'chat',
        'markAsRead',
        messageId
      );
      
      const message = JSON.parse(result.toString());
      this.logger.log(`Mensaje marcado como leído: ${JSON.stringify(message)}`);
      
      return message;
    } catch (error) {
      this.logger.error(`Error al marcar mensaje como leído: ${error.message}`);
      throw error;
    }
  }

  /**
   * Edita un mensaje existente
   * @param messageId ID del mensaje
   * @param newContent Nuevo contenido del mensaje
   * @returns Información del mensaje actualizado
   */
  async editMessage(messageId: string, newContent: string): Promise<any> {
    try {
      this.logger.log(`Editando mensaje ${messageId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método editMessage del contrato chat
      const result = await this.blockchainService.submitTransaction(
        'chat',
        'editMessage',
        messageId,
        newContent
      );
      
      const message = JSON.parse(result.toString());
      this.logger.log(`Mensaje editado: ${JSON.stringify(message)}`);
      
      return message;
    } catch (error) {
      this.logger.error(`Error al editar mensaje: ${error.message}`);
      throw error;
    }
  }

  /**
   * Elimina un mensaje
   * @param messageId ID del mensaje
   * @returns Información del mensaje eliminado
   */
  async deleteMessage(messageId: string): Promise<any> {
    try {
      this.logger.log(`Eliminando mensaje ${messageId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método deleteMessage del contrato chat
      const result = await this.blockchainService.submitTransaction(
        'chat',
        'deleteMessage',
        messageId
      );
      
      const message = JSON.parse(result.toString());
      this.logger.log(`Mensaje eliminado: ${JSON.stringify(message)}`);
      
      return message;
    } catch (error) {
      this.logger.error(`Error al eliminar mensaje: ${error.message}`);
      throw error;
    }
  }

  /**
   * Añade un participante a un canal
   * @param channelId ID del canal
   * @param participantId ID del participante
   * @returns Información del canal actualizado
   */
  async addParticipant(channelId: string, participantId: string): Promise<any> {
    try {
      this.logger.log(`Añadiendo participante ${participantId} al canal ${channelId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método addParticipant del contrato chat
      const result = await this.blockchainService.submitTransaction(
        'chat',
        'addParticipant',
        channelId,
        participantId
      );
      
      const channel = JSON.parse(result.toString());
      this.logger.log(`Participante añadido: ${JSON.stringify(channel)}`);
      
      return channel;
    } catch (error) {
      this.logger.error(`Error al añadir participante: ${error.message}`);
      throw error;
    }
  }

  /**
   * Elimina un participante de un canal
   * @param channelId ID del canal
   * @param participantId ID del participante
   * @returns Información del canal actualizado
   */
  async removeParticipant(channelId: string, participantId: string): Promise<any> {
    try {
      this.logger.log(`Eliminando participante ${participantId} del canal ${channelId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método removeParticipant del contrato chat
      const result = await this.blockchainService.submitTransaction(
        'chat',
        'removeParticipant',
        channelId,
        participantId
      );
      
      const channel = JSON.parse(result.toString());
      this.logger.log(`Participante eliminado: ${JSON.stringify(channel)}`);
      
      return channel;
    } catch (error) {
      this.logger.error(`Error al eliminar participante: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene información de un canal
   * @param channelId ID del canal
   * @returns Información del canal
   */
  async getChannel(channelId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo información del canal ${channelId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getChannel del contrato chat
      const result = await this.blockchainService.evaluateTransaction(
        'chat',
        'getChannel',
        channelId
      );
      
      const channel = JSON.parse(result.toString());
      this.logger.log(`Información del canal obtenida: ${JSON.stringify(channel)}`);
      
      return channel;
    } catch (error) {
      this.logger.error(`Error al obtener información del canal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene los mensajes de un canal
   * @param channelId ID del canal
   * @param limit Límite de mensajes a obtener (opcional)
   * @param offset Desplazamiento para paginación (opcional)
   * @returns Lista de mensajes
   */
  async getChannelMessages(channelId: string, limit?: number, offset?: number): Promise<any> {
    try {
      this.logger.log(`Obteniendo mensajes del canal ${channelId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getChannelMessages del contrato chat
      const result = await this.blockchainService.evaluateTransaction(
        'chat',
        'getChannelMessages',
        channelId,
        limit ? limit.toString() : '',
        offset ? offset.toString() : ''
      );
      
      const messages = JSON.parse(result.toString());
      this.logger.log(`Mensajes obtenidos: ${messages.length} mensajes`);
      
      return messages;
    } catch (error) {
      this.logger.error(`Error al obtener mensajes del canal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene los canales de un usuario
   * @param userId ID del usuario
   * @returns Lista de canales
   */
  async getUserChannels(userId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo canales del usuario ${userId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getUserChannels del contrato chat
      const result = await this.blockchainService.evaluateTransaction(
        'chat',
        'getUserChannels',
        userId
      );
      
      const channels = JSON.parse(result.toString());
      this.logger.log(`Canales obtenidos: ${channels.length} canales`);
      
      return channels;
    } catch (error) {
      this.logger.error(`Error al obtener canales del usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene información de un mensaje
   * @param messageId ID del mensaje
   * @returns Información del mensaje
   */
  async getMessage(messageId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo información del mensaje ${messageId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getMessage del contrato chat
      const result = await this.blockchainService.evaluateTransaction(
        'chat',
        'getMessage',
        messageId
      );
      
      const message = JSON.parse(result.toString());
      this.logger.log(`Información del mensaje obtenida: ${JSON.stringify(message)}`);
      
      return message;
    } catch (error) {
      this.logger.error(`Error al obtener información del mensaje: ${error.message}`);
      throw error;
    }
  }
}
