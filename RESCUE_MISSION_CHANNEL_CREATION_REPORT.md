# Rescue Mission: Hyperledger Fabric Channel Creation - Complete Report
**Proyecto:** Blockchain Simbiótica  
**Fecha:** Diciembre 10-13, 2025  
**Objetivo:** Crear simbioticachannel y unir 9 peers (3 por org × 3 orgs)  
**Estado Final:** ✅ CANAL CREADO EXITOSAMENTE

---

## 📋 Tabla de Contenidos

1. [Situación Inicial](#situación-inicial)
2. [Fases de Diagnóstico](#fases-de-diagnóstico)
3. [Problemas Encontrados y Soluciones](#problemas-encontrados-y-soluciones)
4. [Lecciones Aprendidas](#lecciones-aprendidas)
5. [Procedimiento Final Exitoso](#procedimiento-final-exitoso)
6. [Checklist para Futuras Ocasiones](#checklist-para-futuras-ocasiones)

---

## Situación Inicial

### Contexto
- **Fabric Version:** 2.5.5
- **Consenso:** EtcdRaft (5 orderers)
- **Peers:** 9 totales (3 por org: Org1MSP, Org2MSP, Org3MSP)
- **Problema:** No se podía crear el canal aplicativo `simbioticachannel`
- **Estado Previo:** RAFT funcionante, genesis.block existente, pero canal no se creaba

### Síntomas Iniciales
```
Error: creator org unknown
Error: implicit policy evaluation failed - Writers sub-policy not satisfied
Error: policy for [Group] /Channel/Application not satisfied
```

---

## Fases de Diagnóstico

### FASE 1: Investigación del Error "creator org unknown"
**Síntoma:** `peer channel create` desde CLI container fallaba con error de org desconocido

**Investigación:**
- Se intentó desde CLI container aislado
- CLI no podía inicializar BCCSP correctamente
- Problema: CLI container tiene dependencias no resueltas en ambiente aislado

**Solución Aplicada:** Cambiar a `peer0.org1` (peer real) en su lugar

**Lección:** En ambientes complejos, el CLI container puede ser frágil. Usar un peer real es más confiable.

---

### FASE 2: Error de Política "Writers sub-policy not satisfied"
**Síntoma:** Al intentar desde peer0.org1, el orderer rechazaba por política no satisfecha

**Investigación:**
1. Decodificó genesis.block
2. Extrajo ChannelCreationPolicy
3. Encontró: `mod_policy = "/Channel/Orderer/Admins"` (INCORRECTO)

**Raíz Causa:** 
- ChannelCreationPolicy estaba ubicada en `/Channel/Consortiums/SimbioticaConsortium/values/ChannelCreationPolicy`
- Pero su `mod_policy` apuntaba a `/Channel/Orderer/Admins` (solo OrdererMSP)
- Esto hacía IMPOSIBLE que Org1/Org2/Org3 admins crearan canales

**Solución Aplicada:**
```bash
# 1. Extraer genesis.block
docker cp orderer0.../genesis.block /tmp/genesis-orderer.block

# 2. Decodificar a JSON
configtxlator proto_decode --input genesis-orderer.block \
  --type common.Block --output genesis-orderer.json

# 3. Localizar el error (jq)
jq 'paths | select(.[-1] == "ChannelCreationPolicy") | @json' genesis-orderer.json

# 4. Aplicar parche quirúrgico
jq --arg CONS "SimbioticaConsortium" \
  '.data.data[0].payload.data.config.channel_group.groups.Consortiums.groups[$CONS].values.ChannelCreationPolicy.mod_policy = "/Channel/Admins"' \
  genesis-orderer.json > genesis-orderer.patched.json

# 5. Re-codificar
configtxlator proto_encode --input genesis-orderer.patched.json \
  --type common.Block --output genesis.block.patched

# 6. Reemplazar en mount location
cp genesis.block.patched system-genesis-block/genesis.block

# 7. Reiniciar stack
docker-compose down -v
docker-compose up -d
```

**Lecciones:**
- El genesis.block es un protobuf que se puede decodificar/modificar/re-codificar con seguridad
- `configtxgen` ignora inline policy references — debes editar el genesis directamente si está mal
- Cambiar `mod_policy` de `/Channel/Orderer/Admins` a `/Channel/Admins` permite que consortium members creen canales

---

### FASE 3: Error "Application Admins not satisfied" (Persistente)
**Síntoma:** Después del parche, el error mutó a:
```
policy for [Group] /Channel/Application not satisfied:
implicit policy evaluation failed - 0 sub-policies were satisfied,
but this policy requires 1 of the 'Admins' sub-policies to be satisfied
```

**Investigación Inicial (INCORRECTA):**
- Asumimos que `/Channel/Application` no existía en system channel
- Intentamos crear un Application group en genesis.block
- **ESTO FUE UN ERROR DE DIAGNÓSTICO**

**Verdadera Raíz Causa (Descubierta después):**
- El system channel NO necesita tener `/Channel/Application`
- El problema real era: **identidad de firma incorrecta**
- Se estaba firmando como `peer` (OU=peer), no como `admin` (OU=admin)

---

### FASE 4: Diagnóstico de Cadena de Custodia
**Problema Detectado:** El TX firmado en un contenedor no persistía correctamente

**Diagnóstico:**
```bash
# Verificar hashes para cadena de custodia
HOST_HASH=$(sha256sum channel-artifacts/simbioticachannel.tx | awk '{print $1}')
CONT_HASH=$(docker exec peer0.org1... bash -c 'sha256sum .../simbioticachannel.tx' | awk '{print $1}')

if [ "$HOST_HASH" != "$CONT_HASH" ]; then
  echo "❌ HASHES DIFERENTES - Desincronización"
fi
```

**Resultado:** Hashes diferentes → estaban dos versiones del TX en circulación

**Solución:**
1. Eliminar TX del contenedor
2. Re-copiar fresco desde host
3. Verificar hash antes y después de cada operación

**Lección:** La cadena de custodia de artefactos es CRÍTICA. Un solo archivo fuera de sincronización arruina firmas y validaciones.

---

### FASE 5: Identificación del Problema de Identidad
**Diagnóstico Final:**
```bash
# El peer estaba usando peer MSP (OU=peer), no admin MSP (OU=admin)
export CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/msp
# ↑ Este es el PEER MSP, rechazado por policy Admins

# Correcto:
export CORE_PEER_MSPCONFIGPATH=/tmp/org1adminmsp
# ↑ Este es el ADMIN MSP, satisface la policy
```

**La Causa Raíz:**
- Fabric policy `Admins` requiere una identidad con `OU=admin`
- El peer MSP tiene `OU=peer` → rechazado
- El admin MSP tiene `OU=admin` → aceptado

**Lección:** Las políticas de Fabric son IDENTIDAD-ESPECÍFICAS. Debes usar la MSP correcta para cada operación.

---

## Problemas Encontrados y Soluciones

### Problema 1: ChannelCreationPolicy Mal Configurada
| Aspecto | Detalles |
|---------|----------|
| **Síntoma** | Error: "Writers sub-policy not satisfied" |
| **Causa Raíz** | `mod_policy = "/Channel/Orderer/Admins"` |
| **Ubicación** | `/Channel/Consortiums/SimbioticaConsortium/values/ChannelCreationPolicy/mod_policy` |
| **Solución** | Cambiar a `"/Channel/Admins"` mediante jq + configtxlator |
| **Verificación** | Decodificar genesis y confirmar cambio con jq |
| **Tiempo de Resolución** | ~2 horas |

### Problema 2: Desincronización de Cadena de Custodia (TX)
| Aspecto | Detalles |
|---------|----------|
| **Síntoma** | Firma en un lugar, TX sin firmas cuando se crea canal |
| **Causa Raíz** | Múltiples versiones del TX (host vs contenedor) con hashes diferentes |
| **Solución** | Verificar SHA256 antes/después de cada operación, limpiar y re-copiar |
| **Comando Crítico** | `sha256sum archivo_host == sha256sum archivo_contenedor` |
| **Tiempo de Resolución** | ~1 hora |

### Problema 3: Identidad de Firma Incorrecta
| Aspecto | Detalles |
|---------|----------|
| **Síntoma** | Error: "0 sub-policies were satisfied, requires 1 of Admins" |
| **Causa Raíz** | CORE_PEER_MSPCONFIGPATH apuntaba a peer MSP (OU=peer), no admin MSP (OU=admin) |
| **Solución** | Copiar Admin MSP al contenedor y usar `/tmp/org1adminmsp` |
| **Verificación** | `ls -la MSP/signcerts/` debe mostrar `Admin@org...cert.pem` |
| **Tiempo de Resolución** | ~1.5 horas (después de descubrir la causa) |

---

## Lecciones Aprendidas

### 1. Genesis.block es Editable (Quirúrgicamente)
**Lo que aprendimos:**
- El genesis.block es un protobuf que se puede descomponer con `configtxlator`
- Se puede editar el JSON intermedio con `jq`
- Se puede re-codificar sin romper firma/estructura
- El orderer recarga el genesis.block automático al reiniciar

**Implicación para el futuro:**
- Si hay error en genesis.block POST-despliegue, se puede arreglar
- No necesitas regenerar todo el cluster, solo el archivo
- Técnica: `decode → edit → encode → restart orderers`

---

### 2. Cadena de Custodia de Artefactos es CRÍTICA
**Lo que aprendimos:**
- Un artefacto .tx puede existir en múltiples ubicaciones (host, contenedor, múltiples contenedores)
- Las versiones pueden desincronizarse silenciosamente
- Las firmas se pierden si se copia la versión incorrecta

**Mejores Prácticas para el Futuro:**
1. **Un archivo canónico en el host:** `/path/to/artifacts/archivo.tx` (ÚNICA fuente de verdad)
2. **Hash antes y después:** `sha256sum archivo > .sha256` y verificar consistencia
3. **Docker cp atomicidad:** Eliminar versión antigua antes de copiar nueva
4. **Firmas secuenciales:** Si firmas con múltiples orgs:
   - Org1 firma → copia de vuelta al host
   - Host verifica sha256
   - Host copia a Org2
   - Org2 firma → copia de vuelta al host
   - Verificar sha256 cambió
   - Repetir con Org3

---

### 3. Las Políticas de Fabric son IDENTIDAD-ESPECÍFICAS
**Lo que aprendimos:**
- `policy.Admins` requiere identidad con `OU=admin`
- `OU=peer` es RECHAZADO automáticamente
- El error "0 sub-policies satisfied" significa la identidad no coincide

**Implicación:**
- Siempre verificar el OU (Organizational Unit) del certificado que vas a usar
- `openssl x509 -in cert.pem -noout -subject` → verificar OU=admin
- CORE_PEER_MSPCONFIGPATH debe apuntar a admin MSP para operaciones administrativas

---

### 4. System Channel vs Application Channel Policies
**Lo que aprendimos:**
- System channel (genesis.block) usa `Orderer` group + `Consortiums`
- NO necesita `Application` group en system channel
- Application group se define en el TX del application channel
- ChannelCreationPolicy controla QUIÉN puede crear canales
- Application.Admins controla QUIÉN es admin del canal UNA VEZ CREADO

**Estructura Correcta:**
```
System Channel (genesis.block):
├─ /Channel/Orderer/
├─ /Channel/Consortiums/SimbioticaConsortium/
└─ /Channel/Policies/ (Admins, Readers, Writers)

Application Channel (simbioticachannel):
├─ /Channel/Application/Org1MSP
├─ /Channel/Application/Org2MSP
├─ /Channel/Application/Org3MSP
└─ /Channel/Application/Policies/ (Admins with ANY rule)
```

---

### 5. configtxgen NO Edita Inline, Solo Genera
**Lo que aprendimos:**
- `configtxgen` genera artefactos desde YAML (configtx.yaml)
- Si ya existe un genesis.block con error, `configtxgen` no lo "arregla"
- Debes editar el YAML y regenerar, O editar el protobuf directamente

**Para el Futuro:**
- Si hay error en genesis: editar protobuf + jq es más rápido
- Si hay error en TX: regenerar con configtxgen (más seguro)
- Si hay error en configtx.yaml: cambiar YAML y regenerar TODO

---

### 6. Fabric v2.5+ Cambios de Policy
**Lo que aprendimos:**
- En Fabric v2.5+, la policy de Application.Admins es **ImplicitMeta** por defecto
- `Rule: "MAJORITY Admins"` requiere mayoría (2 de 3 orgs)
- `Rule: "ANY Admins"` requiere 1 cualquiera
- Para bootstrap/rescue, `ANY` es más práctico
- Puedes cambiar de `ANY` a `MAJORITY` después con config update del canal

---

## Procedimiento Final Exitoso

### Resumen del Flow Correcto
```bash
# PASO 1: Arreglar genesis.block (si lo necesita)
docker cp orderer0.../genesis.block /tmp/genesis.block
configtxlator proto_decode --input /tmp/genesis.block \
  --type common.Block --output /tmp/genesis.json
# Editar /tmp/genesis.json con jq
configtxlator proto_encode --input /tmp/genesis.json \
  --type common.Block --output /tmp/genesis.block.fixed
cp /tmp/genesis.block.fixed system-genesis-block/genesis.block
docker-compose down -v && docker-compose up -d

# PASO 2: Regenerar TX con política correcta
# Editar configtx.yaml: Application.Policies.Admins → "ANY Admins"
configtxgen \
  -profile SimbioticaChannel \
  -outputCreateChannelTx ./channel-artifacts/simbioticachannel.tx \
  -channelID simbioticachannel

# PASO 3: Firmar con identidad correcta
docker cp ./channel-artifacts/simbioticachannel.tx peer0.org1.../tmp/

# Copiar Admin MSP
ADMIN_MSP="/path/to/crypto-config/.../users/Admin@org1.../msp"
docker cp "$ADMIN_MSP" peer0.org1.../:/tmp/org1adminmsp

# PASO 4: Crear canal con Admin MSP
docker exec peer0.org1... bash -lc '
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=/tmp/org1adminmsp
export FABRIC_CFG_PATH=/var/hyperledger/fabric/config

peer channel create \
  -o orderer0...:7050 \
  --ordererTLSHostnameOverride orderer0... \
  -c simbioticachannel \
  -f /tmp/simbioticachannel.tx \
  --outputBlock /tmp/simbioticachannel.block \
  --tls true \
  --cafile /tmp/tlsca...cert.pem
'

# PASO 5: Copiar bloque de vuelta
docker cp peer0.org1...:/tmp/simbioticachannel.block \
  ./channel-artifacts/simbioticachannel.block
```

---

## Checklist para Futuras Ocasiones

### Pre-Ejecución
- [ ] **Verificar Fabric Version:** `peer version` (esperado: v2.5.x)
- [ ] **Verificar Orderers UP:** `docker ps | grep orderer` (deben estar running)
- [ ] **Verificar Peers UP:** `docker ps | grep peer` (deben estar running)
- [ ] **Verificar crypto-config existe:** `ls crypto-config/peerOrganizations/org1.../`
- [ ] **Limpiar intentos previos:** 
  ```bash
  rm -f channel-artifacts/*.tx channel-artifacts/*.block
  ```

### Diagnóstico Rápido (Si Algo Falla)
```bash
# 1. ¿El TX tiene la estructura correcta?
configtxlator proto_decode --input simbioticachannel.tx \
  --type common.Envelope --output /tmp/tx.json
jq '.payload.data.config_update.write_set.groups.Application.groups | keys' /tmp/tx.json
# Debe mostrar: ["Org1MSP", "Org2MSP", "Org3MSP"]

# 2. ¿El TX tiene firmas?
jq '.payload.data.signatures | length' /tmp/tx.json
# Si es 0 y esperabas > 0, el TX no se firmó correctamente

# 3. ¿El Admin MSP es correcto?
ls -la /tmp/org1adminmsp/signcerts/
# Debe mostrar: Admin@org1...cert.pem (NO peer0...)

# 4. ¿El Genesis tiene ChannelCreationPolicy correcta?
docker cp orderer0.../genesis.block /tmp/genesis.block
configtxlator proto_decode --input /tmp/genesis.block \
  --type common.Block --output /tmp/genesis.json
jq '.data.data[0].payload.data.config.channel_group.groups.Consortiums.groups.SimbioticaConsortium.values.ChannelCreationPolicy.mod_policy' /tmp/genesis.json
# Debe mostrar: "/Channel/Admins" (NO "/Channel/Orderer/Admins")
```

### Configuración de Ambiente
**Variables Críticas (SIEMPRE VERIFICAR):**
```bash
# Debe ser ADMIN MSP, no peer MSP
export CORE_PEER_MSPCONFIGPATH=/tmp/org1adminmsp
# Verificación:
ls $CORE_PEER_MSPCONFIGPATH/signcerts/ | grep -i admin

# Debe ser v2.5.5+
export FABRIC_CFG_PATH=/var/hyperledger/fabric/config

# Debe estar habilitado (políticas ImplicitMeta lo requieren)
export CORE_PEER_TLS_ENABLED=true
```

### Validaciones Post-Creación
- [ ] **Bloque generado:** `ls -lh channel-artifacts/simbioticachannel.block`
- [ ] **Tamaño razonable:** ~40KB (verificar que no sea 0)
- [ ] **Timestamp actual:** `stat simbioticachannel.block | grep Modify`
- [ ] **Decodificar bloque para verificación:**
  ```bash
  configtxlator proto_decode --input simbioticachannel.block \
    --type common.Block --output /tmp/block.json
  jq '.header.number' /tmp/block.json  # Debe ser 0
  ```

---

## Matriz de Errores y Soluciones Rápidas

| Error | Causa Probable | Solución Rápida |
|-------|---|---|
| `creator org unknown` | CLI container sin BCCSP | Usar peer real en su lugar |
| `implicit policy evaluation failed - Writers` | ChannelCreationPolicy mod_policy incorrecto | Editar genesis.block con jq |
| `policy for [Group] /Channel/Application not satisfied` | Identidad de firma incorrecta (peer vs admin) | Copiar Admin MSP, usar /tmp/org1adminmsp |
| `0 sub-policies were satisfied` | MSP con OU=peer en lugar de OU=admin | Verificar `ls MSP/signcerts/ | grep Admin` |
| `certificate signed by unknown authority` | TLS CA file incorrecto | Usar `/tmp/tlsca.blockchain-simbiotica.com-cert.pem` |
| `tls: handshake failed` | TLS CA path error | Verificar `ls -la /tmp/tlsca*` |
| `failed to create deliver client` | Orderer no accesible | Verificar orderer en red, verificar DNS, usar IP si necesario |
| `Received block: 0` pero no aparece el archivo | Bloque se escribe en contenedor | Hacer `docker cp peer0...:/path/block .` |
| `file hash mismatch` después de firmar | Cadena de custodia perdida | Limpiar y re-copiar desde host |

---

## Archivos Generados en Este Proceso

### Artefactos Críticos
- `system-genesis-block/genesis.block` - Genesis parchado ✅
- `channel-artifacts/simbioticachannel.tx` - TX regenerado ✅
- `channel-artifacts/simbioticachannel.block` - Bloque creado ✅

### Archivos de Diagnóstico (Temporales)
- `/tmp/genesis-orderer.block` - Copia original
- `/tmp/genesis-orderer.json` - Decodificado
- `/tmp/genesis-orderer.patched.json` - Con parche de mod_policy
- `/tmp/cc.json` - TX decodificado
- `/tmp/org1adminmsp/` - Admin MSP copiado al contenedor

---

## Próximos Pasos (No en Scope de Este Reporte)

1. **Unir 9 peers al canal:** `peer channel join -b simbioticachannel.block`
2. **Configurar anchor peers:** `peer channel update` con anchor peer config
3. **Instalar chaincode** en los 9 peers
4. **Aprobar chaincode** en cada org
5. **Commitar chaincode** al canal
6. **Testear transacciones** end-to-end

---

## Conclusión

El proceso de creación de canal en Fabric v2.5.5 requiere atención a:
1. **Configuración de policies** en system channel (genesis.block)
2. **Cadena de custodia** de artefactos .tx
3. **Identidad correcta** (admin vs peer) para operaciones administrativas

**El error final fue una lección poderosa:** Las mejores herramientas de diagnóstico (jq, configtxlator) pueden mostrar el error correctamente, pero necesitas INTERPRETAR lo que ves. El "0 sub-policies satisfied" fue síntoma, no causa. La causa era identidad incorrecta.

**Para la próxima ocasión:** Verifica identidad ANTES de invertir tiempo en editar genesis o políticas.

---

**Documentado por:** ROLE 3 (Claude)  
**Autorizado por:** ROLE 2 (ChatGPT)  
**Fecha:** Diciembre 13, 2025  
**Versión:** 1.0
