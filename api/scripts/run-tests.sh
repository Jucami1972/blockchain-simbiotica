#!/bin/bash

# Script para configurar y ejecutar pruebas automatizadas para el proyecto Blockchain Simbiótica
# Este script ejecuta pruebas unitarias, de integración y end-to-end para todos los módulos

# Definir variables de entorno
export NODE_ENV=test
export TEST_NETWORK_ACTIVE=true
export TEST_COVERAGE=true

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

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    printError "Node.js no está instalado. Por favor, instálelo antes de continuar."
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    printError "npm no está instalado. Por favor, instálelo antes de continuar."
    exit 1
fi

# Verificar si jest está instalado
if ! npm list -g | grep jest &> /dev/null; then
    printInfo "Instalando Jest globalmente..."
    npm install -g jest
fi

# Parsear argumentos
MODULE=""
TEST_TYPE="all"

# Parsear argumentos
while [[ $# -gt 0 ]]; do
    case "$1" in
        -m|--module)
            MODULE="$2"
            shift 2
            ;;
        -t|--type)
            TEST_TYPE="$2"
            shift 2
            ;;
        -h|--help)
            echo "Uso: $0 [opciones]"
            echo "Opciones:"
            echo "  -m, --module <módulo>  Módulo a probar (token, telemedicina, identity, achievex, chat, ia, dao, blockchain, auth)"
            echo "  -t, --type <tipo>      Tipo de prueba (unit, integration, e2e, all)"
            echo "  -h, --help             Muestra esta ayuda"
            exit 0
            ;;
        *)
            printError "Argumento desconocido: $1"
            exit 1
            ;;
    esac
done

# Si no se especifica un módulo, probar todos
if [ -z "$MODULE" ]; then
    printInfo "No se especificó un módulo, probando todos los módulos..."
    MODULES=("token" "telemedicina" "identity" "achievex" "chat" "ia" "dao" "blockchain" "auth")
else
    MODULES=("$MODULE")
fi

# Función para ejecutar pruebas unitarias
function runUnitTests() {
    MODULE=$1
    printInfo "Ejecutando pruebas unitarias para el módulo $MODULE..."
    cd /home/ubuntu/blockchain-simbiotica/api
    npm test -- --testPathPattern="src/$MODULE/.*\.spec\.ts$"
    if [ $? -ne 0 ]; then
        printError "Error en las pruebas unitarias del módulo $MODULE"
        return 1
    fi
    printSuccess "Pruebas unitarias del módulo $MODULE completadas correctamente"
    return 0
}

# Función para ejecutar pruebas de integración
function runIntegrationTests() {
    MODULE=$1
    printInfo "Ejecutando pruebas de integración para el módulo $MODULE..."
    cd /home/ubuntu/blockchain-simbiotica/api
    npm run test:integration -- --testPathPattern="test/integration/$MODULE/.*\.spec\.ts$"
    if [ $? -ne 0 ]; then
        printError "Error en las pruebas de integración del módulo $MODULE"
        return 1
    fi
    printSuccess "Pruebas de integración del módulo $MODULE completadas correctamente"
    return 0
}

# Función para ejecutar pruebas end-to-end
function runE2ETests() {
    MODULE=$1
    printInfo "Ejecutando pruebas end-to-end para el módulo $MODULE..."
    cd /home/ubuntu/blockchain-simbiotica/api
    npm run test:e2e -- --testPathPattern="test/e2e/$MODULE/.*\.spec\.ts$"
    if [ $? -ne 0 ]; then
        printError "Error en las pruebas end-to-end del módulo $MODULE"
        return 1
    fi
    printSuccess "Pruebas end-to-end del módulo $MODULE completadas correctamente"
    return 0
}

# Función para ejecutar todas las pruebas
function runAllTests() {
    MODULE=$1
    printInfo "Ejecutando todas las pruebas para el módulo $MODULE..."
    
    # Ejecutar pruebas unitarias
    runUnitTests $MODULE
    UNIT_RESULT=$?
    
    # Ejecutar pruebas de integración
    runIntegrationTests $MODULE
    INTEGRATION_RESULT=$?
    
    # Ejecutar pruebas end-to-end
    runE2ETests $MODULE
    E2E_RESULT=$?
    
    # Verificar resultados
    if [ $UNIT_RESULT -eq 0 ] && [ $INTEGRATION_RESULT -eq 0 ] && [ $E2E_RESULT -eq 0 ]; then
        printSuccess "Todas las pruebas del módulo $MODULE completadas correctamente"
        return 0
    else
        printError "Error en algunas pruebas del módulo $MODULE"
        return 1
    fi
}

# Ejecutar pruebas para cada módulo
FAILED_MODULES=()
for MODULE in "${MODULES[@]}"; do
    case "$TEST_TYPE" in
        "unit")
            runUnitTests $MODULE
            if [ $? -ne 0 ]; then
                FAILED_MODULES+=("$MODULE")
            fi
            ;;
        "integration")
            runIntegrationTests $MODULE
            if [ $? -ne 0 ]; then
                FAILED_MODULES+=("$MODULE")
            fi
            ;;
        "e2e")
            runE2ETests $MODULE
            if [ $? -ne 0 ]; then
                FAILED_MODULES+=("$MODULE")
            fi
            ;;
        "all")
            runAllTests $MODULE
            if [ $? -ne 0 ]; then
                FAILED_MODULES+=("$MODULE")
            fi
            ;;
        *)
            printError "Tipo de prueba desconocido: $TEST_TYPE"
            exit 1
            ;;
    esac
done

# Generar informe de cobertura
if [ "$TEST_COVERAGE" = true ]; then
    printInfo "Generando informe de cobertura..."
    cd /home/ubuntu/blockchain-simbiotica/api
    npm run test:cov
    if [ $? -ne 0 ]; then
        printError "Error al generar informe de cobertura"
    else
        printSuccess "Informe de cobertura generado correctamente"
    fi
fi

# Verificar si hubo errores
if [ ${#FAILED_MODULES[@]} -eq 0 ]; then
    printSuccess "Todas las pruebas completadas correctamente"
    exit 0
else
    printError "Error en las pruebas de los siguientes módulos: ${FAILED_MODULES[*]}"
    exit 1
fi
