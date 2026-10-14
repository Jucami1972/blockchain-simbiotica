#!/bin/bash
#
# Despliegue completo de la red Fabric de Blockchain Simbiótica.
# Crea el canal, une peer0 de las 3 organizaciones y despliega los 7 chaincodes.
#
# Uso (en la PC con Docker, no interactivo):
#   cd ~/blockchain-simbiotica/network
#   ./deploy-fabric.sh
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

echo "==> Creando canal $CHANNEL..."
docker exec -i \
  -e CHANNEL="$CHANNEL" -e ORDERER="$ORDERER" -e ORDERER_CA="$ORDERER_CA" \
  -e NET="$NET" -e TX="$TX" -e BLOCK="$BLOCK" \
  "$CLI" bash <<'EOF'
set -e
export FABRIC_CFG_PATH="$NET"
cd /opt/gopath/src/github.com/hyperledger/fabric/peer
peer channel create -o "$ORDERER" --tls --cafile "$ORDERER_CA" \
  -c "$CHANNEL" -f "$TX" --outputBlock "$BLOCK"
echo "    canal creado"
EOF

echo "==> Uniendo peer0 de cada organizacion al canal..."
for org in 1 2 3; do
  echo "    Org$org..."
  docker exec -i \
    -e ORG="$org" -e BLOCK="$BLOCK" -e NET="$NET" \
    "$CLI" bash <<'EOF'
set -e
export FABRIC_CFG_PATH="$NET"
export CORE_PEER_LOCALMSPID="Org${ORG}MSP"
export CORE_PEER_ADDRESS="peer0.org${ORG}.blockchain-simbiotica.com:7051"
export CORE_PEER_TLS_ROOTCERT_FILE="$NET/crypto-config/peerOrganizations/org${ORG}.blockchain-simbiotica.com/peers/peer0.org${ORG}.blockchain-simbiotica.com/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="$NET/crypto-config/peerOrganizations/org${ORG}.blockchain-simbiotica.com/users/Admin@org${ORG}.blockchain-simbiotica.com/msp"
peer channel join -b "$BLOCK"
echo "    peer0.org${ORG} unido"
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

set_org 1
peer lifecycle chaincode commit -o "$ORDERER" --tls --cafile "$ORDERER_CA" \
  --channelID "$CHANNEL" --name "$CC" --version 1.0 --sequence 1 \
  --peerAddresses peer0.org1.blockchain-simbiotica.com:7051 --tlsRootCertFiles "$NET/crypto-config/peerOrganizations/org1.blockchain-simbiotica.com/peers/peer0.org1.blockchain-simbiotica.com/tls/ca.crt" \
  --peerAddresses peer0.org2.blockchain-simbiotica.com:7051 --tlsRootCertFiles "$NET/crypto-config/peerOrganizations/org2.blockchain-simbiotica.com/peers/peer0.org2.blockchain-simbiotica.com/tls/ca.crt" \
  --peerAddresses peer0.org3.blockchain-simbiotica.com:7051 --tlsRootCertFiles "$NET/crypto-config/peerOrganizations/org3.blockchain-simbiotica.com/peers/peer0.org3.blockchain-simbiotica.com/tls/ca.crt"

peer lifecycle chaincode querycommitted --channelID "$CHANNEL" --name "$CC"
echo "    OK: $CC desplegado"
EOF
}

for cc in $CHAINCODES; do
  deploy_chaincode "$cc"
done

echo ""
echo "==> DESPLIEGUE COMPLETO: canal $CHANNEL + 7 chaincodes."
