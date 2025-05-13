// Este archivo está listo para ser editado
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const FabricCAServices = require('fabric-ca-client');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const myEnv = dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenvExpand.expand(myEnv);

const channelName = process.env.FABRIC_CHANNEL_NAME;
const chaincodeName = process.env.FABRIC_CHAINCODE_NAME;
const connectionProfilePath = process.env.FABRIC_CONNECTION_PROFILE_PATH;

// Conectar a la red
async function connectToNetwork(userId) {
  try {
    // Cargar el perfil de conexión
    const connectionProfile = JSON.parse(
      fs.readFileSync(connectionProfilePath, 'utf8')
    );

    // Crear una nueva instancia del wallet
    const walletPath = path.join(
      __dirname,
      '../../../fabric/integration-tests/fixtures/wallet'
    );
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Verificar si el usuario existe en el wallet
    const identity = await wallet.get(userId);
    if (!identity) {
      console.log(
        `Usuario ${userId} no existe en el wallet, regístrelo primero.`
      );
      return { success: false, message: 'Usuario no encontrado' };
    }

    // Crear una nueva gateway para conectarse a la red
    const gateway = new Gateway();
    await gateway.connect(connectionProfile, {
      wallet,
      identity: userId,
      discovery: { enabled: true, asLocalhost: true },
    });

    // Conectar al canal
    const network = await gateway.getNetwork(channelName);

    // Obtener el contrato del chaincode
    const contract = network.getContract(chaincodeName);

    return { success: true, gateway, network, contract };
  } catch (error) {
    console.error(`Error al conectar a la red: ${error}`);
    return { success: false, message: error.message };
  }
}

// Desconectar de la red
async function disconnectFromNetwork(gateway) {
  if (gateway) {
    gateway.disconnect();
  }
}

// Registrar y matricular un usuario
async function registerUser(username, role) {
  let gateway;
  try {
    // Cargar el perfil de conexión
    const connectionProfile = JSON.parse(
      fs.readFileSync(connectionProfilePath, 'utf8')
    );

    // Crear una nueva instancia del wallet
    const walletPath = path.join(
      __dirname,
      '../../../fabric/integration-tests/fixtures/wallet'
    );
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Verificar si el usuario ya existe en el wallet
    const userIdentity = await wallet.get(username);
    if (userIdentity) {
      console.log(`Usuario ${username} ya existe en el wallet`);
      return { success: true, message: 'Usuario ya registrado' };
    }

    // Verificar si el admin existe en el wallet
    const adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
      console.log('El admin debe estar registrado primero');
      await enrollAdmin();
    }

    // Crear una nueva gateway para conectarse a la red como admin
    gateway = new Gateway();
    await gateway.connect(connectionProfile, {
      wallet,
      identity: 'admin',
      discovery: { enabled: true, asLocalhost: true },
    });

    // Obtener la CA para Org1
    const caName = 'ca_org1';
    const caURL = connectionProfile.certificateAuthorities[caName].url;
    const ca = new FabricCAServices(caURL);

    // Obtener el proveedor de identidad del wallet
    const provider = wallet
      .getProviderRegistry()
      .getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');

    // Registrar el usuario usando el objeto User del admin
    const secret = await ca.register(
      {
        affiliation: 'org1.department1',
        enrollmentID: username,
        role: role || 'client',
      },
      adminUser
    );

    // Matricular el usuario
    const enrollment = await ca.enroll({
      enrollmentID: username,
      enrollmentSecret: secret,
    });

    // Crear una identidad para el usuario y guardarla en el wallet
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: 'Org1MSP',
      type: 'X.509',
    };
    await wallet.put(username, x509Identity);

    console.log(`Usuario ${username} registrado y matriculado correctamente`);
    return {
      success: true,
      message: 'Usuario registrado y matriculado correctamente',
    };
  } catch (error) {
    console.error(`Error al registrar usuario: ${error}`);
    return { success: false, message: error.message };
  } finally {
    if (gateway) {
      gateway.disconnect();
    }
  }
}

// Matricular al admin
async function enrollAdmin() {
  try {
    // Cargar el perfil de conexión
    const connectionProfile = JSON.parse(
      fs.readFileSync(connectionProfilePath, 'utf8')
    );

    // Crear una nueva instancia del wallet
    const walletPath = path.join(
      __dirname,
      '../../../fabric/integration-tests/fixtures/wallet'
    );
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Verificar si el admin ya existe en el wallet
    const identity = await wallet.get('admin');
    if (identity) {
      console.log('Admin ya existe en el wallet');
      return { success: true, message: 'Admin ya registrado' };
    }

    // Obtener la CA para Org1
    const caName = 'ca_org1';
    console.log('CA Name:', caName);
    console.log(
      'Available CAs:',
      Object.keys(connectionProfile.certificateAuthorities)
    );
    const ca = new FabricCAServices(
      connectionProfile.certificateAuthorities[caName].url,
      {
        trustedRoots: [],
        verify: false,
      },
      connectionProfile.certificateAuthorities[caName].caName
    );

    // Matricular el admin
    const enrollment = await ca.enroll({
      enrollmentID: 'admin',
      enrollmentSecret: 'adminpw',
    });

    // Crear una identidad para el admin y guardarla en el wallet
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: 'Org1MSP',
      type: 'X.509',
    };
    await wallet.put('admin', x509Identity);

    console.log('Admin matriculado correctamente');
    return { success: true, message: 'Admin matriculado correctamente' };
  } catch (error) {
    console.error(`Error al matricular admin: ${error}`);
    return { success: false, message: error.message };
  }
}

module.exports = {
  connectToNetwork,
  disconnectFromNetwork,
  registerUser,
  enrollAdmin,
};
