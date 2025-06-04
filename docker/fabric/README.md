# Guía para Desplegar la Red Hyperledger Fabric - Blockchain Simbiótica

Este documento describe el proceso completo para dejar la red de Hyperledger Fabric lista para el despliegue, incluyendo los ajustes realizados para evitar errores comunes relacionados con variables de entorno y volúmenes en Docker Compose.

---

## 1. Requisitos Previos

- Docker y Docker Compose instalados
- Acceso a la terminal en el directorio raíz del proyecto
- Archivos de configuración y certificados generados en `network/crypto-config` y `network/channel-artifacts`

---

## 2. Limpieza de la Red (Opcional pero Recomendado)

Antes de desplegar la red, asegúrate de que no existan contenedores, volúmenes o redes residuales:

```bash
docker ps -a
# Si hay contenedores relacionados, elimínalos:
docker rm -f $(docker ps -aq)

docker volume ls
# Si hay volúmenes relacionados, elimínalos:
docker volume rm <nombre_del_volumen>

docker network ls
# Si hay redes personalizadas, elimínalas:
docker network rm <nombre_de_la_red>
```

---

## 3. Ajustes Realizados en la Configuración

### a) Variables de Entorno
- Todas las variables en el archivo `.env` deben estar completamente expandidas (sin referencias a otras variables dentro del mismo archivo).
- Ejemplo correcto:
  ```env
  ORDERER0_HOSTNAME=orderer0.blockchain-simbiotica.com
  ORG1_DOMAIN=org1.blockchain-simbiotica.com
  ```

### b) docker-compose.yaml
- Todas las referencias a variables en nombres de servicios, volúmenes y rutas fueron reemplazadas por sus valores finales.
- Los volúmenes nombrados se definen así:
  ```yaml
  volumes:
    orderer0.blockchain-simbiotica.com: {}
    peer0.org1.blockchain-simbiotica.com: {}
    # ...
  ```
- En los servicios, los volúmenes se montan usando el formato extendido:
  ```yaml
  volumes:
    - type: volume
      source: orderer0.blockchain-simbiotica.com
      target: /var/hyperledger/production/orderer
    - type: bind
      source: /ruta/absoluta/al/genesis.block
      target: /var/hyperledger/orderer/genesis.block
      bind:
        create_host_path: true
  ```
- No deben quedar líneas con `${VARIABLE}` en el archivo YAML.

---

## 4. Validación de la Configuración

Antes de levantar la red, valida la configuración:

```bash
docker compose -f docker/fabric/docker-compose.yaml --env-file docker/.env config
```

Si no hay errores, la configuración es válida.

---

## 5. Despliegue de la Red

Para iniciar la red:

```bash
docker compose -f docker/fabric/docker-compose.yaml --env-file docker/.env up -d
```

Esto levantará todos los servicios definidos (orderers, peers, CAs, CouchDB, CLI).

---

## 6. Verificación del Estado de la Red

Para verificar que todos los contenedores estén en ejecución:

```bash
docker ps
```

Para ver los volúmenes y redes creados:

```bash
docker volume ls
docker network ls
```

---

## 7. Notas Adicionales

- Si necesitas limpiar la red nuevamente, repite el paso 2.
- Si modificas el archivo `docker-compose.yaml` o `.env`, valida siempre antes de desplegar.
- Los scripts de automatización pueden ser agregados en la carpeta `fabric/scripts` si se requiere mayor automatización.

---

**¡La red está lista para el despliegue!** 