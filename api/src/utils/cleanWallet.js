const fs = require('fs');
const path = require('path');

async function cleanWallet() {
  try {
    const walletPath = path.join(
      __dirname,
      '../../../fabric/integration-tests/fixtures/wallet'
    );

    // Verificar si existe la wallet
    if (fs.existsSync(walletPath)) {
      // Leer todos los archivos en la wallet
      const files = fs.readdirSync(walletPath);

      // Eliminar cada archivo
      for (const file of files) {
        fs.unlinkSync(path.join(walletPath, file));
      }

      console.log('Wallet limpiada exitosamente');
    } else {
      console.log('La wallet no existe, no es necesario limpiar');
    }
  } catch (error) {
    console.error('Error al limpiar la wallet:', error);
    process.exit(1);
  }
}

cleanWallet();
