import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerService {
  private context: string;
  private readonly logger: Logger;
  private readonly logToFile: boolean;
  private readonly logDir: string;

  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger();
    this.context = 'Default';
    
    // Configuración de logging a archivo
    this.logToFile = this.configService.get<boolean>('logging.fileEnabled', true);
    this.logDir = this.configService.get<string>('logging.directory', '/var/log/blockchain-simbiotica');
    
    // Crear directorio de logs si no existe y está habilitado el logging a archivo
    if (this.logToFile) {
      try {
        if (!fs.existsSync(this.logDir)) {
          fs.mkdirSync(this.logDir, { recursive: true });
        }
      } catch (error) {
        console.error(`Error al crear directorio de logs: ${error.message}`);
        this.logToFile = false;
      }
    }
  }

  /**
   * Establece el contexto para los mensajes de log
   * @param context Nombre del contexto
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Registra un mensaje de log de nivel 'log'
   * @param message Mensaje a registrar
   * @param context Contexto opcional (si no se proporciona, se usa el contexto establecido)
   */
  log(message: string, context?: string): void {
    const ctx = context || this.context;
    this.logger.log(message, ctx);
    this.writeToFile('log', message, ctx);
  }

  /**
   * Registra un mensaje de log de nivel 'error'
   * @param message Mensaje a registrar
   * @param trace Traza de error opcional
   * @param context Contexto opcional (si no se proporciona, se usa el contexto establecido)
   */
  error(message: string, trace?: string, context?: string): void {
    const ctx = context || this.context;
    this.logger.error(message, trace, ctx);
    this.writeToFile('error', message, ctx, trace);
  }

  /**
   * Registra un mensaje de log de nivel 'warn'
   * @param message Mensaje a registrar
   * @param context Contexto opcional (si no se proporciona, se usa el contexto establecido)
   */
  warn(message: string, context?: string): void {
    const ctx = context || this.context;
    this.logger.warn(message, ctx);
    this.writeToFile('warn', message, ctx);
  }

  /**
   * Registra un mensaje de log de nivel 'debug'
   * @param message Mensaje a registrar
   * @param context Contexto opcional (si no se proporciona, se usa el contexto establecido)
   */
  debug(message: string, context?: string): void {
    const ctx = context || this.context;
    this.logger.debug(message, ctx);
    this.writeToFile('debug', message, ctx);
  }

  /**
   * Registra un mensaje de log de nivel 'verbose'
   * @param message Mensaje a registrar
   * @param context Contexto opcional (si no se proporciona, se usa el contexto establecido)
   */
  verbose(message: string, context?: string): void {
    const ctx = context || this.context;
    this.logger.verbose(message, ctx);
    this.writeToFile('verbose', message, ctx);
  }

  /**
   * Escribe un mensaje de log en archivo
   * @param level Nivel de log
   * @param message Mensaje a registrar
   * @param context Contexto
   * @param trace Traza de error opcional
   */
  private writeToFile(level: string, message: string, context: string, trace?: string): void {
    if (!this.logToFile) return;

    try {
      const timestamp = new Date().toISOString();
      const logFileName = `${this.getFormattedDate()}.log`;
      const logFilePath = path.join(this.logDir, logFileName);
      
      let logMessage = `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
      if (trace) {
        logMessage += `\n${trace}`;
      }
      logMessage += '\n';
      
      fs.appendFileSync(logFilePath, logMessage);
    } catch (error) {
      console.error(`Error al escribir en archivo de log: ${error.message}`);
    }
  }

  /**
   * Obtiene la fecha formateada para el nombre del archivo de log
   * @returns Fecha formateada (YYYY-MM-DD)
   */
  private getFormattedDate(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}
