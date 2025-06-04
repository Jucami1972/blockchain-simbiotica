#!/bin/bash

# Script para desplegar chaincodes en la red Blockchain Simbiótica
# Este script instala y aprueba los chaincodes en los peers de la red

# --- Variables de Configuración Clave (Asegúrate que coincidan con tu .env y estructura) ---
: "${PROJECT_ROOT_IN_CONTAINER:=/opt/gopath/src/github.com/hyperledger/fabric/peer/project_root}"
: "${CHANNEL_NAME:=simbioticachannel}"
: "${ORDERER_DOMAIN:=blockchain-simbiotica.com}"
: "${ORDERER0_HOSTNAME:=orderer0.${ORDERER_DOMAIN}}"
: "${ORG1_DOMAIN:=org1.${ORDERER_DOMAIN}}"
: "${ORG2_DOMAIN:=org2.${ORDERER_DOMAIN}}"
: "${ORG3_DOMAIN:=org3.${ORDERER_DOMAIN}}"
: "${ORG1_MSP_ID:=Org1MSP}"
: "${ORG2_MSP_ID:=Org2MSP}"
: "${ORG3_MSP_ID:=Org3MSP}"

DELAY=3
MAX_RETRY=5
# --- Fin Variables de Configuración ---

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m'

function printInfo() { echo -e "${BLUE}[INFO] $(date +"%T") $1${NC}"; }
function printSuccess() { echo -e "${GREEN}[SUCCESS] $(date +"%T") $1${NC}"; }
function printError() { echo -e "${RED}[ERROR] $(date +"%T") $1${NC}"; }
function printWarning() { echo -e "${YELLOW}[WARNING] $(date +"%T") $1${NC}"; }

function checkCommand() {
    if ! command -v "$1" &> /dev/null; then
        printError "$1 no está instalado. Por favor, instálelo antes de continuar."
        exit 1
    fi
}

checkCommand docker

if ! docker ps -q --filter "name=^cli$" --filter "status=running" | grep -q .; then
    printError "El contenedor CLI no está en ejecución. Por favor, inicie la red primero con ./start-network.sh"
    exit 1
fi

CC_BASE_PATH_IN_CLI="${PROJECT_ROOT_IN_CONTAINER}/chaincode"
CRYPTO_CONFIG_BASE_PATH_IN_CLI="${PROJECT_ROOT_IN_CONTAINER}/network/crypto-config"
ORDERER_CA_TLS_CERT_IN_CLI="${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/ordererOrganizations/${ORDERER_DOMAIN}/orderers/${ORDERER0_HOSTNAME}/msp/tlscacerts/tlsca.${ORDERER_DOMAIN}-cert.pem"
PEER_INTERNAL_PORT="7051"
ORDERER_INTERNAL_PORT="7050"

CHAINCODE_NAME=""
CHAINCODE_VERSION="1.0"
CHAINCODE_SEQUENCE="1"
CHAINCODE_LANG="node"
CHAINCODE_INIT_REQUIRED="--init-required"
CHAINCODE_ENDORSEMENT_POLICY="OR('${ORG1_MSP_ID}.member','${ORG2_MSP_ID}.member','${ORG3_MSP_ID}.member')"
CHAINCODE_COLLECTIONS_CONFIG_ARG=""
CHAINCODE_COLLECTIONS_CONFIG_FILE_PATH_IN_CLI=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -n|--name) CHAINCODE_NAME="$2"; shift 2 ;;
        -v|--version) CHAINCODE_VERSION="$2"; shift 2 ;;
        -s|--sequence) CHAINCODE_SEQUENCE="$2"; shift 2 ;;
        -p|--policy) CHAINCODE_ENDORSEMENT_POLICY="$2"; shift 2 ;;
        -c|--collections-config)
            CHAINCODE_COLLECTIONS_CONFIG_FILE_PATH_IN_CLI="${PROJECT_ROOT_IN_CONTAINER}/$2"
            CHAINCODE_COLLECTIONS_CONFIG_ARG="--collections-config ${CHAINCODE_COLLECTIONS_CONFIG_FILE_PATH_IN_CLI}"
            shift 2 ;;
        -l|--lang) CHAINCODE_LANG="$2"; shift 2 ;;
        --no-init) CHAINCODE_INIT_REQUIRED=""; shift ;;
        -h|--help)
            echo "Uso: $0 -n <nombre_chaincode> [opciones]"
            echo "Opciones:"
            echo "  -n, --name <nombre>                Nombre del chaincode (obligatorio)"
            echo "  -v, --version <versión>            Versión (def: 1.0)"
            echo "  -s, --sequence <secuencia>         Secuencia (def: 1)"
            echo "  -l, --lang <lenguaje>              Lenguaje (node, golang, java - def: node)"
            echo "  -p, --policy <política>            Política de endorsement"
            echo "  -c, --collections-config <ruta>    Ruta a config de colecciones (relativa a raíz del proyecto)"
            echo "  --no-init                          No incluir --init-required"
            echo "  -h, --help                         Muestra esta ayuda"
            exit 0 ;;
        *) printError "Argumento desconocido: $1"; exit 1 ;;
    esac
done

if [ -z "$CHAINCODE_NAME" ]; then
    printError "Debe especificar el nombre del chaincode con -n o --name."
    exit 1
fi
CHAINCODES_TO_DEPLOY=("$CHAINCODE_NAME")

PEERS_ORG1_HOSTNAMES=("peer0.${ORG1_DOMAIN}")
PEERS_ORG2_HOSTNAMES=("peer0.${ORG2_DOMAIN}")
PEERS_ORG3_HOSTNAMES=("peer0.${ORG3_DOMAIN}")

function packageChaincode() {
    local cc_name=$1; local cc_version=$2; local cc_lang=$3
    local cc_label="${cc_name}_${cc_version}"
    local cc_package_file="${cc_name}.tar.gz"
    local cc_src_path_in_cli="${CC_BASE_PATH_IN_CLI}/${cc_name}"
    printInfo "Empaquetando chaincode '${cc_name}' v${cc_version} (${cc_lang}) desde '${cc_src_path_in_cli}'..."
    docker exec cli bash -c "[ -d \"${cc_src_path_in_cli}\" ] || { echo 'ERROR: Directorio de código fuente del chaincode ${cc_src_path_in_cli} no encontrado.' >&2; exit 1; }"
    if [ $? -ne 0 ]; then exit 1; fi
    docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && peer lifecycle chaincode package \"${cc_package_file}\" --path \"${cc_src_path_in_cli}\" --lang \"${cc_lang}\" --label \"${cc_label}\""
    if [ $? -ne 0 ]; then printError "Error al empaquetar chaincode '${cc_name}'"; exit 1; fi
    printSuccess "Chaincode '${cc_name}' empaquetado correctamente como '${cc_package_file}'"
}

function installChaincodeOnPeer() {
    local cc_package_file_param=$1; local org_msp_id_param=$2; local org_full_domain_param=$3; local peer_full_hostname_param=$4
    
    printInfo "Instalando '${cc_package_file_param}' en '${peer_full_hostname_param}' de la organización '${org_msp_id_param}'..."
    local admin_msp_path="${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/peerOrganizations/${org_full_domain_param}/users/Admin@${org_full_domain_param}/msp"
    local peer_tls_rootcert_file="${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/peerOrganizations/${org_full_domain_param}/peers/${peer_full_hostname_param}/tls/ca.crt"
    
    printError "DEBUG SCRIPT (antes de docker exec) - admin_msp_path: [${admin_msp_path}]"
    printError "DEBUG SCRIPT (antes de docker exec) - peer_tls_rootcert_file: [${peer_tls_rootcert_file}]"
    
    # Corrección: Usar comillas simples para el comando bash -c para que las variables $VAR se pasen literalmente
    # y sean expandidas por el shell DENTRO del contenedor. Las variables pasadas con -e estarán disponibles.
    docker exec \
        -e "CORE_PEER_LOCALMSPID=${org_msp_id_param}" \
        -e "CORE_PEER_TLS_ENABLED=true" \
        -e "CORE_PEER_TLS_ROOTCERT_FILE=${peer_tls_rootcert_file}" \
        -e "CORE_PEER_MSPCONFIGPATH=${admin_msp_path}" \
        -e "CORE_PEER_ADDRESS=${peer_full_hostname_param}:${PEER_INTERNAL_PORT}" \
        -e "CC_PACKAGE_FILE_CLI=${cc_package_file_param}" \
        cli bash -c '
            echo "--- DEBUG DENTRO DEL CLI (antes de peer lifecycle install) ---";
            echo "CLI ENV - CORE_PEER_LOCALMSPID: ${CORE_PEER_LOCALMSPID}";
            echo "CLI ENV - CORE_PEER_ADDRESS: ${CORE_PEER_ADDRESS}";
            echo "CLI ENV - CORE_PEER_MSPCONFIGPATH: ${CORE_PEER_MSPCONFIGPATH}";
            echo "CLI ENV - CORE_PEER_TLS_ROOTCERT_FILE: ${CORE_PEER_TLS_ROOTCERT_FILE}";
            echo "CLI ENV - CC_PACKAGE_FILE_CLI: ${CC_PACKAGE_FILE_CLI}";
            echo "-------------------------------------------------------------";
            peer lifecycle chaincode install "/opt/gopath/src/github.com/hyperledger/fabric/peer/${CC_PACKAGE_FILE_CLI}"
        '
        
    if [ $? -ne 0 ]; then printError "Error al instalar chaincode en '${peer_full_hostname_param}'"; exit 1; fi
    printSuccess "Chaincode instalado correctamente en '${peer_full_hostname_param}'"
}

function queryInstalledPackageId() {
    local cc_label=$1; local org_msp_id=$2; local org_full_domain=$3; local peer_full_hostname=$4
    printInfo "Consultando ID del paquete para la etiqueta '${cc_label}' en '${peer_full_hostname}'..."
    local admin_msp_path="${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/peerOrganizations/${org_full_domain}/users/Admin@${org_full_domain}/msp"
    local peer_tls_rootcert_file="${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/peerOrganizations/${org_full_domain}/peers/${peer_full_hostname}/tls/ca.crt"
    local query_output
    query_output=$(docker exec \
        -e "CORE_PEER_LOCALMSPID=${org_msp_id}" \
        -e "CORE_PEER_TLS_ENABLED=true" \
        -e "CORE_PEER_TLS_ROOTCERT_FILE=${peer_tls_rootcert_file}" \
        -e "CORE_PEER_MSPCONFIGPATH=${admin_msp_path}" \
        -e "CORE_PEER_ADDRESS=${peer_full_hostname}:${PEER_INTERNAL_PORT}" \
        cli peer lifecycle chaincode queryinstalled 2>&1)
    if [ $? -ne 0 ]; then printError "Error al consultar en '${peer_full_hostname}'. Salida: ${query_output}"; exit 1; fi
    PACKAGE_ID=$(echo "${query_output}" | grep "Package ID: ${cc_label}:" | sed -n "s/Package ID: ${cc_label}:\([^,]*\),.*/\1/p")
    if [ -z "$PACKAGE_ID" ]; then printError "No se pudo encontrar ID del paquete para '${cc_label}' en '${peer_full_hostname}'. Salida: ${query_output}"; exit 1; fi
    echo "${PACKAGE_ID}"
}

function approveChaincodeForMyOrg() {
    local cc_name=$1; local cc_version=$2; local cc_sequence=$3; local package_id=$4
    local org_msp_id=$5; local org_full_domain=$6; local peer_full_hostname=$7
    local endorsement_policy=$8; local collections_config_arg=$9
    printInfo "Aprobando CC '${cc_name}' v${cc_version} seq${cc_sequence} para '${org_msp_id}' en '${peer_full_hostname}'..."
    local admin_msp_path="${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/peerOrganizations/${org_full_domain}/users/Admin@${org_full_domain}/msp"
    local peer_tls_rootcert_file="${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/peerOrganizations/${org_full_domain}/peers/${peer_full_hostname}/tls/ca.crt"
    # printError "DEBUG SCRIPT (approve) - admin_msp_path: [${admin_msp_path}]" # Descomentar si es necesario
    docker exec \
        -e "CORE_PEER_LOCALMSPID=${org_msp_id}" \
        -e "CORE_PEER_TLS_ENABLED=true" \
        -e "CORE_PEER_TLS_ROOTCERT_FILE=${peer_tls_rootcert_file}" \
        -e "CORE_PEER_MSPCONFIGPATH=${admin_msp_path}" \
        -e "CORE_PEER_ADDRESS=${peer_full_hostname}:${PEER_INTERNAL_PORT}" \
        cli peer lifecycle chaincode approveformyorg \
            -o "${ORDERER0_HOSTNAME}:${ORDERER_INTERNAL_PORT}" --tls --cafile "${ORDERER_CA_TLS_CERT_IN_CLI}" \
            --channelID "${CHANNEL_NAME}" --name "${cc_name}" --version "${cc_version}" \
            --package-id "${package_id}" --sequence "${cc_sequence}" \
            ${CHAINCODE_INIT_REQUIRED} --signature-policy "${endorsement_policy}" \
            ${collections_config_arg}
    if [ $? -ne 0 ]; then printError "Error al aprobar CC '${cc_name}' para '${org_msp_id}'"; exit 1; fi
    printSuccess "CC '${cc_name}' aprobado para '${org_msp_id}'"
}

function checkCommitReadiness() {
    local cc_name=$1; local cc_version=$2; local cc_sequence=$3
    local endorsement_policy=$4; local collections_config_arg=$5
    printInfo "Verificando si '${cc_name}' listo para commit en '${CHANNEL_NAME}' (usando ${PEERS_ORG1_HOSTNAMES[0]})..."
    local admin_msp_path="${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/peerOrganizations/${ORG1_DOMAIN}/users/Admin@${ORG1_DOMAIN}/msp"
    local peer_tls_rootcert_file="${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/peerOrganizations/${ORG1_DOMAIN}/peers/${PEERS_ORG1_HOSTNAMES[0]}/tls/ca.crt"
    docker exec \
        -e "CORE_PEER_LOCALMSPID=${ORG1_MSP_ID}" \
        -e "CORE_PEER_TLS_ENABLED=true" \
        -e "CORE_PEER_TLS_ROOTCERT_FILE=${peer_tls_rootcert_file}" \
        -e "CORE_PEER_MSPCONFIGPATH=${admin_msp_path}" \
        -e "CORE_PEER_ADDRESS=${PEERS_ORG1_HOSTNAMES[0]}:${PEER_INTERNAL_PORT}" \
        cli peer lifecycle chaincode checkcommitreadiness \
            --channelID "${CHANNEL_NAME}" --name "${cc_name}" --version "${cc_version}" \
            --sequence "${cc_sequence}" ${CHAINCODE_INIT_REQUIRED} \
            --signature-policy "${endorsement_policy}" \
            ${collections_config_arg} --output json
    printInfo "Verificación de 'checkcommitreadiness' completada."
}

function commitChaincodeDefinition() {
    local cc_name=$1; local cc_version=$2; local cc_sequence=$3
    local endorsement_policy=$4; local collections_config_arg=$5
    printInfo "Confirmando definición de '${cc_name}' v${cc_version} seq${cc_sequence} en '${CHANNEL_NAME}'..."
    local peer_addresses_args=""
    peer_addresses_args+=" --peerAddresses ${PEERS_ORG1_HOSTNAMES[0]}:${PEER_INTERNAL_PORT} --tlsRootCertFiles ${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/peerOrganizations/${ORG1_DOMAIN}/peers/${PEERS_ORG1_HOSTNAMES[0]}/tls/ca.crt"
    peer_addresses_args+=" --peerAddresses ${PEERS_ORG2_HOSTNAMES[0]}:${PEER_INTERNAL_PORT} --tlsRootCertFiles ${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/peerOrganizations/${ORG2_DOMAIN}/peers/${PEERS_ORG2_HOSTNAMES[0]}/tls/ca.crt"
    peer_addresses_args+=" --peerAddresses ${PEERS_ORG3_HOSTNAMES[0]}:${PEER_INTERNAL_PORT} --tlsRootCertFiles ${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/peerOrganizations/${ORG3_DOMAIN}/peers/${PEERS_ORG3_HOSTNAMES[0]}/tls/ca.crt"
    docker exec cli peer lifecycle chaincode commit \
        -o "${ORDERER0_HOSTNAME}:${ORDERER_INTERNAL_PORT}" \
        --tls --cafile "${ORDERER_CA_TLS_CERT_IN_CLI}" \
        --channelID "${CHANNEL_NAME}" --name "${cc_name}" --version "${cc_version}" \
        --sequence "${cc_sequence}" ${CHAINCODE_INIT_REQUIRED} \
        --signature-policy "${endorsement_policy}" \
        ${collections_config_arg} ${peer_addresses_args}
    if [ $? -ne 0 ]; then printError "Error al confirmar definición del CC '${cc_name}'"; exit 1; fi
    printSuccess "Definición de CC '${cc_name}' confirmada en '${CHANNEL_NAME}'"
}

function queryCommittedChaincode() {
    local cc_name=$1
    local admin_msp_path="${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/peerOrganizations/${ORG1_DOMAIN}/users/Admin@${ORG1_DOMAIN}/msp"
    local peer_tls_rootcert_file="${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/peerOrganizations/${ORG1_DOMAIN}/peers/${PEERS_ORG1_HOSTNAMES[0]}/tls/ca.crt"
    printInfo "Consultando '${cc_name}' confirmado en '${CHANNEL_NAME}' (usando ${PEERS_ORG1_HOSTNAMES[0]})..."
    docker exec \
        -e "CORE_PEER_LOCALMSPID=${ORG1_MSP_ID}" \
        -e "CORE_PEER_TLS_ENABLED=true" \
        -e "CORE_PEER_TLS_ROOTCERT_FILE=${peer_tls_rootcert_file}" \
        -e "CORE_PEER_MSPCONFIGPATH=${admin_msp_path}" \
        -e "CORE_PEER_ADDRESS=${PEERS_ORG1_HOSTNAMES[0]}:${PEER_INTERNAL_PORT}" \
        cli peer lifecycle chaincode querycommitted --channelID "${CHANNEL_NAME}" --name "${cc_name}" -O json
}

function invokeInitFunction() {
    local cc_name=$1
    local peer_addresses_args="" 
    peer_addresses_args+=" --peerAddresses ${PEERS_ORG1_HOSTNAMES[0]}:${PEER_INTERNAL_PORT} --tlsRootCertFiles ${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/peerOrganizations/${ORG1_DOMAIN}/peers/${PEERS_ORG1_HOSTNAMES[0]}/tls/ca.crt"
    peer_addresses_args+=" --peerAddresses ${PEERS_ORG2_HOSTNAMES[0]}:${PEER_INTERNAL_PORT} --tlsRootCertFiles ${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/peerOrganizations/${ORG2_DOMAIN}/peers/${PEERS_ORG2_HOSTNAMES[0]}/tls/ca.crt"
    peer_addresses_args+=" --peerAddresses ${PEERS_ORG3_HOSTNAMES[0]}:${PEER_INTERNAL_PORT} --tlsRootCertFiles ${CRYPTO_CONFIG_BASE_PATH_IN_CLI}/peerOrganizations/${ORG3_DOMAIN}/peers/${PEERS_ORG3_HOSTNAMES[0]}/tls/ca.crt"
    printInfo "Invocando función de inicialización para '${cc_name}' en '${CHANNEL_NAME}'..."
    docker exec cli peer chaincode invoke \
        -o "${ORDERER0_HOSTNAME}:${ORDERER_INTERNAL_PORT}" \
        --tls --cafile "${ORDERER_CA_TLS_CERT_IN_CLI}" \
        -C "${CHANNEL_NAME}" -n "${cc_name}" \
        ${peer_addresses_args} \
        --isInit -c '{"Args":[]}'
    if [ $? -ne 0 ]; then 
        printWarning "La invocación --isInit para '${cc_name}' falló o no fue necesaria."
    else
        printSuccess "Invocación --isInit para '${cc_name}' completada."
    fi
}

# --- Flujo Principal de Despliegue ---
for CURRENT_CC_NAME in "${CHAINCODES_TO_DEPLOY[@]}"; do
    printInfo "--- Iniciando despliegue para Chaincode: ${CURRENT_CC_NAME} v${CHAINCODE_VERSION} seq${CHAINCODE_SEQUENCE} ---"
    
    CC_PACKAGE_FILE="${CURRENT_CC_NAME}.tar.gz"
    CC_LABEL="${CURRENT_CC_NAME}_${CHAINCODE_VERSION}"

    packageChaincode "${CURRENT_CC_NAME}" "${CHAINCODE_VERSION}" "${CHAINCODE_LANG}"
    
    printError "DEBUG MAIN LOOP - Llamando a installChaincodeOnPeer para Org1 con:"
    printError "DEBUG MAIN LOOP - CC_PACKAGE_FILE: [${CC_PACKAGE_FILE}]"
    printError "DEBUG MAIN LOOP - ORG1_MSP_ID: [${ORG1_MSP_ID}]"
    printError "DEBUG MAIN LOOP - ORG1_DOMAIN: [${ORG1_DOMAIN}]"
    printError "DEBUG MAIN LOOP - PEER0_HOSTNAME (Org1): [${PEERS_ORG1_HOSTNAMES[0]}]"
    installChaincodeOnPeer "${CC_PACKAGE_FILE}" "${ORG1_MSP_ID}" "${ORG1_DOMAIN}" "${PEERS_ORG1_HOSTNAMES[0]}"
    
    printError "DEBUG MAIN LOOP - Llamando a installChaincodeOnPeer para Org2 con:"
    printError "DEBUG MAIN LOOP - ORG2_MSP_ID: [${ORG2_MSP_ID}]"
    printError "DEBUG MAIN LOOP - ORG2_DOMAIN: [${ORG2_DOMAIN}]"
    printError "DEBUG MAIN LOOP - PEER0_HOSTNAME (Org2): [${PEERS_ORG2_HOSTNAMES[0]}]"
    installChaincodeOnPeer "${CC_PACKAGE_FILE}" "${ORG2_MSP_ID}" "${ORG2_DOMAIN}" "${PEERS_ORG2_HOSTNAMES[0]}"
    
    printError "DEBUG MAIN LOOP - Llamando a installChaincodeOnPeer para Org3 con:"
    printError "DEBUG MAIN LOOP - ORG3_MSP_ID: [${ORG3_MSP_ID}]"
    printError "DEBUG MAIN LOOP - ORG3_DOMAIN: [${ORG3_DOMAIN}]"
    printError "DEBUG MAIN LOOP - PEER0_HOSTNAME (Org3): [${PEERS_ORG3_HOSTNAMES[0]}]"
    installChaincodeOnPeer "${CC_PACKAGE_FILE}" "${ORG3_MSP_ID}" "${ORG3_DOMAIN}" "${PEERS_ORG3_HOSTNAMES[0]}"
    
    PACKAGE_ID=$(queryInstalledPackageId "${CC_LABEL}" "${ORG1_MSP_ID}" "${ORG1_DOMAIN}" "${PEERS_ORG1_HOSTNAMES[0]}")
    printInfo "ID del paquete obtenido para '${CC_LABEL}': ${PACKAGE_ID}"
    if [ -z "${PACKAGE_ID}" ]; then error_exit "No se pudo obtener el PACKAGE_ID. Abortando."; fi
    
    approveChaincodeForMyOrg "${CURRENT_CC_NAME}" "${CHAINCODE_VERSION}" "${CHAINCODE_SEQUENCE}" "${PACKAGE_ID}" "${ORG1_MSP_ID}" "${ORG1_DOMAIN}" "${PEERS_ORG1_HOSTNAMES[0]}" "${CHAINCODE_ENDORSEMENT_POLICY}" "${CHAINCODE_COLLECTIONS_CONFIG_ARG}"
    approveChaincodeForMyOrg "${CURRENT_CC_NAME}" "${CHAINCODE_VERSION}" "${CHAINCODE_SEQUENCE}" "${PACKAGE_ID}" "${ORG2_MSP_ID}" "${ORG2_DOMAIN}" "${PEERS_ORG2_HOSTNAMES[0]}" "${CHAINCODE_ENDORSEMENT_POLICY}" "${CHAINCODE_COLLECTIONS_CONFIG_ARG}"
    approveChaincodeForMyOrg "${CURRENT_CC_NAME}" "${CHAINCODE_VERSION}" "${CHAINCODE_SEQUENCE}" "${PACKAGE_ID}" "${ORG3_MSP_ID}" "${ORG3_DOMAIN}" "${PEERS_ORG3_HOSTNAMES[0]}" "${CHAINCODE_ENDORSEMENT_POLICY}" "${CHAINCODE_COLLECTIONS_CONFIG_ARG}"
    
    checkCommitReadiness "${CURRENT_CC_NAME}" "${CHAINCODE_VERSION}" "${CHAINCODE_SEQUENCE}" "${CHAINCODE_ENDORSEMENT_POLICY}" "${CHAINCODE_COLLECTIONS_CONFIG_ARG}"
    
    commitChaincodeDefinition "${CURRENT_CC_NAME}" "${CHAINCODE_VERSION}" "${CHAINCODE_SEQUENCE}" "${CHAINCODE_ENDORSEMENT_POLICY}" "${CHAINCODE_COLLECTIONS_CONFIG_ARG}"
    
    queryCommittedChaincode "${CURRENT_CC_NAME}"

    if [ "${CHAINCODE_INIT_REQUIRED}" == "--init-required" ]; then
        invokeInitFunction "${CURRENT_CC_NAME}"
    fi
    
    printSuccess "Chaincode '${CURRENT_CC_NAME}' desplegado y configurado exitosamente en '${CHANNEL_NAME}'."
done

printSuccess "Todos los chaincodes especificados han sido procesados."

```

**Cambios Clave en esta Versión:**

1.  **Corrección del Error de Sintaxis:** Se eliminó la definición de función anidada `installChaincodeOnPeer` dentro de sí misma.
2.  **Ajuste en `docker exec` para Depuración Interna:**
    * La cadena de comandos para `bash -c` ahora está entre **comillas simples (`'...'`)**. Esto es crucial porque evita que el shell del *host* intente expandir las variables `\$CORE_PEER_...` que están destinadas a ser expandidas por el shell *dentro* del contenedor.
    * Dentro de las comillas simples, las variables de entorno como `${CORE_PEER_LOCALMSPID}` (ahora sin el `\`) serán expandidas por el shell del contenedor `cli`, que tiene acceso a ellas a través de las opciones `-e` del `docker exec`.
    * La variable `${cc_package_file_param}` (que es un parámetro de la función y cuyo valor se conoce en el host) se inyecta en la cadena de comillas simples usando la concatenación de cadenas de Bash: `'/path/to/file/'"${cc_package_file_param}"`.

**Por favor, prueba esta versión actualizada.** Con estos cambios, las líneas de depuración `CLI ENV - ...` deberían ahora mostrar los valores correctos de las variables de entorno tal como las ve el comando `peer` dentro del contenedor. Esto nos ayudará a confirmar si las rutas se están pasando correctamente hasta el final.

Ejecuta:
```bash
./deploy-chaincode.sh -n token
```
Y comparte la salida comple