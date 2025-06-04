import { Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    this.logger.setContext('TokenService');
  }

  /**
   * Obtiene el balance de tokens de una dirección
   * @param address Dirección del usuario
   * @returns Balance de tokens
   */
  async getBalance(address: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo balance para la dirección: ${address}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método balanceOf del contrato token
      const result = await this.blockchainService.evaluateTransaction(
        'token',
        'balanceOf',
        address
      );
      
      const balance = JSON.parse(result.toString());
      this.logger.log(`Balance obtenido para ${address}: ${balance}`);
      
      return { address, balance };
    } catch (error) {
      this.logger.error(`Error al obtener balance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene el suministro total de tokens
   * @returns Suministro total de tokens
   */
  async getTotalSupply(): Promise<any> {
    try {
      this.logger.log('Obteniendo suministro total de tokens');
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método totalSupply del contrato token
      const result = await this.blockchainService.evaluateTransaction(
        'token',
        'totalSupply'
      );
      
      const totalSupply = JSON.parse(result.toString());
      this.logger.log(`Suministro total obtenido: ${totalSupply}`);
      
      return { totalSupply };
    } catch (error) {
      this.logger.error(`Error al obtener suministro total: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transfiere tokens de una dirección a otra
   * @param from Dirección del remitente
   * @param to Dirección del destinatario
   * @param amount Cantidad de tokens a transferir
   * @returns Resultado de la transacción
   */
  async transfer(from: string, to: string, amount: string): Promise<any> {
    try {
      this.logger.log(`Transfiriendo ${amount} tokens de ${from} a ${to}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método transfer del contrato token
      const result = await this.blockchainService.submitTransaction(
        'token',
        'transfer',
        from,
        to,
        amount
      );
      
      const transaction = JSON.parse(result.toString());
      this.logger.log(`Transferencia completada: ${JSON.stringify(transaction)}`);
      
      return transaction;
    } catch (error) {
      this.logger.error(`Error al transferir tokens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Aprueba a una dirección para gastar tokens en nombre del propietario
   * @param owner Dirección del propietario
   * @param spender Dirección del gastador
   * @param amount Cantidad de tokens a aprobar
   * @returns Resultado de la transacción
   */
  async approve(owner: string, spender: string, amount: string): Promise<any> {
    try {
      this.logger.log(`Aprobando ${amount} tokens para que ${spender} gaste en nombre de ${owner}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método approve del contrato token
      const result = await this.blockchainService.submitTransaction(
        'token',
        'approve',
        owner,
        spender,
        amount
      );
      
      const transaction = JSON.parse(result.toString());
      this.logger.log(`Aprobación completada: ${JSON.stringify(transaction)}`);
      
      return transaction;
    } catch (error) {
      this.logger.error(`Error al aprobar tokens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transfiere tokens de una dirección a otra en nombre del propietario
   * @param spender Dirección del gastador
   * @param from Dirección del remitente
   * @param to Dirección del destinatario
   * @param amount Cantidad de tokens a transferir
   * @returns Resultado de la transacción
   */
  async transferFrom(spender: string, from: string, to: string, amount: string): Promise<any> {
    try {
      this.logger.log(`${spender} transfiriendo ${amount} tokens de ${from} a ${to}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método transferFrom del contrato token
      const result = await this.blockchainService.submitTransaction(
        'token',
        'transferFrom',
        spender,
        from,
        to,
        amount
      );
      
      const transaction = JSON.parse(result.toString());
      this.logger.log(`Transferencia desde completada: ${JSON.stringify(transaction)}`);
      
      return transaction;
    } catch (error) {
      this.logger.error(`Error al transferir tokens desde otra cuenta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene la cantidad de tokens que un gastador puede gastar en nombre de un propietario
   * @param owner Dirección del propietario
   * @param spender Dirección del gastador
   * @returns Cantidad de tokens aprobados
   */
  async getAllowance(owner: string, spender: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo allowance para ${spender} de ${owner}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método allowance del contrato token
      const result = await this.blockchainService.evaluateTransaction(
        'token',
        'allowance',
        owner,
        spender
      );
      
      const allowance = JSON.parse(result.toString());
      this.logger.log(`Allowance obtenido: ${allowance}`);
      
      return { owner, spender, allowance };
    } catch (error) {
      this.logger.error(`Error al obtener allowance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Acuña nuevos tokens y los asigna a una dirección
   * @param to Dirección del destinatario
   * @param amount Cantidad de tokens a acuñar
   * @returns Resultado de la transacción
   */
  async mint(to: string, amount: string): Promise<any> {
    try {
      this.logger.log(`Acuñando ${amount} tokens para ${to}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Verificar si el minteo está habilitado
      const mintingEnabled = this.configService.get<boolean>('modules.token.mintingEnabled');
      if (!mintingEnabled) {
        throw new Error('El minteo de tokens está deshabilitado');
      }
      
      // Llamar al método mint del contrato token
      const result = await this.blockchainService.submitTransaction(
        'token',
        'mint',
        to,
        amount
      );
      
      const transaction = JSON.parse(result.toString());
      this.logger.log(`Minteo completado: ${JSON.stringify(transaction)}`);
      
      return transaction;
    } catch (error) {
      this.logger.error(`Error al acuñar tokens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Quema tokens de una dirección
   * @param from Dirección de la que se quemarán tokens
   * @param amount Cantidad de tokens a quemar
   * @returns Resultado de la transacción
   */
  async burn(from: string, amount: string): Promise<any> {
    try {
      this.logger.log(`Quemando ${amount} tokens de ${from}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Verificar si la quema está habilitada
      const burningEnabled = this.configService.get<boolean>('modules.token.burningEnabled');
      if (!burningEnabled) {
        throw new Error('La quema de tokens está deshabilitada');
      }
      
      // Llamar al método burn del contrato token
      const result = await this.blockchainService.submitTransaction(
        'token',
        'burn',
        from,
        amount
      );
      
      const transaction = JSON.parse(result.toString());
      this.logger.log(`Quema completada: ${JSON.stringify(transaction)}`);
      
      return transaction;
    } catch (error) {
      this.logger.error(`Error al quemar tokens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene el historial de transacciones de una dirección
   * @param address Dirección a consultar
   * @returns Historial de transacciones
   */
  async getTransactionHistory(address: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo historial de transacciones para ${address}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getTransactionHistory del contrato token
      const result = await this.blockchainService.evaluateTransaction(
        'token',
        'getTransactionHistory',
        address
      );
      
      const history = JSON.parse(result.toString());
      this.logger.log(`Historial obtenido para ${address}: ${history.length} transacciones`);
      
      return { address, transactions: history };
    } catch (error) {
      this.logger.error(`Error al obtener historial de transacciones: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene información del token
   * @returns Información del token
   */
  async getTokenInfo(): Promise<any> {
    try {
      this.logger.log('Obteniendo información del token');
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getTokenInfo del contrato token
      const result = await this.blockchainService.evaluateTransaction(
        'token',
        'getTokenInfo'
      );
      
      const tokenInfo = JSON.parse(result.toString());
      this.logger.log(`Información del token obtenida: ${JSON.stringify(tokenInfo)}`);
      
      return tokenInfo;
    } catch (error) {
      this.logger.error(`Error al obtener información del token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Bloquea tokens de una dirección
   * @param address Dirección a bloquear
   * @param amount Cantidad de tokens a bloquear
   * @param reason Razón del bloqueo
   * @returns Resultado de la transacción
   */
  async lockTokens(address: string, amount: string, reason: string): Promise<any> {
    try {
      this.logger.log(`Bloqueando ${amount} tokens de ${address} por: ${reason}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método lockTokens del contrato token
      const result = await this.blockchainService.submitTransaction(
        'token',
        'lockTokens',
        address,
        amount,
        reason
      );
      
      const transaction = JSON.parse(result.toString());
      this.logger.log(`Bloqueo completado: ${JSON.stringify(transaction)}`);
      
      return transaction;
    } catch (error) {
      this.logger.error(`Error al bloquear tokens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desbloquea tokens de una dirección
   * @param address Dirección a desbloquear
   * @param amount Cantidad de tokens a desbloquear
   * @returns Resultado de la transacción
   */
  async unlockTokens(address: string, amount: string): Promise<any> {
    try {
      this.logger.log(`Desbloqueando ${amount} tokens de ${address}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método unlockTokens del contrato token
      const result = await this.blockchainService.submitTransaction(
        'token',
        'unlockTokens',
        address,
        amount
      );
      
      const transaction = JSON.parse(result.toString());
      this.logger.log(`Desbloqueo completado: ${JSON.stringify(transaction)}`);
      
      return transaction;
    } catch (error) {
      this.logger.error(`Error al desbloquear tokens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene la cantidad de tokens bloqueados de una dirección
   * @param address Dirección a consultar
   * @returns Cantidad de tokens bloqueados
   */
  async getLockedTokens(address: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo tokens bloqueados para ${address}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getLockedTokens del contrato token
      const result = await this.blockchainService.evaluateTransaction(
        'token',
        'getLockedTokens',
        address
      );
      
      const lockedTokens = JSON.parse(result.toString());
      this.logger.log(`Tokens bloqueados obtenidos para ${address}: ${lockedTokens}`);
      
      return { address, lockedTokens };
    } catch (error) {
      this.logger.error(`Error al obtener tokens bloqueados: ${error.message}`);
      throw error;
    }
  }
}
