import { Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';

@Injectable()
export class DaoService {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    this.logger.setContext('DaoService');
  }

  /**
   * Crea una nueva propuesta de gobernanza
   * @param titulo Título de la propuesta
   * @param descripcion Descripción detallada de la propuesta
   * @param categoria Categoría de la propuesta
   * @param accionesData Acciones a ejecutar en formato JSON
   * @returns Información de la propuesta creada
   */
  async crearPropuesta(titulo: string, descripcion: string, categoria: string, accionesData: string): Promise<any> {
    try {
      this.logger.log(`Creando propuesta: ${titulo}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método crearPropuesta del contrato dao
      const result = await this.blockchainService.submitTransaction(
        'dao',
        'crearPropuesta',
        titulo,
        descripcion,
        categoria,
        accionesData
      );
      
      const propuesta = JSON.parse(result.toString());
      this.logger.log(`Propuesta creada: ${JSON.stringify(propuesta)}`);
      
      return propuesta;
    } catch (error) {
      this.logger.error(`Error al crear propuesta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Vota en una propuesta
   * @param propuestaId ID de la propuesta
   * @param voto Tipo de voto (favor, contra, abstencion)
   * @param comentario Comentario opcional
   * @returns Información de la propuesta actualizada
   */
  async votar(propuestaId: string, voto: string, comentario?: string): Promise<any> {
    try {
      this.logger.log(`Votando en propuesta ${propuestaId} con voto: ${voto}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método votar del contrato dao
      const result = await this.blockchainService.submitTransaction(
        'dao',
        'votar',
        propuestaId,
        voto,
        comentario || ''
      );
      
      const propuesta = JSON.parse(result.toString());
      this.logger.log(`Voto registrado: ${JSON.stringify(propuesta)}`);
      
      return propuesta;
    } catch (error) {
      this.logger.error(`Error al votar en propuesta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Finaliza una votación de propuesta
   * @param propuestaId ID de la propuesta
   * @returns Información de la propuesta finalizada
   */
  async finalizarVotacion(propuestaId: string): Promise<any> {
    try {
      this.logger.log(`Finalizando votación de propuesta ${propuestaId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método finalizarVotacion del contrato dao
      const result = await this.blockchainService.submitTransaction(
        'dao',
        'finalizarVotacion',
        propuestaId
      );
      
      const propuesta = JSON.parse(result.toString());
      this.logger.log(`Votación finalizada: ${JSON.stringify(propuesta)}`);
      
      return propuesta;
    } catch (error) {
      this.logger.error(`Error al finalizar votación: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ejecuta una propuesta aprobada
   * @param propuestaId ID de la propuesta
   * @returns Información de la propuesta ejecutada
   */
  async ejecutarPropuesta(propuestaId: string): Promise<any> {
    try {
      this.logger.log(`Ejecutando propuesta ${propuestaId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método ejecutarPropuesta del contrato dao
      const result = await this.blockchainService.submitTransaction(
        'dao',
        'ejecutarPropuesta',
        propuestaId
      );
      
      const propuesta = JSON.parse(result.toString());
      this.logger.log(`Propuesta ejecutada: ${JSON.stringify(propuesta)}`);
      
      return propuesta;
    } catch (error) {
      this.logger.error(`Error al ejecutar propuesta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene información de una propuesta
   * @param propuestaId ID de la propuesta
   * @returns Información de la propuesta
   */
  async getPropuesta(propuestaId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo información de la propuesta ${propuestaId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getPropuesta del contrato dao
      const result = await this.blockchainService.evaluateTransaction(
        'dao',
        'getPropuesta',
        propuestaId
      );
      
      const propuesta = JSON.parse(result.toString());
      this.logger.log(`Información de la propuesta obtenida: ${JSON.stringify(propuesta)}`);
      
      return propuesta;
    } catch (error) {
      this.logger.error(`Error al obtener información de la propuesta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene todas las propuestas
   * @param estado Estado de las propuestas a filtrar (opcional)
   * @returns Lista de propuestas
   */
  async getPropuestas(estado?: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo propuestas${estado ? ` con estado: ${estado}` : ''}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getPropuestas del contrato dao
      const result = await this.blockchainService.evaluateTransaction(
        'dao',
        'getPropuestas',
        estado || ''
      );
      
      const propuestas = JSON.parse(result.toString());
      this.logger.log(`Propuestas obtenidas: ${propuestas.length} propuestas`);
      
      return propuestas;
    } catch (error) {
      this.logger.error(`Error al obtener propuestas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene los votos de una propuesta
   * @param propuestaId ID de la propuesta
   * @returns Lista de votos
   */
  async getVotosPropuesta(propuestaId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo votos de la propuesta ${propuestaId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getVotosPropuesta del contrato dao
      const result = await this.blockchainService.evaluateTransaction(
        'dao',
        'getVotosPropuesta',
        propuestaId
      );
      
      const votos = JSON.parse(result.toString());
      this.logger.log(`Votos obtenidos: ${votos.length} votos`);
      
      return votos;
    } catch (error) {
      this.logger.error(`Error al obtener votos de la propuesta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene el voto de un usuario en una propuesta
   * @param propuestaId ID de la propuesta
   * @param userId ID del usuario
   * @returns Información del voto
   */
  async getVotoUsuario(propuestaId: string, userId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo voto del usuario ${userId} en la propuesta ${propuestaId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getVotoUsuario del contrato dao
      const result = await this.blockchainService.evaluateTransaction(
        'dao',
        'getVotoUsuario',
        propuestaId,
        userId
      );
      
      const voto = JSON.parse(result.toString());
      this.logger.log(`Voto obtenido: ${JSON.stringify(voto)}`);
      
      return voto;
    } catch (error) {
      this.logger.error(`Error al obtener voto del usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene las propuestas creadas por un usuario
   * @param userId ID del usuario
   * @returns Lista de propuestas
   */
  async getPropuestasUsuario(userId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo propuestas creadas por el usuario ${userId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getPropuestasUsuario del contrato dao
      const result = await this.blockchainService.evaluateTransaction(
        'dao',
        'getPropuestasUsuario',
        userId
      );
      
      const propuestas = JSON.parse(result.toString());
      this.logger.log(`Propuestas obtenidas: ${propuestas.length} propuestas`);
      
      return propuestas;
    } catch (error) {
      this.logger.error(`Error al obtener propuestas del usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene la configuración del DAO
   * @returns Configuración del DAO
   */
  async getConfiguracionDAO(): Promise<any> {
    try {
      this.logger.log('Obteniendo configuración del DAO');
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getConfiguracionDAO del contrato dao
      const result = await this.blockchainService.evaluateTransaction(
        'dao',
        'getConfiguracionDAO'
      );
      
      const configuracion = JSON.parse(result.toString());
      this.logger.log(`Configuración obtenida: ${JSON.stringify(configuracion)}`);
      
      return configuracion;
    } catch (error) {
      this.logger.error(`Error al obtener configuración del DAO: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza la configuración del DAO
   * @param configuracionData Nueva configuración en formato JSON
   * @returns Configuración actualizada
   */
  async actualizarConfiguracionDAO(configuracionData: string): Promise<any> {
    try {
      this.logger.log('Actualizando configuración del DAO');
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método actualizarConfiguracionDAO del contrato dao
      const result = await this.blockchainService.submitTransaction(
        'dao',
        'actualizarConfiguracionDAO',
        configuracionData
      );
      
      const configuracion = JSON.parse(result.toString());
      this.logger.log(`Configuración actualizada: ${JSON.stringify(configuracion)}`);
      
      return configuracion;
    } catch (error) {
      this.logger.error(`Error al actualizar configuración del DAO: ${error.message}`);
      throw error;
    }
  }
}
