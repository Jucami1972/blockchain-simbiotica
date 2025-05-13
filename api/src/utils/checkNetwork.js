const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function checkNetwork() {
  try {
    // Cargar la wallet
    const walletPath = path.join(
      __dirname,
      '../../../fabric/integration-tests/fixtures/wallet'
    );
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Verificar si existe la identidad
    const identity = await wallet.get('user1');
    if (!identity) {
      console.log('❌ No se encontró la identidad user1 en la wallet');
      return;
    }
    console.log('✅ Identidad user1 encontrada en la wallet');

    // Cargar el perfil de conexión
    const connectionProfile = JSON.parse(
      fs.readFileSync(
        path.join(
          __dirname,
          '../../../fabric/network-config/connection-profile.json'
        ),
        'utf8'
      )
    );

    // Crear el gateway
    const gateway = new Gateway();
    await gateway.connect(connectionProfile, {
      wallet,
      identity: 'user1',
      discovery: { enabled: true, asLocalhost: true },
    });
    console.log('✅ Conexión al gateway establecida');

    // Obtener el canal
    const network = await gateway.getNetwork('mychannel');
    console.log('✅ Canal mychannel accesible');

    // Obtener el contrato
    const contract = network.getContract('ccv');
    console.log('✅ Contrato ccv accesible');

    // Desconectar el gateway
    gateway.disconnect();
    console.log('✅ Verificación completada exitosamente');
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
  }
}

checkNetwork();
