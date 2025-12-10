#!/bin/bash
set -e

export FABRIC_CFG_PATH=${PWD}

echo "==> Creando canal simbioticachannel..."

export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=./crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=./crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

peer channel create \
  -o localhost:7050 \
  -c simbioticachannel \
  -f ./channel-artifacts/simbiochannel.tx \
  --outputBlock ./channel-artifacts/simbiochannel.block \
  --tls --cafile ./crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt

echo "==> Uniéndose al canal..."
peer channel join -b ./channel-artifacts/simbiochannel.block

echo "Canal creado y peer unido correctamente."

