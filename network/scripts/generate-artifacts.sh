#!/bin/bash

# Copyright 2024 Blockchain Simbiótica Project Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# Script para generar artefactos criptográficos y de canal.
# ESTE SCRIPT ESTÁ DISEÑADO PARA SER EJECUTADO DENTRO DEL CONTENEDOR CLI DE FABRIC-TOOLS.

# Salir inmediatamente si un comando falla o una variable no está definida
set -euo pipefail

# --- Definición de Rutas DENTRO del Contenedor CLI ---
# La variable PROJECT_ROOT_IN_CONTAINER se pasará como variable de entorno al ejecutar `docker compose exec`
# o se puede definir aquí si se prefiere una ruta fija dentro del contenedor.
# Por defecto, el script 'generate.sh' (envoltorio) la pasará.
: "${PROJECT_ROOT_IN_CONTAINER:?La variable PROJECT_ROOT_IN_CONTAINER debe estar definida (ej. /opt/gopath/src/github.com/hyperledger/fabric/peer/project_root)}"
# --- Fin Definición de Rutas ---

# Funciones de logging
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
function log { echo -e "${BLUE}[$(date +"%T")] ${GREEN}INFO${NC}: $1"; }
function error_exit { echo -e "${BLUE}[$(date +"%T")] ${RED}ERROR${NC}: $1" >&2; exit 1; }
function warn { echo -e "${BLUE}[$(date +"%T")] ${YELLOW}WARN${NC}: $1"; }

# Cargar variables de entorno desde .env ubicado en la raíz del proyecto (mapeado)
# Las variables ya deberían estar disponibles en el entorno del contenedor CLI
# si se pasaron con `docker compose exec -e VAR=valor` o si el .env se carga
# al inicio del contenedor CLI (no es el caso aquí, se pasan explícitamente).
# Sin embargo, para robustez, intentamos cargarlas si el script se llamara de otra forma.
ENV_FILE_IN_CONTAINER="${PROJECT_ROOT_IN_CONTAINER}/docker/.env"

if [ -f "${ENV_FILE_IN_CONTAINER}" ]; then
    log "Cargando variables de entorno desde ${ENV_FILE_IN_CONTAINER} (dentro del contenedor)"
    set -a
    # shellcheck source=/dev/null
    source <(grep -v '^#' "${ENV_FILE_IN_CONTAINER}" | sed -e 's/\r$//')
    set +a
else
    warn "Archivo de entorno ${ENV_FILE_IN_CONTAINER} no encontrado dentro del contenedor. Se asumirá que las variables necesarias fueron pasadas al entorno del contenedor."
fi

# Verificar que las variables necesarias del .env estén cargadas/pasadas
: "${FABRIC_TOOLS_VERSION:?Variable FABRIC_TOOLS_VERSION no definida}"
: "${FABRIC_CFG_DIR_RELATIVE_TO_ROOT:?Variable FABRIC_CFG_DIR_RELATIVE_TO_ROOT no definida}"
: "${NETWORK_DIR_RELATIVE_TO_ROOT:?Variable NETWORK_DIR_RELATIVE_TO_ROOT no definida}"
: "${CRYPTO_CONFIG_SUBDIR:?Variable CRYPTO_CONFIG_SUBDIR no definida}"
: "${CHANNEL_ARTIFACTS_SUBDIR:?Variable CHANNEL_ARTIFACTS_SUBDIR no definida}"
: "${GENESIS_PROFILE_NAME:?Variable GENESIS_PROFILE_NAME no definida}"
: "${SYSTEM_CHANNEL_NAME:?Variable SYSTEM_CHANNEL_NAME no definida}"
: "${CHANNEL_NAME:?Variable CHANNEL_NAME no definida}"
: "${CHANNEL_PROFILE:?Variable CHANNEL_PROFILE no definida}"
: "${ORG1_MSP_ID:?Variable ORG1_MSP_ID no definida}"
: "${ORG2_MSP_ID:?Variable ORG2_MSP_ID no definida}"
# Si tienes Org3MSP, también deberías verificarla aquí, por ejemplo:
# : "${ORG3_MSP_ID:?Variable ORG3_MSP_ID no definida}"

# Construir rutas absolutas DENTRO del contenedor
FABRIC_CFG_PATH_ABS_IN_CONTAINER="${PROJECT_ROOT_IN_CONTAINER}/${FABRIC_CFG_DIR_RELATIVE_TO_ROOT}" # Ajustado para usar variable
NETWORK_PATH_ABS_IN_CONTAINER="${PROJECT_ROOT_IN_CONTAINER}/${NETWORK_DIR_RELATIVE_TO_ROOT}"
CRYPTO_CONFIG_OUTPUT_DIR_ABS_IN_CONTAINER="${NETWORK_PATH_ABS_IN_CONTAINER}/${CRYPTO_CONFIG_SUBDIR}"
CHANNEL_ARTIFACTS_OUTPUT_DIR_ABS_IN_CONTAINER="${NETWORK_PATH_ABS_IN_CONTAINER}/${CHANNEL_ARTIFACTS_SUBDIR}"

log "Ruta raíz del proyecto en contenedor: ${PROJECT_ROOT_IN_CONTAINER}"
log "Ruta de configuración de Fabric en contenedor: ${FABRIC_CFG_PATH_ABS_IN_CONTAINER}"
log "Ruta de salida para crypto-config en contenedor: ${CRYPTO_CONFIG_OUTPUT_DIR_ABS_IN_CONTAINER}"
log "Ruta de salida para channel-artifacts en contenedor: ${CHANNEL_ARTIFACTS_OUTPUT_DIR_ABS_IN_CONTAINER}"


# Verificar si las herramientas de Fabric están disponibles (ya deberían estarlo en el contenedor fabric-tools)
if ! command -v cryptogen &> /dev/null; then
    error_exit "cryptogen (v${FABRIC_TOOLS_VERSION}) no está disponible dentro del contenedor CLI."
fi
if ! command -v configtxgen &> /dev/null; then
    error_exit "configtxgen (v${FABRIC_TOOLS_VERSION}) no está disponible dentro del contenedor CLI."
fi

log "Limpiando directorios de artefactos antiguos (rutas dentro del contenedor)..."
rm -rf "${CRYPTO_CONFIG_OUTPUT_DIR_ABS_IN_CONTAINER:?}"/*
rm -rf "${CHANNEL_ARTIFACTS_OUTPUT_DIR_ABS_IN_CONTAINER:?}"/*
mkdir -p "${CRYPTO_CONFIG_OUTPUT_DIR_ABS_IN_CONTAINER}"
mkdir -p "${CHANNEL_ARTIFACTS_OUTPUT_DIR_ABS_IN_CONTAINER}"

# --- Generación de Material Criptográfico con cryptogen ---
log "Generando material criptográfico con cryptogen..."
CRYPTO_CONFIG_YAML_FILE_PATH_ABS_IN_CONTAINER="${FABRIC_CFG_PATH_ABS_IN_CONTAINER}/crypto-config.yaml" # Asumiendo que crypto-config.yaml está junto a configtx.yaml
if [ ! -f "${CRYPTO_CONFIG_YAML_FILE_PATH_ABS_IN_CONTAINER}" ]; then
    error_exit "Archivo de configuración criptográfica ${CRYPTO_CONFIG_YAML_FILE_PATH_ABS_IN_CONTAINER} no encontrado."
fi

cryptogen generate --config="${CRYPTO_CONFIG_YAML_FILE_PATH_ABS_IN_CONTAINER}" --output="${CRYPTO_CONFIG_OUTPUT_DIR_ABS_IN_CONTAINER}"
if [ $? -ne 0 ]; then
    error_exit "Fallo al generar material criptográfico. Abortando."
fi
log "Material criptográfico generado en ${CRYPTO_CONFIG_OUTPUT_DIR_ABS_IN_CONTAINER}"

# ----- INICIO DE LÍNEAS DE DEPURACIÓN AÑADIDAS -----
log "VERIFICANDO CONTENIDO COMPLETO DE CRYPTO-CONFIG DESPUÉS DE CRYPTOGEN:"
ls -Rla "${CRYPTO_CONFIG_OUTPUT_DIR_ABS_IN_CONTAINER}"
log "VERIFICANDO ESPECÍFICAMENTE TLS DE orderer0.blockchain-simbiotica.com:"
# Asegúrate que las rutas aquí coincidan con la estructura que genera cryptogen
ls -la "${CRYPTO_CONFIG_OUTPUT_DIR_ABS_IN_CONTAINER}/ordererOrganizations/blockchain-simbiotica.com/orderers/orderer0.blockchain-simbiotica.com/tls/" || log "Directorio TLS para orderer0 no encontrado o ls falló"
log "VERIFICANDO ESPECÍFICAMENTE TLS DE orderer1.blockchain-simbiotica.com:"
ls -la "${CRYPTO_CONFIG_OUTPUT_DIR_ABS_IN_CONTAINER}/ordererOrganizations/blockchain-simbiotica.com/orderers/orderer1.blockchain-simbiotica.com/tls/" || log "Directorio TLS para orderer1 no encontrado o ls falló"
# Puedes añadir más 'ls' para otros orderers si es necesario, por ejemplo:
# log "VERIFICANDO ESPECÍFICAMENTE TLS DE orderer2.blockchain-simbiotica.com:"
# ls -la "${CRYPTO_CONFIG_OUTPUT_DIR_ABS_IN_CONTAINER}/ordererOrganizations/blockchain-simbiotica.com/orderers/orderer2.blockchain-simbiotica.com/tls/" || log "Directorio TLS para orderer2 no encontrado o ls falló"
# log "VERIFICANDO ESPECÍFICAMENTE TLS DE orderer3.blockchain-simbiotica.com:"
# ls -la "${CRYPTO_CONFIG_OUTPUT_DIR_ABS_IN_CONTAINER}/ordererOrganizations/blockchain-simbiotica.com/orderers/orderer3.blockchain-simbiotica.com/tls/" || log "Directorio TLS para orderer3 no encontrado o ls falló"
# log "VERIFICANDO ESPECÍFICAMENTE TLS DE orderer4.blockchain-simbiotica.com:"
# ls -la "${CRYPTO_CONFIG_OUTPUT_DIR_ABS_IN_CONTAINER}/ordererOrganizations/blockchain-simbiotica.com/orderers/orderer4.blockchain-simbiotica.com/tls/" || log "Directorio TLS para orderer4 no encontrado o ls falló"
log "FIN DE VERIFICACIÓN DE CONTENIDO."
# ----- FIN DE LÍNEAS DE DEPURACIÓN AÑADIDAS -----

# --- Generación de Artefactos de Canal con configtxgen ---
log "Generando artefactos de canal con configtxgen..."
# Establecer FABRIC_CFG_PATH para que configtxgen encuentre configtx.yaml
export FABRIC_CFG_PATH="${FABRIC_CFG_PATH_ABS_IN_CONTAINER}"

# Cambiar al directorio de salida de los artefactos de canal para que configtxgen escriba allí directamente,
# O asegurar que las rutas en outputBlock, outputCreateChannelTx, etc., sean absolutas o relativas al CWD.
# El script original cambiaba a NETWORK_PATH_ABS_IN_CONTAINER. Mantendremos eso por ahora.
cd "${NETWORK_PATH_ABS_IN_CONTAINER}"

# 1. Generar Bloque Génesis del Orderer
log "Generando bloque génesis del orderer (Perfil: ${GENESIS_PROFILE_NAME}, Canal Sistema: ${SYSTEM_CHANNEL_NAME})..."
configtxgen -profile "${GENESIS_PROFILE_NAME}" -channelID "${SYSTEM_CHANNEL_NAME}" -outputBlock "${CHANNEL_ARTIFACTS_OUTPUT_DIR_ABS_IN_CONTAINER}/genesis.block"
if [ $? -ne 0 ]; then
    error_exit "Fallo al generar el bloque génesis. Abortando."
fi
log "Bloque génesis generado en ${CHANNEL_ARTIFACTS_OUTPUT_DIR_ABS_IN_CONTAINER}/genesis.block"

# 2. Generar Transacción de Creación del Canal de Aplicación
log "Generando transacción de creación del canal '${CHANNEL_NAME}' (Perfil: ${CHANNEL_PROFILE})..."
configtxgen -profile "${CHANNEL_PROFILE}" -outputCreateChannelTx "${CHANNEL_ARTIFACTS_OUTPUT_DIR_ABS_IN_CONTAINER}/channel.tx" -channelID "${CHANNEL_NAME}"
if [ $? -ne 0 ]; then
    error_exit "Fallo al generar la transacción de creación del canal. Abortando."
fi
log "Transacción de creación del canal generada en ${CHANNEL_ARTIFACTS_OUTPUT_DIR_ABS_IN_CONTAINER}/channel.tx"

# 3. Generar Transacciones de Actualización de Anchor Peer para Org1MSP
log "Generando transacción de anchor peer para ${ORG1_MSP_ID} en el canal '${CHANNEL_NAME}'..."
configtxgen -profile "${CHANNEL_PROFILE}" -outputAnchorPeersUpdate "${CHANNEL_ARTIFACTS_OUTPUT_DIR_ABS_IN_CONTAINER}/${ORG1_MSP_ID}anchors.tx" -channelID "${CHANNEL_NAME}" -asOrg "${ORG1_MSP_ID}"
if [ $? -ne 0 ]; then
    error_exit "Fallo al generar la transacción de anchor peer para ${ORG1_MSP_ID}. Abortando."
fi
log "Transacción de anchor peer para ${ORG1_MSP_ID} generada en ${CHANNEL_ARTIFACTS_OUTPUT_DIR_ABS_IN_CONTAINER}/${ORG1_MSP_ID}anchors.tx"

# 4. Generar Transacciones de Actualización de Anchor Peer para Org2MSP
log "Generando transacción de anchor peer para ${ORG2_MSP_ID} en el canal '${CHANNEL_NAME}'..."
configtxgen -profile "${CHANNEL_PROFILE}" -outputAnchorPeersUpdate "${CHANNEL_ARTIFACTS_OUTPUT_DIR_ABS_IN_CONTAINER}/${ORG2_MSP_ID}anchors.tx" -channelID "${CHANNEL_NAME}" -asOrg "${ORG2_MSP_ID}"
if [ $? -ne 0 ]; then
    error_exit "Fallo al generar la transacción de anchor peer para ${ORG2_MSP_ID}. Abortando."
fi
log "Transacción de anchor peer para ${ORG2_MSP_ID} generada en ${CHANNEL_ARTIFACTS_OUTPUT_DIR_ABS_IN_CONTAINER}/${ORG2_MSP_ID}anchors.tx"

# 5. Generar Transacciones de Actualización de Anchor Peer para Org3MSP (si existe)
# Asumiendo que ORG3_MSP_ID es una variable que se define si Org3 existe
if [ -n "${ORG3_MSP_ID:-}" ]; then # Comprueba si ORG3_MSP_ID está definida y no vacía
  log "Generando transacción de anchor peer para ${ORG3_MSP_ID} en el canal '${CHANNEL_NAME}'..."
  configtxgen -profile "${CHANNEL_PROFILE}" -outputAnchorPeersUpdate "${CHANNEL_ARTIFACTS_OUTPUT_DIR_ABS_IN_CONTAINER}/${ORG3_MSP_ID}anchors.tx" -channelID "${CHANNEL_NAME}" -asOrg "${ORG3_MSP_ID}"
  if [ $? -ne 0 ]; then
      error_exit "Fallo al generar la transacción de anchor peer para ${ORG3_MSP_ID}. Abortando."
  fi
  log "Transacción de anchor peer para ${ORG3_MSP_ID} generada en ${CHANNEL_ARTIFACTS_OUTPUT_DIR_ABS_IN_CONTAINER}/${ORG3_MSP_ID}anchors.tx"
else
  log "ORG3_MSP_ID no definida, omitiendo generación de anchor peer para Org3."
fi

log "Todos los artefactos han sido generados exitosamente dentro del contenedor."
log "Puedes verificar los artefactos en el host en las rutas mapeadas."

exit 0