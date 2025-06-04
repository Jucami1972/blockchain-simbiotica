import { Test, TestingModule } from '@nestjs/testing';
import { DaoService } from './dao.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';

describe('DaoService', () => {
  let service: DaoService;
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
        DaoService,
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

    service = module.get<DaoService>(DaoService);
    blockchainService = module.get<BlockchainService>(BlockchainService);

    // Restablecer los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('crearPropuesta', () => {
    it('should create a proposal successfully', async () => {
      // Arrange
      const titulo = 'Integración con sistema de telemedicina';
      const descripcion = 'Propuesta para integrar el sistema de telemedicina con el módulo de IA para diagnósticos asistidos';
      const categoria = 'integracion';
      const accionesData = JSON.stringify({
        tipo: 'integracion',
        modulos: ['telemedicina', 'ia'],
        presupuesto: 5000,
        duracion: 30
      });
      const expectedPropuesta = {
        id: 'propuesta123',
        titulo,
        descripcion,
        categoria,
        acciones: JSON.parse(accionesData),
        creador: 'user123',
        creadaEn: '2023-01-01T00:00:00Z',
        actualizadaEn: '2023-01-01T00:00:00Z',
        estado: 'pendiente',
        votos: {
          favor: 0,
          contra: 0,
          abstencion: 0
        },
        votantes: [],
        quorum: false,
        aprobada: false,
        ejecutada: false
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedPropuesta)));

      // Act
      const result = await service.crearPropuesta(titulo, descripcion, categoria, accionesData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'dao',
        'crearPropuesta',
        titulo,
        descripcion,
        categoria,
        accionesData
      );
      expect(result).toEqual(expectedPropuesta);
      expect(mockLogger.log).toHaveBeenCalledTimes(2);
    });

    it('should throw error when blockchain is not connected', async () => {
      // Arrange
      const titulo = 'Integración con sistema de telemedicina';
      const descripcion = 'Propuesta para integrar el sistema de telemedicina con el módulo de IA';
      const categoria = 'integracion';
      const accionesData = JSON.stringify({
        tipo: 'integracion',
        modulos: ['telemedicina', 'ia']
      });
      mockBlockchainService.isConnected.mockReturnValue(false);

      // Act & Assert
      await expect(service.crearPropuesta(titulo, descripcion, categoria, accionesData)).rejects.toThrow('No hay conexión con la blockchain');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle blockchain errors properly', async () => {
      // Arrange
      const titulo = 'Integración con sistema de telemedicina';
      const descripcion = 'Propuesta para integrar el sistema de telemedicina con el módulo de IA';
      const categoria = 'integracion';
      const accionesData = JSON.stringify({
        tipo: 'integracion',
        modulos: ['telemedicina', 'ia']
      });
      const errorMessage = 'Error al crear la propuesta';
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.crearPropuesta(titulo, descripcion, categoria, accionesData)).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('votar', () => {
    it('should vote on a proposal successfully', async () => {
      // Arrange
      const propuestaId = 'propuesta123';
      const voto = 'favor';
      const comentario = 'Estoy de acuerdo con esta propuesta';
      const expectedPropuesta = {
        id: propuestaId,
        titulo: 'Integración con sistema de telemedicina',
        estado: 'votacion',
        votos: {
          favor: 1,
          contra: 0,
          abstencion: 0
        },
        votantes: [
          {
            usuario: 'user123',
            voto: 'favor',
            comentario: 'Estoy de acuerdo con esta propuesta',
            timestamp: '2023-01-02T00:00:00Z'
          }
        ],
        quorum: false,
        aprobada: false
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedPropuesta)));

      // Act
      const result = await service.votar(propuestaId, voto, comentario);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'dao',
        'votar',
        propuestaId,
        voto,
        comentario
      );
      expect(result).toEqual(expectedPropuesta);
    });

    it('should vote without comment', async () => {
      // Arrange
      const propuestaId = 'propuesta123';
      const voto = 'favor';
      const expectedPropuesta = {
        id: propuestaId,
        titulo: 'Integración con sistema de telemedicina',
        estado: 'votacion',
        votos: {
          favor: 1,
          contra: 0,
          abstencion: 0
        },
        votantes: [
          {
            usuario: 'user123',
            voto: 'favor',
            comentario: '',
            timestamp: '2023-01-02T00:00:00Z'
          }
        ],
        quorum: false,
        aprobada: false
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedPropuesta)));

      // Act
      const result = await service.votar(propuestaId, voto);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'dao',
        'votar',
        propuestaId,
        voto,
        ''
      );
      expect(result).toEqual(expectedPropuesta);
    });

    it('should throw error when user has already voted', async () => {
      // Arrange
      const propuestaId = 'propuesta123';
      const voto = 'favor';
      const errorMessage = 'El usuario ya ha votado en esta propuesta';
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.votar(propuestaId, voto)).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('finalizarVotacion', () => {
    it('should finalize voting successfully with approval', async () => {
      // Arrange
      const propuestaId = 'propuesta123';
      const expectedPropuesta = {
        id: propuestaId,
        titulo: 'Integración con sistema de telemedicina',
        estado: 'aprobada',
        votos: {
          favor: 8,
          contra: 2,
          abstencion: 0
        },
        votantes: [
          { usuario: 'user123', voto: 'favor' },
          { usuario: 'user456', voto: 'favor' }
          // ... más votantes
        ],
        quorum: true,
        aprobada: true,
        finalizadaEn: '2023-01-10T00:00:00Z',
        resultado: 'La propuesta ha sido aprobada con un 80% de votos a favor'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedPropuesta)));

      // Act
      const result = await service.finalizarVotacion(propuestaId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'dao',
        'finalizarVotacion',
        propuestaId
      );
      expect(result).toEqual(expectedPropuesta);
    });

    it('should finalize voting with rejection', async () => {
      // Arrange
      const propuestaId = 'propuesta456';
      const expectedPropuesta = {
        id: propuestaId,
        titulo: 'Cambio en política de tokens',
        estado: 'rechazada',
        votos: {
          favor: 3,
          contra: 7,
          abstencion: 0
        },
        votantes: [
          { usuario: 'user123', voto: 'contra' },
          { usuario: 'user456', voto: 'favor' }
          // ... más votantes
        ],
        quorum: true,
        aprobada: false,
        finalizadaEn: '2023-01-10T00:00:00Z',
        resultado: 'La propuesta ha sido rechazada con un 70% de votos en contra'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedPropuesta)));

      // Act
      const result = await service.finalizarVotacion(propuestaId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'dao',
        'finalizarVotacion',
        propuestaId
      );
      expect(result).toEqual(expectedPropuesta);
    });

    it('should throw error when quorum is not reached', async () => {
      // Arrange
      const propuestaId = 'propuesta123';
      const errorMessage = 'No se ha alcanzado el quórum necesario para finalizar la votación';
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.finalizarVotacion(propuestaId)).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('ejecutarPropuesta', () => {
    it('should execute proposal successfully', async () => {
      // Arrange
      const propuestaId = 'propuesta123';
      const expectedPropuesta = {
        id: propuestaId,
        titulo: 'Integración con sistema de telemedicina',
        estado: 'ejecutada',
        votos: {
          favor: 8,
          contra: 2,
          abstencion: 0
        },
        quorum: true,
        aprobada: true,
        ejecutada: true,
        ejecutadaEn: '2023-01-15T00:00:00Z',
        resultadoEjecucion: 'La propuesta ha sido ejecutada correctamente'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedPropuesta)));

      // Act
      const result = await service.ejecutarPropuesta(propuestaId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'dao',
        'ejecutarPropuesta',
        propuestaId
      );
      expect(result).toEqual(expectedPropuesta);
    });

    it('should throw error when proposal is not approved', async () => {
      // Arrange
      const propuestaId = 'propuesta456';
      const errorMessage = 'La propuesta no está aprobada y no puede ser ejecutada';
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.ejecutarPropuesta(propuestaId)).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getPropuesta', () => {
    it('should return proposal information', async () => {
      // Arrange
      const propuestaId = 'propuesta123';
      const expectedPropuesta = {
        id: propuestaId,
        titulo: 'Integración con sistema de telemedicina',
        descripcion: 'Propuesta para integrar el sistema de telemedicina con el módulo de IA para diagnósticos asistidos',
        categoria: 'integracion',
        acciones: {
          tipo: 'integracion',
          modulos: ['telemedicina', 'ia'],
          presupuesto: 5000,
          duracion: 30
        },
        creador: 'user123',
        creadaEn: '2023-01-01T00:00:00Z',
        actualizadaEn: '2023-01-10T00:00:00Z',
        estado: 'aprobada',
        votos: {
          favor: 8,
          contra: 2,
          abstencion: 0
        },
        votantes: [
          { usuario: 'user123', voto: 'favor' },
          { usuario: 'user456', voto: 'favor' }
          // ... más votantes
        ],
        quorum: true,
        aprobada: true,
        finalizadaEn: '2023-01-10T00:00:00Z'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedPropuesta)));

      // Act
      const result = await service.getPropuesta(propuestaId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'dao',
        'getPropuesta',
        propuestaId
      );
      expect(result).toEqual(expectedPropuesta);
    });
  });

  describe('getPropuestas', () => {
    it('should return all proposals', async () => {
      // Arrange
      const expectedPropuestas = [
        {
          id: 'propuesta123',
          titulo: 'Integración con sistema de telemedicina',
          categoria: 'integracion',
          creador: 'user123',
          creadaEn: '2023-01-01T00:00:00Z',
          estado: 'aprobada'
        },
        {
          id: 'propuesta456',
          titulo: 'Cambio en política de tokens',
          categoria: 'tokens',
          creador: 'user456',
          creadaEn: '2023-01-05T00:00:00Z',
          estado: 'rechazada'
        },
        {
          id: 'propuesta789',
          titulo: 'Nueva funcionalidad de chat',
          categoria: 'funcionalidad',
          creador: 'user123',
          creadaEn: '2023-01-10T00:00:00Z',
          estado: 'pendiente'
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedPropuestas)));

      // Act
      const result = await service.getPropuestas();

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'dao',
        'getPropuestas',
        ''
      );
      expect(result).toEqual(expectedPropuestas);
    });

    it('should return proposals filtered by status', async () => {
      // Arrange
      const estado = 'pendiente';
      const expectedPropuestas = [
        {
          id: 'propuesta789',
          titulo: 'Nueva funcionalidad de chat',
          categoria: 'funcionalidad',
          creador: 'user123',
          creadaEn: '2023-01-10T00:00:00Z',
          estado: 'pendiente'
        },
        {
          id: 'propuesta101',
          titulo: 'Mejora en sistema de logros',
          categoria: 'funcionalidad',
          creador: 'user456',
          creadaEn: '2023-01-12T00:00:00Z',
          estado: 'pendiente'
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedPropuestas)));

      // Act
      const result = await service.getPropuestas(estado);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'dao',
        'getPropuestas',
        estado
      );
      expect(result).toEqual(expectedPropuestas);
    });
  });

  describe('getVotosPropuesta', () => {
    it('should return proposal votes', async () => {
      // Arrange
      const propuestaId = 'propuesta123';
      const expectedVotos = [
        {
          usuario: 'user123',
          nombre: 'Juan Pérez',
          voto: 'favor',
          comentario: 'Estoy de acuerdo con esta propuesta',
          timestamp: '2023-01-02T10:00:00Z'
        },
        {
          usuario: 'user456',
          nombre: 'María Gómez',
          voto: 'favor',
          comentario: 'Me parece una buena idea',
          timestamp: '2023-01-02T11:30:00Z'
        },
        {
          usuario: 'user789',
          nombre: 'Carlos Ruiz',
          voto: 'contra',
          comentario: 'Creo que hay mejores alternativas',
          timestamp: '2023-01-03T09:15:00Z'
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedVotos)));

      // Act
      const result = await service.getVotosPropuesta(propuestaId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'dao',
        'getVotosPropuesta',
        propuestaId
      );
      expect(result).toEqual(expectedVotos);
    });
  });

  describe('getVotoUsuario', () => {
    it('should return user vote on a proposal', async () => {
      // Arrange
      const propuestaId = 'propuesta123';
      const userId = 'user123';
      const expectedVoto = {
        usuario: userId,
        propuestaId: propuestaId,
        voto: 'favor',
        comentario: 'Estoy de acuerdo con esta propuesta',
        timestamp: '2023-01-02T10:00:00Z'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedVoto)));

      // Act
      const result = await service.getVotoUsuario(propuestaId, userId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'dao',
        'getVotoUsuario',
        propuestaId,
        userId
      );
      expect(result).toEqual(expectedVoto);
    });

    it('should return null when user has not voted', async () => {
      // Arrange
      const propuestaId = 'propuesta123';
      const userId = 'user999';
      const expectedVoto = null;
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedVoto)));

      // Act
      const result = await service.getVotoUsuario(propuestaId, userId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'dao',
        'getVotoUsuario',
        propuestaId,
        userId
      );
      expect(result).toEqual(expectedVoto);
    });
  });

  describe('getPropuestasUsuario', () => {
    it('should return proposals created by a user', async () => {
      // Arrange
      const userId = 'user123';
      const expectedPropuestas = [
        {
          id: 'propuesta123',
          titulo: 'Integración con sistema de telemedicina',
          categoria: 'integracion',
          creadaEn: '2023-01-01T00:00:00Z',
          estado: 'aprobada'
        },
        {
          id: 'propuesta789',
          titulo: 'Nueva funcionalidad de chat',
          categoria: 'funcionalidad',
          creadaEn: '2023-01-10T00:00:00Z',
          estado: 'pendiente'
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedPropuestas)));

      // Act
      const result = await service.getPropuestasUsuario(userId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'dao',
        'getPropuestasUsuario',
        userId
      );
      expect(result).toEqual(expectedPropuestas);
    });
  });

  describe('getConfiguracionDAO', () => {
    it('should return DAO configuration', async () => {
      // Arrange
      const expectedConfiguracion = {
        quorum: 0.5,
        umbralAprobacion: 0.66,
        periodoVotacion: 7,
        votantesPermitidos: ['miembros', 'delegados'],
        categorias: ['integracion', 'funcionalidad', 'tokens', 'gobernanza'],
        reglasVotacion: {
          pesoPorToken: true,
          minimoTokens: 100
        },
        actualizadaEn: '2023-01-01T00:00:00Z',
        actualizadaPor: 'admin'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedConfiguracion)));

      // Act
      const result = await service.getConfiguracionDAO();

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'dao',
        'getConfiguracionDAO'
      );
      expect(result).toEqual(expectedConfiguracion);
    });
  });

  describe('actualizarConfiguracionDAO', () => {
    it('should update DAO configuration successfully', async () => {
      // Arrange
      const configuracionData = JSON.stringify({
        quorum: 0.6,
        umbralAprobacion: 0.7,
        periodoVotacion: 5
      });
      const expectedConfiguracion = {
        quorum: 0.6,
        umbralAprobacion: 0.7,
        periodoVotacion: 5,
        votantesPermitidos: ['miembros', 'delegados'],
        categorias: ['integracion', 'funcionalidad', 'tokens', 'gobernanza'],
        reglasVotacion: {
          pesoPorToken: true,
          minimoTokens: 100
        },
        actualizadaEn: '2023-01-15T00:00:00Z',
        actualizadaPor: 'admin'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedConfiguracion)));

      // Act
      const result = await service.actualizarConfiguracionDAO(configuracionData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'dao',
        'actualizarConfiguracionDAO',
        configuracionData
      );
      expect(result).toEqual(expectedConfiguracion);
    });

    it('should throw error when user does not have permission', async () => {
      // Arrange
      const configuracionData = JSON.stringify({
        quorum: 0.6,
        umbralAprobacion: 0.7
      });
      const errorMessage = 'El usuario no tiene permisos para actualizar la configuración del DAO';
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.actualizarConfiguracionDAO(configuracionData)).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
