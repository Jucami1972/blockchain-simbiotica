# Configuración de la Red de Prueba

## Scripts de Automatización

### restart-test-network.sh

Ubicación: `fabric/scripts/restart-test-network.sh`

Este script está diseñado específicamente para el entorno de desarrollo y pruebas. **NO debe usarse en producción.**

#### Funcionalidades:

- Detiene y limpia la red existente
- Elimina artefactos previos
- Levanta una nueva red de prueba
- Crea un canal
- Despliega el chaincode CCV
- Limpia las wallets de identidades
- Recrea la identidad user1

#### Uso:

```bash
cd fabric/scripts
./restart-test-network.sh
```

#### Requisitos:

- Hyperledger Fabric test-network configurado
- Node.js y npm instalados
- Permisos de ejecución en el script

#### Advertencias:

- Este script eliminará todos los datos de la red de prueba
- Asegúrese de tener un backup si es necesario
- Solo use en entorno de desarrollo

## Otros Scripts Disponibles

### deploy.sh

Ubicación: `fabric/scripts/deploy.sh`

- Despliegue inicial de la red
- Configuración de canales
- Instalación de chaincodes

### validate-environment.sh

Ubicación: `fabric/scripts/validate-environment.sh`

- Verifica requisitos del sistema
- Valida configuraciones
- Comprueba dependencias

### backup_ledger.sh

Ubicación: `fabric/scripts/backup_ledger.sh`

- Realiza backup del estado del ledger
- Preserva datos importantes
- Facilita recuperación
