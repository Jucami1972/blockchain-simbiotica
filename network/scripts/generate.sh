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

# Script para facilitar la generación de artefactos ejecutando
# el script 'generate-artifacts.sh' DENTRO de un contenedor efímero del servicio CLI.

set -euo pipefail # Salir en error, variable no definida, o error en pipe

# Directorio desde donde se ejecuta el script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT_HOST="${SCRIPT_DIR}/../.." # Raíz del proyecto blockchain-simbiotica/ en el HOST

# Funciones de logging
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
function log { echo -e "${BLUE}[$(date +"%T")] ${GREEN}INFO${NC}: $1"; }
function error_exit { echo -e "${BLUE}[$(date +"%T")] ${RED}ERROR${NC}: $1" >&2; exit 1; }

# Cargar variables de entorno desde docker/.env
ENV_FILE_PATH="${PROJECT_ROOT_HOST}/docker/.env"
if [ -f "${ENV_FILE_PATH}" ]; then
    log "Cargando variables de entorno desde ${ENV_FILE_PATH}"
    set -a
    # shellcheck source=/dev/null
    source <(grep -v '^#' "${ENV_FILE_PATH}" | sed -e 's/\r$//')
    set +a
else
    error_exit "Archivo de entorno ${ENV_FILE_PATH} no encontrado."
fi

# Verificar que PROJECT_ROOT_IN_CONTAINER esté definido en .env
: "${PROJECT_ROOT_IN_CONTAINER:?La variable PROJECT_ROOT_IN_CONTAINER no está definida en ${ENV_FILE_PATH}. Debe ser la ruta de montaje raíz del proyecto dentro del CLI (ej. /opt/gopath/src/github.com/hyperledger/fabric/peer)}"
: "${SCRIPTS_DIR_RELATIVE_TO_ROOT:?La variable SCRIPTS_DIR_RELATIVE_TO_ROOT no está definida en ${ENV_FILE_PATH}.}"
: "${FABRIC_CFG_DIR_RELATIVE_TO_ROOT:?La variable FABRIC_CFG_DIR_RELATIVE_TO_ROOT no está definida en ${ENV_FILE_PATH}.}"


# Nombre del servicio CLI definido en docker-compose.yaml
CLI_SERVICE_NAME="cli"
# Variable de entorno que se pasará al contenedor CLI (para que el script interno la use)
PROJECT_ROOT_IN_CONTAINER_ENV_VAR="PROJECT_ROOT_IN_CONTAINER=${PROJECT_ROOT_IN_CONTAINER}" # Toma el valor de .env

# Directorio donde se encuentra el script generate-artifacts.sh DENTRO del contenedor
# Se construye usando PROJECT_ROOT_IN_CONTAINER y SCRIPTS_DIR_RELATIVE_TO_ROOT del .env
CLI_SCRIPTS_DIR_IN_CONTAINER="${PROJECT_ROOT_IN_CONTAINER}/${SCRIPTS_DIR_RELATIVE_TO_ROOT}"
ARTIFACTS_SCRIPT_NAME="generate-artifacts.sh" # Nombre del script a ejecutar

# Ruta al docker-compose.yaml de Fabric
DOCKER_COMPOSE_FILE_PATH="${PROJECT_ROOT_HOST}/${FABRIC_CFG_DIR_RELATIVE_TO_ROOT}/docker-compose.yaml"

if [ ! -f "${DOCKER_COMPOSE_FILE_PATH}" ]; then
    error_exit "Archivo docker-compose.yaml de Fabric no encontrado en ${DOCKER_COMPOSE_FILE_PATH}"
fi

log "Intentando generar artefactos usando el servicio CLI '${CLI_SERVICE_NAME}' (con docker compose run)..."
log "El script a ejecutar dentro del contenedor es: ${ARTIFACTS_SCRIPT_NAME}"
log "Se ejecutará desde el directorio (workdir) DENTRO del contenedor: ${CLI_SCRIPTS_DIR_IN_CONTAINER}"
log "La variable PROJECT_ROOT_IN_CONTAINER se pasará al contenedor como: ${PROJECT_ROOT_IN_CONTAINER}"

# Comando para ejecutar el script dentro de un nuevo contenedor del servicio CLI
# Usamos --workdir para establecer el directorio de trabajo DENTRO del contenedor
# al lugar donde se encuentra el script generate-artifacts.sh.
# Luego, simplemente ejecutamos './generate-artifacts.sh'.
# docker compose run ya carga el .env especificado por --env-file, por lo que
# PROJECT_ROOT_IN_CONTAINER estará disponible para el script interno si está en .env
# y también para la interpolación en el docker-compose.yaml del CLI si es necesario.
# Pasar -e explícitamente asegura que esté disponible para la ejecución del comando bash.

docker compose -f "${DOCKER_COMPOSE_FILE_PATH}" --env-file "${ENV_FILE_PATH}" run --rm \
  -e "${PROJECT_ROOT_IN_CONTAINER_ENV_VAR}" \
  --workdir "${CLI_SCRIPTS_DIR_IN_CONTAINER}" \
  "${CLI_SERVICE_NAME}" \
  bash "./${ARTIFACTS_SCRIPT_NAME}"

EXIT_CODE=$?

if [ ${EXIT_CODE} -eq 0 ]; then
  log "Generación de artefactos completada exitosamente a través del contenedor CLI."
else
  error_exit "La generación de artefactos falló. Código de salida: ${EXIT_CODE}. Revisa los logs de la ejecución del contenedor."
fi

exit 0