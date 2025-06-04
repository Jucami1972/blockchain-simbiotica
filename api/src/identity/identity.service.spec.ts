import { Test, TestingModule } from '@nestjs/testing';
import { IdentityService } from './identity.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';

describe('IdentityService', () => {
  let service: IdentityService;
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
        IdentityService,
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

    service = module.get<IdentityService>(IdentityService);
    blockchainService = module.get<BlockchainService>(BlockchainService);

    // Restablecer los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerUser', () => {
    it('should register a user successfully', async () => {
      // Arrange
      const userId = 'user123';
      const userData = JSON.stringify({
        username: 'juanperez',
        email: 'juan@example.com',
        nombre: 'Juan Pérez',
        rol: 'paciente'
      });
      const expectedUser = {
        id: userId,
        data: JSON.parse(userData),
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        credentials: []
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedUser)));

      // Act
      const result = await service.registerUser(userId, userData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'identity',
        'registerUser',
        userId,
        userData
      );
      expect(result).toEqual(expectedUser);
      expect(mockLogger.log).toHaveBeenCalledTimes(2);
    });

    it('should throw error when blockchain is not connected', async () => {
      // Arrange
      const userId = 'user123';
      const userData = JSON.stringify({
        username: 'juanperez',
        email: 'juan@example.com'
      });
      mockBlockchainService.isConnected.mockReturnValue(false);

      // Act & Assert
      await expect(service.registerUser(userId, userData)).rejects.toThrow('No hay conexión con la blockchain');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle blockchain errors properly', async () => {
      // Arrange
      const userId = 'user123';
      const userData = JSON.stringify({
        username: 'juanperez',
        email: 'juan@example.com'
      });
      const errorMessage = 'El usuario ya existe';
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.registerUser(userId, userData)).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('should return user information', async () => {
      // Arrange
      const userId = 'user123';
      const expectedUser = {
        id: userId,
        data: {
          username: 'juanperez',
          email: 'juan@example.com',
          nombre: 'Juan Pérez',
          rol: 'paciente'
        },
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        credentials: ['credential1', 'credential2']
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedUser)));

      // Act
      const result = await service.getUser(userId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'identity',
        'getUser',
        userId
      );
      expect(result).toEqual(expectedUser);
    });

    it('should throw error when user does not exist', async () => {
      // Arrange
      const userId = 'nonexistent';
      const errorMessage = 'Usuario no encontrado';
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.getUser(userId)).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user information successfully', async () => {
      // Arrange
      const userId = 'user123';
      const userData = JSON.stringify({
        email: 'juan.perez@example.com',
        telefono: '123456789'
      });
      const expectedUser = {
        id: userId,
        data: {
          username: 'juanperez',
          email: 'juan.perez@example.com',
          nombre: 'Juan Pérez',
          telefono: '123456789',
          rol: 'paciente'
        },
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-02-01T00:00:00Z',
        credentials: ['credential1', 'credential2']
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedUser)));

      // Act
      const result = await service.updateUser(userId, userData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'identity',
        'updateUser',
        userId,
        userData
      );
      expect(result).toEqual(expectedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const userId = 'user123';
      const expectedResult = {
        id: userId,
        status: 'deleted',
        deletedAt: '2023-02-15T00:00:00Z'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedResult)));

      // Act
      const result = await service.deleteUser(userId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'identity',
        'deleteUser',
        userId
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getUserByUsername', () => {
    it('should return user by username', async () => {
      // Arrange
      const username = 'juanperez';
      const expectedUser = {
        id: 'user123',
        data: {
          username: username,
          email: 'juan@example.com',
          nombre: 'Juan Pérez',
          rol: 'paciente'
        },
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedUser)));

      // Act
      const result = await service.getUserByUsername(username);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'identity',
        'getUserByUsername',
        username
      );
      expect(result).toEqual(expectedUser);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      // Arrange
      const email = 'juan@example.com';
      const expectedUser = {
        id: 'user123',
        data: {
          username: 'juanperez',
          email: email,
          nombre: 'Juan Pérez',
          rol: 'paciente'
        },
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedUser)));

      // Act
      const result = await service.getUserByEmail(email);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'identity',
        'getUserByEmail',
        email
      );
      expect(result).toEqual(expectedUser);
    });
  });

  describe('getUsers', () => {
    it('should return all users with pagination', async () => {
      // Arrange
      const limit = 10;
      const offset = 0;
      const expectedUsers = [
        {
          id: 'user123',
          data: {
            username: 'juanperez',
            email: 'juan@example.com',
            nombre: 'Juan Pérez',
            rol: 'paciente'
          },
          status: 'active'
        },
        {
          id: 'user456',
          data: {
            username: 'mariagomez',
            email: 'maria@example.com',
            nombre: 'María Gómez',
            rol: 'médico'
          },
          status: 'active'
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedUsers)));

      // Act
      const result = await service.getUsers(limit, offset);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'identity',
        'getUsers',
        limit.toString(),
        offset.toString()
      );
      expect(result).toEqual(expectedUsers);
    });

    it('should return all users without pagination', async () => {
      // Arrange
      const expectedUsers = [
        {
          id: 'user123',
          data: {
            username: 'juanperez',
            email: 'juan@example.com'
          },
          status: 'active'
        },
        {
          id: 'user456',
          data: {
            username: 'mariagomez',
            email: 'maria@example.com'
          },
          status: 'active'
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedUsers)));

      // Act
      const result = await service.getUsers();

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'identity',
        'getUsers',
        '',
        ''
      );
      expect(result).toEqual(expectedUsers);
    });
  });

  describe('registerCredential', () => {
    it('should register credential successfully', async () => {
      // Arrange
      const credentialId = 'credential123';
      const userId = 'user123';
      const issuer = 'hospital123';
      const credentialData = JSON.stringify({
        tipo: 'título médico',
        nombre: 'Licenciatura en Medicina',
        institución: 'Universidad Nacional',
        fecha: '2020-06-15'
      });
      const expectedCredential = {
        id: credentialId,
        userId: userId,
        issuer: issuer,
        data: JSON.parse(credentialData),
        issuedAt: '2023-02-15T00:00:00Z',
        expiresAt: '2028-02-15T00:00:00Z',
        status: 'valid',
        revoked: false
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedCredential)));

      // Act
      const result = await service.registerCredential(credentialId, userId, issuer, credentialData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'identity',
        'registerCredential',
        credentialId,
        userId,
        issuer,
        credentialData
      );
      expect(result).toEqual(expectedCredential);
    });
  });

  describe('getCredential', () => {
    it('should return credential information', async () => {
      // Arrange
      const credentialId = 'credential123';
      const expectedCredential = {
        id: credentialId,
        userId: 'user123',
        issuer: 'hospital123',
        data: {
          tipo: 'título médico',
          nombre: 'Licenciatura en Medicina',
          institución: 'Universidad Nacional',
          fecha: '2020-06-15'
        },
        issuedAt: '2023-02-15T00:00:00Z',
        expiresAt: '2028-02-15T00:00:00Z',
        status: 'valid',
        revoked: false
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedCredential)));

      // Act
      const result = await service.getCredential(credentialId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'identity',
        'getCredential',
        credentialId
      );
      expect(result).toEqual(expectedCredential);
    });
  });

  describe('revokeCredential', () => {
    it('should revoke credential successfully', async () => {
      // Arrange
      const credentialId = 'credential123';
      const revokerId = 'admin123';
      const reason = 'Información incorrecta';
      const expectedRevocation = {
        credentialId: credentialId,
        revokerId: revokerId,
        reason: reason,
        revokedAt: '2023-02-20T00:00:00Z',
        status: 'revoked'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedRevocation)));

      // Act
      const result = await service.revokeCredential(credentialId, revokerId, reason);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'identity',
        'revokeCredential',
        credentialId,
        revokerId,
        reason
      );
      expect(result).toEqual(expectedRevocation);
    });
  });

  describe('getUserCredentials', () => {
    it('should return user credentials', async () => {
      // Arrange
      const userId = 'user123';
      const expectedCredentials = [
        {
          id: 'credential123',
          userId: userId,
          issuer: 'hospital123',
          data: {
            tipo: 'título médico',
            nombre: 'Licenciatura en Medicina'
          },
          issuedAt: '2023-02-15T00:00:00Z',
          status: 'valid'
        },
        {
          id: 'credential456',
          userId: userId,
          issuer: 'colegio_medicos',
          data: {
            tipo: 'licencia médica',
            número: 'LM12345'
          },
          issuedAt: '2023-01-10T00:00:00Z',
          status: 'valid'
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedCredentials)));

      // Act
      const result = await service.getUserCredentials(userId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'identity',
        'getUserCredentials',
        userId
      );
      expect(result).toEqual(expectedCredentials);
    });
  });

  describe('verifyCredential', () => {
    it('should verify valid credential successfully', async () => {
      // Arrange
      const credentialId = 'credential123';
      const expectedVerification = {
        credentialId: credentialId,
        isValid: true,
        status: 'valid',
        issuer: 'hospital123',
        userId: 'user123',
        verifiedAt: '2023-02-25T00:00:00Z'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedVerification)));

      // Act
      const result = await service.verifyCredential(credentialId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'identity',
        'verifyCredential',
        credentialId
      );
      expect(result).toEqual(expectedVerification);
    });

    it('should verify revoked credential', async () => {
      // Arrange
      const credentialId = 'credential456';
      const expectedVerification = {
        credentialId: credentialId,
        isValid: false,
        status: 'revoked',
        issuer: 'hospital123',
        userId: 'user123',
        verifiedAt: '2023-02-25T00:00:00Z',
        revocationInfo: {
          revokedAt: '2023-02-20T00:00:00Z',
          reason: 'Información incorrecta'
        }
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedVerification)));

      // Act
      const result = await service.verifyCredential(credentialId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'identity',
        'verifyCredential',
        credentialId
      );
      expect(result).toEqual(expectedVerification);
    });
  });
});
