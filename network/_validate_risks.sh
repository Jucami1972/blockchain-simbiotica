#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║    ANÁLISIS DE RIESGOS Y VALIDACIONES ADICIONALES            ║"
echo "╚══════════════════════════════════════════════════════════════╝"

echo -e "\n┌─ RIESGOS DETECTADOS ─────────────────────────────────────────┐"

# Riesgo 1: Volúmenes faltantes
echo "⚠️  Riesgo 1: Volúmenes Nombrados"
EXPECTED_VOLS=28
ACTUAL_VOLS=$(grep "^  [a-z].*\.blockchain-simbiotica\.com: {}" docker-compose.yaml | wc -l)
if [ "$ACTUAL_VOLS" -lt "$EXPECTED_VOLS" ]; then
    echo "  ❌ CRÍTICO: Se esperan $EXPECTED_VOLS volúmenes, solo hay $ACTUAL_VOLS"
    echo "     Volúmenes esperados: 5 orderers + 3 CAs + 9 peers + 9 CouchDB = 26 (base)"
    echo "     Faltantes: $(($EXPECTED_VOLS - $ACTUAL_VOLS))"
else
    echo "  ✅ CORRECTO: $ACTUAL_VOLS volúmenes nombrados presentes"
fi

# Riesgo 2: Directorios de crypto-config
echo -e "\n⚠️  Riesgo 2: Directorios de Artefactos Criptográficos"
if [ -d "crypto-config" ]; then
    CRYPTO_SIZE=$(du -sh crypto-config 2>/dev/null | awk '{print $1}')
    if [ "$CRYPTO_SIZE" = "0" ] || [ -z "$CRYPTO_SIZE" ]; then
        echo "  ⚠️  ADVERTENCIA: crypto-config/ existe pero está vacío"
        echo "     Será poblado por 'cryptogen generate' en TAREA 5.4"
    else
        echo "  ✅ crypto-config/ contiene datos: $CRYPTO_SIZE"
    fi
else
    echo "  ❌ CRÍTICO: crypto-config/ no existe"
fi

# Riesgo 3: Puertos duplicados
echo -e "\n⚠️  Riesgo 3: Conflicto de Puertos"
PORT_DUPES=$(grep -E "^ *- \"[0-9]+:" docker-compose.yaml | cut -d'"' -f2 | cut -d':' -f1 | sort | uniq -d)
if [ -z "$PORT_DUPES" ]; then
    echo "  ✅ CORRECTO: No hay puertos duplicados"
else
    echo "  ❌ CRÍTICO: Puertos duplicados encontrados: $PORT_DUPES"
fi

# Riesgo 4: Variables de entorno críticas
echo -e "\n⚠️  Riesgo 4: Variables de Entorno Críticas"
MISSING_ENV=0
for peer_org in "Org1MSP" "Org2MSP" "Org3MSP"; do
    if ! grep -q "CORE_PEER_LOCALMSPID=$peer_org" docker-compose.yaml; then
        echo "  ❌ FALTA: CORE_PEER_LOCALMSPID=$peer_org"
        ((MISSING_ENV++))
    fi
done
if [ "$MISSING_ENV" -eq 0 ]; then
    echo "  ✅ CORRECTO: Todas las LOCALMSPID están presentes"
fi

# Riesgo 5: Orden en EtcdRaft
echo -e "\n⚠️  Riesgo 5: Configuración de EtcdRaft"
RAFT_CONFIG=$(grep -A50 "EtcdRaft:" configtx.yaml | grep "Consenters:" | wc -l)
if [ "$RAFT_CONFIG" -gt 0 ]; then
    echo "  ✅ CORRECTO: Sección EtcdRaft/Consenters presente"
else
    echo "  ❌ CRÍTICO: Falta configuración de EtcdRaft"
fi

# Riesgo 6: Rutas de certificados TLS
echo -e "\n⚠️  Riesgo 6: Rutas de Certificados TLS en configtx"
TLS_PATHS=$(grep -c "ClientTLSCert:\|ServerTLSCert:" configtx.yaml)
if [ "$TLS_PATHS" -eq 10 ]; then
    echo "  ✅ CORRECTO: $TLS_PATHS rutas TLS definidas (5 orderers x 2)"
else
    echo "  ⚠️  ADVERTENCIA: Se esperan 10 rutas TLS, se encontraron $TLS_PATHS"
fi

# Riesgo 7: Perfiles de configtx
echo -e "\n⚠️  Riesgo 7: Perfiles de Configuración"
PROFILES=$(grep "^    [A-Z]" configtx.yaml | grep -E "Genesis|Channel" | wc -l)
if [ "$PROFILES" -ge 2 ]; then
    echo "  ✅ CORRECTO: Se encontraron $PROFILES perfiles (SimbioticaOrdererGenesis, SimbioticaChannel)"
else
    echo "  ❌ CRÍTICO: Se esperan ≥2 perfiles, solo hay $PROFILES"
fi

# Riesgo 8: Consistencia de hostname vs container_name
echo -e "\n⚠️  Riesgo 8: Consistencia hostname vs container_name"
HOSTNAME_MISMATCHES=$(
  (grep "container_name:" docker-compose.yaml | awk -F': ' '{print $2}' | sort) > /tmp/containers.txt
  (grep "hostname:" docker-compose.yaml | awk -F': ' '{print $2}' | sort) > /tmp/hostnames.txt
  diff /tmp/containers.txt /tmp/hostnames.txt | wc -l
)
if [ "$HOSTNAME_MISMATCHES" -eq 0 ]; then
    echo "  ✅ CORRECTO: container_name y hostname son consistentes"
else
    echo "  ⚠️  ADVERTENCIA: Posibles inconsistencias entre container_name y hostname"
fi

echo -e "\n└─────────────────────────────────────────────────────────────┘"

echo -e "\n┌─ VALIDACIONES ADICIONALES ───────────────────────────────────┐"

# Capacidades de Fabric
echo "✓ Versión de Capabilities en configtx:"
grep -E "V[0-9]_[0-9]:" configtx.yaml | sort | uniq | while read cap; do echo "  $cap"; done

# Network mode en docker-compose
echo -e "\n✓ Network mode para peers:"
grep "CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=" docker-compose.yaml | head -1 | awk -F'=' '{print "  "$2}'

# Validación de endpoints de orderers
echo -e "\n✓ Endpoints de orderers en configtx (Addresses):"
grep -A5 "Addresses:" configtx.yaml | grep "orderer" | head -1

# Bootstrap peer configuration
echo -e "\n✓ Bootstrap peers configurados:"
BOOTSTRAP_COUNT=$(grep "CORE_PEER_GOSSIP_BOOTSTRAP=" docker-compose.yaml | sort | uniq | wc -l)
echo "  $BOOTSTRAP_COUNT configuraciones de bootstrap encontradas"

# CouchDB addresses
echo -e "\n✓ Direcciones de CouchDB en peers:"
COUCHDB_ADDRS=$(grep "CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=" docker-compose.yaml | wc -l)
echo "  $COUCHDB_ADDRS direcciones de CouchDB configuradas"

echo -e "\n└─────────────────────────────────────────────────────────────┘"

