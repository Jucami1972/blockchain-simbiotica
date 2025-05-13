# ESTRUCTURA DETALLADA DEL PROYECTO BLOCKCHAIN SIMBIÓTICA

## 1. ESTRUCTURA COMPLETA DE DIRECTORIOS

```
blockchain-simbiotica/
├── .github/
│   └── workflows/
│       └── fabric-deploy.yml
├── api/
│   ├── docs/
│   │   └── NETWORK_SETUP.md
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── utils/
│   ├── .env
│   └── package.json
├── docs/
├── fabric/
│   ├── api/
│   ├── backups/
│   ├── integration-tests/
│   │   └── fixtures/
│   │       └── wallet/
│   ├── network/
│   ├── scripts/
│   │   ├── backup_ledger.sh
│   │   ├── deploy.sh
│   │   ├── restart-test-network.sh
│   │   └── validate-environment.sh
│   └── connection-profile.json
├── src/
│   ├── controllers/
│   │   ├── contributionController.js
│   │   ├── userController.js
│   │   └── verificationController.js
│   ├── fabric/
│   │   └── network.js
│   ├── routes/
│   │   ├── contributionRoutes.js
│   │   ├── index.js
│   │   ├── userRoutes.js
│   │   └── verificationRoutes.js
│   ├── utils/
│   │   ├── checkNetwork.js
│   │   ├── cleanWallet.js
│   │   ├── enrollUser1.js
│   │   └── testWallet.js
│   ├── app.js
│   └── enrollAdmin.js
├── test/
├── .git/
├── node_modules/
├── .nvmrc
├── package.json
├── package-lock.json
├── README_BACKUP.md
└── restart.sh
```

## 2. ARCHIVOS DE CÓDIGO FUENTE

```
# JavaScript Files
api/src/controllers/userController.js
api/src/utils/fabricConnection.js
api/src/utils/logger.js
api/src/index.js
api/src/routes/index.js
api/src/utils/errorHandler.js
src/controllers/contributionController.js
src/controllers/userController.js
src/controllers/verificationController.js
src/fabric/network.js
src/routes/contributionRoutes.js
src/routes/index.js
src/routes/userRoutes.js
src/routes/verificationRoutes.js
src/utils/checkNetwork.js
src/utils/cleanWallet.js
src/utils/enrollUser1.js
src/utils/testWallet.js
src/app.js
src/enrollAdmin.js

# JSON Files
api/package.json
fabric/connection-profile.json
package.json
package-lock.json

# Shell Scripts
fabric/scripts/backup_ledger.sh
fabric/scripts/deploy.sh
fabric/scripts/restart-test-network.sh
fabric/scripts/validate-environment.sh
restart.sh

# Configuration Files
api/.env
.nvmrc
```

## 3. DISTRIBUCIÓN DE TIPOS DE ARCHIVOS

```
# JavaScript Files (.js)
- Controllers: 5 files
- Routes: 4 files
- Utils: 7 files
- Main: 2 files
- Total: 18 files

# JSON Files (.json)
- Package: 2 files
- Configuration: 1 file
- Total: 3 files

# Shell Scripts (.sh)
- Deployment: 4 files
- Total: 4 files

# Markdown Files (.md)
- Documentation: 2 files
- Total: 2 files

# Configuration Files
- Environment: 1 file
- Node Version: 1 file
- Total: 2 files
```

## 4. RESUMEN DE DIRECTORIOS

```
# Directorios Principales
- api/              # Capa de API
- docs/             # Documentación
- fabric/           # Configuración de Fabric
- src/              # Código fuente principal
- test/             # Pruebas
- .github/          # Configuración de GitHub
- .git/             # Control de versiones
- node_modules/     # Dependencias

# Subdirectorios de API
- api/docs/         # Documentación de API
- api/src/          # Código fuente de API
  ├── controllers/  # Controladores
  ├── routes/       # Rutas
  └── utils/        # Utilidades

# Subdirectorios de Fabric
- fabric/api/       # API duplicada (pendiente de limpieza)
- fabric/backups/   # Respaldo de datos
- fabric/integration-tests/  # Pruebas de integración
- fabric/network/   # Configuración de red
- fabric/scripts/   # Scripts de automatización

# Subdirectorios de Source
- src/controllers/  # Controladores
- src/fabric/       # Integración con Fabric
- src/routes/       # Rutas
- src/utils/        # Utilidades
```

## 5. NOTAS IMPORTANTES

1. La carpeta `fabric/api/` está marcada para eliminación por ser una duplicación
2. Los wallets están centralizados en `fabric/integration-tests/fixtures/wallet/`
3. Los scripts de automatización están en `fabric/scripts/`
4. La documentación principal está en `api/docs/`
5. Las pruebas están divididas entre `test/` y `fabric/integration-tests/`
