#!/bin/bash
set -e

export FABRIC_CFG_PATH=${PWD}

echo "==> Generando material criptográfico (MSP)..."
cryptogen generate --config=./crypto-config.yaml --output=./crypto-config

mkdir -p system-genesis-block
mkdir -p channel-artifacts

echo "==> Generando bloque génesis..."
configtxgen -profile OneOrgOrdererGenesis -channelID system-channel -outputBlock ./system-genesis-block/genesis.block

echo "==> Generando transacción de creación de canal..."
configtxgen -profile OneOrgChannel -channelID simbioticachannel -outputCreateChannelTx ./channel-artifacts/simbiochannel.tx

echo "Artefactos generados correctamente."

