import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainService } from './blockchain.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';
import * as FabricCAServices from 'fabric-ca-client';
import { Gateway, Wallets, Contract, Network } from 'fabric-network';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fabric-ca-client');
jest.mock('fabric-network');

describe('BlockchainService', () => {
  let service: BlockchainService;
  let configService: ConfigService;
  let logger: Logger;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockGateway = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    getNetwork: jest.fn(),
  };

  const mockNetwork = {
    getContract: jest.fn(),
  };

  const mockContract = {
    submitTransaction: jest.fn(),
    evaluateTransaction: jest.fn(),
  };

  const mockWallet = {
    put: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Configurar mocks
    (Gateway as jest.Mock).mockImplementation(() => mockGateway);
    (Wallets.newFileSystemWallet as jest.Mock).mockResolvedValue(mockWallet);
    mockGateway.getNetwork.mockResolvedValue(mockNetwork);
    mockNetwork.getContract.mockReturnValue(mockContract);

    // Configurar valores de configuración
    mockConfigService.get.mockImplementation((key) => {
      const config = {
        'blockchain.connectionProfilePath': '/path/to/connection-profile.json',
        'blockchain.walletPath': '/path/to/wallet',
        'blockchain.orgMSP': 'Org1MSP',
        'blockchain.channelName': 'simbioticachannel',
        'blockchain.caUrl': 'https://ca.org1.blockchain-simbiotica.com:7054',
      };
      return config[key];
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
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

    service = module.get<BlockchainService>(BlockchainService);
    configService = module.get<ConfigService>(ConfigService);
    logger = module.get<Logger>(Logger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('connect', () => {
    beforeEach(() => {
      // Mock para fs.readFileSync
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => 
        JSON.stringify({
          organizations: {
            Org1MSP: {
              mspid: 'Org1MSP',
              peers: ['peer0.org1.blockchain-simbiotica.com'],
            },
          },
        })
      );
      
      // Mock para path.resolve
      jest.spyOn(path, 'resolve').mockReturnValue('/resolved/path');
      
      // Mock para wallet.get
      mockWallet.get.mockResolvedValue({
        type: 'X.509',
        credentials: {
          certificate: 'certificate',
          privateKey: 'privateKey',
        },
      });
    });

    it('should connect to the blockchain network successfully', async () => {
      // Arrange
      const userId = 'admin';
      
      // Act
      await service.connect(userId);
      
      // Assert
      expect(Wallets.newFileSystemWallet).toHaveBeenCalledWith('/path/to/wallet');
      expect(mockWallet.get).toHaveBeenCalledWith(userId);
      expect(mockGateway.connect).toHaveBeenCalled();
      expect(mockGateway.getNetwork).toHaveBeenCalledWith('simbioticachannel');
      expect(logger.log).toHaveBeenCalledWith(`Conectado a la red blockchain como ${userId}`);
    });

    it('should throw an error if user identity is not found', async () => {
      // Arrange
      const userId = 'nonexistent';
      mockWallet.get.mockResolvedValue(undefined);
      
      // Act & Assert
      await expect(service.connect(userId)).rejects.toThrow(`Identidad ${userId} no encontrada en el wallet`);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should throw an error if connection fails', async () => {
      // Arrange
      const userId = 'admin';
      const errorMessage = 'Connection error';
      mockGateway.connect.mockRejectedValue(new Error(errorMessage));
      
      // Act & Assert
      await expect(service.connect(userId)).rejects.toThrow(errorMessage);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect from the blockchain network', () => {
      // Act
      service.disconnect();
      
      // Assert
      expect(mockGateway.disconnect).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('Desconectado de la red blockchain');
    });
  });

  describe('isConnected', () => {
    it('should return true when connected', () => {
      // Arrange
      service['network'] = mockNetwork as unknown as Network;
      
      // Act
      const result = service.isConnected();
      
      // Assert
      expect(result).toBe(true);
    });

    it('should return false when not connected', () => {
      // Arrange
      service['network'] = null;
      
      // Act
      const result = service.isConnected();
      
      // Assert
      expect(result).toBe(false);
    });
  });

  describe('submitTransaction', () => {
    beforeEach(() => {
      service['network'] = mockNetwork as unknown as Network;
    });

    it('should submit transaction successfully', async () => {
      // Arrange
      const chaincodeName = 'token';
      const functionName = 'transfer';
      const args = ['recipient', '100'];
      const expectedResult = Buffer.from('{"success":true}');
      mockContract.submitTransaction.mockResolvedValue(expectedResult);
      
      // Act
      const result = await service.submitTransaction(chaincodeName, functionName, ...args);
      
      // Assert
      expect(mockNetwork.getContract).toHaveBeenCalledWith(chaincodeName);
      expect(mockContract.submitTransaction).toHaveBeenCalledWith(functionName, ...args);
      expect(result).toEqual(expectedResult);
      expect(logger.log).toHaveBeenCalledWith(`Transacción enviada: ${chaincodeName} - ${functionName}`);
    });

    it('should throw an error if not connected', async () => {
      // Arrange
      service['network'] = null;
      const chaincodeName = 'token';
      const functionName = 'transfer';
      const args = ['recipient', '100'];
      
      // Act & Assert
      await expect(service.submitTransaction(chaincodeName, functionName, ...args)).rejects.toThrow('No hay conexión con la blockchain');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should throw an error if transaction fails', async () => {
      // Arrange
      const chaincodeName = 'token';
      const functionName = 'transfer';
      const args = ['recipient', '100'];
      const errorMessage = 'Transaction error';
      mockContract.submitTransaction.mockRejectedValue(new Error(errorMessage));
      
      // Act & Assert
      await expect(service.submitTransaction(chaincodeName, functionName, ...args)).rejects.toThrow(errorMessage);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('evaluateTransaction', () => {
    beforeEach(() => {
      service['network'] = mockNetwork as unknown as Network;
    });

    it('should evaluate transaction successfully', async () => {
      // Arrange
      const chaincodeName = 'token';
      const functionName = 'balanceOf';
      const args = ['user123'];
      const expectedResult = Buffer.from('{"balance":"500"}');
      mockContract.evaluateTransaction.mockResolvedValue(expectedResult);
      
      // Act
      const result = await service.evaluateTransaction(chaincodeName, functionName, ...args);
      
      // Assert
      expect(mockNetwork.getContract).toHaveBeenCalledWith(chaincodeName);
      expect(mockContract.evaluateTransaction).toHaveBeenCalledWith(functionName, ...args);
      expect(result).toEqual(expectedResult);
      expect(logger.log).toHaveBeenCalledWith(`Transacción evaluada: ${chaincodeName} - ${functionName}`);
    });

    it('should throw an error if not connected', async () => {
      // Arrange
      service['network'] = null;
      const chaincodeName = 'token';
      const functionName = 'balanceOf';
      const args = ['user123'];
      
      // Act & Assert
      await expect(service.evaluateTransaction(chaincodeName, functionName, ...args)).rejects.toThrow('No hay conexión con la blockchain');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should throw an error if evaluation fails', async () => {
      // Arrange
      const chaincodeName = 'token';
      const functionName = 'balanceOf';
      const args = ['user123'];
      const errorMessage = 'Evaluation error';
      mockContract.evaluateTransaction.mockRejectedValue(new Error(errorMessage));
      
      // Act & Assert
      await expect(service.evaluateTransaction(chaincodeName, functionName, ...args)).rejects.toThrow(errorMessage);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('registerUser', () => {
    let mockCaClient;
    let mockIdentity;
    
    beforeEach(() => {
      mockCaClient = {
        register: jest.fn(),
        enroll: jest.fn(),
      };
      
      mockIdentity = {
        credentials: {
          certificate: 'certificate',
          privateKey: 'privateKey',
        },
      };
      
      (FabricCAServices as jest.Mock).mockImplementation(() => ({
        newIdentityService: jest.fn().mockReturnValue({
          getAll: jest.fn(),
          create: jest.fn(),
        }),
      }));
      
      jest.spyOn(service as any, 'getCaClient').mockReturnValue(mockCaClient);
      mockCaClient.register.mockResolvedValue('enrollmentSecret');
      mockCaClient.enroll.mockResolvedValue(mockIdentity);
    });

    it('should register and enroll a new user successfully', async () => {
      // Arrange
      const userId = 'newUser';
      const userRole = 'client';
      const adminId = 'admin';
      
      // Mock para wallet.get para el admin
      mockWallet.get.mockResolvedValue({
        type: 'X.509',
        credentials: {
          certificate: 'adminCertificate',
          privateKey: 'adminPrivateKey',
        },
      });
      
      // Act
      await service.registerUser(userId, userRole, adminId);
      
      // Assert
      expect(mockWallet.get).toHaveBeenCalledWith(adminId);
      expect(mockCaClient.register).toHaveBeenCalled();
      expect(mockCaClient.enroll).toHaveBeenCalled();
      expect(mockWallet.put).toHaveBeenCalledWith(userId, expect.any(Object));
      expect(logger.log).toHaveBeenCalledWith(`Usuario ${userId} registrado y enrollado correctamente`);
    });

    it('should throw an error if admin identity is not found', async () => {
      // Arrange
      const userId = 'newUser';
      const userRole = 'client';
      const adminId = 'nonexistentAdmin';
      
      // Mock para wallet.get para el admin
      mockWallet.get.mockResolvedValue(undefined);
      
      // Act & Assert
      await expect(service.registerUser(userId, userRole, adminId)).rejects.toThrow(`Identidad de administrador ${adminId} no encontrada en el wallet`);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should throw an error if registration fails', async () => {
      // Arrange
      const userId = 'newUser';
      const userRole = 'client';
      const adminId = 'admin';
      const errorMessage = 'Registration error';
      
      // Mock para wallet.get para el admin
      mockWallet.get.mockResolvedValue({
        type: 'X.509',
        credentials: {
          certificate: 'adminCertificate',
          privateKey: 'adminPrivateKey',
        },
      });
      
      mockCaClient.register.mockRejectedValue(new Error(errorMessage));
      
      // Act & Assert
      await expect(service.registerUser(userId, userRole, adminId)).rejects.toThrow(errorMessage);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('enrollAdmin', () => {
    let mockCaClient;
    let mockIdentity;
    
    beforeEach(() => {
      mockCaClient = {
        enroll: jest.fn(),
      };
      
      mockIdentity = {
        credentials: {
          certificate: 'certificate',
          privateKey: 'privateKey',
        },
      };
      
      jest.spyOn(service as any, 'getCaClient').mockReturnValue(mockCaClient);
      mockCaClient.enroll.mockResolvedValue(mockIdentity);
    });

    it('should enroll admin successfully', async () => {
      // Arrange
      const adminId = 'admin';
      const adminSecret = 'adminpw';
      
      // Act
      await service.enrollAdmin(adminId, adminSecret);
      
      // Assert
      expect(mockCaClient.enroll).toHaveBeenCalledWith({ enrollmentID: adminId, enrollmentSecret: adminSecret });
      expect(mockWallet.put).toHaveBeenCalledWith(adminId, expect.any(Object));
      expect(logger.log).toHaveBeenCalledWith(`Administrador ${adminId} enrollado correctamente`);
    });

    it('should throw an error if enrollment fails', async () => {
      // Arrange
      const adminId = 'admin';
      const adminSecret = 'adminpw';
      const errorMessage = 'Enrollment error';
      
      mockCaClient.enroll.mockRejectedValue(new Error(errorMessage));
      
      // Act & Assert
      await expect(service.enrollAdmin(adminId, adminSecret)).rejects.toThrow(errorMessage);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
