#!/bin/bash

export FABRIC_CFG_PATH=/home/jucami29/fabric-workspace/blockchain-simbiotica/fabric-network/fabric-samples/config
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/home/jucami29/fabric-workspace/blockchain-simbiotica/fabric-network/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/home/jucami29/fabric-workspace/blockchain-simbiotica/fabric-network/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051 