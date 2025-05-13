const { Wallets } = require('fabric-network');
const path = require('path');

async function main() {
  try {
    // Cargar la wallet
    const walletPath = path.join(
      __dirname,
      '../../../fabric/integration-tests/fixtures/wallet'
    );
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Listar las identidades
    const identities = await wallet.list();
    console.log('Identidades en la wallet:', identities);

    // Obtener la identidad de user1
    const identity = await wallet.get('user1');
    if (identity) {
      console.log('Identidad encontrada:');
      console.log('  Type:', identity.type);
      console.log('  MspId:', identity.mspId);
      console.log(
        '  Certificate disponible:',
        !!identity.credentials.certificate
      );
      console.log(
        '  Private Key disponible:',
        !!identity.credentials.privateKey
      );
    } else {
      console.log('No se encontró la identidad de user1');
    }
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

main();
