# Despliegue de Blockchain Simbiótica

## Requisitos:

- Docker y Docker Compose
- Node.js 14.x
- Hyperledger Fabric 2.x

## Pasos:

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/tu-repo/blockchain-simbiotica.git
   cd blockchain-simbiotica
   ```

2. Iniciar Fabric:

   ```bash
   cd fabric/
   ./scripts/deploy.sh
   ```

3. Iniciar la API:

   ```bash
   cd api/
   npm install
   npm start
   ```

4. Probar API:
   ```bash
   curl http://localhost:3000/api/users
   ```
