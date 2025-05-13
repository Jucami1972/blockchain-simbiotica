# Backup Blockchain Simbiótica

**Fecha de backup:** 2025-05-09  
**Ubicación original:** C:\Users\prjcc\Proyecto\backup_blockchain_simbiotica_20250509_102022.tar

## Contenido

- [archivo1] Descripción breve (reemplaza con el nombre real y descripción)
- [archivo2] Descripción breve (reemplaza con el nombre real y descripción)

## Restauración

1. Copia el archivo `.tar` al entorno de trabajo Linux (WSL o servidor).
2. Extrae el contenido:
   ```bash
   tar -xvf backup_blockchain_simbiotica_20250509_102022.tar
   ```
3. Sigue los pasos automáticos incluidos en los scripts:
   - Para reiniciar la red y preparar el entorno:
     ```bash
     npm run restart:env
     ```
   - Para crear la identidad de usuario:
     ```bash
     npm run setup:user1
     ```
4. Verifica el estado de la red y la wallet antes de ejecutar pruebas.

## Notas

- No sobrescribas este backup hasta tener un nuevo estado funcional comprobado.
- Si mejoras los scripts, crea un nuevo backup y actualiza este documento.
