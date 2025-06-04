import { Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';

@Injectable()
export class IdentityService {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    this.logger.setContext('IdentityService');
  }

  /**
   * Registra un nuevo usuario en el sistema
   * @param userId ID del usuario
   * @param userData Datos del usuario en formato JSON
   * @returns Información del usuario registrado
   */
  async registerUser(userId: string, userData: string): Promise<any> {
    try {
      this.logger.log(`Registrando usuario con ID: ${userId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método registerUser del contrato identity
      const result = await this.blockchainService.submitTransaction(
        'identity',
        'registerUser',
        userId,
        userData
      );
      
      const user = JSON.parse(result.toString());
      this.logger.log(`Usuario registrado: ${JSON.stringify(user)}`);
      
      return user;
    } catch (error) {
      this.logger.error(`Error al registrar usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene información de un usuario
   * @param userId ID del usuario
   * @returns Información del usuario
   */
  async getUser(userId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo información del usuario con ID: ${userId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getUser del contrato identity
      const result = await this.blockchainService.evaluateTransaction(
        'identity',
        'getUser',
        userId
      );
      
      const user = JSON.parse(result.toString());
      this.logger.log(`Información del usuario obtenida: ${JSON.stringify(user)}`);
      
      return user;
    } catch (error) {
      this.logger.error(`Error al obtener información del usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza la información de un usuario
   * @param userId ID del usuario
   * @param userData Datos actualizados del usuario en formato JSON
   * @returns Información del usuario actualizada
   */
  async updateUser(userId: string, userData: string): Promise<any> {
    try {
      this.logger.log(`Actualizando usuario con ID: ${userId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método updateUser del contrato identity
      const result = await this.blockchainService.submitTransaction(
        'identity',
        'updateUser',
        userId,
        userData
      );
      
      const user = JSON.parse(result.toString());
      this.logger.log(`Usuario actualizado: ${JSON.stringify(user)}`);
      
      return user;
    } catch (error) {
      this.logger.error(`Error al actualizar usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Elimina un usuario
   * @param userId ID del usuario
   * @returns Resultado de la operación
   */
  async deleteUser(userId: string): Promise<any> {
    try {
      this.logger.log(`Eliminando usuario con ID: ${userId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método deleteUser del contrato identity
      const result = await this.blockchainService.submitTransaction(
        'identity',
        'deleteUser',
        userId
      );
      
      const deleteResult = JSON.parse(result.toString());
      this.logger.log(`Usuario eliminado: ${JSON.stringify(deleteResult)}`);
      
      return deleteResult;
    } catch (error) {
      this.logger.error(`Error al eliminar usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca un usuario por nombre de usuario
   * @param username Nombre de usuario
   * @returns Información del usuario
   */
  async getUserByUsername(username: string): Promise<any> {
    try {
      this.logger.log(`Buscando usuario con nombre de usuario: ${username}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getUserByUsername del contrato identity
      const result = await this.blockchainService.evaluateTransaction(
        'identity',
        'getUserByUsername',
        username
      );
      
      const user = JSON.parse(result.toString());
      this.logger.log(`Usuario encontrado: ${JSON.stringify(user)}`);
      
      return user;
    } catch (error) {
      this.logger.error(`Error al buscar usuario por nombre de usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca un usuario por correo electrónico
   * @param email Correo electrónico
   * @returns Información del usuario
   */
  async getUserByEmail(email: string): Promise<any> {
    try {
      this.logger.log(`Buscando usuario con correo electrónico: ${email}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getUserByEmail del contrato identity
      const result = await this.blockchainService.evaluateTransaction(
        'identity',
        'getUserByEmail',
        email
      );
      
      const user = JSON.parse(result.toString());
      this.logger.log(`Usuario encontrado: ${JSON.stringify(user)}`);
      
      return user;
    } catch (error) {
      this.logger.error(`Error al buscar usuario por correo electrónico: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene todos los usuarios
   * @param limit Límite de usuarios a obtener (opcional)
   * @param offset Desplazamiento para paginación (opcional)
   * @returns Lista de usuarios
   */
  async getUsers(limit?: number, offset?: number): Promise<any> {
    try {
      this.logger.log('Obteniendo usuarios');
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getUsers del contrato identity
      const result = await this.blockchainService.evaluateTransaction(
        'identity',
        'getUsers',
        limit ? limit.toString() : '',
        offset ? offset.toString() : ''
      );
      
      const users = JSON.parse(result.toString());
      this.logger.log(`Usuarios obtenidos: ${users.length} usuarios`);
      
      return users;
    } catch (error) {
      this.logger.error(`Error al obtener usuarios: ${error.message}`);
      throw error;
    }
  }

  /**
   * Registra una credencial verificable para un usuario
   * @param credentialId ID de la credencial
   * @param userId ID del usuario
   * @param issuer Emisor de la credencial
   * @param credentialData Datos de la credencial en formato JSON
   * @returns Información de la credencial registrada
   */
  async registerCredential(credentialId: string, userId: string, issuer: string, credentialData: string): Promise<any> {
    try {
      this.logger.log(`Registrando credencial ${credentialId} para usuario ${userId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método registerCredential del contrato identity
      const result = await this.blockchainService.submitTransaction(
        'identity',
        'registerCredential',
        credentialId,
        userId,
        issuer,
        credentialData
      );
      
      const credential = JSON.parse(result.toString());
      this.logger.log(`Credencial registrada: ${JSON.stringify(credential)}`);
      
      return credential;
    } catch (error) {
      this.logger.error(`Error al registrar credencial: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene una credencial verificable
   * @param credentialId ID de la credencial
   * @returns Información de la credencial
   */
  async getCredential(credentialId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo credencial con ID: ${credentialId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getCredential del contrato identity
      const result = await this.blockchainService.evaluateTransaction(
        'identity',
        'getCredential',
        credentialId
      );
      
      const credential = JSON.parse(result.toString());
      this.logger.log(`Credencial obtenida: ${JSON.stringify(credential)}`);
      
      return credential;
    } catch (error) {
      this.logger.error(`Error al obtener credencial: ${error.message}`);
      throw error;
    }
  }

  /**
   * Revoca una credencial verificable
   * @param credentialId ID de la credencial
   * @param revokerId ID del revocador
   * @param reason Razón de la revocación
   * @returns Información de la revocación
   */
  async revokeCredential(credentialId: string, revokerId: string, reason: string): Promise<any> {
    try {
      this.logger.log(`Revocando credencial ${credentialId} por ${revokerId}: ${reason}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método revokeCredential del contrato identity
      const result = await this.blockchainService.submitTransaction(
        'identity',
        'revokeCredential',
        credentialId,
        revokerId,
        reason
      );
      
      const revocation = JSON.parse(result.toString());
      this.logger.log(`Credencial revocada: ${JSON.stringify(revocation)}`);
      
      return revocation;
    } catch (error) {
      this.logger.error(`Error al revocar credencial: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene las credenciales de un usuario
   * @param userId ID del usuario
   * @returns Lista de credenciales del usuario
   */
  async getUserCredentials(userId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo credenciales del usuario con ID: ${userId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getUserCredentials del contrato identity
      const result = await this.blockchainService.evaluateTransaction(
        'identity',
        'getUserCredentials',
        userId
      );
      
      const credentials = JSON.parse(result.toString());
      this.logger.log(`Credenciales obtenidas para ${userId}: ${credentials.length} credenciales`);
      
      return credentials;
    } catch (error) {
      this.logger.error(`Error al obtener credenciales del usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica una credencial
   * @param credentialId ID de la credencial
   * @returns Resultado de la verificación
   */
  async verifyCredential(credentialId: string): Promise<any> {
    try {
      this.logger.log(`Verificando credencial con ID: ${credentialId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método verifyCredential del contrato identity
      const result = await this.blockchainService.evaluateTransaction(
        'identity',
        'verifyCredential',
        credentialId
      );
      
      const verification = JSON.parse(result.toString());
      this.logger.log(`Resultado de verificación: ${JSON.stringify(verification)}`);
      
      return verification;
    } catch (error) {
      this.logger.error(`Error al verificar credencial: ${error.message}`);
      throw error;
    }
  }
}
