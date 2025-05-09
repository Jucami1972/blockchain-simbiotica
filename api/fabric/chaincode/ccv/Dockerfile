# Base Node.js con la versión recomendada por Hyperledger Fabric
FROM node:14

# Establecer el directorio de trabajo
WORKDIR /usr/src/chaincode

# Copiar archivos del chaincode
COPY . .

# Instalar dependencias
RUN npm install --production

# Configuración de Fabric (se instalan los shims)
RUN npm install fabric-contract-api@2.2 fabric-shim@2.2 --production

# Establecer variable de entorno para Fabric
ENV CORE_CHAINCODE_ID_NAME=ccv
ENV CORE_CHAINCODE_LOGGING_LEVEL=DEBUG
ENV CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=net_default

# Exponer el puerto del chaincode
EXPOSE 9998

# Iniciar el chaincode
CMD ["node", "index.js"] 