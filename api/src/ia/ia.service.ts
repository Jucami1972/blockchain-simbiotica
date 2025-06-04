import { Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';

@Injectable()
export class IaService {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    this.logger.setContext('IaService');
  }

  /**
   * Registra un nuevo modelo de IA
   * @param modeloId ID único del modelo
   * @param modeloData Datos del modelo en formato JSON
   * @returns Información del modelo registrado
   */
  async registrarModelo(modeloId: string, modeloData: string): Promise<any> {
    try {
      this.logger.log(`Registrando modelo con ID: ${modeloId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método registrarModelo del contrato ia
      const result = await this.blockchainService.submitTransaction(
        'ia',
        'registrarModelo',
        modeloId,
        modeloData
      );
      
      const modelo = JSON.parse(result.toString());
      this.logger.log(`Modelo registrado: ${JSON.stringify(modelo)}`);
      
      return modelo;
    } catch (error) {
      this.logger.error(`Error al registrar modelo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Registra una solicitud de inferencia de IA
   * @param modeloId ID del modelo
   * @param solicitudData Datos de la solicitud en formato JSON
   * @returns Información de la solicitud registrada
   */
  async registrarSolicitud(modeloId: string, solicitudData: string): Promise<any> {
    try {
      this.logger.log(`Registrando solicitud para el modelo: ${modeloId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método registrarSolicitud del contrato ia
      const result = await this.blockchainService.submitTransaction(
        'ia',
        'registrarSolicitud',
        modeloId,
        solicitudData
      );
      
      const solicitud = JSON.parse(result.toString());
      this.logger.log(`Solicitud registrada: ${JSON.stringify(solicitud)}`);
      
      return solicitud;
    } catch (error) {
      this.logger.error(`Error al registrar solicitud: ${error.message}`);
      throw error;
    }
  }

  /**
   * Registra la respuesta a una solicitud de inferencia
   * @param solicitudId ID de la solicitud
   * @param respuestaData Datos de la respuesta en formato JSON
   * @returns Información de la respuesta registrada
   */
  async registrarRespuesta(solicitudId: string, respuestaData: string): Promise<any> {
    try {
      this.logger.log(`Registrando respuesta para la solicitud: ${solicitudId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método registrarRespuesta del contrato ia
      const result = await this.blockchainService.submitTransaction(
        'ia',
        'registrarRespuesta',
        solicitudId,
        respuestaData
      );
      
      const respuesta = JSON.parse(result.toString());
      this.logger.log(`Respuesta registrada: ${JSON.stringify(respuesta)}`);
      
      return respuesta;
    } catch (error) {
      this.logger.error(`Error al registrar respuesta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Registra una evaluación de calidad para una respuesta de IA
   * @param respuestaId ID de la respuesta
   * @param evaluacionData Datos de la evaluación en formato JSON
   * @returns Información de la evaluación registrada
   */
  async registrarEvaluacion(respuestaId: string, evaluacionData: string): Promise<any> {
    try {
      this.logger.log(`Registrando evaluación para la respuesta: ${respuestaId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método registrarEvaluacion del contrato ia
      const result = await this.blockchainService.submitTransaction(
        'ia',
        'registrarEvaluacion',
        respuestaId,
        evaluacionData
      );
      
      const evaluacion = JSON.parse(result.toString());
      this.logger.log(`Evaluación registrada: ${JSON.stringify(evaluacion)}`);
      
      return evaluacion;
    } catch (error) {
      this.logger.error(`Error al registrar evaluación: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene información de un modelo de IA
   * @param modeloId ID del modelo
   * @returns Información del modelo
   */
  async getModelo(modeloId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo información del modelo con ID: ${modeloId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getModelo del contrato ia
      const result = await this.blockchainService.evaluateTransaction(
        'ia',
        'getModelo',
        modeloId
      );
      
      const modelo = JSON.parse(result.toString());
      this.logger.log(`Información del modelo obtenida: ${JSON.stringify(modelo)}`);
      
      return modelo;
    } catch (error) {
      this.logger.error(`Error al obtener información del modelo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene información de una solicitud de inferencia
   * @param solicitudId ID de la solicitud
   * @returns Información de la solicitud
   */
  async getSolicitud(solicitudId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo información de la solicitud con ID: ${solicitudId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getSolicitud del contrato ia
      const result = await this.blockchainService.evaluateTransaction(
        'ia',
        'getSolicitud',
        solicitudId
      );
      
      const solicitud = JSON.parse(result.toString());
      this.logger.log(`Información de la solicitud obtenida: ${JSON.stringify(solicitud)}`);
      
      return solicitud;
    } catch (error) {
      this.logger.error(`Error al obtener información de la solicitud: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene información de una respuesta de inferencia
   * @param respuestaId ID de la respuesta
   * @returns Información de la respuesta
   */
  async getRespuesta(respuestaId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo información de la respuesta con ID: ${respuestaId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getRespuesta del contrato ia
      const result = await this.blockchainService.evaluateTransaction(
        'ia',
        'getRespuesta',
        respuestaId
      );
      
      const respuesta = JSON.parse(result.toString());
      this.logger.log(`Información de la respuesta obtenida: ${JSON.stringify(respuesta)}`);
      
      return respuesta;
    } catch (error) {
      this.logger.error(`Error al obtener información de la respuesta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene todas las solicitudes de un usuario
   * @param userId ID del usuario
   * @returns Lista de solicitudes del usuario
   */
  async getSolicitudesUsuario(userId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo solicitudes del usuario con ID: ${userId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getSolicitudesUsuario del contrato ia
      const result = await this.blockchainService.evaluateTransaction(
        'ia',
        'getSolicitudesUsuario',
        userId
      );
      
      const solicitudes = JSON.parse(result.toString());
      this.logger.log(`Solicitudes obtenidas: ${solicitudes.length} solicitudes`);
      
      return solicitudes;
    } catch (error) {
      this.logger.error(`Error al obtener solicitudes del usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene todas las solicitudes de un modelo
   * @param modeloId ID del modelo
   * @returns Lista de solicitudes del modelo
   */
  async getSolicitudesModelo(modeloId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo solicitudes del modelo con ID: ${modeloId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getSolicitudesModelo del contrato ia
      const result = await this.blockchainService.evaluateTransaction(
        'ia',
        'getSolicitudesModelo',
        modeloId
      );
      
      const solicitudes = JSON.parse(result.toString());
      this.logger.log(`Solicitudes obtenidas: ${solicitudes.length} solicitudes`);
      
      return solicitudes;
    } catch (error) {
      this.logger.error(`Error al obtener solicitudes del modelo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de uso de IA
   * @returns Estadísticas de uso
   */
  async getEstadisticasUso(): Promise<any> {
    try {
      this.logger.log('Obteniendo estadísticas de uso de IA');
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getEstadisticasUso del contrato ia
      const result = await this.blockchainService.evaluateTransaction(
        'ia',
        'getEstadisticasUso'
      );
      
      const estadisticas = JSON.parse(result.toString());
      this.logger.log(`Estadísticas de uso obtenidas: ${JSON.stringify(estadisticas)}`);
      
      return estadisticas;
    } catch (error) {
      this.logger.error(`Error al obtener estadísticas de uso: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza un modelo de IA
   * @param modeloId ID del modelo
   * @param modeloData Datos actualizados del modelo en formato JSON
   * @returns Información del modelo actualizado
   */
  async actualizarModelo(modeloId: string, modeloData: string): Promise<any> {
    try {
      this.logger.log(`Actualizando modelo con ID: ${modeloId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método actualizarModelo del contrato ia
      const result = await this.blockchainService.submitTransaction(
        'ia',
        'actualizarModelo',
        modeloId,
        modeloData
      );
      
      const modelo = JSON.parse(result.toString());
      this.logger.log(`Modelo actualizado: ${JSON.stringify(modelo)}`);
      
      return modelo;
    } catch (error) {
      this.logger.error(`Error al actualizar modelo: ${error.message}`);
      throw error;
    }
  }
}
