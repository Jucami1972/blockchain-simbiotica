#!/bin/bash
set -eo pipefail

# --- Configuración ---
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
RESET="\033[0m"
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
ROOT_DIR="$SCRIPT_DIR/.."

# Parámetros personalizables
CHAINCODE_NAME="ccv"
CHAINCODE_LANG="javascript"
NETWORK_NAME="fabric_test"
CHANNEL_NAME="mychannel"
CC_VERSION=$(date +%s)  # Versión única por despliegue

# --- Funciones principales ---
clean_environment() {
    echo -e "${YELLOW}⚠️  Limpiando ambiente anterior...${RESET}"
    docker rm -f $(docker ps -aq --filter name=dev-peer*) 2>/dev/null || true
    docker volume prune -f
    rm -rf "${ROOT_DIR}/fabric/chaincode/${CHAINCODE_NAME}/node_modules"
}

start_network() {
    echo -e "\n${GREEN}🚀 Iniciando red Fabric...${RESET}"
    cd "${ROOT_DIR}/fabric/network"
    ./network.sh down
    if ! ./network.sh up -ca -s couchdb; then
        error_exit "Falló al iniciar la red"
    fi
}

deploy_chaincode() {
    echo -e "\n${GREEN}📦 Desplegando chaincode...${RESET}"
    cd "${ROOT_DIR}/fabric/network"
    
    echo -e "${YELLOW}⚙️  Empaquetando chaincode...${RESET}"
    if ! ./network.sh deployCC -ccn "$CHAINCODE_NAME" -ccp "../chaincode/${CHAINCODE_NAME}" -ccl "$CHAINCODE_LANG" -ccv "$CC_VERSION" -ccs 1; then
        error_exit "Falló el despliegue del chaincode"
    fi
}

install_dependencies() {
    echo -e "\n${YELLOW}📦 Instalando dependencias...${RESET}"
    cd "${ROOT_DIR}/fabric/chaincode/${CHAINCODE_NAME}"
    npm install --omit=dev --legacy-peer-deps
}

create_backup() {
    local backup_dir="${ROOT_DIR}/fabric/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    echo -e "${YELLOW}💾 Creando backup en $backup_dir...${RESET}"
    
    docker cp $(docker ps -q --filter name=peer0.org1.example.com):/var/hyperledger/production/ "$backup_dir/ledger" || true
    cp -r "${ROOT_DIR}/fabric/chaincode" "$backup_dir"
}

error_exit() {
    echo -e "${RED}⛔ ERROR: $1${RESET}"
    echo -e "${YELLOW}🔄 Intentando rollback...${RESET}"
    clean_environment
    exit 1
}

# --- Validación inicial ---
check_dependencies() {
    command -v docker >/dev/null 2>&1 || error_exit "Docker no instalado"
    command -v node >/dev/null 2>&1 || error_exit "Node.js no instalado"
    [ -f "${ROOT_DIR}/fabric/network/network.sh" ] || error_exit "Script network.sh no encontrado"
}

# --- Ejecución principal ---
main() {
    check_dependencies
    create_backup
    clean_environment
    start_network
    install_dependencies
    deploy_chaincode
    
    echo -e "\n${GREEN}✅ Despliegue exitoso!${RESET}"
    echo -e "Versión del chaincode: ${CC_VERSION}"
    echo -e "Contenedores activos:"
    docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' --filter network=$NETWORK_NAME
}

main
