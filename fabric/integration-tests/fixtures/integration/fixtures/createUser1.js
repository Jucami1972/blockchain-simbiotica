const { Wallets, X509WalletMixin } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Crear una nueva wallet
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Verificar si user1 ya existe
    const userExists = await wallet.get('user1');
    if (userExists) {
      console.log('La identidad "user1" ya existe en la wallet');
      return;
    }

    // Leer los certificados
    const certPath = path.join(__dirname, 'user1', 'signcerts', 'cert.pem');
    const keyPath = path.join(__dirname, 'user1', 'keystore', 'key.pem');

    const cert = fs.readFileSync(certPath).toString();
    const key = fs.readFileSync(keyPath).toString();

    // Crear la identidad
    const identity = X509WalletMixin.createIdentity('Org1MSP', cert, key);
    await wallet.import('user1', identity);
    console.log('Identidad "user1" creada exitosamente en la wallet');
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

main();
