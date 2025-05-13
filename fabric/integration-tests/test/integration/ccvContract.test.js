/*
 * SPDX-License-Identifier: Apache-2.0
 */

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const assert = require('chai').assert;

const ccpPath = path.resolve(
  __dirname,
  '..',
  '..',
  'network-config',
  'connection-org1.json'
);

describe('CCV Contract Tests', () => {
  let contract;
  let gateway;

  before(async () => {
    // Configuración del gateway
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'appUser',
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork('mychannel');
    contract = network.getContract('ccvContract');
  });

  after(async () => {
    // Cerrar conexión al finalizar los tests
    gateway.disconnect();
  });

  describe('Transacciones del contrato', () => {
    it('Debe inicializar el ledger correctamente', async () => {
      await contract.submitTransaction('InitLedger');
      const result = await contract.evaluateTransaction('GetAllAssets');
      assert.isNotEmpty(
        result,
        'El ledger debería estar inicializado con datos'
      );
    });

    it('Debe crear un nuevo activo', async () => {
      await contract.submitTransaction(
        'CreateAsset',
        'ASSET10',
        'valor1',
        'propietario1'
      );
      const result = await contract.evaluateTransaction('ReadAsset', 'ASSET10');
      const asset = JSON.parse(result.toString());
      assert.equal(
        asset.id,
        'ASSET10',
        'El activo debería haberse creado correctamente'
      );
    });

    it('Debe actualizar un activo existente', async () => {
      await contract.submitTransaction(
        'UpdateAsset',
        'ASSET10',
        'valorActualizado',
        'propietarioActualizado'
      );
      const result = await contract.evaluateTransaction('ReadAsset', 'ASSET10');
      const asset = JSON.parse(result.toString());
      assert.equal(
        asset.value,
        'valorActualizado',
        'El valor debería haberse actualizado correctamente'
      );
    });

    it('Debe eliminar un activo existente', async () => {
      await contract.submitTransaction('DeleteAsset', 'ASSET10');
      try {
        await contract.evaluateTransaction('ReadAsset', 'ASSET10');
      } catch (error) {
        assert.include(
          error.message,
          'does not exist',
          'El activo debería haber sido eliminado'
        );
      }
    });
  });
});
