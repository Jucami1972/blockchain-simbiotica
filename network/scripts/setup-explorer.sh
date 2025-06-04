#!/bin/bash

# Script para configurar Hyperledger Explorer en la red Blockchain Simbiótica
# Este script configura y arranca Hyperledger Explorer para monitorizar la red

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

# Verificar si Docker está en ejecución
if ! docker info > /dev/null 2>&1; then
    error "Docker no está en ejecución. Por favor, inicie Docker y vuelva a intentarlo."
    exit 1
fi

# Verificar si la red está en ejecución
log "Verificando si la red Blockchain Simbiótica está en ejecución..."
docker ps | grep "peer0.org1.example.com" > /dev/null
if [ $? -ne 0 ]; then
    error "La red Blockchain Simbiótica no está en ejecución. Ejecute primero start-network.sh"
    exit 1
fi

# Copiar material criptográfico para Explorer
log "Copiando material criptográfico para Explorer..."
mkdir -p ../../docker/explorer/crypto
cp -r ../crypto-config ../../docker/explorer/crypto/

if [ $? -ne 0 ]; then
    error "Error al copiar el material criptográfico. Abortando."
    exit 1
fi

# Iniciar Explorer
log "Iniciando Hyperledger Explorer..."
docker-compose -f ../../docker/explorer/docker-compose.yaml up -d

if [ $? -ne 0 ]; then
    error "Error al iniciar Hyperledger Explorer. Abortando."
    exit 1
fi

# Verificar que los contenedores estén en ejecución
log "Verificando el estado de los contenedores de Explorer..."
sleep 5
EXPLORER_CONTAINERS=$(docker ps -a | grep "explorer\|explorerdb" | wc -l)
RUNNING_EXPLORER_CONTAINERS=$(docker ps | grep "explorer\|explorerdb" | wc -l)

if [ "$RUNNING_EXPLORER_CONTAINERS" -lt "$EXPLORER_CONTAINERS" ]; then
    warn "No todos los contenedores de Explorer están en ejecución. Verificando logs..."
    docker ps -a | grep "explorer\|explorerdb"
    docker logs explorer.mynetwork.com
    exit 1
else
    log "Todos los contenedores de Explorer están en ejecución correctamente."
fi

# Mostrar información de acceso
log "Hyperledger Explorer configurado correctamente."
log "Acceda a Explorer en: http://localhost:${EXPLORER_PORT}"
log "Credenciales por defecto:"
log "- Usuario: admin"
log "- Contraseña: adminpw"

exit 0
