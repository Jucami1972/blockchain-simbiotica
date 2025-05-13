#!/bin/bash

set -e

# Ruta al test-network de fabric-samples (ajusta si es necesario)
TEST_NETWORK_DIR=../fabric-samples/test-network
WALLET_DIR=../fabric/integration-tests/fixtures/wallet
CHAINCODE_NAME=ccv
CHAINCODE_PATH=../../chaincode/ccv
CHAINCODE_LANG=node
CHANNEL_NAME=mychannel

# 1. Detener y limpiar la red de Fabric
cd $TEST_NETWORK_DIR
./network.sh down

# 2. Limpiar artefactos previos
rm -rf organizations system-genesis-block

# 3. Levantar la red de Fabric
./network.sh up createChannel -c $CHANNEL_NAME -ca

# 4. Desplegar el chaincode
./network.sh deployCC -ccn $CHAINCODE_NAME -ccp $CHAINCODE_PATH -ccl $CHAINCODE_LANG -c $CHANNEL_NAME

# 5. Volver al directorio del proyecto
cd -

# 6. Limpiar la wallet de identidades
if [ -d "$WALLET_DIR" ]; then
  rm -rf "$WALLET_DIR"/*
  echo "Wallet limpiada: $WALLET_DIR"
else
  echo "No existe la wallet: $WALLET_DIR"
fi

# 7. (Opcional) Volver a crear la identidad user1
npm run setup:user1

echo "\n✅ Entorno de pruebas reiniciado y chaincode desplegado correctamente." 