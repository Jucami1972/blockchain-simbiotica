# Informe de Problemas Solucionados y Buenas Prácticas

## 1. Gestión de versiones de Node.js
**Problema:**
El proyecto usaba Node.js 14, pero muchas dependencias modernas (como ESLint, Husky, Prettier) requieren Node.js 18 o superior.
**Solución:**
- Se creó el archivo `.nvmrc` con la versión 18.20.8.
- Se cambió a Node.js 18 usando `nvm use 18`.
- Se eliminó Node.js 14 y cualquier otra versión innecesaria de WSL para evitar conflictos.
- Se bloqueó Node.js 18 como predeterminada en el entorno WSL.
**Recomendación:**
Siempre usar `.nvmrc` y `nvm` para gestionar versiones y evitar conflictos en equipos y CI.

---

## 2. Error de sleep: missing operand en scripts de Fabric
**Problema:**
El script `network.sh` de Hyperledger Fabric arrojaba el error `sleep: missing operand` por variables de espera no inicializadas.
**Solución:**
- Se inicializó la variable `DELAY` y `RETRY_WAIT` con valores por defecto en el script.
**Recomendación:**
Siempre inicializar variables de entorno en scripts bash para evitar errores de ejecución.

---

## 3. Errores de formato y configuración en ESLint y Prettier
**Problema:**
- Error al instalar ESLint y Prettier por versión incompatible de Node.js.
- Error de configuración: `require is not defined in ES module scope` en `eslint.config.mjs`.
**Solución:**
- Se actualizó Node.js a la versión 18.
- Se corrigió la configuración de ESLint para usar `import` en vez de `require` en archivos `.mjs`.
- Se integró Prettier con ESLint usando la sintaxis recomendada.
**Recomendación:**
Usar siempre la sintaxis de módulos ES (`import`) en archivos `.mjs` y mantener las dependencias actualizadas.

---

## 4. Integración de Husky y lint-staged
**Problema:**
- Comandos `npx husky install` y `npx husky add` marcados como deprecated.
- Falta de automatización en la validación y formateo de código antes de los commits.
**Solución:**
- Se instaló Husky y lint-staged como dependencias de desarrollo.
- Se configuró el script `prepare` en `package.json`.
- Se inicializó Husky y se creó el hook pre-commit para ejecutar lint-staged.
- Se configuró lint-staged para ejecutar ESLint y Prettier en los archivos modificados antes de cada commit.
**Recomendación:**
Seguir las prácticas recomendadas por la documentación oficial de Husky y lint-staged para mantener un flujo de trabajo moderno y seguro.

---

## 5. Errores de sintaxis YAML en workflows de GitHub Actions
**Problema:**
Error de sintaxis YAML en `.github/workflows/ci.yml` reportado por el editor/linter.
**Solución:**
- Se revisó la existencia y el contenido del archivo.
- Se creó un workflow de CI básico y válido para Node.js en la ruta correcta.
**Recomendación:**
Mantener los archivos YAML bien indentados y validados con herramientas como yamllint.

---

## 6. Errores de invocación y consulta en Hyperledger Fabric
**Problema:**
- Errores al invocar chaincode por argumentos mal formateados o en orden incorrecto.
- Errores al consultar assets que no existen.
**Solución:**
- Se corrigieron los comandos de invocación y consulta, asegurando el orden correcto de los argumentos.
- Se documentó el comportamiento esperado al consultar assets inexistentes.
**Recomendación:**
Revisar siempre la documentación del chaincode para conocer el orden y tipo de argumentos requeridos.

---

## 7. Limpieza y organización del entorno
**Problema:**
- Carpetas y archivos duplicados o innecesarios.
- Dependencias desactualizadas o vulnerables.
**Solución:**
- Se eliminaron versiones antiguas de Node.js y dependencias innecesarias.
- Se limpió y reinstaló el entorno de dependencias.
**Recomendación:**
Mantener el entorno limpio y actualizado para evitar conflictos y vulnerabilidades.

---

## 8. Automatización y buenas prácticas
**Problema:**
- Falta de automatización en la selección de versión de Node.js y validación de código.
**Solución:**
- Uso de `.nvmrc`, Husky, lint-staged y Prettier para automatizar el flujo de trabajo.
**Recomendación:**
Automatizar todo lo posible para reducir errores humanos y mejorar la calidad del código.

---

# Resumen
Durante la sesión se resolvieron problemas de versiones, configuración de herramientas de calidad de código, automatización de flujos de trabajo, errores de scripts y de sintaxis, y se dejó el entorno listo para desarrollo profesional y colaborativo. 