import { Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';

@Injectable()
export class AchievexService {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    this.logger.setContext('AchievexService');
  }

  /**
   * Crea una nueva categoría de logros
   * @param categoryId ID único de la categoría
   * @param categoryData Datos de la categoría en formato JSON
   * @returns Información de la categoría creada
   */
  async createCategory(categoryId: string, categoryData: string): Promise<any> {
    try {
      this.logger.log(`Creando categoría con ID: ${categoryId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método createCategory del contrato achievex
      const result = await this.blockchainService.submitTransaction(
        'achievex',
        'createCategory',
        categoryId,
        categoryData
      );
      
      const category = JSON.parse(result.toString());
      this.logger.log(`Categoría creada: ${JSON.stringify(category)}`);
      
      return category;
    } catch (error) {
      this.logger.error(`Error al crear categoría: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea un nuevo logro
   * @param achievementId ID único del logro
   * @param categoryId ID de la categoría
   * @param achievementData Datos del logro en formato JSON
   * @returns Información del logro creado
   */
  async createAchievement(achievementId: string, categoryId: string, achievementData: string): Promise<any> {
    try {
      this.logger.log(`Creando logro con ID: ${achievementId} en categoría: ${categoryId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método createAchievement del contrato achievex
      const result = await this.blockchainService.submitTransaction(
        'achievex',
        'createAchievement',
        achievementId,
        categoryId,
        achievementData
      );
      
      const achievement = JSON.parse(result.toString());
      this.logger.log(`Logro creado: ${JSON.stringify(achievement)}`);
      
      return achievement;
    } catch (error) {
      this.logger.error(`Error al crear logro: ${error.message}`);
      throw error;
    }
  }

  /**
   * Otorga un logro a un usuario
   * @param userId ID del usuario
   * @param achievementId ID del logro
   * @param evidence Evidencia del logro en formato JSON (opcional)
   * @returns Información del logro otorgado
   */
  async awardAchievement(userId: string, achievementId: string, evidence?: string): Promise<any> {
    try {
      this.logger.log(`Otorgando logro ${achievementId} a usuario ${userId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método awardAchievement del contrato achievex
      const result = await this.blockchainService.submitTransaction(
        'achievex',
        'awardAchievement',
        userId,
        achievementId,
        evidence || ''
      );
      
      const userAchievement = JSON.parse(result.toString());
      this.logger.log(`Logro otorgado: ${JSON.stringify(userAchievement)}`);
      
      return userAchievement;
    } catch (error) {
      this.logger.error(`Error al otorgar logro: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza un logro existente
   * @param achievementId ID del logro
   * @param achievementData Nuevos datos del logro en formato JSON
   * @returns Información del logro actualizado
   */
  async updateAchievement(achievementId: string, achievementData: string): Promise<any> {
    try {
      this.logger.log(`Actualizando logro con ID: ${achievementId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método updateAchievement del contrato achievex
      const result = await this.blockchainService.submitTransaction(
        'achievex',
        'updateAchievement',
        achievementId,
        achievementData
      );
      
      const achievement = JSON.parse(result.toString());
      this.logger.log(`Logro actualizado: ${JSON.stringify(achievement)}`);
      
      return achievement;
    } catch (error) {
      this.logger.error(`Error al actualizar logro: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene información de una categoría
   * @param categoryId ID de la categoría
   * @returns Información de la categoría
   */
  async getCategory(categoryId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo información de la categoría con ID: ${categoryId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getCategory del contrato achievex
      const result = await this.blockchainService.evaluateTransaction(
        'achievex',
        'getCategory',
        categoryId
      );
      
      const category = JSON.parse(result.toString());
      this.logger.log(`Información de la categoría obtenida: ${JSON.stringify(category)}`);
      
      return category;
    } catch (error) {
      this.logger.error(`Error al obtener información de la categoría: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene información de un logro
   * @param achievementId ID del logro
   * @returns Información del logro
   */
  async getAchievement(achievementId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo información del logro con ID: ${achievementId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getAchievement del contrato achievex
      const result = await this.blockchainService.evaluateTransaction(
        'achievex',
        'getAchievement',
        achievementId
      );
      
      const achievement = JSON.parse(result.toString());
      this.logger.log(`Información del logro obtenida: ${JSON.stringify(achievement)}`);
      
      return achievement;
    } catch (error) {
      this.logger.error(`Error al obtener información del logro: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene todas las categorías
   * @returns Lista de categorías
   */
  async getAllCategories(): Promise<any> {
    try {
      this.logger.log('Obteniendo todas las categorías');
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getAllCategories del contrato achievex
      const result = await this.blockchainService.evaluateTransaction(
        'achievex',
        'getAllCategories'
      );
      
      const categories = JSON.parse(result.toString());
      this.logger.log(`Categorías obtenidas: ${categories.length} categorías`);
      
      return categories;
    } catch (error) {
      this.logger.error(`Error al obtener categorías: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene todos los logros de una categoría
   * @param categoryId ID de la categoría
   * @returns Lista de logros
   */
  async getCategoryAchievements(categoryId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo logros de la categoría con ID: ${categoryId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getCategoryAchievements del contrato achievex
      const result = await this.blockchainService.evaluateTransaction(
        'achievex',
        'getCategoryAchievements',
        categoryId
      );
      
      const achievements = JSON.parse(result.toString());
      this.logger.log(`Logros obtenidos para la categoría ${categoryId}: ${achievements.length} logros`);
      
      return achievements;
    } catch (error) {
      this.logger.error(`Error al obtener logros de la categoría: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene el perfil de logros de un usuario
   * @param userId ID del usuario
   * @returns Perfil de logros del usuario
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo perfil de logros del usuario con ID: ${userId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getUserProfile del contrato achievex
      const result = await this.blockchainService.evaluateTransaction(
        'achievex',
        'getUserProfile',
        userId
      );
      
      const profile = JSON.parse(result.toString());
      this.logger.log(`Perfil de logros obtenido para ${userId}: ${JSON.stringify(profile)}`);
      
      return profile;
    } catch (error) {
      this.logger.error(`Error al obtener perfil de logros del usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene los logros de un usuario
   * @param userId ID del usuario
   * @returns Lista de logros del usuario
   */
  async getUserAchievements(userId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo logros del usuario con ID: ${userId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getUserAchievements del contrato achievex
      const result = await this.blockchainService.evaluateTransaction(
        'achievex',
        'getUserAchievements',
        userId
      );
      
      const achievements = JSON.parse(result.toString());
      this.logger.log(`Logros obtenidos para el usuario ${userId}: ${achievements.length} logros`);
      
      return achievements;
    } catch (error) {
      this.logger.error(`Error al obtener logros del usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica si un usuario tiene un logro específico
   * @param userId ID del usuario
   * @param achievementId ID del logro
   * @returns Resultado de la verificación
   */
  async hasAchievement(userId: string, achievementId: string): Promise<any> {
    try {
      this.logger.log(`Verificando si el usuario ${userId} tiene el logro ${achievementId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método hasAchievement del contrato achievex
      const result = await this.blockchainService.evaluateTransaction(
        'achievex',
        'hasAchievement',
        userId,
        achievementId
      );
      
      const hasAchievement = JSON.parse(result.toString());
      this.logger.log(`Resultado de verificación: ${hasAchievement}`);
      
      return { userId, achievementId, hasAchievement };
    } catch (error) {
      this.logger.error(`Error al verificar logro del usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de logros
   * @returns Estadísticas de logros
   */
  async getAchievementStats(): Promise<any> {
    try {
      this.logger.log('Obteniendo estadísticas de logros');
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getAchievementStats del contrato achievex
      const result = await this.blockchainService.evaluateTransaction(
        'achievex',
        'getAchievementStats'
      );
      
      const stats = JSON.parse(result.toString());
      this.logger.log(`Estadísticas de logros obtenidas: ${JSON.stringify(stats)}`);
      
      return stats;
    } catch (error) {
      this.logger.error(`Error al obtener estadísticas de logros: ${error.message}`);
      throw error;
    }
  }
}
