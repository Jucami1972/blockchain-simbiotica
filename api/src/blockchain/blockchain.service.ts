import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FabricCAServices from 'fabric-ca-client';
import { Wallets, Gateway, GatewayOptions, Contract, Network } from 'fabric-network';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private gateway: Gateway;
  private wallet: any;
  private connectionProfile: any;
  private channelName: string;
  private chaincodeIds: Record<string, string>;
  private contracts: Record<string, Contract> = {};
  private network: Network;

  constructor(private configService: ConfigService) {
    this.channelName = this.configService.get<string>('blockchain.channelName');
    this.chaincodeIds = this.configService.get<Record<string, string>>('blockchain.chaincodes');
    
    try {
      // Cargar el perfil de conexión
      const networkProfilePath = this.configService.get<string>('blockchain.networkProfile');
      this.connectionProfile = JSON.parse(fs.readFileSync(networkProfilePath, 'utf8'));
      
      // Inicializar el wallet
      const walletPath = this.configService.get<string>('blockchain.wallet.path');
      if (!fs.existsSync(walletPath)) {
        fs.mkdirSync(walletPath, { recursive: true });
      }
      
      this.logger.log(`Blockchain service initialized with channel: ${this.channelName}`);
    } catch (error) {
      this.logger.error(`Failed to initialize blockchain service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Inicializa la conexión con la red blockchain
   */
  async connect(userId: string): Promise<void> {
    try {
      // Crear una nueva instancia de gateway
      this.gateway = new Gateway();
      
      // Cargar el wallet
      const walletPath = this.configService.get<string>('blockchain.wallet.path');
      this.wallet = await Wallets.newFileSystemWallet(walletPath);
      
      // Verificar si el usuario existe en el wallet
      const identity = await this.wallet.get(userId);
      if (!identity) {
        throw new Error(`Identity ${userId} not found in wallet`);
      }
      
      // Opciones de conexión
      const gatewayOptions: GatewayOptions = {
        wallet: this.wallet,
        identity: userId,
        discovery: {
          enabled: this.configService.get<boolean>('blockchain.discovery.enabled'),
          asLocalhost: this.configService.get<boolean>('blockchain.discovery.asLocalhost'),
        },
      };
      
      // Conectar a la gateway
      await this.gateway.connect(this.connectionProfile, gatewayOptions);
      
      // Obtener la red
      this.network = await this.gateway.getNetwork(this.channelName);
      
      // Inicializar contratos
      await this.initializeContracts();
      
      this.logger.log(`Connected to blockchain network as ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to connect to blockchain network: ${error.message}`);
      throw error;
    }
  }

  /**
   * Inicializa los contratos para cada chaincode
   */
  private async initializeContracts(): Promise<void> {
    try {
      for (const [moduleName, chaincodeId] of Object.entries(this.chaincodeIds)) {
        this.contracts[moduleName] = this.network.getContract(chaincodeId);
        this.logger.log(`Contract initialized for ${moduleName} with chaincode ID: ${chaincodeId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to initialize contracts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desconecta de la red blockchain
   */
  async disconnect(): Promise<void> {
    if (this.gateway) {
      this.gateway.disconnect();
      this.logger.log('Disconnected from blockchain network');
    }
  }

  /**
   * Registra un nuevo usuario en la CA
   */
  async registerUser(adminId: string, userId: string, affiliation: string): Promise<void> {
    try {
      // Obtener la configuración de la organización
      const org1Config = this.configService.get('blockchain.organizations.org1');
      
      // Cargar el wallet
      const walletPath = this.configService.get<string>('blockchain.wallet.path');
      this.wallet = await Wallets.newFileSystemWallet(walletPath);
      
      // Verificar si el usuario ya existe
      const userIdentity = await this.wallet.get(userId);
      if (userIdentity) {
        this.logger.log(`Identity ${userId} already exists in wallet`);
        return;
      }
      
      // Verificar si el admin existe
      const adminIdentity = await this.wallet.get(adminId);
      if (!adminIdentity) {
        throw new Error(`Admin identity ${adminId} not found in wallet`);
      }
      
      // Crear una nueva instancia de CA client
      const caInfo = this.connectionProfile.certificateAuthorities[org1Config.caUrl];
      const caTLSCACerts = caInfo.tlsCACerts.pem;
      const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
      
      // Crear un provider para el admin
      const provider = this.wallet.getProviderRegistry().getProvider(adminIdentity.type);
      const adminUser = await provider.getUserContext(adminIdentity, adminId);
      
      // Registrar el usuario
      const secret = await ca.register({
        affiliation,
        enrollmentID: userId,
        role: 'client',
      }, adminUser);
      
      // Inscribir el usuario
      const enrollment = await ca.enroll({
        enrollmentID: userId,
        enrollmentSecret: secret,
      });
      
      // Crear la identidad del usuario
      const x509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: org1Config.mspId,
        type: 'X.509',
      };
      
      // Guardar la identidad en el wallet
      await this.wallet.put(userId, x509Identity);
      
      this.logger.log(`User ${userId} registered and enrolled successfully`);
    } catch (error) {
      this.logger.error(`Failed to register user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Inscribe al admin en la CA
   */
  async enrollAdmin(): Promise<void> {
    try {
      // Obtener la configuración de la organización
      const org1Config = this.configService.get('blockchain.organizations.org1');
      const adminUser = org1Config.adminUser;
      const adminPassword = org1Config.adminPassword;
      
      // Cargar el wallet
      const walletPath = this.configService.get<string>('blockchain.wallet.path');
      this.wallet = await Wallets.newFileSystemWallet(walletPath);
      
      // Verificar si el admin ya existe
      const identity = await this.wallet.get(adminUser);
      if (identity) {
        this.logger.log(`Admin identity ${adminUser} already exists in wallet`);
        return;
      }
      
      // Crear una nueva instancia de CA client
      const caInfo = this.connectionProfile.certificateAuthorities[org1Config.caUrl];
      const caTLSCACerts = caInfo.tlsCACerts.pem;
      const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
      
      // Inscribir el admin
      const enrollment = await ca.enroll({
        enrollmentID: adminUser,
        enrollmentSecret: adminPassword,
      });
      
      // Crear la identidad del admin
      const x509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: org1Config.mspId,
        type: 'X.509',
      };
      
      // Guardar la identidad en el wallet
      await this.wallet.put(adminUser, x509Identity);
      
      this.logger.log(`Admin ${adminUser} enrolled successfully`);
    } catch (error) {
      this.logger.error(`Failed to enroll admin: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ejecuta una transacción en un contrato específico
   */
  async submitTransaction(moduleName: string, functionName: string, ...args: string[]): Promise<Buffer> {
    try {
      const contract = this.contracts[moduleName];
      if (!contract) {
        throw new Error(`Contract for module ${moduleName} not found`);
      }
      
      this.logger.log(`Submitting transaction: ${functionName} in module ${moduleName}`);
      const result = await contract.submitTransaction(functionName, ...args);
      this.logger.log(`Transaction ${functionName} submitted successfully`);
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to submit transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * Evalúa una transacción en un contrato específico (solo lectura)
   */
  async evaluateTransaction(moduleName: string, functionName: string, ...args: string[]): Promise<Buffer> {
    try {
      const contract = this.contracts[moduleName];
      if (!contract) {
        throw new Error(`Contract for module ${moduleName} not found`);
      }
      
      this.logger.log(`Evaluating transaction: ${functionName} in module ${moduleName}`);
      const result = await contract.evaluateTransaction(functionName, ...args);
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to evaluate transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene todos los contratos inicializados
   */
  getContracts(): Record<string, Contract> {
    return this.contracts;
  }

  /**
   * Obtiene un contrato específico por nombre de módulo
   */
  getContract(moduleName: string): Contract {
    const contract = this.contracts[moduleName];
    if (!contract) {
      throw new Error(`Contract for module ${moduleName} not found`);
    }
    return contract;
  }

  /**
   * Verifica si el servicio está conectado a la red blockchain
   */
  isConnected(): boolean {
    return !!this.gateway && !!this.network;
  }

  /**
   * Obtiene información sobre la red blockchain
   */
  async getNetworkInfo(): Promise<any> {
    try {
      if (!this.isConnected()) {
        throw new Error('Not connected to blockchain network');
      }
      
      // Obtener información de los peers
      const peers = this.network.getChannel().getEndorsers();
      const peersInfo = peers.map(peer => ({
        name: peer.name,
        url: peer.endpoint.url,
        mspid: peer.mspid,
      }));
      
      // Obtener información de los chaincodes
      const chaincodesInfo = {};
      for (const [moduleName, chaincodeId] of Object.entries(this.chaincodeIds)) {
        chaincodesInfo[moduleName] = {
          id: chaincodeId,
          initialized: !!this.contracts[moduleName],
        };
      }
      
      return {
        channelName: this.channelName,
        peers: peersInfo,
        chaincodes: chaincodesInfo,
        connected: this.isConnected(),
      };
    } catch (error) {
      this.logger.error(`Failed to get network info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Escucha eventos de un contrato específico
   */
  async listenForContractEvents(moduleName: string, eventName: string, callback: (event: any) => void): Promise<any> {
    try {
      const contract = this.contracts[moduleName];
      if (!contract) {
        throw new Error(`Contract for module ${moduleName} not found`);
      }
      
      this.logger.log(`Listening for event ${eventName} in module ${moduleName}`);
      const listener = await contract.addContractListener(async (event) => {
        if (event.eventName === eventName) {
          this.logger.log(`Event ${eventName} received`);
          callback(event);
        }
      });
      
      return listener;
    } catch (error) {
      this.logger.error(`Failed to listen for contract events: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deja de escuchar eventos de un contrato específico
   */
  async removeContractListener(moduleName: string, listener: any): Promise<void> {
    try {
      const contract = this.contracts[moduleName];
      if (!contract) {
        throw new Error(`Contract for module ${moduleName} not found`);
      }
      
      await contract.removeContractListener(listener);
      this.logger.log(`Contract listener removed from module ${moduleName}`);
    } catch (error) {
      this.logger.error(`Failed to remove contract listener: ${error.message}`);
      throw error;
    }
  }
}
