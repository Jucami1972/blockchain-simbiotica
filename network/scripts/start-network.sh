#!/bin/bash

# Script para iniciar la red Blockchain Simbiótica
# Este script inicia los contenedores Docker para la red Hyperledger Fabric

# Definir variables de entorno
export COMPOSE_PROJECT_NAME=blockchain-simbiotica
export FABRIC_CFG_PATH=${PWD}/../docker/fabric
export CHANNEL_NAME=simbioticachannel

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
checkCommand docker-compose

# Verificar si los artefactos criptográficos existen
if [ ! -d "../crypto-config" ]; then
    printWarning "No se encontraron artefactos criptográficos. Generando..."
    ./generate.sh
    if [ $? -ne 0 ]; then
        printError "Error al generar artefactos criptográficos"
        exit 1
    fi
fi

# Iniciar la red
printInfo "Iniciando la red Blockchain Simbiótica..."
docker-compose -f ${FABRIC_CFG_PATH}/docker-compose.yaml up -d
if [ $? -ne 0 ]; then
    printError "Error al iniciar la red"
    exit 1
fi

# Verificar que todos los contenedores estén en ejecución
printInfo "Verificando que todos los contenedores estén en ejecución..."
sleep 5
CONTAINERS=$(docker ps -a | grep "blockchain-simbiotica" | grep "Exit" | wc -l)
if [ $CONTAINERS -gt 0 ]; then
    printError "Algunos contenedores no se iniciaron correctamente"
    docker ps -a | grep "blockchain-simbiotica" | grep "Exit"
    exit 1
fi

printSuccess "La red Blockchain Simbiótica se ha iniciado correctamente"
printInfo "Para crear un canal, ejecute: ./create-channel.sh"
printInfo "Para desplegar chaincodes, ejecute: ./deploy-chaincode.sh"
printInfo "Para detener la red, ejecute: ./teardown.sh"

# Mostrar los contenedores en ejecución
docker ps
