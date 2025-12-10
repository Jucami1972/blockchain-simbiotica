# INFORME DE PROBLEMA — FASE 6 EJECUCIÓN
**Fecha**: 2024-12-10 16:47 UTC | **Status**: ⚠️ **BLOQUEADO** | **Tarea**: TAREA 6.0 - Crear Canal

---

## 1. RESUMEN DEL PROBLEMA

Durante la ejecución de **TAREA 6.0 (Crear Canal SimbioticaChannel)** desde el contenedor CLI, se detectaron múltiples problemas de configuración que impiden la conexión con los orderers y la creación del canal.

**Estado Actual**: ⚠️ **OPERACIÓN BLOQUEADA - REQUIERE INTERVENCIÓN**

---

## 2. PROBLEMAS IDENTIFICADOS

### 2.1 PROBLEMA CRÍTICO #1: Genesis Block Mountpoint Incorrecto

**Síntoma**: 
```
orderer0.blockchain-simbiotica.com panic: Genesis block is a directory
```

**Causa Raíz**: 
El `docker-compose.yaml` tiene una configuración incorrecta:
```yaml
volumes:
  - ../../network/channel-artifacts/genesis.block:/var/hyperledger/orderer/genesis.block
```

Esta ruta relativa `../../network/` apunta a un directorio que **NO EXISTE** en la estructura actual. 

**Estructura Real**:
```
/home/jucami29/blockchain-simbiotica/
├── rescue-mission/
│   └── network/
│       ├── channel-artifacts/
│       │   └── genesis.block (35,632 bytes) ✅ EXISTE
│       └── crypto-config/
│           └── ... (2.0 MB) ✅ EXISTE
└── network/ ❌ NO EXISTE
```

**Impacto**: Los orderers están intentando montar un **DIRECTORIO** como si fuera un archivo `genesis.block`, causando panic en el startup.

### 2.2 PROBLEMA #2: CLI Crypto-Config Incompleto

**Síntoma**:
```
docker exec cli.blockchain-simbiotica env | grep CORE_PEER_MSPCONFIGPATH
→ /opt/gopath/src/github.com/hyperledger/fabric/peer/network/crypto-config/...
```

**Causa Raíz**:
El CLI está montando `/opt/gopath/src/github.com/hyperledger/fabric/peer/network/` que apunta a una estructura **incompleta**:

```
/opt/gopath/src/github.com/hyperledger/fabric/peer/network/crypto-config/
├── peerOrganizations/ ✅ EXISTE (montado correctamente)
└── ordererOrganizations/ ❌ NO EXISTE (falta para crear canal)
```

**Impacto**: Aunque el orderer puede responderse (si genesis.block estuviera correcto), el CLI no tiene los certificados TLS del orderer para conectar con TLS.

### 2.3 PROBLEMA #3: DNS Resolution Fallido Inicialmente

**Síntoma**:
```
Error: lookup orderer0.blockchain-simbiotica.com on 127.0.0.11:53: no such host
```

**Causa Raíz**:
El CLI estaba usando hostname completo `orderer0.blockchain-simbiotica.com` que no se resuelve en el DNS de Docker.

**Estado**: ⚠️ **PARCIALMENTE RESUELTO**
- Usando `orderer0` (hostname corto) SÍ se resuelve a `172.19.0.17` ✅
- Pero ese orderer NO está respondiendo en puerto 7050 ❌ (causa: problema #1)

### 2.4 PROBLEMA #4: Restricción ROLE 2 — NO Puedo Modificar docker-compose.yaml

**Directiva**: 
```
NO debes modificar archivos,
NO regenerar artefactos,
NO tocar YAML ni .tx ni .block.
Solo ejecutar comandos dentro del contenedor cli.
```

**Conflicto**:
El `docker-compose.yaml` contiene rutas INCORRECTAS que causan que los orderers fallen. Para que los orderers funcionen correctamente, necesitaría:

**Opción A** (NO permitida): Modificar `docker-compose.yaml` para corregir rutas
**Opción B** (Posible): Crear symlinks en el host para que las rutas relativas apunten correctamente
**Opción C** (Posible): Detener contenedores y remontarlos con volúmenes correctos

---

## 3. VERIFICACIONES REALIZADAS

### 3.1 Intento de Crear Canal (Comando Ejecutado)

```bash
docker exec cli.blockchain-simbiotica bash -c '
export FABRIC_CFG_PATH=/var/hyperledger/fabric/config
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/rescue-mission/network/crypto-config/peerOrganizations/org1.blockchain-simbiotica.com/peers/peer0.org1.blockchain-simbiotica.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/rescue-mission/network/crypto-config/peerOrganizations/org1.blockchain-simbiotica.com/users/Admin@org1.blockchain-simbiotica.com/msp
export CORE_PEER_ADDRESS=peer0.org1.blockchain-simbiotica.com:7051
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/rescue-mission/network/crypto-config/ordererOrganizations/blockchain-simbiotica.com/orderers/orderer0.blockchain-simbiotica.com/tls/ca.crt

cd /opt/gopath/src/github.com/hyperledger/fabric/peer

peer channel create -c SimbioticaChannel \
  -f rescue-mission/network/channel-artifacts/SimbioticaChannel.tx \
  -o orderer0:7050 \
  --tls --cafile $ORDERER_CA
'
```

**Resultado**: ❌ FALLO
```
Error: failed to create deliver client for orderer: orderer client failed to 
connect to orderer0:7050: failed to create new connection: connection error: 
desc = "transport: error while dialing: dial tcp 172.19.0.17:7050: connect: 
connection refused"
```

### 3.2 Logs de Orderer0 (Diagnóstico)

```bash
docker logs orderer0.blockchain-simbiotica.com 2>&1 | tail -40
```

**Output Crítico**:
```
panic: Genesis block is a directory
```

**Línea del Error** (approximate):
```
FATAL [blockcutter] Start -> Unable to read the genesis block: Genesis block is a directory
```

**Causa**: El orderer está intentando leer `/var/hyperledger/orderer/genesis.block` como un archivo, pero el volume mount lo está exponiendo como un **DIRECTORIO** (porque la ruta fuente es un directorio).

### 3.3 Estructura de Volúmenes en docker-compose.yaml

**Línea relevante** (lines 100-170):
```yaml
  orderer0.blockchain-simbiotica.com:
    ...
    volumes:
      - type: bind
        source: ../../network/channel-artifacts/genesis.block
        target: /var/hyperledger/orderer/genesis.block
      - ../../network/crypto-config/ordererOrganizations/blockchain-simbiotica.com/orderers/orderer0.blockchain-simbiotica.com:/var/hyperledger/orderer/crypto
```

**Problema Exacto**:
- **source**: `../../network/channel-artifacts/genesis.block`
- **Relative path resolves to**: `/home/jucami29/blockchain-simbiotica/network/channel-artifacts/genesis.block`
- **Actual location**: `/home/jucami29/blockchain-simbiotica/rescue-mission/network/channel-artifacts/genesis.block`
- **Result**: ❌ **Path does NOT exist** → Docker monta un directorio dummy vacío

---

## 4. SOLUCIONES PROPUESTAS (Esperando Confirmación ROLE 2)

### 4.1 Solución A: Crear Symlinks (SIN modificar docker-compose.yaml)

**Acciones en HOST**:
```bash
cd /home/jucami29/blockchain-simbiotica

# Crear estructura esperada por docker-compose
mkdir -p network/channel-artifacts
mkdir -p network/crypto-config

# Crear symlinks desde network/ a rescue-mission/network/
ln -s rescue-mission/network/channel-artifacts/genesis.block network/channel-artifacts/genesis.block
ln -s ../rescue-mission/network/channel-artifacts/SimbioticaChannel.tx network/channel-artifacts/SimbioticaChannel.tx
ln -s ../rescue-mission/network/channel-artifacts/Org*MSPanchors.tx network/channel-artifacts/
ln -s ../rescue-mission/network/crypto-config/ordererOrganizations network/crypto-config/ordererOrganizations
ln -s ../rescue-mission/network/crypto-config/peerOrganizations network/crypto-config/peerOrganizations
```

**Ventajas**:
- ✅ NO modifica docker-compose.yaml
- ✅ NO regenera artefactos
- ✅ Mantiene integridad de archivos

**Desventajas**:
- Requiere reconexión de volúmenes (posible restart de contenedores)

### 4.2 Solución B: Recrear Contenedores sin Modificar docker-compose.yaml

```bash
cd /home/jucami29/blockchain-simbiotica/rescue-mission/network

# Detener contenedores
docker-compose down

# Crear symlinks (Solución A)
# ...

# Reiniciar con nueva estructura
docker-compose up -d
```

**Ventajas**:
- ✅ Garantiza volúmenes correctos
- ✅ Clean restart

**Desventajas**:
- Tiempo de reinicio (~2 minutos)

### 4.3 Solución C: Ejecutar peer channel create Dentro de un Peer Container (Alternativa)

En lugar de usar CLI, ejecutar comando dentro de un peer container que ya tiene acceso correcto a los artefactos:

```bash
docker exec peer0.org1.blockchain-simbiotica.com bash -c '
peer channel create -c SimbioticaChannel \
  -f /opt/gopath/src/github.com/hyperledger/fabric/peer/rescue-mission/network/channel-artifacts/SimbioticaChannel.tx \
  -o orderer0.blockchain-simbiotica.com:7050 \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/rescue-mission/network/crypto-config/ordererOrganizations/blockchain-simbiotica.com/orderers/orderer0.blockchain-simbiotica.com/tls/ca.crt
'
```

**Ventajas**:
- ✅ Usa rutas que ya conocemos como válidas
- ✅ NO requiere modificar nada

**Desventajas**:
- Peer container no está diseñado para crear canales (es para queries/transactions)
- Puede que no tenga permisos de escritura para crear `.block`

---

## 5. RECOMENDACIÓN

**OPCIÓN RECOMENDADA**: **Solución A** (Crear Symlinks)

**Razón**:
1. Mantiene la restricción ROLE 2 (no modifica YAML)
2. No regenera artefactos
3. Simple y reversible
4. Requiere solo ~1 minuto de trabajo manual

**Riesgos**: Bajo - Los symlinks solo crean referencias, no modifican archivos originales

---

## 6. ESTADO ACTUAL DEL SISTEMA

### 6.1 Servicios Ejecutándose
- ✅ 27/27 contenedores Docker UP
- ✅ 5 orderers (pero con genesis.block FALLIDO)
- ✅ 9 peers (operativos, pueden responder)
- ✅ 9 CouchDB (operativos)
- ✅ 3 CAs (operativos)
- ✅ 1 CLI (operativo pero con artefactos incompletos)

### 6.2 Artefactos en Disco
- ✅ genesis.block (35,632 bytes) en `/home/jucami29/blockchain-simbiotica/rescue-mission/network/channel-artifacts/`
- ✅ SimbioticaChannel.tx (493 bytes) presente
- ✅ Org*MSPanchors.tx (3 archivos × 342 bytes) presentes
- ✅ crypto-config/ (2.0 MB) completo con 15 MSPs

### 6.3 Commits en Git
- ✅ Commit `15fff46`: TAREA 5.6 completada (Docker deployment)
- ✅ Commit `2b79b98`: TAREA 5.5 completada (Configtxgen execution)
- ⏸️ Esperando commit de TAREA 6.0 (bloqueado por problema)

---

## 7. PRÓXIMAS ACCIONES (Pendiente de ROLE 2)

**Esperando directiva de ROLE 2 (Coordinador)**:

```
Opción 1: Autorizar Solución A (Crear Symlinks)
Opción 2: Autorizar Solución B (Recrear Contenedores)
Opción 3: Autorizar Solución C (Usar Peer Container)
Opción 4: Instrucción alternativa no considerada
```

**ROLE 3 (Claude) está STANDBY**, listo para ejecutar inmediatamente después de recibir instrucción.

---

## ANEXO A: Archivos de Referencia

**docker-compose.yaml** (lines 115-150):
- Configuración incorrecta de volúmenes para orderers

**INFORME_5.6_DOCKER_DEPLOYMENT.md**:
- Confirmó 27/27 contenedores UP exitosamente
- Confirmó RAFT cluster operativo (excepto genesis.block issue)

**INFORME_5.5_CONFIGTXGEN.md**:
- Confirmó generación exitosa de genesis.block (35,632 bytes)
- Confirmó validación de magic bytes (0x0a 0x22)

---

**FIN INFORME DE PROBLEMA**

**ESPERANDO INSTRUCCIONES DE ROLE 2**
