#!/bin/bash

# Script para detener y limpiar la red Blockchain Simbiótica
# Este script detiene todos los contenedores y limpia los recursos

# --- Configuración de Paths ---
# Obtenemos la ruta absoluta a la raíz del proyecto (asumiendo que este script está en network/scripts/)
PROJECT_ROOT_ABS="$(cd "$(dirname "$0")/../.." && pwd)"

ENV_FILE="${PROJECT_ROOT_ABS}/docker/.env"
FABRIC_COMPOSE_FILE="${PROJECT_ROOT_ABS}/docker/fabric/docker-compose.yaml"
# Si tienes un archivo compose para Explorer, descomenta y ajusta la siguiente línea:
# EXPLORER_COMPOSE_FILE="${PROJECT_ROOT_ABS}/docker/explorer/docker-compose.yaml"

# --- Cargar Variables de Entorno ---
# Necesitamos COMPOSE_PROJECT_NAME para los comandos de docker compose
if [ -f "${ENV_FILE}" ]; then
    # Exporta las variables del .env para que estén disponibles para docker compose -p
    # y para cualquier otro comando en el script si fuera necesario.
    export $(grep -v '^#' "${ENV_FILE}" | sed -e 's/[[:space:]]*#.*$//' -e 's/[[:space:]]*$//' | xargs)
else
    echo -e "\033[0;31mERROR\033[0m: Archivo .env no encontrado en ${ENV_FILE}"
    exit 1
fi

# --- Colores para Mensajes ---
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Funciones para Mensajes ---
function log {
    echo -e "${BLUE}[$(date +"%T")] ${GREEN}INFO${NC}: $1"
}
function error {
    echo -e "${BLUE}[$(date +"%T")] ${RED}ERROR${NC}: $1"
}
function warn {
    echo -e "${BLUE}[$(date +"%T")] ${YELLOW}WARN${NC}: $1"
}

# --- Verificaciones Previas ---
# Verificar si Docker está en ejecución
if ! docker info > /dev/null 2>&1; then
    error "Docker no está en ejecución. Por favor, inicie Docker y vuelva a intentarlo."
    exit 1
fi

# Verificar si COMPOSE_PROJECT_NAME está seteado
if [ -z "${COMPOSE_PROJECT_NAME}" ]; then
    error "La variable COMPOSE_PROJECT_NAME no está definida. Asegúrate de que esté en tu archivo .env (${ENV_FILE})"
    exit 1
fi

# --- Confirmación del Usuario ---
read -p "¿Está seguro de que desea detener y limpiar toda la red Blockchain Simbiótica (proyecto: ${COMPOSE_PROJECT_NAME})? (s/n): " CONFIRM
if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
    log "Operación cancelada."
    exit 0
fi

# --- Detener y Eliminar Servicios de Fabric ---
log "Deteniendo y eliminando servicios de Fabric (contenedores, red, volúmenes anónimos)..."
if [ -f "${FABRIC_COMPOSE_FILE}" ]; then
    docker compose -p "${COMPOSE_PROJECT_NAME}" --env-file "${ENV_FILE}" -f "${FABRIC_COMPOSE_FILE}" down --volumes --remove-orphans
    if [ $? -ne 0 ]; then
        warn "Hubo un problema al ejecutar 'docker compose down' para los servicios de Fabric. Verifique los mensajes anteriores."
        # Se podría agregar un 'exit 1' aquí si se considera un error fatal
    fi
else
    warn "Archivo docker-compose para Fabric no encontrado en ${FABRIC_COMPOSE_FILE}"
fi

# --- Detener y Eliminar Servicios de Explorer (si aplica) ---
# Descomenta y ajusta si tienes un archivo docker-compose separado para Explorer
# if [ -n "${EXPLORER_COMPOSE_FILE:-}" ] && [ -f "${EXPLORER_COMPOSE_FILE}" ]; then
# log "Deteniendo y eliminando servicios de Explorer..."
#     # Ajusta el nombre del proyecto si Explorer usa uno diferente, e.g., --project-name "${COMPOSE_PROJECT_NAME}_explorer"
# docker compose -p "${COMPOSE_PROJECT_NAME}" --env-file "${ENV_FILE}" -f "${EXPLORER_COMPOSE_FILE}" down --volumes --remove-orphans
#     if [ $? -ne 0 ]; then
# warn "Hubo un problema al ejecutar 'docker compose down' para los servicios de Explorer."
#     fi
# elif [ -n "${EXPLORER_COMPOSE_FILE:-}" ]; then # Si la variable está seteada pero el archivo no existe
# warn "Archivo docker-compose para Explorer no encontrado en ${EXPLORER_COMPOSE_FILE}, omitiendo su limpieza."
# fi

# --- Limpieza Adicional (Más Agresiva) ---

# Eliminar contenedores huérfanos que pudieran haber quedado (opcional si 'down --remove-orphans' funciona bien)
# Esta línea es más una medida de seguridad por si algo no se limpió con compose down.
# El comando `docker compose down --remove-orphans` debería manejar la mayoría de los casos.
log "Intentando eliminar contenedores restantes que coincidan con patrones comunes de Fabric (si existen)..."
ORPHAN_CONTAINERS=$(docker ps -aq --filter "name=dev-peer" --filter "name=peer" --filter "name=orderer" --filter "name=ca." --filter "name=couchdb")
if [ -n "$ORPHAN_CONTAINERS" ]; then
    docker rm -f $ORPHAN_CONTAINERS 2>/dev/null || true
else
    log "No se encontraron contenedores huérfanos adicionales basados en patrones comunes."
fi

# Eliminar imágenes de chaincode (esto es específico de Fabric y útil)
log "Eliminando imágenes de chaincode (dev-*)..."
CHAINCODE_IMAGES=$(docker images dev-* -q)
if [ -n "$CHAINCODE_IMAGES" ]; then
    docker rmi -f $CHAINCODE_IMAGES 2>/dev/null || true
    log "Imágenes de chaincode eliminadas."
else
    log "No se encontraron imágenes de chaincode dev-* para eliminar."
fi

# Eliminar volúmenes Docker no utilizados en todo el sistema (¡cuidado si tienes otros proyectos!)
log "Eliminando todos los volúmenes Docker no utilizados en el sistema..."
docker volume prune -f

# Eliminar redes Docker no utilizadas en todo el sistema (docker compose down ya elimina las redes del proyecto)
log "Eliminando todas las redes Docker no utilizadas en el sistema..."
docker network prune -f

# --- Eliminar Artefactos Generados (con sudo) ---
# Preguntar si se deben eliminar los artefactos generados
read -p "¿Desea eliminar también los artefactos generados (crypto-config, channel-artifacts)? (s/n): " REMOVE_ARTIFACTS
if [[ "$REMOVE_ARTIFACTS" == "s" || "$REMOVE_ARTIFACTS" == "S" ]]; then
    log "Eliminando artefactos generados..."
    # Las rutas ahora son relativas a la raíz del proyecto
    if sudo rm -rf "${PROJECT_ROOT_ABS}/network/crypto-config" && \
       sudo rm -rf "${PROJECT_ROOT_ABS}/network/channel-artifacts"; then
        log "Artefactos eliminados."
    else
        error "No se pudieron eliminar todos los artefactos. Revise los permisos o ejecute manualmente con sudo."
    fi
fi

log "Proceso de limpieza de la red Blockchain Simbiótica completado."
log "Para iniciar la red nuevamente, ejecute: ./start-network.sh"

exit 0