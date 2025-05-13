#!/bin/bash
set -eo pipefail  # Mejor manejo de errores

# ---- [1] Configuración inicial ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
cd "$ROOT_DIR"  # Asegura ejecución desde raíz

# ---- [2] Funciones de soporte ----
error() { echo -e "\033[31m❌ $1\033[0m"; exit 1; }
success() { echo -e "\033[32m✔️ $1\033[0m"; }

check_version() {
  local cmd="$1"
  local version_regex="$2"
  local version
  version=$($cmd | grep -oP "$version_regex" || true)
  [ -z "$version" ] && error "No se pudo obtener versión de $cmd"
  echo "$version"
}

# ---- [3] Validar Docker ----
if ! docker info >/dev/null 2>&1; then
  error "Docker Daemon no está corriendo"
fi

# ---- [4] Validar versiones ----
declare -A versions=(
  [node]="$(check_version "node -v" 'v?\K\\d+\\.\\d+\\.\\d+')"
  [npm]="$(check_version "npm -v" '\\d+\\.\\d+\\.\\d+')"
  [docker]="$(check_version "docker --version" '\\d+\\.\\d+\\.\\d+')"
  [docker-compose]="$(check_version "docker compose version --short" '\\d+\\.\\d+\\.\\d+')"
  [fabric-sdk]="$(jq -r '.dependencies.\"fabric-network\"' fabric/chaincode/ccv/package.json)"
)

echo -e \"\\n--- Validación de Versiones ---\"
for k in \"${!versions[@]}\"; do
  echo \"$k: ${versions[$k]}\"
done

# ---- [5] Validar estructura ----
declare -a dirs=(
  \"fabric/chaincode/ccv/src\"
  \"fabric/integration-tests/fixtures/wallet\"
  \"fabric/scripts\"
)

declare -a files=(
  \"fabric/chaincode/ccv/package.json\"
  \"fabric/chaincode/ccv/src/index.js\"
  \"fabric/scripts/deploy.sh\"
)

for dir in \"${dirs[@]}\"; do
  [ -d \"$dir\" ] || error \"Falta directorio: $dir\"
  success \"Directorio: $dir\"
done

for file in \"${files[@]}\"; do
  [ -f \"$file\" ] || error \"Falta archivo: $file\"
  success \"Archivo: $file\"
done

# ---- [6] Contenedores de Fabric ----
mapfile -t fabric_containers < <(docker ps --filter \"network=fabric_test\" --format \"{{.Names}}\")

if [ ${#fabric_containers[@]} -eq 0 ]; then
  error \"No hay contenedores de Fabric activos\"
else
  success \"Contenedores activos: ${fabric_containers[*]}\"
fi

echo -e \"\\n\\033[34m✅ Validación exitosa!\\033[0m\"
