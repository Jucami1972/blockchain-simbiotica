export default () => ({
  // Configuración general de la aplicación
  app: {
    name: 'Blockchain Simbiótica API',
    port: parseInt(process.env.PORT, 10) || 3000,
    environment: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    cors: {
      enabled: process.env.CORS_ENABLED === 'true',
      origin: process.env.CORS_ORIGIN || '*',
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'blockchain-simbiotica-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutos
      max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // límite de 100 solicitudes por ventana
    },
  },
  
  // Configuración de la base de datos
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/blockchain-simbiotica',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  
  // Configuración de la blockchain
  blockchain: {
    networkProfile: process.env.NETWORK_PROFILE || './connection-profile.json',
    channelName: process.env.CHANNEL_NAME || 'simbioticachannel',
    chaincodes: {
      token: process.env.TOKEN_CHAINCODE || 'token',
      telemedicina: process.env.TELEMEDICINA_CHAINCODE || 'telemedicina',
      identity: process.env.IDENTITY_CHAINCODE || 'identity',
      achievex: process.env.ACHIEVEX_CHAINCODE || 'achievex',
      chat: process.env.CHAT_CHAINCODE || 'chat',
      ia: process.env.IA_CHAINCODE || 'ia',
      dao: process.env.DAO_CHAINCODE || 'dao',
    },
    organizations: {
      org1: {
        mspId: process.env.ORG1_MSP_ID || 'Org1MSP',
        peers: (process.env.ORG1_PEERS || 'peer0.org1.simbiotica.com').split(','),
        adminUser: process.env.ORG1_ADMIN_USER || 'admin',
        adminPassword: process.env.ORG1_ADMIN_PASSWORD || 'adminpw',
        caUrl: process.env.ORG1_CA_URL || 'https://ca.org1.simbiotica.com:7054',
      },
      org2: {
        mspId: process.env.ORG2_MSP_ID || 'Org2MSP',
        peers: (process.env.ORG2_PEERS || 'peer0.org2.simbiotica.com').split(','),
        adminUser: process.env.ORG2_ADMIN_USER || 'admin',
        adminPassword: process.env.ORG2_ADMIN_PASSWORD || 'adminpw',
        caUrl: process.env.ORG2_CA_URL || 'https://ca.org2.simbiotica.com:7054',
      },
    },
    wallet: {
      path: process.env.WALLET_PATH || './wallet',
    },
    discovery: {
      enabled: process.env.DISCOVERY_ENABLED === 'true' || true,
      asLocalhost: process.env.DISCOVERY_AS_LOCALHOST === 'true' || true,
    },
  },
  
  // Configuración de servicios externos
  services: {
    // Configuración para el servicio de IA
    ia: {
      provider: process.env.IA_PROVIDER || 'openai',
      apiKey: process.env.IA_API_KEY || '',
      defaultModel: process.env.IA_DEFAULT_MODEL || 'gpt-4',
      endpoint: process.env.IA_ENDPOINT || 'https://api.openai.com/v1',
      maxTokens: parseInt(process.env.IA_MAX_TOKENS, 10) || 4096,
      temperature: parseFloat(process.env.IA_TEMPERATURE) || 0.7,
    },
    
    // Configuración para el servicio de notificaciones
    notifications: {
      email: {
        enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true' || false,
        host: process.env.EMAIL_HOST || 'smtp.example.com',
        port: parseInt(process.env.EMAIL_PORT, 10) || 587,
        secure: process.env.EMAIL_SECURE === 'true' || false,
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASSWORD || '',
        },
        from: process.env.EMAIL_FROM || 'no-reply@blockchain-simbiotica.com',
      },
      sms: {
        enabled: process.env.SMS_NOTIFICATIONS_ENABLED === 'true' || false,
        provider: process.env.SMS_PROVIDER || 'twilio',
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      },
      push: {
        enabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true' || false,
        provider: process.env.PUSH_PROVIDER || 'firebase',
        apiKey: process.env.FIREBASE_API_KEY || '',
        projectId: process.env.FIREBASE_PROJECT_ID || '',
      },
    },
    
    // Configuración para el servicio de almacenamiento
    storage: {
      provider: process.env.STORAGE_PROVIDER || 'local',
      local: {
        path: process.env.LOCAL_STORAGE_PATH || './uploads',
      },
      s3: {
        bucket: process.env.S3_BUCKET || '',
        region: process.env.S3_REGION || 'us-east-1',
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    },
  },
  
  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    directory: process.env.LOG_DIRECTORY || './logs',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    console: process.env.LOG_CONSOLE === 'true' || true,
  },
  
  // Configuración de seguridad
  security: {
    helmet: {
      enabled: process.env.HELMET_ENABLED === 'true' || true,
    },
    rateLimit: {
      enabled: process.env.RATE_LIMIT_ENABLED === 'true' || true,
    },
    csrf: {
      enabled: process.env.CSRF_ENABLED === 'true' || false,
    },
    tls: {
      enabled: process.env.TLS_ENABLED === 'true' || false,
      key: process.env.TLS_KEY || '',
      cert: process.env.TLS_CERT || '',
    },
  },
  
  // Configuración de módulos específicos
  modules: {
    // Configuración del módulo de telemedicina
    telemedicina: {
      maxFileSize: parseInt(process.env.TELEMEDICINA_MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
      allowedFileTypes: (process.env.TELEMEDICINA_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf').split(','),
      encryptionEnabled: process.env.TELEMEDICINA_ENCRYPTION_ENABLED === 'true' || true,
      consultaDuration: parseInt(process.env.TELEMEDICINA_CONSULTA_DURATION, 10) || 30, // 30 minutos
      recordsRetentionDays: parseInt(process.env.TELEMEDICINA_RECORDS_RETENTION_DAYS, 10) || 3650, // 10 años
    },
    
    // Configuración del módulo de token
    token: {
      symbol: process.env.TOKEN_SYMBOL || 'SIMB',
      decimals: parseInt(process.env.TOKEN_DECIMALS, 10) || 18,
      initialSupply: process.env.TOKEN_INITIAL_SUPPLY || '100000000000000000000000000', // 100 millones con 18 decimales
      maxSupply: process.env.TOKEN_MAX_SUPPLY || '1000000000000000000000000000', // 1 billón con 18 decimales
      mintingEnabled: process.env.TOKEN_MINTING_ENABLED === 'true' || true,
      burningEnabled: process.env.TOKEN_BURNING_ENABLED === 'true' || true,
      transferFee: parseFloat(process.env.TOKEN_TRANSFER_FEE) || 0.1, // 0.1%
      treasuryAddress: process.env.TOKEN_TREASURY_ADDRESS || 'treasury',
    },
    
    // Configuración del módulo de identidad
    identity: {
      verificationRequired: process.env.IDENTITY_VERIFICATION_REQUIRED === 'true' || true,
      verificationExpiry: parseInt(process.env.IDENTITY_VERIFICATION_EXPIRY, 10) || 30, // 30 días
      kycProviders: (process.env.IDENTITY_KYC_PROVIDERS || 'internal,external').split(','),
      minVerificationLevel: parseInt(process.env.IDENTITY_MIN_VERIFICATION_LEVEL, 10) || 2,
      maxVerificationLevel: parseInt(process.env.IDENTITY_MAX_VERIFICATION_LEVEL, 10) || 4,
    },
    
    // Configuración del módulo AchieveX
    achievex: {
      badgesEnabled: process.env.ACHIEVEX_BADGES_ENABLED === 'true' || true,
      rewardsEnabled: process.env.ACHIEVEX_REWARDS_ENABLED === 'true' || true,
      leaderboardEnabled: process.env.ACHIEVEX_LEADERBOARD_ENABLED === 'true' || true,
      leaderboardRefreshInterval: parseInt(process.env.ACHIEVEX_LEADERBOARD_REFRESH_INTERVAL, 10) || 3600, // 1 hora
      pointsExpiryDays: parseInt(process.env.ACHIEVEX_POINTS_EXPIRY_DAYS, 10) || 365, // 1 año
    },
    
    // Configuración del módulo de chat
    chat: {
      maxMessageLength: parseInt(process.env.CHAT_MAX_MESSAGE_LENGTH, 10) || 2000,
      fileAttachmentsEnabled: process.env.CHAT_FILE_ATTACHMENTS_ENABLED === 'true' || true,
      maxFileSize: parseInt(process.env.CHAT_MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
      encryptionEnabled: process.env.CHAT_ENCRYPTION_ENABLED === 'true' || true,
      messageRetentionDays: parseInt(process.env.CHAT_MESSAGE_RETENTION_DAYS, 10) || 365, // 1 año
    },
    
    // Configuración del módulo de IA
    ia: {
      enabled: process.env.IA_ENABLED === 'true' || true,
      modelsAvailable: (process.env.IA_MODELS_AVAILABLE || 'gpt-4,llama-3,claude-3').split(','),
      maxConcurrentRequests: parseInt(process.env.IA_MAX_CONCURRENT_REQUESTS, 10) || 10,
      requestTimeout: parseInt(process.env.IA_REQUEST_TIMEOUT, 10) || 30000, // 30 segundos
      cacheEnabled: process.env.IA_CACHE_ENABLED === 'true' || true,
      cacheTTL: parseInt(process.env.IA_CACHE_TTL, 10) || 3600, // 1 hora
    },
    
    // Configuración del módulo de DAO
    dao: {
      votingEnabled: process.env.DAO_VOTING_ENABLED === 'true' || true,
      proposalThreshold: parseInt(process.env.DAO_PROPOSAL_THRESHOLD, 10) || 100, // 100 tokens
      votingPeriod: parseInt(process.env.DAO_VOTING_PERIOD, 10) || 7, // 7 días
      executionDelay: parseInt(process.env.DAO_EXECUTION_DELAY, 10) || 2, // 2 días
      quorumPercentage: parseInt(process.env.DAO_QUORUM_PERCENTAGE, 10) || 51, // 51%
      superMajorityPercentage: parseInt(process.env.DAO_SUPERMAJORITY_PERCENTAGE, 10) || 67, // 67%
    },
  },
});
