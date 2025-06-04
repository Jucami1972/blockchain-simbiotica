#!/bin/bash

# Script para crear un canal en la red Blockchain Simbiótica
# Este script crea un canal y une los peers al canal

# Definir variables de entorno
export COMPOSE_PROJECT_NAME=blockchain-simbiotica
export FABRIC_CFG_PATH=${PWD}/../docker/fabric
export CHANNEL_NAME=simbioticachannel
export DELAY=3
export MAX_RETRY=5
export VERBOSE=false

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes informativos
function printInfo() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Función para imprimir mensajes de éxito
function printSuccess() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# Función para imprimir mensajes de error
function printError() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Función para imprimir mensajes de advertencia
function printWarning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Función para verificar si un comando existe
function checkCommand() {
    if ! command -v $1 &> /dev/null; then
        printError "$1 no está instalado. Por favor, instálelo antes de continuar."
        exit 1
    fi
}

# Verificar que las herramientas necesarias estén instaladas
checkCommand docker

# Verificar si la red está en ejecución
if [ $(docker ps -q | wc -l) -eq 0 ]; then
    printError "La red no está en ejecución. Por favor, inicie la red primero con ./start-network.sh"
    exit 1
fi

# Crear canal
printInfo "Creando canal ${CHANNEL_NAME}..."
docker exec cli peer channel create -o orderer0.blockchain-simbiotica.com:7050 -c $CHANNEL_NAME -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/blockchain-simbiotica.com/orderers/orderer0.blockchain-simbiotica.com/msp/tlscacerts/tlsca.blockchain-simbiotica.com-cert.pem
if [ $? -ne 0 ]; then
    printError "Error al crear el canal"
    exit 1
fi
printSuccess "Canal ${CHANNEL_NAME} creado correctamente"

# Unir peer0.org1 al canal
printInfo "Uniendo peer0.org1 al canal ${CHANNEL_NAME}..."
docker exec cli peer channel join -b ${CHANNEL_NAME}.block
if [ $? -ne 0 ]; then
    printError "Error al unir peer0.org1 al canal"
    exit 1
fi
printSuccess "peer0.org1 unido al canal ${CHANNEL_NAME} correctamente"

# Unir peer1.org1 al canal
printInfo "Uniendo peer1.org1 al canal ${CHANNEL_NAME}..."
docker exec -e CORE_PEER_ADDRESS=peer1.org1.blockchain-simbiotica.com:7051 -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.blockchain-simbiotica.com/peers/peer1.org1.blockchain-simbiotica.com/tls/ca.crt cli peer channel join -b ${CHANNEL_NAME}.block
if [ $? -ne 0 ]; then
    printError "Error al unir peer1.org1 al canal"
    exit 1
fi
printSuccess "peer1.org1 unido al canal ${CHANNEL_NAME} correctamente"

# Unir peer0.org2 al canal
printInfo "Uniendo peer0.org2 al canal ${CHANNEL_NAME}..."
docker exec -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.blockchain-simbiotica.com/users/Admin@org2.blockchain-simbiotica.com/msp -e CORE_PEER_ADDRESS=peer0.org2.blockchain-simbiotica.com:9051 -e CORE_PEER_LOCALMSPID=Org2MSP -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.blockchain-simbiotica.com/peers/peer0.org2.blockchain-simbiotica.com/tls/ca.crt cli peer channel join -b ${CHANNEL_NAME}.block
if [ $? -ne 0 ]; then
    printError "Error al unir peer0.org2 al canal"
    exit 1
fi
printSuccess "peer0.org2 unido al canal ${CHANNEL_NAME} correctamente"

# Unir peer0.org3 al canal
printInfo "Uniendo peer0.org3 al canal ${CHANNEL_NAME}..."
docker exec -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.blockchain-simbiotica.com/users/Admin@org3.blockchain-simbiotica.com/msp -e CORE_PEER_ADDRESS=peer0.org3.blockchain-simbiotica.com:11051 -e CORE_PEER_LOCALMSPID=Org3MSP -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.blockchain-simbiotica.com/peers/peer0.org3.blockchain-simbiotica.com/tls/ca.crt cli peer channel join -b ${CHANNEL_NAME}.block
if [ $? -ne 0 ]; then
    printError "Error al unir peer0.org3 al canal"
    exit 1
fi
printSuccess "peer0.org3 unido al canal ${CHANNEL_NAME} correctamente"

# Actualizar los anchor peers para Org1
printInfo "Actualizando anchor peers para Org1..."
docker exec cli peer channel update -o orderer0.blockchain-simbiotica.com:7050 -c $CHANNEL_NAME -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/Org1MSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/blockchain-simbiotica.com/orderers/orderer0.blockchain-simbiotica.com/msp/tlscacerts/tlsca.blockchain-simbiotica.com-cert.pem
if [ $? -ne 0 ]; then
    printError "Error al actualizar anchor peers para Org1"
    exit 1
fi
printSuccess "Anchor peers para Org1 actualizados correctamente"

# Actualizar los anchor peers para Org2
printInfo "Actualizando anchor peers para Org2..."
docker exec -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.blockchain-simbiotica.com/users/Admin@org2.blockchain-simbiotica.com/msp -e CORE_PEER_ADDRESS=peer0.org2.blockchain-simbiotica.com:9051 -e CORE_PEER_LOCALMSPID=Org2MSP -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.blockchain-simbiotica.com/peers/peer0.org2.blockchain-simbiotica.com/tls/ca.crt cli peer channel update -o orderer0.blockchain-simbiotica.com:7050 -c $CHANNEL_NAME -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/Org2MSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/blockchain-simbiotica.com/orderers/orderer0.blockchain-simbiotica.com/msp/tlscacerts/tlsca.blockchain-simbiotica.com-cert.pem
if [ $? -ne 0 ]; then
    printError "Error al actualizar anchor peers para Org2"
    exit 1
fi
printSuccess "Anchor peers para Org2 actualizados correctamente"

# Actualizar los anchor peers para Org3
printInfo "Actualizando anchor peers para Org3..."
docker exec -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.blockchain-simbiotica.com/users/Admin@org3.blockchain-simbiotica.com/msp -e CORE_PEER_ADDRESS=peer0.org3.blockchain-simbiotica.com:11051 -e CORE_PEER_LOCALMSPID=Org3MSP -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.blockchain-simbiotica.com/peers/peer0.org3.blockchain-simbiotica.com/tls/ca.crt cli peer channel update -o orderer0.blockchain-simbiotica.com:7050 -c $CHANNEL_NAME -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/Org3MSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/blockchain-simbiotica.com/orderers/orderer0.blockchain-simbiotica.com/msp/tlscacerts/tlsca.blockchain-simbiotica.com-cert.pem
if [ $? -ne 0 ]; then
    printError "Error al actualizar anchor peers para Org3"
    exit 1
fi
printSuccess "Anchor peers para Org3 actualizados correctamente"

printSuccess "Canal ${CHANNEL_NAME} creado y configurado correctamente"
printInfo "Para desplegar chaincodes, ejecute: ./deploy-chaincode.sh"
