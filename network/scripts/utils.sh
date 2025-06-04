#!/bin/bash

# Script de utilidades para la red Blockchain Simbiótica
# Este script contiene funciones comunes utilizadas por otros scripts

# Cargar variables de entorno
source ../../docker/.env

# Colores para mensajes
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
function log {
    echo -e "${BLUE}[$(date +"%T")] ${GREEN}INFO${NC}: $1"
}

# Función para mostrar errores
function error {
    echo -e "${BLUE}[$(date +"%T")] ${RED}ERROR${NC}: $1"
}

# Función para mostrar advertencias
function warn {
    echo -e "${BLUE}[$(date +"%T")] ${YELLOW}WARN${NC}: $1"
}

# Función para cambiar a la organización 1
function setOrg1() {
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=../crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=../crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=peer0.org1.example.com:7051
    export PEER0_ORG1_CA=../crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    log "Cambiado a Org1MSP (peer0.org1.example.com)"
}

# Función para cambiar a la organización 2
function setOrg2() {
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=../crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=../crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
    export CORE_PEER_ADDRESS=peer0.org2.example.com:7051
    export PEER0_ORG2_CA=../crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
    log "Cambiado a Org2MSP (peer0.org2.example.com)"
}

# Función para verificar si un contenedor está en ejecución
function checkContainerRunning() {
    local container_name=$1
    docker ps | grep "$container_name" > /dev/null
    return $?
}

# Función para verificar si un canal existe
function checkChannelExists() {
    local channel_name=$1
    setOrg1
    docker exec cli peer channel list | grep "$channel_name" > /dev/null
    return $?
}

# Función para verificar si un chaincode está instalado
function checkChaincodeInstalled() {
    local cc_name=$1
    local cc_version=$2
    setOrg1
    docker exec cli peer lifecycle chaincode queryinstalled | grep "${cc_name}_${cc_version}" > /dev/null
    return $?
}

# Función para limpiar la red
function cleanNetwork() {
    log "Limpiando entorno previo..."
    docker-compose -f ../../docker/fabric/docker-compose.yaml down --volumes --remove-orphans
    docker-compose -f ../../docker/explorer/docker-compose.yaml down --volumes --remove-orphans
    docker volume prune -f
    docker network prune -f
    rm -rf ../crypto-config
    rm -rf ../channel-artifacts
    log "Entorno limpiado correctamente."
}

# Función para mostrar el estado de la red
function showNetworkStatus() {
    log "Estado de la red Blockchain Simbiótica:"
    log "Contenedores en ejecución:"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep "peer\|orderer\|ca\|couchdb\|explorer"
    
    log "Canales disponibles:"
    setOrg1
    docker exec cli peer channel list 2>/dev/null || echo "No se pudo obtener la lista de canales"
    
    log "Chaincodes instalados:"
    docker exec cli peer lifecycle chaincode queryinstalled 2>/dev/null || echo "No se pudo obtener la lista de chaincodes"
}

# Exportar funciones para que sean accesibles desde otros scripts
export -f log
export -f error
export -f warn
export -f setOrg1
export -f setOrg2
export -f checkContainerRunning
export -f checkChannelExists
export -f checkChaincodeInstalled
export -f cleanNetwork
export -f showNetworkStatus
