#!/bin/bash
#
# Despliegue completo de la red Fabric de Blockchain Simbiótica.
# Crea el canal, une peer0 de las 3 organizaciones y despliega los 7 chaincodes.
#
# Uso (en la PC con Docker, no interactivo):
#   cd ~/blockchain-simbiotica/network
#   ./deploy-fabric.sh
#
# Requisito previo: network/channel-artifacts/simbiochannel.tx debe ser la
# transacción binaria generada con configtxgen (varios KB). El script lo
# verifica antes de empezar y falla con instrucciones si no lo es.
#
set -euo pipefail

CHANNEL="simbioticachannel"
CLI="cli.blockchain-simbiotica"
PEER_BASE="/opt/gopath/src/github.com/hyperledger/fabric/peer"
NET="$PEER_BASE/network"
ORDERER="orderer0.blockchain-simbiotica.com:7050"
ORDERER_CA="$NET/crypto-config/ordererOrganizations/blockchain-simbiotica.com/orderers/orderer0.blockchain-simbiotica.com/msp/tlscacerts/tlsca.blockchain-simbiotica.com-cert.pem"
CHAINCODES="identity telemedicina token dao ia achievex chat"
BLOCK="$NET/channel-artifacts/simbiochannel.block"
TX="$NET/channel-artifacts/simbiochannel.tx"

echo "==> Verificando que el cli ve los archivos del repo..."
docker exec "$CLI" test -f "$NET/core.yaml" \
  || { echo "ERROR: el cli no ve los archivos (revisa el volumen ../ en docker-compose.yaml y recrea con: docker compose up -d --force-recreate cli)"; exit 1; }
echo "    montaje OK"

echo "==> Verificando que el .tx del canal sea una transacción binaria válida..."
TX_SIZE=$(docker exec "$CLI" stat -c %s "$TX" 2>/dev/null || echo 0)
if [ "$TX_SIZE" -lt 1000 ]; then
  echo "ERROR: $TX mide $TX_SIZE bytes; no parece una transacción binaria válida."
  echo "Regenérala con configtxgen (desde ~/blockchain-simbiotica/network):"
  echo "  docker run --rm -v \"\$PWD\":/config -w /config -e FABRIC_CFG_PATH=/config hyperledger/fabric-tools:2.5 \\"
  echo "    configtxgen -profile SimbioticaChannel -channelID simbioticachannel \\"
  echo "    -outputCreateChannelTx ./channel-artifacts/simbiochannel.tx"
  echo "Verifica después: 'file channel-artifacts/simbiochannel.tx' debe decir 'data' y medir varios KB."
  exit 1
fi
echo "    tx OK ($TX_SIZE bytes)"

echo "==> Creando canal $CHANNEL (o reutilizando si ya existe)..."
docker exec -i \
  -e CHANNEL="$CHANNEL" -e ORDERER="$ORDERER" -e ORDERER_CA="$ORDERER_CA" \
  -e NET="$NET" -e TX="$TX" -e BLOCK="$BLOCK" \
  "$CLI" bash <<'EOF'
set -e
export FABRIC_CFG_PATH="$NET"
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_ADDRESS="peer0.org1.blockchain-simbiotica.com:7051"
export CORE_PEER_TLS_ROOTCERT_FILE="$NET/crypto-config/peerOrganizations/org1.blockchain-simbiotica.com/peers/peer0.org1.blockchain-simbiotica.com/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="$NET/crypto-config/peerOrganizations/org1.blockchain-simbiotica.com/users/Admin@org1.blockchain-simbiotica.com/msp"
cd /opt/gopath/src/github.com/hyperledger/fabric/peer
if peer channel list 2>/dev/null | grep -q "$CHANNEL"; then
  echo "    el canal ya existe: obteniendo bloque génesis..."
  peer channel fetch oldest "$BLOCK" -o "$ORDERER" --tls --cafile "$ORDERER_CA" -c "$CHANNEL"
else
  peer channel create -o "$ORDERER" --tls --cafile "$ORDERER_CA" \
    -c "$CHANNEL" -f "$TX" --outputBlock "$BLOCK"
  echo "    canal creado"
fi
EOF

echo "==> Uniendo peer0 de cada organizacion al canal..."
for org in 1 2 3; do
  echo "    Org$org..."
  docker exec -i \
    -e ORG="$org" -e BLOCK="$BLOCK" -e NET="$NET" -e CHANNEL="$CHANNEL" \
    "$CLI" bash <<'EOF'
set -e
export FABRIC_CFG_PATH="$NET"
export CORE_PEER_LOCALMSPID="Org${ORG}MSP"
export CORE_PEER_ADDRESS="peer0.org${ORG}.blockchain-simbiotica.com:7051"
export CORE_PEER_TLS_ROOTCERT_FILE="$NET/crypto-config/peerOrganizations/org${ORG}.blockchain-simbiotica.com/peers/peer0.org${ORG}.blockchain-simbiotica.com/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="$NET/crypto-config/peerOrganizations/org${ORG}.blockchain-simbiotica.com/users/Admin@org${ORG}.blockchain-simbiotica.com/msp"
if peer channel list 2>/dev/null | grep -q "$CHANNEL"; then
  echo "    peer0.org${ORG} ya estaba unido"
else
  peer channel join -b "$BLOCK"
  echo "    peer0.org${ORG} unido"
fi
EOF
done

deploy_chaincode() {
  local cc="$1"
  echo "==> Desplegando chaincode: $cc (puede tardar varios minutos, cada peer compila con npm)..."
  docker exec -i \
    -e CHANNEL="$CHANNEL" -e ORDERER="$ORDERER" -e ORDERER_CA="$ORDERER_CA" \
    -e NET="$NET" -e CC="$cc" \
    "$CLI" bash <<'EOF'
set -e
export FABRIC_CFG_PATH="$NET"
cd /opt/gopath/src/github.com/hyperledger/fabric/peer

set_org() {
  org=$1
  export CORE_PEER_LOCALMSPID="Org${org}MSP"
  export CORE_PEER_ADDRESS="peer0.org${org}.blockchain-simbiotica.com:7051"
  export CORE_PEER_TLS_ROOTCERT_FILE="$NET/crypto-config/peerOrganizations/org${org}.blockchain-simbiotica.com/peers/peer0.org${org}.blockchain-simbiotica.com/tls/ca.crt"
  export CORE_PEER_MSPCONFIGPATH="$NET/crypto-config/peerOrganizations/org${org}.blockchain-simbiotica.com/users/Admin@org${org}.blockchain-simbiotica.com/msp"
}

set_org 1
if peer lifecycle chaincode querycommitted --channelID "$CHANNEL" --name "$CC" >/dev/null 2>&1; then
  echo "    $CC ya está committed: se omite"
else

peer lifecycle chaincode package "$CC.tar.gz" --path "./chaincode/$CC" --lang node --label "${CC}_1.0"

for org in 1 2 3; do
  set_org "$org"
  peer lifecycle chaincode install "$CC.tar.gz"
done

set_org 1
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "${CC}_1.0" | sed -E 's/.*Package ID: ([^,]+),.*/\1/')
echo "    Package ID: $PACKAGE_ID"

for org in 1 2 3; do
  set_org "$org"
  peer lifecycle chaincode approveformyorg -o "$ORDERER" --tls --cafile "$ORDERER_CA" \
    --channelID "$CHANNEL" --name "$CC" --version 1.0 --sequence 1 --package-id "$PACKAGE_ID"
done

echo "    esperando checkcommitreadiness..."
READY=false
for ((attempt=1; attempt<=12; attempt++)); do
  JSON=$(peer lifecycle chaincode checkcommitreadiness --channelID "$CHANNEL" --name "$CC" --version 1.0 --sequence 1 --output json 2>/dev/null || true)
  if echo "$JSON" | grep -q '"Org1MSP": true' && echo "$JSON" | grep -q '"Org2MSP": true' && echo "$JSON" | grep -q '"Org3MSP": true'; then
    READY=true
    break
  fi
  sleep 10
done
if [ "$READY" != "true" ]; then
  echo "ERROR: approvals no listos para $CC tras 120s"
  exit 1
fi
echo "    readiness OK"

set_org 1
peer lifecycle chaincode commit -o "$ORDERER" --tls --cafile "$ORDERER_CA" \
  --channelID "$CHANNEL" --name "$CC" --version 1.0 --sequence 1 \
  --peerAddresses peer0.org1.blockchain-simbiotica.com:7051 --tlsRootCertFiles "$NET/crypto-config/peerOrganizations/org1.blockchain-simbiotica.com/peers/peer0.org1.blockchain-simbiotica.com/tls/ca.crt" \
  --peerAddresses peer0.org2.blockchain-simbiotica.com:7051 --tlsRootCertFiles "$NET/crypto-config/peerOrganizations/org2.blockchain-simbiotica.com/peers/peer0.org2.blockchain-simbiotica.com/tls/ca.crt" \
  --peerAddresses peer0.org3.blockchain-simbiotica.com:7051 --tlsRootCertFiles "$NET/crypto-config/peerOrganizations/org3.blockchain-simbiotica.com/peers/peer0.org3.blockchain-simbiotica.com/tls/ca.crt"

peer lifecycle chaincode querycommitted --channelID "$CHANNEL" --name "$CC"
echo "    OK: $CC desplegado"
fi
EOF
}

for cc in $CHAINCODES; do
  deploy_chaincode "$cc"
done

echo ""
echo "==> DESPLIEGUE COMPLETO: canal $CHANNEL + 7 chaincodes."
