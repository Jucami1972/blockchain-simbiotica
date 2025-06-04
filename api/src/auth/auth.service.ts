import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
    private readonly blockchainService: BlockchainService
  ) {
    this.logger.setContext('AuthService');
  }

  /**
   * Registra un nuevo usuario en el sistema
   * @param username Nombre de usuario
   * @param password Contraseña
   * @param email Correo electrónico
   * @param fullName Nombre completo
   * @param role Rol del usuario (opcional)
   * @returns Información del usuario registrado
   */
  async register(username: string, password: string, email: string, fullName: string, role?: string): Promise<any> {
    try {
      this.logger.log(`Registrando nuevo usuario: ${username}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Generar hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Generar ID único para el usuario
      const userId = this.generateUUID();
      
      // Preparar datos del usuario
      const userData = JSON.stringify({
        username,
        email,
        fullName,
        passwordHash: hashedPassword,
        role: role || 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Registrar usuario en la blockchain
      const result = await this.blockchainService.submitTransaction(
        'identity',
        'registerUser',
        userId,
        userData
      );
      
      const user = JSON.parse(result.toString());
      this.logger.log(`Usuario registrado: ${JSON.stringify(user)}`);
      
      // Generar token JWT
      const token = this.generateToken(user);
      
      return {
        userId: user.userId,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        token
      };
    } catch (error) {
      this.logger.error(`Error al registrar usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Autentica a un usuario
   * @param username Nombre de usuario
   * @param password Contraseña
   * @returns Información del usuario autenticado y token JWT
   */
  async login(username: string, password: string): Promise<any> {
    try {
      this.logger.log(`Autenticando usuario: ${username}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Buscar usuario por nombre de usuario
      const result = await this.blockchainService.evaluateTransaction(
        'identity',
        'getUserByUsername',
        username
      );
      
      const user = JSON.parse(result.toString());
      
      // Verificar si el usuario existe
      if (!user || !user.userId) {
        throw new Error('Usuario no encontrado');
      }
      
      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Contraseña incorrecta');
      }
      
      // Generar token JWT
      const token = this.generateToken(user);
      
      this.logger.log(`Usuario autenticado: ${user.userId}`);
      
      return {
        userId: user.userId,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        token
      };
    } catch (error) {
      this.logger.error(`Error al autenticar usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica un token JWT
   * @param token Token JWT
   * @returns Información del usuario decodificada
   */
  async verifyToken(token: string): Promise<any> {
    try {
      this.logger.log('Verificando token JWT');
      
      // Verificar token
      const decoded = jwt.verify(token, this.configService.get<string>('jwt.secret'));
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Verificar que el usuario siga existiendo
      const result = await this.blockchainService.evaluateTransaction(
        'identity',
        'getUser',
        decoded.sub
      );
      
      const user = JSON.parse(result.toString());
      
      // Verificar si el usuario existe
      if (!user || !user.userId) {
        throw new Error('Usuario no encontrado');
      }
      
      return {
        userId: user.userId,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      };
    } catch (error) {
      this.logger.error(`Error al verificar token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza la información de un usuario
   * @param userId ID del usuario
   * @param userData Datos del usuario a actualizar
   * @returns Información del usuario actualizada
   */
  async updateUser(userId: string, userData: any): Promise<any> {
    try {
      this.logger.log(`Actualizando usuario con ID: ${userId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Obtener usuario actual
      const currentUserResult = await this.blockchainService.evaluateTransaction(
        'identity',
        'getUser',
        userId
      );
      
      const currentUser = JSON.parse(currentUserResult.toString());
      
      // Verificar si el usuario existe
      if (!currentUser || !currentUser.userId) {
        throw new Error('Usuario no encontrado');
      }
      
      // Preparar datos actualizados
      const updatedUserData = {
        ...currentUser,
        ...userData,
        updatedAt: new Date().toISOString()
      };
      
      // Si se proporciona una nueva contraseña, generar hash
      if (userData.password) {
        updatedUserData.passwordHash = await bcrypt.hash(userData.password, 10);
        delete updatedUserData.password;
      }
      
      // Actualizar usuario en la blockchain
      const result = await this.blockchainService.submitTransaction(
        'identity',
        'updateUser',
        userId,
        JSON.stringify(updatedUserData)
      );
      
      const updatedUser = JSON.parse(result.toString());
      this.logger.log(`Usuario actualizado: ${JSON.stringify(updatedUser)}`);
      
      return {
        userId: updatedUser.userId,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role
      };
    } catch (error) {
      this.logger.error(`Error al actualizar usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cambia la contraseña de un usuario
   * @param userId ID del usuario
   * @param currentPassword Contraseña actual
   * @param newPassword Nueva contraseña
   * @returns Resultado de la operación
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<any> {
    try {
      this.logger.log(`Cambiando contraseña para usuario con ID: ${userId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Obtener usuario actual
      const currentUserResult = await this.blockchainService.evaluateTransaction(
        'identity',
        'getUser',
        userId
      );
      
      const currentUser = JSON.parse(currentUserResult.toString());
      
      // Verificar si el usuario existe
      if (!currentUser || !currentUser.userId) {
        throw new Error('Usuario no encontrado');
      }
      
      // Verificar contraseña actual
      const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Contraseña actual incorrecta');
      }
      
      // Generar hash de la nueva contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      
      // Preparar datos actualizados
      const updatedUserData = {
        ...currentUser,
        passwordHash: newPasswordHash,
        updatedAt: new Date().toISOString()
      };
      
      // Actualizar usuario en la blockchain
      await this.blockchainService.submitTransaction(
        'identity',
        'updateUser',
        userId,
        JSON.stringify(updatedUserData)
      );
      
      this.logger.log(`Contraseña cambiada para usuario: ${userId}`);
      
      return { success: true, message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      this.logger.error(`Error al cambiar contraseña: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera un token JWT para un usuario
   * @param user Información del usuario
   * @returns Token JWT
   */
  private generateToken(user: any): string {
    const payload = {
      sub: user.userId,
      username: user.username,
      role: user.role
    };
    
    return jwt.sign(
      payload,
      this.configService.get<string>('jwt.secret'),
      { expiresIn: this.configService.get<string>('jwt.expiresIn') || '1d' }
    );
  }

  /**
   * Genera un UUID v4
   * @returns UUID generado
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
