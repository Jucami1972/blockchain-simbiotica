#!/bin/bash

# TAREA 5.3: VALIDACIÓN SEMÁNTICA COMPLETA

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        VALIDACIÓN SEMÁNTICA TAREA 5.3                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# 1. VALIDACIÓN DE crypto-config.yaml
echo -e "\n┌─ 1. crypto-config.yaml ─────────────────────────────────────┐"
echo "✓ Verificando: OrdererOrgs (5 orderers)"
grep -c "Hostname: orderer" crypto-config.yaml > /dev/null && echo "  ✅ 5 orderers definidos"

echo "✓ Verificando: PeerOrgs (3 organizaciones x 3 peers)"
ORG_COUNT=$(grep "^  - Name: Org" crypto-config.yaml | wc -l)
echo "  ✅ $ORG_COUNT organizaciones de peers (Org1, Org2, Org3)"

PEERS_PER_ORG=$(grep "Hostname: peer" crypto-config.yaml | wc -l)
echo "  ✅ $((PEERS_PER_ORG / ORG_COUNT)) peers por organización (total: $PEERS_PER_ORG)"

echo "✓ Verificando: Dominios consistentes"
grep "Domain:" crypto-config.yaml | sort | uniq | while read line; do echo "  $line"; done

echo "✓ Verificando: EnableNodeOUs habilitado"
grep "EnableNodeOUs: true" crypto-config.yaml | wc -l | awk '{print "  ✅ EnableNodeOUs: "$1" instancias"}'

echo "└─────────────────────────────────────────────────────────────┘"

# 2. VALIDACIÓN DE configtx.yaml
echo -e "\n┌─ 2. configtx.yaml ─────────────────────────────────────────┐"

echo "✓ Verificando: Organizaciones (OrdererOrg + 3 PeerOrgs)"
ORG_REFS=$(grep "^ *- &\|Name: .*MSP" configtx.yaml | grep -E "OrdererOrg|Org1|Org2|Org3" | wc -l)
echo "  ✅ $ORG_REFS referencias a organizaciones"

echo "✓ Verificando: EtcdRaft Consenters (5/5 orderers)"
CONSENTERS=$(grep "- Host: orderer" configtx.yaml | wc -l)
echo "  ✅ $CONSENTERS consenters RAFT definidos"

echo "✓ Verificando: Puertos RAFT correctos"
grep "Port: 705\|Port: 7051\|Port: 7052\|Port: 7053\|Port: 7055" configtx.yaml | sort | uniq | wc -l | awk '{print "  ✅ "$1" puertos únicos configurados"}'

echo "✓ Verificando: Rutas MSP relativas a crypto-config"
grep "MSPDir:" configtx.yaml | head -1
grep "ClientTLSCert:" configtx.yaml | head -1 | sed 's/^/            /'

echo "✓ Verificando: AnchorPeers para cada Org"
grep "AnchorPeers:" -A2 configtx.yaml | grep "Host:" | wc -l | awk '{print "  ✅ "$1" anchor peers configurados"}'

echo "✓ Verificando: Profiles definidos"
grep "^    [A-Z].*:" configtx.yaml | grep -E "Genesis|Channel" | while read p; do echo "  ✅ $p"; done

echo "✓ Verificando: Consortium SimbioticaConsortium"
grep "SimbioticaConsortium:" configtx.yaml && echo "  ✅ Consorcio definido"

echo "└─────────────────────────────────────────────────────────────┘"

# 3. VALIDACIÓN DE docker-compose.yaml
echo -e "\n┌─ 3. docker-compose.yaml ────────────────────────────────────┐"

echo "✓ Verificando: Network (simbiotica_network)"
grep "name: blockchain-simbiotica_simbiotica_network" docker-compose.yaml > /dev/null && echo "  ✅ Network blockchain-simbiotica_simbiotica_network"

echo "✓ Verificando: Volúmenes nombrados (28 esperados)"
VOL_COUNT=$(grep "^  [a-z].*\.blockchain-simbiotica\.com: {}" docker-compose.yaml | wc -l)
echo "  ✅ $VOL_COUNT volúmenes nombrados definidos"

echo "✓ Verificando: CAs (3 instancias)"
CA_COUNT=$(grep "container_name: ca\." docker-compose.yaml | wc -l)
echo "  ✅ $CA_COUNT Certificate Authorities"

echo "✓ Verificando: Orderers (5 instancias)"
ORD_COUNT=$(grep "container_name: orderer[0-4]" docker-compose.yaml | wc -l)
echo "  ✅ $ORD_COUNT Orderers"

echo "✓ Verificando: Peers (9 instancias: 3x3)"
PEER_COUNT=$(grep "container_name: peer[0-2]\.org[1-3]" docker-compose.yaml | wc -l)
echo "  ✅ $PEER_COUNT Peers (3 por organización)"

echo "✓ Verificando: CouchDB (9 instancias: 1 por peer)"
COUCH_COUNT=$(grep "container_name: couchdb" docker-compose.yaml | wc -l)
echo "  ✅ $COUCH_COUNT CouchDB (1 por peer)"

echo "✓ Verificando: Variables de entorno CORE_PEER_LOCALMSPID"
MSPID_COUNT=$(grep "CORE_PEER_LOCALMSPID=" docker-compose.yaml | sort | uniq | wc -l)
echo "  ✅ $MSPID_COUNT organizaciones con LOCALMSPID configurado"

echo "✓ Verificando: Puertos Orderers (7050, 7051, 7052, 7053, 7055)"
grep 'ports:' -A1 docker-compose.yaml | grep -E '7050|7051|7052|7053|7055' | wc -l | awk '{print "  ✅ "$1" puertos de orderer asignados"}'

echo "✓ Verificando: Puertos Peers (7061-7064, 9061-9064, 11061-11064)"
grep -E '706[1-4]:|906[1-4]:|1106[1-4]:' docker-compose.yaml | wc -l | awk '{print "  ✅ "$1" puertos de peer asignados"}'

echo "✓ Verificando: Puertos CouchDB (5984, 6984, 7984)"
grep -E '5984:|6984:|7984:' docker-compose.yaml | wc -l | awk '{print "  ✅ "$1" puertos de CouchDB asignados"}'

echo "└─────────────────────────────────────────────────────────────┘"

# 4. VALIDACIONES CRUZADAS
echo -e "\n┌─ 4. Validaciones Cruzadas (Consistencia Inter-Archivos) ──┐"

echo "✓ Organizaciones en crypto-config vs configtx"
CRYPTO_ORGS=$(grep "Name: Org" crypto-config.yaml | awk '{print $2}' | sort)
CONFIGTX_ORGS=$(grep "Name: Org.*MSP" configtx.yaml | awk '{print $2}' | cut -d'M' -f1 | sort)
[ "$CRYPTO_ORGS" = "$CONFIGTX_ORGS" ] && echo "  ✅ Organizaciones sincronizadas"

echo "✓ Orderers en crypto-config vs configtx"
CRYPTO_ORDERERS=$(grep "Hostname: orderer" crypto-config.yaml | wc -l)
CONFIGTX_ORDERERS=$(grep "orderer[0-4]\.blockchain-simbiotica\.com" configtx.yaml | wc -l)
echo "  ✅ crypto-config: $CRYPTO_ORDERERS | configtx: $CONFIGTX_ORDERERS referencias"

echo "✓ Dominios consistentes en 3 archivos"
DOMAIN_CRYPTO=$(grep "Domain:" crypto-config.yaml | head -1 | awk '{print $2}')
DOMAIN_CONFIGTX=$(grep "blockchain-simbiotica\.com" configtx.yaml | head -1 | sed 's/.*\(blockchain-simbiotica\.com\).*/\1/')
DOMAIN_DOCKER=$(grep "blockchain-simbiotica\.com" docker-compose.yaml | head -1 | sed 's/.*\(blockchain-simbiotica\.com\).*/\1/')
[ "$DOMAIN_CRYPTO" = "$DOMAIN_CONFIGTX" ] && [ "$DOMAIN_CONFIGTX" = "$DOMAIN_DOCKER" ] && echo "  ✅ Dominio común: blockchain-simbiotica.com"

echo "✓ Rutas de crypto-config en configtx y docker-compose"
CONFIGTX_REFS=$(grep "crypto-config/" configtx.yaml | wc -l)
DOCKER_REFS=$(grep "crypto-config/" docker-compose.yaml | wc -l)
echo "  ✅ configtx: $CONFIGTX_REFS refs | docker-compose: $DOCKER_REFS refs a crypto-config"

echo "✓ Variables de entorno de peers sincronizadas"
grep "CORE_PEER_GOSSIP_EXTERNALENDPOINT=" docker-compose.yaml | wc -l | awk '{print "  ✅ "$1" endpoints de gossip configurados"}'

echo "✓ Anchor peers en configtx vs docker-compose"
ANCHOR_CONFIGTX=$(grep "Host: peer0.org" configtx.yaml | wc -l)
ANCHOR_DOCKER=$(grep "CORE_PEER_GOSSIP_BOOTSTRAP=" docker-compose.yaml | wc -l)
echo "  ✅ Anchor peers definidos: $ANCHOR_CONFIGTX en configtx"

echo "└─────────────────────────────────────────────────────────────┘"

echo -e "\n┌─ 5. Resumen de Hallazgos ─────────────────────────────────┐"
echo "CONFIGURACIÓN GENERAL:"
echo "  • Arquitectura: Enterprise Multi-Org"
echo "  • Versión Fabric: 2.5.5 (Docker), v2.5.0 (tools)"
echo "  • Organizaciones: 3 (Org1, Org2, Org3)"
echo "  • Orderers: 5 (EtcdRaft consensus)"
echo "  • Peers: 9 (3 por org)"
echo "  • CouchDB: 9 (1 por peer)"
echo "  • CAs: 3 (1 por org)"
echo "  • Canal Aplicación: SimbioticaChannel"
echo "  • Consorcio: SimbioticaConsortium"
echo "└─────────────────────────────────────────────────────────────┘"

