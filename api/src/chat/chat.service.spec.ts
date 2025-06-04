import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';

describe('ChatService', () => {
  let service: ChatService;
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
        ChatService,
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

    service = module.get<ChatService>(ChatService);
    blockchainService = module.get<BlockchainService>(BlockchainService);

    // Restablecer los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createChannel', () => {
    it('should create a channel successfully', async () => {
      // Arrange
      const channelType = 'direct';
      const participants = JSON.stringify(['user123', 'user456']);
      const metadata = JSON.stringify({
        name: 'Chat Privado',
        icon: 'chat-icon',
        encrypted: true
      });
      const expectedChannel = {
        id: 'channel123',
        type: channelType,
        participants: ['user123', 'user456'],
        metadata: JSON.parse(metadata),
        createdAt: '2023-01-01T00:00:00Z',
        createdBy: 'user123',
        updatedAt: '2023-01-01T00:00:00Z',
        messages: []
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedChannel)));

      // Act
      const result = await service.createChannel(channelType, participants, metadata);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'chat',
        'createChannel',
        channelType,
        participants,
        metadata
      );
      expect(result).toEqual(expectedChannel);
      expect(mockLogger.log).toHaveBeenCalledTimes(2);
    });

    it('should create a channel without metadata', async () => {
      // Arrange
      const channelType = 'direct';
      const participants = JSON.stringify(['user123', 'user456']);
      const expectedChannel = {
        id: 'channel123',
        type: channelType,
        participants: ['user123', 'user456'],
        metadata: {},
        createdAt: '2023-01-01T00:00:00Z',
        createdBy: 'user123',
        updatedAt: '2023-01-01T00:00:00Z',
        messages: []
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedChannel)));

      // Act
      const result = await service.createChannel(channelType, participants);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'chat',
        'createChannel',
        channelType,
        participants,
        ''
      );
      expect(result).toEqual(expectedChannel);
    });

    it('should throw error when blockchain is not connected', async () => {
      // Arrange
      const channelType = 'direct';
      const participants = JSON.stringify(['user123', 'user456']);
      mockBlockchainService.isConnected.mockReturnValue(false);

      // Act & Assert
      await expect(service.createChannel(channelType, participants)).rejects.toThrow('No hay conexión con la blockchain');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      // Arrange
      const channelId = 'channel123';
      const messageType = 'text';
      const content = 'Hola, ¿cómo estás?';
      const metadata = JSON.stringify({
        encrypted: true,
        encryptionKey: 'abc123'
      });
      const expectedMessage = {
        id: 'message123',
        channelId: channelId,
        type: messageType,
        content: content,
        metadata: JSON.parse(metadata),
        sender: 'user123',
        timestamp: '2023-01-01T12:00:00Z',
        readBy: ['user123'],
        status: 'sent'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedMessage)));

      // Act
      const result = await service.sendMessage(channelId, messageType, content, metadata);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'chat',
        'sendMessage',
        channelId,
        messageType,
        content,
        metadata
      );
      expect(result).toEqual(expectedMessage);
    });

    it('should send a message without metadata', async () => {
      // Arrange
      const channelId = 'channel123';
      const messageType = 'text';
      const content = 'Hola, ¿cómo estás?';
      const expectedMessage = {
        id: 'message123',
        channelId: channelId,
        type: messageType,
        content: content,
        metadata: {},
        sender: 'user123',
        timestamp: '2023-01-01T12:00:00Z',
        readBy: ['user123'],
        status: 'sent'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedMessage)));

      // Act
      const result = await service.sendMessage(channelId, messageType, content);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'chat',
        'sendMessage',
        channelId,
        messageType,
        content,
        ''
      );
      expect(result).toEqual(expectedMessage);
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read successfully', async () => {
      // Arrange
      const messageId = 'message123';
      const expectedMessage = {
        id: messageId,
        channelId: 'channel123',
        type: 'text',
        content: 'Hola, ¿cómo estás?',
        sender: 'user123',
        timestamp: '2023-01-01T12:00:00Z',
        readBy: ['user123', 'user456'],
        readAt: {
          'user123': '2023-01-01T12:00:00Z',
          'user456': '2023-01-01T12:05:00Z'
        },
        status: 'read'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedMessage)));

      // Act
      const result = await service.markAsRead(messageId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'chat',
        'markAsRead',
        messageId
      );
      expect(result).toEqual(expectedMessage);
    });
  });

  describe('editMessage', () => {
    it('should edit message successfully', async () => {
      // Arrange
      const messageId = 'message123';
      const newContent = 'Hola, ¿cómo estás? (editado)';
      const expectedMessage = {
        id: messageId,
        channelId: 'channel123',
        type: 'text',
        content: newContent,
        originalContent: 'Hola, ¿cómo estás?',
        sender: 'user123',
        timestamp: '2023-01-01T12:00:00Z',
        editedAt: '2023-01-01T12:10:00Z',
        readBy: ['user123'],
        status: 'edited'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedMessage)));

      // Act
      const result = await service.editMessage(messageId, newContent);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'chat',
        'editMessage',
        messageId,
        newContent
      );
      expect(result).toEqual(expectedMessage);
    });
  });

  describe('deleteMessage', () => {
    it('should delete message successfully', async () => {
      // Arrange
      const messageId = 'message123';
      const expectedMessage = {
        id: messageId,
        channelId: 'channel123',
        status: 'deleted',
        deletedAt: '2023-01-01T12:15:00Z',
        deletedBy: 'user123'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedMessage)));

      // Act
      const result = await service.deleteMessage(messageId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'chat',
        'deleteMessage',
        messageId
      );
      expect(result).toEqual(expectedMessage);
    });
  });

  describe('addParticipant', () => {
    it('should add participant to channel successfully', async () => {
      // Arrange
      const channelId = 'channel123';
      const participantId = 'user789';
      const expectedChannel = {
        id: channelId,
        type: 'group',
        participants: ['user123', 'user456', 'user789'],
        metadata: {
          name: 'Grupo de Trabajo',
          icon: 'group-icon'
        },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedChannel)));

      // Act
      const result = await service.addParticipant(channelId, participantId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'chat',
        'addParticipant',
        channelId,
        participantId
      );
      expect(result).toEqual(expectedChannel);
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant from channel successfully', async () => {
      // Arrange
      const channelId = 'channel123';
      const participantId = 'user456';
      const expectedChannel = {
        id: channelId,
        type: 'group',
        participants: ['user123', 'user789'],
        metadata: {
          name: 'Grupo de Trabajo',
          icon: 'group-icon'
        },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-03T00:00:00Z'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedChannel)));

      // Act
      const result = await service.removeParticipant(channelId, participantId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'chat',
        'removeParticipant',
        channelId,
        participantId
      );
      expect(result).toEqual(expectedChannel);
    });
  });

  describe('getChannel', () => {
    it('should return channel information', async () => {
      // Arrange
      const channelId = 'channel123';
      const expectedChannel = {
        id: channelId,
        type: 'group',
        participants: ['user123', 'user456', 'user789'],
        metadata: {
          name: 'Grupo de Trabajo',
          icon: 'group-icon'
        },
        createdAt: '2023-01-01T00:00:00Z',
        createdBy: 'user123',
        updatedAt: '2023-01-03T00:00:00Z',
        messageCount: 25,
        lastMessageAt: '2023-01-03T12:00:00Z'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedChannel)));

      // Act
      const result = await service.getChannel(channelId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'chat',
        'getChannel',
        channelId
      );
      expect(result).toEqual(expectedChannel);
    });
  });

  describe('getChannelMessages', () => {
    it('should return channel messages with pagination', async () => {
      // Arrange
      const channelId = 'channel123';
      const limit = 10;
      const offset = 0;
      const expectedMessages = [
        {
          id: 'message123',
          channelId: channelId,
          type: 'text',
          content: 'Hola a todos',
          sender: 'user123',
          timestamp: '2023-01-01T12:00:00Z',
          readBy: ['user123', 'user456']
        },
        {
          id: 'message124',
          channelId: channelId,
          type: 'text',
          content: 'Hola, ¿cómo están?',
          sender: 'user456',
          timestamp: '2023-01-01T12:05:00Z',
          readBy: ['user123', 'user456', 'user789']
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedMessages)));

      // Act
      const result = await service.getChannelMessages(channelId, limit, offset);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'chat',
        'getChannelMessages',
        channelId,
        limit.toString(),
        offset.toString()
      );
      expect(result).toEqual(expectedMessages);
    });

    it('should return channel messages without pagination', async () => {
      // Arrange
      const channelId = 'channel123';
      const expectedMessages = [
        {
          id: 'message123',
          channelId: channelId,
          type: 'text',
          content: 'Hola a todos',
          sender: 'user123',
          timestamp: '2023-01-01T12:00:00Z'
        },
        {
          id: 'message124',
          channelId: channelId,
          type: 'text',
          content: 'Hola, ¿cómo están?',
          sender: 'user456',
          timestamp: '2023-01-01T12:05:00Z'
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedMessages)));

      // Act
      const result = await service.getChannelMessages(channelId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'chat',
        'getChannelMessages',
        channelId,
        '',
        ''
      );
      expect(result).toEqual(expectedMessages);
    });
  });

  describe('getUserChannels', () => {
    it('should return user channels', async () => {
      // Arrange
      const userId = 'user123';
      const expectedChannels = [
        {
          id: 'channel123',
          type: 'direct',
          participants: ['user123', 'user456'],
          metadata: {
            name: 'Chat Privado'
          },
          lastMessage: {
            content: 'Hola, ¿cómo estás?',
            sender: 'user456',
            timestamp: '2023-01-01T12:05:00Z'
          },
          unreadCount: 0
        },
        {
          id: 'channel456',
          type: 'group',
          participants: ['user123', 'user456', 'user789'],
          metadata: {
            name: 'Grupo de Trabajo',
            icon: 'group-icon'
          },
          lastMessage: {
            content: 'Reunión mañana a las 10',
            sender: 'user789',
            timestamp: '2023-01-02T09:00:00Z'
          },
          unreadCount: 2
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedChannels)));

      // Act
      const result = await service.getUserChannels(userId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'chat',
        'getUserChannels',
        userId
      );
      expect(result).toEqual(expectedChannels);
    });
  });

  describe('getMessage', () => {
    it('should return message information', async () => {
      // Arrange
      const messageId = 'message123';
      const expectedMessage = {
        id: messageId,
        channelId: 'channel123',
        type: 'text',
        content: 'Hola a todos',
        sender: 'user123',
        timestamp: '2023-01-01T12:00:00Z',
        readBy: ['user123', 'user456', 'user789'],
        readAt: {
          'user123': '2023-01-01T12:00:00Z',
          'user456': '2023-01-01T12:01:00Z',
          'user789': '2023-01-01T12:03:00Z'
        },
        status: 'read'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedMessage)));

      // Act
      const result = await service.getMessage(messageId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'chat',
        'getMessage',
        messageId
      );
      expect(result).toEqual(expectedMessage);
    });
  });
});
