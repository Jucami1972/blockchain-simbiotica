import { Test, TestingModule } from '@nestjs/testing';
import { AchievexService } from './achievex.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';

describe('AchievexService', () => {
  let service: AchievexService;
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
        AchievexService,
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

    service = module.get<AchievexService>(AchievexService);
    blockchainService = module.get<BlockchainService>(BlockchainService);

    // Restablecer los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCategory', () => {
    it('should create a category successfully', async () => {
      // Arrange
      const categoryId = 'category123';
      const categoryData = JSON.stringify({
        name: 'Salud',
        description: 'Logros relacionados con hábitos saludables',
        icon: 'health-icon',
        color: '#3498db'
      });
      const expectedCategory = {
        id: categoryId,
        name: 'Salud',
        description: 'Logros relacionados con hábitos saludables',
        icon: 'health-icon',
        color: '#3498db',
        createdAt: '2023-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedAt: '2023-01-01T00:00:00Z',
        achievements: []
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedCategory)));

      // Act
      const result = await service.createCategory(categoryId, categoryData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'achievex',
        'createCategory',
        categoryId,
        categoryData
      );
      expect(result).toEqual(expectedCategory);
      expect(mockLogger.log).toHaveBeenCalledTimes(2);
    });

    it('should throw error when blockchain is not connected', async () => {
      // Arrange
      const categoryId = 'category123';
      const categoryData = JSON.stringify({
        name: 'Salud',
        description: 'Logros relacionados con hábitos saludables'
      });
      mockBlockchainService.isConnected.mockReturnValue(false);

      // Act & Assert
      await expect(service.createCategory(categoryId, categoryData)).rejects.toThrow('No hay conexión con la blockchain');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle blockchain errors properly', async () => {
      // Arrange
      const categoryId = 'category123';
      const categoryData = JSON.stringify({
        name: 'Salud',
        description: 'Logros relacionados con hábitos saludables'
      });
      const errorMessage = 'La categoría ya existe';
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.createCategory(categoryId, categoryData)).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('createAchievement', () => {
    it('should create an achievement successfully', async () => {
      // Arrange
      const achievementId = 'achievement123';
      const categoryId = 'category123';
      const achievementData = JSON.stringify({
        name: 'Caminante Activo',
        description: '10,000 pasos diarios durante una semana',
        criteria: 'Registrar 10,000 pasos diarios durante 7 días consecutivos',
        icon: 'walking-icon',
        badge: 'caminante-activo',
        points: 100,
        difficulty: 'medium'
      });
      const expectedAchievement = {
        id: achievementId,
        categoryId: categoryId,
        name: 'Caminante Activo',
        description: '10,000 pasos diarios durante una semana',
        criteria: 'Registrar 10,000 pasos diarios durante 7 días consecutivos',
        icon: 'walking-icon',
        badge: 'caminante-activo',
        points: 100,
        tokenReward: 0,
        nftReward: null,
        difficulty: 'medium',
        createdAt: '2023-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedAt: '2023-01-01T00:00:00Z',
        active: true
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedAchievement)));

      // Act
      const result = await service.createAchievement(achievementId, categoryId, achievementData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'achievex',
        'createAchievement',
        achievementId,
        categoryId,
        achievementData
      );
      expect(result).toEqual(expectedAchievement);
    });
  });

  describe('awardAchievement', () => {
    it('should award achievement to user successfully', async () => {
      // Arrange
      const userId = 'user123';
      const achievementId = 'achievement123';
      const evidence = JSON.stringify({
        steps: [10500, 11200, 10800, 12000, 10300, 10700, 11500],
        dates: ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05', '2023-01-06', '2023-01-07']
      });
      const expectedUserAchievement = {
        userId: userId,
        achievementId: achievementId,
        categoryId: 'category123',
        awardedAt: '2023-01-08T00:00:00Z',
        awardedBy: 'system',
        evidence: JSON.parse(evidence),
        points: 100,
        tokenReward: 10,
        nftReward: {
          id: 'nft_user123_achievement123_1672876800000',
          metadata: {
            name: 'Caminante Activo',
            description: 'Logro obtenido por mantener 10,000 pasos diarios durante una semana',
            image: 'ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/caminante-activo.png'
          }
        }
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedUserAchievement)));

      // Act
      const result = await service.awardAchievement(userId, achievementId, evidence);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'achievex',
        'awardAchievement',
        userId,
        achievementId,
        evidence
      );
      expect(result).toEqual(expectedUserAchievement);
    });

    it('should award achievement without evidence', async () => {
      // Arrange
      const userId = 'user123';
      const achievementId = 'achievement123';
      const expectedUserAchievement = {
        userId: userId,
        achievementId: achievementId,
        categoryId: 'category123',
        awardedAt: '2023-01-08T00:00:00Z',
        awardedBy: 'system',
        evidence: {},
        points: 100,
        tokenReward: 10,
        nftReward: null
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedUserAchievement)));

      // Act
      const result = await service.awardAchievement(userId, achievementId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'achievex',
        'awardAchievement',
        userId,
        achievementId,
        ''
      );
      expect(result).toEqual(expectedUserAchievement);
    });

    it('should throw error when user already has achievement', async () => {
      // Arrange
      const userId = 'user123';
      const achievementId = 'achievement123';
      const errorMessage = 'El usuario ya tiene el logro';
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.awardAchievement(userId, achievementId)).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('updateAchievement', () => {
    it('should update achievement successfully', async () => {
      // Arrange
      const achievementId = 'achievement123';
      const achievementData = JSON.stringify({
        description: 'Caminar 10,000 pasos diarios durante una semana completa',
        points: 150,
        active: true
      });
      const expectedAchievement = {
        id: achievementId,
        categoryId: 'category123',
        name: 'Caminante Activo',
        description: 'Caminar 10,000 pasos diarios durante una semana completa',
        criteria: 'Registrar 10,000 pasos diarios durante 7 días consecutivos',
        icon: 'walking-icon',
        badge: 'caminante-activo',
        points: 150,
        tokenReward: 0,
        nftReward: null,
        difficulty: 'medium',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-10T00:00:00Z',
        active: true
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedAchievement)));

      // Act
      const result = await service.updateAchievement(achievementId, achievementData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'achievex',
        'updateAchievement',
        achievementId,
        achievementData
      );
      expect(result).toEqual(expectedAchievement);
    });
  });

  describe('getCategory', () => {
    it('should return category information', async () => {
      // Arrange
      const categoryId = 'category123';
      const expectedCategory = {
        id: categoryId,
        name: 'Salud',
        description: 'Logros relacionados con hábitos saludables',
        icon: 'health-icon',
        color: '#3498db',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        achievements: ['achievement123', 'achievement456']
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedCategory)));

      // Act
      const result = await service.getCategory(categoryId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'achievex',
        'getCategory',
        categoryId
      );
      expect(result).toEqual(expectedCategory);
    });
  });

  describe('getAchievement', () => {
    it('should return achievement information', async () => {
      // Arrange
      const achievementId = 'achievement123';
      const expectedAchievement = {
        id: achievementId,
        categoryId: 'category123',
        name: 'Caminante Activo',
        description: '10,000 pasos diarios durante una semana',
        criteria: 'Registrar 10,000 pasos diarios durante 7 días consecutivos',
        icon: 'walking-icon',
        badge: 'caminante-activo',
        points: 100,
        tokenReward: 0,
        nftReward: null,
        difficulty: 'medium',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        active: true
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedAchievement)));

      // Act
      const result = await service.getAchievement(achievementId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'achievex',
        'getAchievement',
        achievementId
      );
      expect(result).toEqual(expectedAchievement);
    });
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      // Arrange
      const expectedCategories = [
        {
          id: 'category123',
          name: 'Salud',
          description: 'Logros relacionados con hábitos saludables',
          icon: 'health-icon',
          color: '#3498db'
        },
        {
          id: 'category456',
          name: 'Educación',
          description: 'Logros relacionados con aprendizaje',
          icon: 'education-icon',
          color: '#2ecc71'
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedCategories)));

      // Act
      const result = await service.getAllCategories();

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'achievex',
        'getAllCategories'
      );
      expect(result).toEqual(expectedCategories);
    });
  });

  describe('getCategoryAchievements', () => {
    it('should return achievements for a category', async () => {
      // Arrange
      const categoryId = 'category123';
      const expectedAchievements = [
        {
          id: 'achievement123',
          name: 'Caminante Activo',
          description: '10,000 pasos diarios durante una semana',
          points: 100,
          difficulty: 'medium'
        },
        {
          id: 'achievement456',
          name: 'Maratonista',
          description: 'Completar una maratón',
          points: 500,
          difficulty: 'hard'
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedAchievements)));

      // Act
      const result = await service.getCategoryAchievements(categoryId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'achievex',
        'getCategoryAchievements',
        categoryId
      );
      expect(result).toEqual(expectedAchievements);
    });
  });

  describe('getUserProfile', () => {
    it('should return user achievement profile', async () => {
      // Arrange
      const userId = 'user123';
      const expectedProfile = {
        userId: userId,
        totalPoints: 250,
        totalTokens: 25,
        achievements: ['achievement123', 'achievement789'],
        badges: ['caminante-activo', 'lector-avido'],
        nfts: ['nft_user123_achievement123_1672876800000'],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-15T00:00:00Z'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedProfile)));

      // Act
      const result = await service.getUserProfile(userId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'achievex',
        'getUserProfile',
        userId
      );
      expect(result).toEqual(expectedProfile);
    });
  });

  describe('getUserAchievements', () => {
    it('should return achievements for a user', async () => {
      // Arrange
      const userId = 'user123';
      const expectedAchievements = [
        {
          achievementId: 'achievement123',
          categoryId: 'category123',
          name: 'Caminante Activo',
          description: '10,000 pasos diarios durante una semana',
          awardedAt: '2023-01-08T00:00:00Z',
          points: 100
        },
        {
          achievementId: 'achievement789',
          categoryId: 'category456',
          name: 'Lector Ávido',
          description: 'Leer 10 libros en un mes',
          awardedAt: '2023-01-15T00:00:00Z',
          points: 150
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedAchievements)));

      // Act
      const result = await service.getUserAchievements(userId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'achievex',
        'getUserAchievements',
        userId
      );
      expect(result).toEqual(expectedAchievements);
    });
  });

  describe('hasAchievement', () => {
    it('should return true when user has achievement', async () => {
      // Arrange
      const userId = 'user123';
      const achievementId = 'achievement123';
      const expectedResult = true;
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedResult)));

      // Act
      const result = await service.hasAchievement(userId, achievementId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'achievex',
        'hasAchievement',
        userId,
        achievementId
      );
      expect(result).toEqual({ userId, achievementId, hasAchievement: expectedResult });
    });

    it('should return false when user does not have achievement', async () => {
      // Arrange
      const userId = 'user123';
      const achievementId = 'achievement456';
      const expectedResult = false;
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedResult)));

      // Act
      const result = await service.hasAchievement(userId, achievementId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'achievex',
        'hasAchievement',
        userId,
        achievementId
      );
      expect(result).toEqual({ userId, achievementId, hasAchievement: expectedResult });
    });
  });

  describe('getAchievementStats', () => {
    it('should return achievement statistics', async () => {
      // Arrange
      const expectedStats = {
        totalAchievements: 50,
        totalCategories: 5,
        totalAwarded: 1250,
        topAchievements: [
          { id: 'achievement123', name: 'Caminante Activo', awardCount: 320 },
          { id: 'achievement456', name: 'Maratonista', awardCount: 45 }
        ],
        topUsers: [
          { id: 'user123', name: 'Juan Pérez', achievementCount: 25 },
          { id: 'user456', name: 'María Gómez', achievementCount: 22 }
        ],
        categoryDistribution: {
          'category123': 15,
          'category456': 12,
          'category789': 23
        }
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedStats)));

      // Act
      const result = await service.getAchievementStats();

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'achievex',
        'getAchievementStats'
      );
      expect(result).toEqual(expectedStats);
    });
  });
});
