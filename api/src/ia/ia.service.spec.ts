import { Test, TestingModule } from '@nestjs/testing';
import { IaService } from './ia.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';

describe('IaService', () => {
  let service: IaService;
  let blockchainService: BlockchainService;

  const mockBlockchainService = {
    isConnected: jest.fn(),
    submitTransaction: jest.fn(),
    evaluateTransaction: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IaService,
        {
          provide: BlockchainService,
          useValue: mockBlockchainService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<IaService>(IaService);
    blockchainService = module.get<BlockchainService>(BlockchainService);

    // Restablecer los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registrarModelo', () => {
    it('should register a model successfully', async () => {
      // Arrange
      const modeloId = 'modelo123';
      const modeloData = JSON.stringify({
        nombre: 'GPT-4',
        version: '1.0',
        tipo: 'lenguaje',
        proveedor: 'OpenAI',
        parametros: 175000000000,
        descripcion: 'Modelo de lenguaje avanzado para procesamiento de texto'
      });
      const expectedModelo = {
        id: modeloId,
        nombre: 'GPT-4',
        version: '1.0',
        tipo: 'lenguaje',
        proveedor: 'OpenAI',
        parametros: 175000000000,
        descripcion: 'Modelo de lenguaje avanzado para procesamiento de texto',
        registradoEn: '2023-01-01T00:00:00Z',
        registradoPor: 'admin',
        actualizadoEn: '2023-01-01T00:00:00Z',
        estado: 'activo',
        solicitudes: 0
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedModelo)));

      // Act
      const result = await service.registrarModelo(modeloId, modeloData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'ia',
        'registrarModelo',
        modeloId,
        modeloData
      );
      expect(result).toEqual(expectedModelo);
      expect(mockLogger.log).toHaveBeenCalledTimes(2);
    });

    it('should throw error when blockchain is not connected', async () => {
      // Arrange
      const modeloId = 'modelo123';
      const modeloData = JSON.stringify({
        nombre: 'GPT-4',
        version: '1.0'
      });
      mockBlockchainService.isConnected.mockReturnValue(false);

      // Act & Assert
      await expect(service.registrarModelo(modeloId, modeloData)).rejects.toThrow('No hay conexión con la blockchain');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle blockchain errors properly', async () => {
      // Arrange
      const modeloId = 'modelo123';
      const modeloData = JSON.stringify({
        nombre: 'GPT-4',
        version: '1.0'
      });
      const errorMessage = 'El modelo ya existe';
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.registrarModelo(modeloId, modeloData)).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('registrarSolicitud', () => {
    it('should register a request successfully', async () => {
      // Arrange
      const modeloId = 'modelo123';
      const solicitudData = JSON.stringify({
        usuario: 'user123',
        prompt: '¿Cuáles son los síntomas de la diabetes?',
        parametros: {
          temperatura: 0.7,
          maxTokens: 500
        },
        contexto: 'consulta_medica'
      });
      const expectedSolicitud = {
        id: 'solicitud123',
        modeloId: modeloId,
        usuario: 'user123',
        prompt: '¿Cuáles son los síntomas de la diabetes?',
        parametros: {
          temperatura: 0.7,
          maxTokens: 500
        },
        contexto: 'consulta_medica',
        registradaEn: '2023-01-01T12:00:00Z',
        estado: 'pendiente',
        tiempoRespuesta: null,
        respuestaId: null
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedSolicitud)));

      // Act
      const result = await service.registrarSolicitud(modeloId, solicitudData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'ia',
        'registrarSolicitud',
        modeloId,
        solicitudData
      );
      expect(result).toEqual(expectedSolicitud);
    });
  });

  describe('registrarRespuesta', () => {
    it('should register a response successfully', async () => {
      // Arrange
      const solicitudId = 'solicitud123';
      const respuestaData = JSON.stringify({
        contenido: 'Los síntomas comunes de la diabetes incluyen: sed excesiva, micción frecuente, fatiga, visión borrosa, hambre constante, pérdida de peso inexplicable...',
        tokens: 120,
        tiempoEjecucion: 2.5
      });
      const expectedRespuesta = {
        id: 'respuesta123',
        solicitudId: solicitudId,
        modeloId: 'modelo123',
        usuario: 'user123',
        contenido: 'Los síntomas comunes de la diabetes incluyen: sed excesiva, micción frecuente, fatiga, visión borrosa, hambre constante, pérdida de peso inexplicable...',
        tokens: 120,
        tiempoEjecucion: 2.5,
        registradaEn: '2023-01-01T12:01:00Z',
        evaluada: false,
        evaluacionId: null
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedRespuesta)));

      // Act
      const result = await service.registrarRespuesta(solicitudId, respuestaData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'ia',
        'registrarRespuesta',
        solicitudId,
        respuestaData
      );
      expect(result).toEqual(expectedRespuesta);
    });
  });

  describe('registrarEvaluacion', () => {
    it('should register an evaluation successfully', async () => {
      // Arrange
      const respuestaId = 'respuesta123';
      const evaluacionData = JSON.stringify({
        calificacion: 4.5,
        comentario: 'Respuesta clara y completa',
        criterios: {
          precision: 5,
          claridad: 4,
          utilidad: 4.5
        },
        evaluador: 'user123'
      });
      const expectedEvaluacion = {
        id: 'evaluacion123',
        respuestaId: respuestaId,
        solicitudId: 'solicitud123',
        modeloId: 'modelo123',
        calificacion: 4.5,
        comentario: 'Respuesta clara y completa',
        criterios: {
          precision: 5,
          claridad: 4,
          utilidad: 4.5
        },
        evaluador: 'user123',
        registradaEn: '2023-01-01T12:10:00Z'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedEvaluacion)));

      // Act
      const result = await service.registrarEvaluacion(respuestaId, evaluacionData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'ia',
        'registrarEvaluacion',
        respuestaId,
        evaluacionData
      );
      expect(result).toEqual(expectedEvaluacion);
    });
  });

  describe('getModelo', () => {
    it('should return model information', async () => {
      // Arrange
      const modeloId = 'modelo123';
      const expectedModelo = {
        id: modeloId,
        nombre: 'GPT-4',
        version: '1.0',
        tipo: 'lenguaje',
        proveedor: 'OpenAI',
        parametros: 175000000000,
        descripcion: 'Modelo de lenguaje avanzado para procesamiento de texto',
        registradoEn: '2023-01-01T00:00:00Z',
        registradoPor: 'admin',
        actualizadoEn: '2023-01-01T00:00:00Z',
        estado: 'activo',
        solicitudes: 150,
        calificacionPromedio: 4.7
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedModelo)));

      // Act
      const result = await service.getModelo(modeloId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'ia',
        'getModelo',
        modeloId
      );
      expect(result).toEqual(expectedModelo);
    });
  });

  describe('getSolicitud', () => {
    it('should return request information', async () => {
      // Arrange
      const solicitudId = 'solicitud123';
      const expectedSolicitud = {
        id: solicitudId,
        modeloId: 'modelo123',
        usuario: 'user123',
        prompt: '¿Cuáles son los síntomas de la diabetes?',
        parametros: {
          temperatura: 0.7,
          maxTokens: 500
        },
        contexto: 'consulta_medica',
        registradaEn: '2023-01-01T12:00:00Z',
        estado: 'completada',
        tiempoRespuesta: 2.5,
        respuestaId: 'respuesta123'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedSolicitud)));

      // Act
      const result = await service.getSolicitud(solicitudId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'ia',
        'getSolicitud',
        solicitudId
      );
      expect(result).toEqual(expectedSolicitud);
    });
  });

  describe('getRespuesta', () => {
    it('should return response information', async () => {
      // Arrange
      const respuestaId = 'respuesta123';
      const expectedRespuesta = {
        id: respuestaId,
        solicitudId: 'solicitud123',
        modeloId: 'modelo123',
        usuario: 'user123',
        contenido: 'Los síntomas comunes de la diabetes incluyen: sed excesiva, micción frecuente, fatiga, visión borrosa, hambre constante, pérdida de peso inexplicable...',
        tokens: 120,
        tiempoEjecucion: 2.5,
        registradaEn: '2023-01-01T12:01:00Z',
        evaluada: true,
        evaluacionId: 'evaluacion123'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedRespuesta)));

      // Act
      const result = await service.getRespuesta(respuestaId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'ia',
        'getRespuesta',
        respuestaId
      );
      expect(result).toEqual(expectedRespuesta);
    });
  });

  describe('getSolicitudesUsuario', () => {
    it('should return user requests', async () => {
      // Arrange
      const userId = 'user123';
      const expectedSolicitudes = [
        {
          id: 'solicitud123',
          modeloId: 'modelo123',
          modeloNombre: 'GPT-4',
          prompt: '¿Cuáles son los síntomas de la diabetes?',
          registradaEn: '2023-01-01T12:00:00Z',
          estado: 'completada'
        },
        {
          id: 'solicitud456',
          modeloId: 'modelo123',
          modeloNombre: 'GPT-4',
          prompt: '¿Cuáles son los tratamientos para la hipertensión?',
          registradaEn: '2023-01-02T10:00:00Z',
          estado: 'completada'
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedSolicitudes)));

      // Act
      const result = await service.getSolicitudesUsuario(userId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'ia',
        'getSolicitudesUsuario',
        userId
      );
      expect(result).toEqual(expectedSolicitudes);
    });
  });

  describe('getSolicitudesModelo', () => {
    it('should return model requests', async () => {
      // Arrange
      const modeloId = 'modelo123';
      const expectedSolicitudes = [
        {
          id: 'solicitud123',
          usuario: 'user123',
          prompt: '¿Cuáles son los síntomas de la diabetes?',
          registradaEn: '2023-01-01T12:00:00Z',
          estado: 'completada'
        },
        {
          id: 'solicitud456',
          usuario: 'user123',
          prompt: '¿Cuáles son los tratamientos para la hipertensión?',
          registradaEn: '2023-01-02T10:00:00Z',
          estado: 'completada'
        },
        {
          id: 'solicitud789',
          usuario: 'user456',
          prompt: '¿Qué es la presión arterial?',
          registradaEn: '2023-01-03T09:00:00Z',
          estado: 'pendiente'
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedSolicitudes)));

      // Act
      const result = await service.getSolicitudesModelo(modeloId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'ia',
        'getSolicitudesModelo',
        modeloId
      );
      expect(result).toEqual(expectedSolicitudes);
    });
  });

  describe('getEstadisticasUso', () => {
    it('should return usage statistics', async () => {
      // Arrange
      const expectedEstadisticas = {
        totalModelos: 5,
        totalSolicitudes: 1250,
        totalRespuestas: 1200,
        totalEvaluaciones: 950,
        calificacionPromedio: 4.6,
        modelosMasUsados: [
          { id: 'modelo123', nombre: 'GPT-4', solicitudes: 800 },
          { id: 'modelo456', nombre: 'DALL-E', solicitudes: 300 }
        ],
        usuariosMasActivos: [
          { id: 'user123', solicitudes: 150 },
          { id: 'user456', solicitudes: 120 }
        ],
        tiempoPromedioRespuesta: 2.8,
        distribucionContextos: {
          'consulta_medica': 500,
          'educacion': 300,
          'legal': 200,
          'otros': 250
        }
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedEstadisticas)));

      // Act
      const result = await service.getEstadisticasUso();

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'ia',
        'getEstadisticasUso'
      );
      expect(result).toEqual(expectedEstadisticas);
    });
  });

  describe('actualizarModelo', () => {
    it('should update model successfully', async () => {
      // Arrange
      const modeloId = 'modelo123';
      const modeloData = JSON.stringify({
        descripcion: 'Modelo de lenguaje avanzado para procesamiento de texto y generación de contenido',
        estado: 'activo'
      });
      const expectedModelo = {
        id: modeloId,
        nombre: 'GPT-4',
        version: '1.0',
        tipo: 'lenguaje',
        proveedor: 'OpenAI',
        parametros: 175000000000,
        descripcion: 'Modelo de lenguaje avanzado para procesamiento de texto y generación de contenido',
        registradoEn: '2023-01-01T00:00:00Z',
        registradoPor: 'admin',
        actualizadoEn: '2023-01-10T00:00:00Z',
        estado: 'activo',
        solicitudes: 150
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedModelo)));

      // Act
      const result = await service.actualizarModelo(modeloId, modeloData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'ia',
        'actualizarModelo',
        modeloId,
        modeloData
      );
      expect(result).toEqual(expectedModelo);
    });
  });
});
