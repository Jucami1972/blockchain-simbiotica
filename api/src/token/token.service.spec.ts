import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';

describe('TokenService', () => {
  let service: TokenService;
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
        TokenService,
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

    service = module.get<TokenService>(TokenService);
    blockchainService = module.get<BlockchainService>(BlockchainService);

    // Restablecer los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBalance', () => {
    it('should return balance for a valid address', async () => {
      // Arrange
      const address = 'user123';
      const expectedBalance = { balance: 1000 };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedBalance)));

      // Act
      const result = await service.getBalance(address);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'token',
        'balanceOf',
        address
      );
      expect(result).toEqual({ address, balance: expectedBalance });
      expect(mockLogger.log).toHaveBeenCalledTimes(2);
    });

    it('should throw error when blockchain is not connected', async () => {
      // Arrange
      const address = 'user123';
      mockBlockchainService.isConnected.mockReturnValue(false);

      // Act & Assert
      await expect(service.getBalance(address)).rejects.toThrow('No hay conexión con la blockchain');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle blockchain errors properly', async () => {
      // Arrange
      const address = 'user123';
      const errorMessage = 'Blockchain error';
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.getBalance(address)).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getTotalSupply', () => {
    it('should return total supply', async () => {
      // Arrange
      const expectedTotalSupply = 1000000;
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedTotalSupply)));

      // Act
      const result = await service.getTotalSupply();

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'token',
        'totalSupply'
      );
      expect(result).toEqual({ totalSupply: expectedTotalSupply });
    });
  });

  describe('transfer', () => {
    it('should transfer tokens successfully', async () => {
      // Arrange
      const from = 'user1';
      const to = 'user2';
      const amount = '100';
      const expectedTransaction = { 
        from, 
        to, 
        amount: 100, 
        status: 'success',
        transactionId: 'tx123'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedTransaction)));

      // Act
      const result = await service.transfer(from, to, amount);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'token',
        'transfer',
        from,
        to,
        amount
      );
      expect(result).toEqual(expectedTransaction);
    });
  });

  describe('approve', () => {
    it('should approve tokens successfully', async () => {
      // Arrange
      const owner = 'user1';
      const spender = 'user2';
      const amount = '100';
      const expectedTransaction = { 
        owner, 
        spender, 
        amount: 100, 
        status: 'success',
        transactionId: 'tx123'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedTransaction)));

      // Act
      const result = await service.approve(owner, spender, amount);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'token',
        'approve',
        owner,
        spender,
        amount
      );
      expect(result).toEqual(expectedTransaction);
    });
  });

  describe('transferFrom', () => {
    it('should transfer tokens from another account successfully', async () => {
      // Arrange
      const spender = 'user1';
      const from = 'user2';
      const to = 'user3';
      const amount = '100';
      const expectedTransaction = { 
        spender,
        from, 
        to, 
        amount: 100, 
        status: 'success',
        transactionId: 'tx123'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedTransaction)));

      // Act
      const result = await service.transferFrom(spender, from, to, amount);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'token',
        'transferFrom',
        spender,
        from,
        to,
        amount
      );
      expect(result).toEqual(expectedTransaction);
    });
  });

  describe('getAllowance', () => {
    it('should return allowance for owner and spender', async () => {
      // Arrange
      const owner = 'user1';
      const spender = 'user2';
      const expectedAllowance = 500;
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedAllowance)));

      // Act
      const result = await service.getAllowance(owner, spender);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'token',
        'allowance',
        owner,
        spender
      );
      expect(result).toEqual({ owner, spender, allowance: expectedAllowance });
    });
  });

  describe('mint', () => {
    it('should mint tokens successfully when minting is enabled', async () => {
      // Arrange
      const to = 'user1';
      const amount = '1000';
      const expectedTransaction = { 
        to, 
        amount: 1000, 
        status: 'success',
        transactionId: 'tx123'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockConfigService.get.mockReturnValue(true); // mintingEnabled = true
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedTransaction)));

      // Act
      const result = await service.mint(to, amount);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockConfigService.get).toHaveBeenCalledWith('modules.token.mintingEnabled');
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'token',
        'mint',
        to,
        amount
      );
      expect(result).toEqual(expectedTransaction);
    });

    it('should throw error when minting is disabled', async () => {
      // Arrange
      const to = 'user1';
      const amount = '1000';
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockConfigService.get.mockReturnValue(false); // mintingEnabled = false

      // Act & Assert
      await expect(service.mint(to, amount)).rejects.toThrow('El minteo de tokens está deshabilitado');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('burn', () => {
    it('should burn tokens successfully when burning is enabled', async () => {
      // Arrange
      const from = 'user1';
      const amount = '500';
      const expectedTransaction = { 
        from, 
        amount: 500, 
        status: 'success',
        transactionId: 'tx123'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockConfigService.get.mockReturnValue(true); // burningEnabled = true
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedTransaction)));

      // Act
      const result = await service.burn(from, amount);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockConfigService.get).toHaveBeenCalledWith('modules.token.burningEnabled');
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'token',
        'burn',
        from,
        amount
      );
      expect(result).toEqual(expectedTransaction);
    });

    it('should throw error when burning is disabled', async () => {
      // Arrange
      const from = 'user1';
      const amount = '500';
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockConfigService.get.mockReturnValue(false); // burningEnabled = false

      // Act & Assert
      await expect(service.burn(from, amount)).rejects.toThrow('La quema de tokens está deshabilitada');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history for an address', async () => {
      // Arrange
      const address = 'user1';
      const expectedHistory = [
        { type: 'transfer', from: 'user2', to: 'user1', amount: 100, timestamp: '2023-01-01T00:00:00Z' },
        { type: 'transfer', from: 'user1', to: 'user3', amount: 50, timestamp: '2023-01-02T00:00:00Z' }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedHistory)));

      // Act
      const result = await service.getTransactionHistory(address);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'token',
        'getTransactionHistory',
        address
      );
      expect(result).toEqual({ address, transactions: expectedHistory });
    });
  });

  describe('getTokenInfo', () => {
    it('should return token information', async () => {
      // Arrange
      const expectedTokenInfo = {
        name: 'SIMB Token',
        symbol: 'SIMB',
        decimals: 18,
        totalSupply: 1000000,
        owner: 'admin'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedTokenInfo)));

      // Act
      const result = await service.getTokenInfo();

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'token',
        'getTokenInfo'
      );
      expect(result).toEqual(expectedTokenInfo);
    });
  });

  describe('lockTokens', () => {
    it('should lock tokens successfully', async () => {
      // Arrange
      const address = 'user1';
      const amount = '200';
      const reason = 'Staking';
      const expectedTransaction = { 
        address, 
        amount: 200, 
        reason,
        status: 'success',
        transactionId: 'tx123'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedTransaction)));

      // Act
      const result = await service.lockTokens(address, amount, reason);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'token',
        'lockTokens',
        address,
        amount,
        reason
      );
      expect(result).toEqual(expectedTransaction);
    });
  });

  describe('unlockTokens', () => {
    it('should unlock tokens successfully', async () => {
      // Arrange
      const address = 'user1';
      const amount = '100';
      const expectedTransaction = { 
        address, 
        amount: 100, 
        status: 'success',
        transactionId: 'tx123'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedTransaction)));

      // Act
      const result = await service.unlockTokens(address, amount);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'token',
        'unlockTokens',
        address,
        amount
      );
      expect(result).toEqual(expectedTransaction);
    });
  });

  describe('getLockedTokens', () => {
    it('should return locked tokens for an address', async () => {
      // Arrange
      const address = 'user1';
      const expectedLockedTokens = {
        total: 300,
        locks: [
          { amount: 200, reason: 'Staking', lockedAt: '2023-01-01T00:00:00Z' },
          { amount: 100, reason: 'Governance', lockedAt: '2023-01-02T00:00:00Z' }
        ]
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedLockedTokens)));

      // Act
      const result = await service.getLockedTokens(address);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'token',
        'getLockedTokens',
        address
      );
      expect(result).toEqual({ address, lockedTokens: expectedLockedTokens });
    });
  });
});
