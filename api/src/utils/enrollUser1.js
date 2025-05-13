const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Crear una nueva wallet
    const walletPath = path.join(
      __dirname,
      '../../../fabric/integration-tests/fixtures/wallet'
    );
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Verificar si user1 ya existe
    const userIdentity = await wallet.get('user1');
    if (userIdentity) {
      console.log('La identidad "user1" ya existe en la wallet');
      return;
    }

    // Crear el cliente de CA con TLS
    const caURL = 'https://localhost:7054';
    const ca = new FabricCAServices(caURL, {
      trustedRoots: [],
      verify: false,
    });

    // Registrar y matricular al usuario
    const enrollment = await ca.enroll({
      enrollmentID: 'user1',
      enrollmentSecret: 'user1pw',
    });

    // Crear la identidad
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: 'Org1MSP',
      type: 'X.509',
    };

    // Guardar la identidad en la wallet
    await wallet.put('user1', x509Identity);
    console.log('Usuario "user1" registrado y matriculado exitosamente');
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

main();
