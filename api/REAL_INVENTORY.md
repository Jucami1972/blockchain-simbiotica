# INVENTARIO REAL DEL PROYECTO BLOCKCHAIN SIMBIÓTICA

## 1. ESTRUCTURA PRINCIPAL

```
blockchain-simbiotica/
├── api/                    # Capa de API
├── docs/                   # Documentación
├── fabric/                 # Configuración de Fabric
├── src/                    # Código fuente principal
├── test/                   # Pruebas
├── .github/               # Configuración de GitHub
├── .git/                  # Control de versiones
├── node_modules/          # Dependencias de Node.js
├── .nvmrc                 # Versión de Node.js
├── package.json           # Configuración del proyecto
├── package-lock.json      # Lock de dependencias
├── README_BACKUP.md       # Documentación de respaldo
└── restart.sh             # Script de reinicio
```

## 2. COMPONENTES DETALLADOS

### 2.1 API

```
api/
└── docs/
    └── NETWORK_SETUP.md
```

### 2.2 Fabric

```
fabric/
├── api/                   # API duplicada (pendiente de limpieza)
├── backups/              # Directorio de respaldos
├── integration-tests/    # Pruebas de integración
│   └── fixtures/
│       └── wallet/      # Ubicación centralizada de wallets
├── network/             # Configuración de red
├── scripts/             # Scripts de automatización
│   ├── backup_ledger.sh
│   ├── deploy.sh
│   ├── restart-test-network.sh
│   └── validate-environment.sh
└── connection-profile.json
```

### 2.3 Source Code

```
src/
├── controllers/
│   ├── contributionController.js
│   ├── userController.js
│   └── verificationController.js
├── fabric/
│   └── network.js
├── routes/
│   ├── contributionRoutes.js
│   ├── index.js
│   ├── userRoutes.js
│   └── verificationRoutes.js
├── utils/
│   ├── checkNetwork.js
│   ├── cleanWallet.js
│   ├── enrollUser1.js
│   └── testWallet.js
├── app.js
└── enrollAdmin.js
```

## 3. ARCHIVOS DE CONFIGURACIÓN

- `.env` (en api/)
- `.nvmrc`
- `package.json`
- `package-lock.json`

## 4. ARCHIVOS DE DOCUMENTACIÓN

- `api/docs/NETWORK_SETUP.md`
- `README_BACKUP.md`

## 5. ARCHIVOS DE DEPLOYMENT

- `fabric/scripts/deploy.sh`
- `fabric/scripts/restart-test-network.sh`
- `fabric/scripts/validate-environment.sh`
- `restart.sh`

## 6. ARCHIVOS DE TEST

- `fabric/integration-tests/` (pruebas de integración)
- `test/` (pruebas unitarias)

## 7. ARCHIVOS DE WALLET

- `fabric/integration-tests/fixtures/wallet/` (ubicación centralizada)

## 8. ESTADO ACTUAL

1. **Wallets:**

   - ✅ Ubicación centralizada en `fabric/integration-tests/fixtures/wallet/`
   - ✅ Todos los archivos actualizados para usar esta ubicación
   - ✅ No hay duplicados de wallets

2. **Scripts:**

   - ✅ `restart.sh` actualizado con la ruta correcta de wallet
   - ✅ Scripts de automatización en `fabric/scripts/`
   - ✅ Rutas relativas corregidas

3. **Código Fuente:**

   - ✅ `src/fabric/network.js` actualizado
   - ✅ `src/utils/*` actualizados
   - ✅ Referencias a wallet unificadas

4. **Pendiente:**
   - ⚠️ Eliminar carpeta `fabric/api/` (duplicada)
   - ⚠️ Verificar y actualizar documentación
   - ⚠️ Implementar pruebas unitarias faltantes

## 9. RECOMENDACIONES

1. Eliminar la carpeta `fabric/api/` que contiene duplicados
2. Actualizar la documentación para reflejar la estructura actual
3. Implementar pruebas unitarias faltantes
4. Mantener un único punto de verdad para la configuración de la red
5. Revisar y actualizar las variables de entorno
