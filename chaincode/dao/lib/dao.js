'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Contrato de Gobernanza DAO para la Blockchain Simbiótica
 * Implementa funcionalidades para la gobernanza descentralizada y toma de decisiones
 */
class DAOContract extends Contract {
    
    /**
     * Inicializa el contrato con los valores predeterminados
     * @param {Context} ctx - Contexto de transacción
     */
    async init(ctx) {
        console.info('============= Inicializando Contrato de Gobernanza DAO =============');
        
        // Configuración del contrato de gobernanza
        const daoConfig = {
            version: '1.0',
            nombre: 'Gobernanza Simbiótica',
            tokenVotacion: 'SIMB',
            quorum: 0.51, // 51% de participación mínima
            umbralAprobacion: 0.67, // 67% de votos a favor para aprobar
            periodoVotacionDias: 7,
            periodoEjecucionDias: 14,
            rolAdmin: 'admin',
            rolesPermitidos: ['admin', 'miembro', 'desarrollador', 'auditor'],
            categoriasPropuesta: ['general', 'tecnica', 'financiera', 'parametros', 'miembros']
        };
        
        await ctx.stub.putState('daoConfig', Buffer.from(JSON.stringify(daoConfig)));
        
        console.info('============= Contrato de Gobernanza DAO inicializado correctamente =============');
        return JSON.stringify(daoConfig);
    }
    
    /**
     * Crea una nueva propuesta de gobernanza
     * @param {Context} ctx - Contexto de transacción
     * @param {String} titulo - Título de la propuesta
     * @param {String} descripcion - Descripción detallada de la propuesta
     * @param {String} categoria - Categoría de la propuesta
     * @param {String} accionesData - Acciones a ejecutar en formato JSON
     * @returns {Object} - Información de la propuesta creada
     */
    async crearPropuesta(ctx, titulo, descripcion, categoria, accionesData) {
        // Obtener la identidad del creador
        const clientIdentity = ctx.clientIdentity;
        const creador = clientIdentity.getID();
        
        // Validar parámetros
        if (!titulo || !descripcion || !categoria || !accionesData) {
            throw new Error('Parámetros inválidos: se requiere título, descripción, categoría y acciones');
        }
        
        // Obtener configuración DAO
        const configBuffer = await ctx.stub.getState('daoConfig');
        if (!configBuffer || configBuffer.length === 0) {
            throw new Error('No se encontró la configuración del DAO');
        }
        
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que la categoría sea válida
        if (!config.categoriasPropuesta.includes(categoria)) {
            throw new Error(`Categoría inválida. Debe ser una de: ${config.categoriasPropuesta.join(', ')}`);
        }
        
        // Verificar que las acciones sean JSON válido
        let acciones;
        try {
            acciones = JSON.parse(accionesData);
        } catch (error) {
            throw new Error('Las acciones deben estar en formato JSON válido');
        }
        
        // Verificar que el creador tenga un rol permitido
        const rolCreador = await this.obtenerRolUsuario(ctx, creador);
        if (!config.rolesPermitidos.includes(rolCreador)) {
            throw new Error(`No tienes permiso para crear propuestas. Tu rol es: ${rolCreador}`);
        }
        
        // Verificar que el creador tenga tokens suficientes para proponer
        const tokenContract = await this.obtenerContratoToken(ctx);
        const balanceCreador = await tokenContract.balanceOf(ctx, creador);
        
        // Requerir al menos 100 tokens para crear una propuesta
        if (balanceCreador < 100) {
            throw new Error(`No tienes suficientes tokens para crear una propuesta. Tienes: ${balanceCreador}, se requieren: 100`);
        }
        
        // Crear propuesta
        const now = new Date();
        const propuestaId = `propuesta_${now.getTime()}`;
        
        // Calcular fechas de inicio y fin de votación
        const fechaInicio = now;
        const fechaFin = new Date(now);
        fechaFin.setDate(fechaFin.getDate() + config.periodoVotacionDias);
        
        const propuesta = {
            id: propuestaId,
            titulo: titulo,
            descripcion: descripcion,
            categoria: categoria,
            acciones: acciones,
            creador: creador,
            fechaCreacion: now.toISOString(),
            fechaInicioVotacion: fechaInicio.toISOString(),
            fechaFinVotacion: fechaFin.toISOString(),
            estado: 'activa',
            votosFavor: 0,
            votosContra: 0,
            votosAbstencion: 0,
            totalVotantes: 0,
            quorumAlcanzado: false,
            aprobada: false,
            ejecutada: false,
            fechaEjecucion: null,
            resultadoEjecucion: null,
            comentarios: []
        };
        
        // Guardar propuesta
        await ctx.stub.putState(propuestaId, Buffer.from(JSON.stringify(propuesta)));
        
        // Emitir evento de propuesta creada
        const propuestaEvent = {
            type: 'creacion',
            propuestaId: propuestaId,
            titulo: titulo,
            categoria: categoria,
            creador: creador,
            fechaInicio: fechaInicio.toISOString(),
            fechaFin: fechaFin.toISOString()
        };
        await ctx.stub.setEvent('PropuestaCreada', Buffer.from(JSON.stringify(propuestaEvent)));
        
        return propuesta;
    }
    
    /**
     * Vota en una propuesta
     * @param {Context} ctx - Contexto de transacción
     * @param {String} propuestaId - ID de la propuesta
     * @param {String} voto - Tipo de voto (favor, contra, abstencion)
     * @param {String} comentario - Comentario opcional
     * @returns {Object} - Información de la propuesta actualizada
     */
    async votar(ctx, propuestaId, voto, comentario) {
        // Obtener la identidad del votante
        const clientIdentity = ctx.clientIdentity;
        const votante = clientIdentity.getID();
        
        // Validar parámetros
        if (!propuestaId || !voto) {
            throw new Error('Parámetros inválidos: se requiere ID de propuesta y voto');
        }
        
        // Verificar que el voto sea válido
        const votosValidos = ['favor', 'contra', 'abstencion'];
        if (!votosValidos.includes(voto)) {
            throw new Error(`Voto inválido. Debe ser uno de: ${votosValidos.join(', ')}`);
        }
        
        // Obtener propuesta
        const propuestaBuffer = await ctx.stub.getState(propuestaId);
        if (!propuestaBuffer || propuestaBuffer.length === 0) {
            throw new Error(`Propuesta con ID ${propuestaId} no encontrada`);
        }
        
        const propuesta = JSON.parse(propuestaBuffer.toString());
        
        // Verificar que la propuesta esté activa
        if (propuesta.estado !== 'activa') {
            throw new Error(`La propuesta no está activa. Estado actual: ${propuesta.estado}`);
        }
        
        // Verificar que la votación esté en curso
        const now = new Date();
        const fechaInicio = new Date(propuesta.fechaInicioVotacion);
        const fechaFin = new Date(propuesta.fechaFinVotacion);
        
        if (now < fechaInicio) {
            throw new Error('La votación aún no ha comenzado');
        }
        
        if (now > fechaFin) {
            throw new Error('La votación ha finalizado');
        }
        
        // Verificar que el votante tenga un rol permitido
        const rolVotante = await this.obtenerRolUsuario(ctx, votante);
        
        // Obtener configuración DAO
        const configBuffer = await ctx.stub.getState('daoConfig');
        const config = JSON.parse(configBuffer.toString());
        
        if (!config.rolesPermitidos.includes(rolVotante)) {
            throw new Error(`No tienes permiso para votar. Tu rol es: ${rolVotante}`);
        }
        
        // Verificar que el votante no haya votado ya
        const votoKey = `voto_${propuestaId}_${votante}`;
        const votoExistenteBuffer = await ctx.stub.getState(votoKey);
        
        if (votoExistenteBuffer && votoExistenteBuffer.length > 0) {
            throw new Error('Ya has votado en esta propuesta');
        }
        
        // Obtener balance de tokens del votante para calcular el peso del voto
        const tokenContract = await this.obtenerContratoToken(ctx);
        const balanceVotante = await tokenContract.balanceOf(ctx, votante);
        
        // Registrar voto
        const votoObj = {
            propuestaId: propuestaId,
            votante: votante,
            voto: voto,
            peso: balanceVotante,
            timestamp: now.toISOString(),
            comentario: comentario || ''
        };
        
        await ctx.stub.putState(votoKey, Buffer.from(JSON.stringify(votoObj)));
        
        // Actualizar conteo de votos en la propuesta
        if (voto === 'favor') {
            propuesta.votosFavor += balanceVotante;
        } else if (voto === 'contra') {
            propuesta.votosContra += balanceVotante;
        } else {
            propuesta.votosAbstencion += balanceVotante;
        }
        
        propuesta.totalVotantes += 1;
        
        // Añadir comentario si existe
        if (comentario) {
            propuesta.comentarios.push({
                autor: votante,
                texto: comentario,
                timestamp: now.toISOString()
            });
        }
        
        // Verificar si se ha alcanzado el quorum
        const totalTokens = await this.obtenerTotalTokens(ctx);
        const participacion = (propuesta.votosFavor + propuesta.votosContra + propuesta.votosAbstencion) / totalTokens;
        
        propuesta.quorumAlcanzado = participacion >= config.quorum;
        
        // Verificar si la propuesta ha sido aprobada
        if (propuesta.quorumAlcanzado) {
            const totalVotos = propuesta.votosFavor + propuesta.votosContra;
            if (totalVotos > 0) {
                const porcentajeFavor = propuesta.votosFavor / totalVotos;
                propuesta.aprobada = porcentajeFavor >= config.umbralAprobacion;
            }
        }
        
        // Guardar propuesta actualizada
        await ctx.stub.putState(propuestaId, Buffer.from(JSON.stringify(propuesta)));
        
        // Emitir evento de voto registrado
        const votoEvent = {
            type: 'voto',
            propuestaId: propuestaId,
            votante: votante,
            voto: voto,
            peso: balanceVotante,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('VotoRegistrado', Buffer.from(JSON.stringify(votoEvent)));
        
        return propuesta;
    }
    
    /**
     * Finaliza una votación de propuesta
     * @param {Context} ctx - Contexto de transacción
     * @param {String} propuestaId - ID de la propuesta
     * @returns {Object} - Información de la propuesta finalizada
     */
    async finalizarVotacion(ctx, propuestaId) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!propuestaId) {
            throw new Error('Parámetros inválidos: se requiere ID de propuesta');
        }
        
        // Obtener propuesta
        const propuestaBuffer = await ctx.stub.getState(propuestaId);
        if (!propuestaBuffer || propuestaBuffer.length === 0) {
            throw new Error(`Propuesta con ID ${propuestaId} no encontrada`);
        }
        
        const propuesta = JSON.parse(propuestaBuffer.toString());
        
        // Verificar que la propuesta esté activa
        if (propuesta.estado !== 'activa') {
            throw new Error(`La propuesta no está activa. Estado actual: ${propuesta.estado}`);
        }
        
        // Verificar que la fecha de fin de votación haya pasado
        const now = new Date();
        const fechaFin = new Date(propuesta.fechaFinVotacion);
        
        if (now < fechaFin) {
            throw new Error('La votación aún no ha finalizado');
        }
        
        // Verificar que el llamante tenga rol de admin
        const rolCaller = await this.obtenerRolUsuario(ctx, caller);
        
        // Obtener configuración DAO
        const configBuffer = await ctx.stub.getState('daoConfig');
        const config = JSON.parse(configBuffer.toString());
        
        if (rolCaller !== config.rolAdmin) {
            throw new Error(`Solo el administrador puede finalizar votaciones. Tu rol es: ${rolCaller}`);
        }
        
        // Actualizar estado de la propuesta
        propuesta.estado = 'finalizada';
        
        // Verificar quorum y aprobación final
        const totalTokens = await this.obtenerTotalTokens(ctx);
        const participacion = (propuesta.votosFavor + propuesta.votosContra + propuesta.votosAbstencion) / totalTokens;
        
        propuesta.quorumAlcanzado = participacion >= config.quorum;
        
        if (propuesta.quorumAlcanzado) {
            const totalVotos = propuesta.votosFavor + propuesta.votosContra;
            if (totalVotos > 0) {
                const porcentajeFavor = propuesta.votosFavor / totalVotos;
                propuesta.aprobada = porcentajeFavor >= config.umbralAprobacion;
            }
        }
        
        // Guardar propuesta actualizada
        await ctx.stub.putState(propuestaId, Buffer.from(JSON.stringify(propuesta)));
        
        // Emitir evento de votación finalizada
        const finalizacionEvent = {
            type: 'finalizacion',
            propuestaId: propuestaId,
            quorumAlcanzado: propuesta.quorumAlcanzado,
            aprobada: propuesta.aprobada,
            votosFavor: propuesta.votosFavor,
            votosContra: propuesta.votosContra,
            votosAbstencion: propuesta.votosAbstencion,
            totalVotantes: propuesta.totalVotantes,
            finalizadaPor: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('VotacionFinalizada', Buffer.from(JSON.stringify(finalizacionEvent)));
        
        return propuesta;
    }
    
    /**
     * Ejecuta una propuesta aprobada
     * @param {Context} ctx - Contexto de transacción
     * @param {String} propuestaId - ID de la propuesta
     * @returns {Object} - Información de la propuesta ejecutada
     */
    async ejecutarPropuesta(ctx, propuestaId) {
        // Obtener la identidad del ejecutor
        const clientIdentity = ctx.clientIdentity;
        const ejecutor = clientIdentity.getID();
        
        // Validar parámetros
        if (!propuestaId) {
            throw new Error('Parámetros inválidos: se requiere ID de propuesta');
        }
        
        // Obtener propuesta
        const propuestaBuffer = await ctx.stub.getState(propuestaId);
        if (!propuestaBuffer || propuestaBuffer.length === 0) {
            throw new Error(`Propuesta con ID ${propuestaId} no encontrada`);
        }
        
        const propuesta = JSON.parse(propuestaBuffer.toString());
        
        // Verificar que la propuesta esté finalizada
        if (propuesta.estado !== 'finalizada') {
            throw new Error(`La propuesta no está finalizada. Estado actual: ${propuesta.estado}`);
        }
        
        // Verificar que la propuesta haya sido aprobada
        if (!propuesta.aprobada) {
            throw new Error('La propuesta no fue aprobada');
        }
        
        // Verificar que la propuesta no haya sido ejecutada ya
        if (propuesta.ejecutada) {
            throw new Error('La propuesta ya ha sido ejecutada');
        }
        
        // Verificar que el ejecutor tenga rol de admin
        const rolEjecutor = await this.obtenerRolUsuario(ctx, ejecutor);
        
        // Obtener configuración DAO
        const configBuffer = await ctx.stub.getState('daoConfig');
        const config = JSON.parse(configBuffer.toString());
        
        if (rolEjecutor !== config.rolAdmin) {
            throw new Error(`Solo el administrador puede ejecutar propuestas. Tu rol es: ${rolEjecutor}`);
        }
        
        // Ejecutar acciones de la propuesta
        const now = new Date();
        let resultadoEjecucion = {};
        
        try {
            // Aquí se implementaría la lógica para ejecutar las acciones específicas
            // según el tipo de propuesta y las acciones definidas
            
            // Por ejemplo, si la propuesta es para cambiar parámetros de configuración:
            if (propuesta.categoria === 'parametros' && propuesta.acciones.tipo === 'actualizarConfiguracion') {
                const nuevaConfig = {
                    ...config,
                    ...propuesta.acciones.parametros
                };
                
                // Guardar nueva configuración
                await ctx.stub.putState('daoConfig', Buffer.from(JSON.stringify(nuevaConfig)));
                
                resultadoEjecucion = {
                    exito: true,
                    mensaje: 'Configuración actualizada correctamente',
                    detalles: propuesta.acciones.parametros
                };
            }
            // Si la propuesta es para añadir un nuevo miembro:
            else if (propuesta.categoria === 'miembros' && propuesta.acciones.tipo === 'agregarMiembro') {
                const nuevoMiembro = propuesta.acciones.miembro;
                
                // Crear registro de miembro
                const miembroObj = {
                    id: nuevoMiembro.id,
                    nombre: nuevoMiembro.nombre,
                    rol: nuevoMiembro.rol,
                    fechaRegistro: now.toISOString(),
                    registradoPor: ejecutor,
                    activo: true
                };
                
                await ctx.stub.putState(`miembro_${nuevoMiembro.id}`, Buffer.from(JSON.stringify(miembroObj)));
                
                resultadoEjecucion = {
                    exito: true,
                    mensaje: 'Miembro agregado correctamente',
                    detalles: miembroObj
                };
            }
            // Otros tipos de acciones...
            else {
                resultadoEjecucion = {
                    exito: false,
                    mensaje: 'Tipo de acción no implementada',
                    detalles: propuesta.acciones
                };
            }
        } catch (error) {
            resultadoEjecucion = {
                exito: false,
                mensaje: `Error al ejecutar la propuesta: ${error.message}`,
                detalles: error.stack
            };
        }
        
        // Actualizar propuesta
        propuesta.ejecutada = resultadoEjecucion.exito;
        propuesta.fechaEjecucion = now.toISOString();
        propuesta.resultadoEjecucion = resultadoEjecucion;
        propuesta.estado = resultadoEjecucion.exito ? 'ejecutada' : 'fallida';
        
        // Guardar propuesta actualizada
        await ctx.stub.putState(propuestaId, Buffer.from(JSON.stringify(propuesta)));
        
        // Emitir evento de propuesta ejecutada
        const ejecucionEvent = {
            type: 'ejecucion',
            propuestaId: propuestaId,
            exito: resultadoEjecucion.exito,
            ejecutadaPor: ejecutor,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('PropuestaEjecutada', Buffer.from(JSON.stringify(ejecucionEvent)));
        
        return propuesta;
    }
    
    /**
     * Registra un nuevo miembro en el DAO
     * @param {Context} ctx - Contexto de transacción
     * @param {String} miembroId - ID único del miembro
     * @param {String} nombre - Nombre del miembro
     * @param {String} rol - Rol del miembro
     * @returns {Object} - Información del miembro registrado
     */
    async registrarMiembro(ctx, miembroId, nombre, rol) {
        // Obtener la identidad del registrador
        const clientIdentity = ctx.clientIdentity;
        const registrador = clientIdentity.getID();
        
        // Validar parámetros
        if (!miembroId || !nombre || !rol) {
            throw new Error('Parámetros inválidos: se requiere ID, nombre y rol del miembro');
        }
        
        // Verificar si el miembro ya existe
        const existingMiembroBuffer = await ctx.stub.getState(`miembro_${miembroId}`);
        if (existingMiembroBuffer && existingMiembroBuffer.length > 0) {
            throw new Error(`El miembro con ID ${miembroId} ya existe`);
        }
        
        // Obtener configuración DAO
        const configBuffer = await ctx.stub.getState('daoConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el rol sea válido
        if (!config.rolesPermitidos.includes(rol)) {
            throw new Error(`Rol inválido. Debe ser uno de: ${config.rolesPermitidos.join(', ')}`);
        }
        
        // Verificar que el registrador tenga rol de admin
        const rolRegistrador = await this.obtenerRolUsuario(ctx, registrador);
        
        if (rolRegistrador !== config.rolAdmin) {
            throw new Error(`Solo el administrador puede registrar miembros. Tu rol es: ${rolRegistrador}`);
        }
        
        // Crear miembro
        const now = new Date();
        const miembro = {
            id: miembroId,
            nombre: nombre,
            rol: rol,
            fechaRegistro: now.toISOString(),
            registradoPor: registrador,
            activo: true
        };
        
        // Guardar miembro
        await ctx.stub.putState(`miembro_${miembroId}`, Buffer.from(JSON.stringify(miembro)));
        
        // Emitir evento de miembro registrado
        const miembroEvent = {
            type: 'registro',
            miembroId: miembroId,
            nombre: nombre,
            rol: rol,
            registradoPor: registrador,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('MiembroRegistrado', Buffer.from(JSON.stringify(miembroEvent)));
        
        return miembro;
    }
    
    /**
     * Actualiza el rol de un miembro
     * @param {Context} ctx - Contexto de transacción
     * @param {String} miembroId - ID del miembro
     * @param {String} nuevoRol - Nuevo rol del miembro
     * @returns {Object} - Información del miembro actualizado
     */
    async actualizarRolMiembro(ctx, miembroId, nuevoRol) {
        // Obtener la identidad del actualizador
        const clientIdentity = ctx.clientIdentity;
        const actualizador = clientIdentity.getID();
        
        // Validar parámetros
        if (!miembroId || !nuevoRol) {
            throw new Error('Parámetros inválidos: se requiere ID del miembro y nuevo rol');
        }
        
        // Verificar que el miembro exista
        const miembroBuffer = await ctx.stub.getState(`miembro_${miembroId}`);
        if (!miembroBuffer || miembroBuffer.length === 0) {
            throw new Error(`Miembro con ID ${miembroId} no encontrado`);
        }
        
        const miembro = JSON.parse(miembroBuffer.toString());
        
        // Obtener configuración DAO
        const configBuffer = await ctx.stub.getState('daoConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el rol sea válido
        if (!config.rolesPermitidos.includes(nuevoRol)) {
            throw new Error(`Rol inválido. Debe ser uno de: ${config.rolesPermitidos.join(', ')}`);
        }
        
        // Verificar que el actualizador tenga rol de admin
        const rolActualizador = await this.obtenerRolUsuario(ctx, actualizador);
        
        if (rolActualizador !== config.rolAdmin) {
            throw new Error(`Solo el administrador puede actualizar roles. Tu rol es: ${rolActualizador}`);
        }
        
        // Actualizar miembro
        miembro.rol = nuevoRol;
        miembro.fechaActualizacion = new Date().toISOString();
        miembro.actualizadoPor = actualizador;
        
        // Guardar miembro actualizado
        await ctx.stub.putState(`miembro_${miembroId}`, Buffer.from(JSON.stringify(miembro)));
        
        // Emitir evento de rol actualizado
        const rolEvent = {
            type: 'actualizacionRol',
            miembroId: miembroId,
            rolAnterior: miembro.rol,
            nuevoRol: nuevoRol,
            actualizadoPor: actualizador,
            timestamp: miembro.fechaActualizacion
        };
        await ctx.stub.setEvent('RolMiembroActualizado', Buffer.from(JSON.stringify(rolEvent)));
        
        return miembro;
    }
    
    /**
     * Desactiva un miembro
     * @param {Context} ctx - Contexto de transacción
     * @param {String} miembroId - ID del miembro
     * @returns {Object} - Información del miembro desactivado
     */
    async desactivarMiembro(ctx, miembroId) {
        // Obtener la identidad del desactivador
        const clientIdentity = ctx.clientIdentity;
        const desactivador = clientIdentity.getID();
        
        // Validar parámetros
        if (!miembroId) {
            throw new Error('Parámetros inválidos: se requiere ID del miembro');
        }
        
        // Verificar que el miembro exista
        const miembroBuffer = await ctx.stub.getState(`miembro_${miembroId}`);
        if (!miembroBuffer || miembroBuffer.length === 0) {
            throw new Error(`Miembro con ID ${miembroId} no encontrado`);
        }
        
        const miembro = JSON.parse(miembroBuffer.toString());
        
        // Verificar que el miembro esté activo
        if (!miembro.activo) {
            throw new Error('El miembro ya está desactivado');
        }
        
        // Obtener configuración DAO
        const configBuffer = await ctx.stub.getState('daoConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el desactivador tenga rol de admin
        const rolDesactivador = await this.obtenerRolUsuario(ctx, desactivador);
        
        if (rolDesactivador !== config.rolAdmin) {
            throw new Error(`Solo el administrador puede desactivar miembros. Tu rol es: ${rolDesactivador}`);
        }
        
        // Desactivar miembro
        miembro.activo = false;
        miembro.fechaDesactivacion = new Date().toISOString();
        miembro.desactivadoPor = desactivador;
        
        // Guardar miembro actualizado
        await ctx.stub.putState(`miembro_${miembroId}`, Buffer.from(JSON.stringify(miembro)));
        
        // Emitir evento de miembro desactivado
        const desactivacionEvent = {
            type: 'desactivacion',
            miembroId: miembroId,
            desactivadoPor: desactivador,
            timestamp: miembro.fechaDesactivacion
        };
        await ctx.stub.setEvent('MiembroDesactivado', Buffer.from(JSON.stringify(desactivacionEvent)));
        
        return miembro;
    }
    
    /**
     * Obtiene una propuesta
     * @param {Context} ctx - Contexto de transacción
     * @param {String} propuestaId - ID de la propuesta
     * @returns {Object} - Información de la propuesta
     */
    async obtenerPropuesta(ctx, propuestaId) {
        // Validar parámetros
        if (!propuestaId) {
            throw new Error('Parámetros inválidos: se requiere ID de la propuesta');
        }
        
        // Obtener propuesta
        const propuestaBuffer = await ctx.stub.getState(propuestaId);
        if (!propuestaBuffer || propuestaBuffer.length === 0) {
            throw new Error(`Propuesta con ID ${propuestaId} no encontrada`);
        }
        
        return JSON.parse(propuestaBuffer.toString());
    }
    
    /**
     * Obtiene todas las propuestas activas
     * @param {Context} ctx - Contexto de transacción
     * @returns {Array} - Lista de propuestas activas
     */
    async obtenerPropuestasActivas(ctx) {
        // Consultar propuestas activas
        const query = {
            selector: {
                estado: 'activa'
            }
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const propuestas = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const propuesta = JSON.parse(result.value.value.toString());
            propuestas.push(propuesta);
            result = await iterator.next();
        }
        
        return propuestas;
    }
    
    /**
     * Obtiene todas las propuestas por estado
     * @param {Context} ctx - Contexto de transacción
     * @param {String} estado - Estado de las propuestas a buscar
     * @returns {Array} - Lista de propuestas con el estado especificado
     */
    async obtenerPropuestasPorEstado(ctx, estado) {
        // Validar parámetros
        if (!estado) {
            throw new Error('Parámetros inválidos: se requiere estado');
        }
        
        // Verificar que el estado sea válido
        const estadosValidos = ['activa', 'finalizada', 'ejecutada', 'fallida'];
        if (!estadosValidos.includes(estado)) {
            throw new Error(`Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`);
        }
        
        // Consultar propuestas por estado
        const query = {
            selector: {
                estado: estado
            }
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const propuestas = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const propuesta = JSON.parse(result.value.value.toString());
            propuestas.push(propuesta);
            result = await iterator.next();
        }
        
        return propuestas;
    }
    
    /**
     * Obtiene un miembro
     * @param {Context} ctx - Contexto de transacción
     * @param {String} miembroId - ID del miembro
     * @returns {Object} - Información del miembro
     */
    async obtenerMiembro(ctx, miembroId) {
        // Validar parámetros
        if (!miembroId) {
            throw new Error('Parámetros inválidos: se requiere ID del miembro');
        }
        
        // Obtener miembro
        const miembroBuffer = await ctx.stub.getState(`miembro_${miembroId}`);
        if (!miembroBuffer || miembroBuffer.length === 0) {
            throw new Error(`Miembro con ID ${miembroId} no encontrado`);
        }
        
        return JSON.parse(miembroBuffer.toString());
    }
    
    /**
     * Obtiene todos los miembros activos
     * @param {Context} ctx - Contexto de transacción
     * @returns {Array} - Lista de miembros activos
     */
    async obtenerMiembrosActivos(ctx) {
        // Consultar miembros activos
        const query = {
            selector: {
                activo: true
            }
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const miembros = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const miembro = JSON.parse(result.value.value.toString());
            miembros.push(miembro);
            result = await iterator.next();
        }
        
        return miembros;
    }
    
    /**
     * Obtiene la configuración del DAO
     * @param {Context} ctx - Contexto de transacción
     * @returns {Object} - Configuración del DAO
     */
    async obtenerConfiguracion(ctx) {
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('daoConfig');
        if (!configBuffer || configBuffer.length === 0) {
            throw new Error('No se encontró la configuración del DAO');
        }
        
        return JSON.parse(configBuffer.toString());
    }
    
    /**
     * Actualiza la configuración del DAO
     * @param {Context} ctx - Contexto de transacción
     * @param {String} configData - Nuevos datos de configuración en formato JSON
     * @returns {Object} - Configuración actualizada
     */
    async actualizarConfiguracion(ctx, configData) {
        // Obtener la identidad del actualizador
        const clientIdentity = ctx.clientIdentity;
        const actualizador = clientIdentity.getID();
        
        // Validar parámetros
        if (!configData) {
            throw new Error('Parámetros inválidos: se requieren datos de configuración');
        }
        
        // Verificar que los datos sean JSON válido
        let configDataObj;
        try {
            configDataObj = JSON.parse(configData);
        } catch (error) {
            throw new Error('Los datos de configuración deben estar en formato JSON válido');
        }
        
        // Obtener configuración actual
        const configBuffer = await ctx.stub.getState('daoConfig');
        if (!configBuffer || configBuffer.length === 0) {
            throw new Error('No se encontró la configuración del DAO');
        }
        
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el actualizador tenga rol de admin
        const rolActualizador = await this.obtenerRolUsuario(ctx, actualizador);
        
        if (rolActualizador !== config.rolAdmin) {
            throw new Error(`Solo el administrador puede actualizar la configuración. Tu rol es: ${rolActualizador}`);
        }
        
        // Actualizar configuración
        const updatedConfig = {
            ...config,
            ...configDataObj,
            // Asegurar que estos campos no se sobrescriban directamente
            version: configDataObj.version || config.version,
            nombre: configDataObj.nombre || config.nombre,
            tokenVotacion: configDataObj.tokenVotacion || config.tokenVotacion
        };
        
        // Guardar configuración actualizada
        await ctx.stub.putState('daoConfig', Buffer.from(JSON.stringify(updatedConfig)));
        
        // Emitir evento de configuración actualizada
        const configEvent = {
            type: 'actualizacionConfig',
            actualizadoPor: actualizador,
            timestamp: new Date().toISOString()
        };
        await ctx.stub.setEvent('ConfiguracionActualizada', Buffer.from(JSON.stringify(configEvent)));
        
        return updatedConfig;
    }
    
    /**
     * Obtiene el rol de un usuario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @returns {String} - Rol del usuario
     */
    async obtenerRolUsuario(ctx, userId) {
        // Buscar si el usuario está registrado como miembro
        const miembroBuffer = await ctx.stub.getState(`miembro_${userId}`);
        
        if (miembroBuffer && miembroBuffer.length > 0) {
            const miembro = JSON.parse(miembroBuffer.toString());
            
            // Verificar si el miembro está activo
            if (miembro.activo) {
                return miembro.rol;
            }
        }
        
        // Si no está registrado o no está activo, devolver rol por defecto
        return 'invitado';
    }
    
    /**
     * Obtiene el contrato de token
     * @param {Context} ctx - Contexto de transacción
     * @returns {Object} - Contrato de token
     */
    async obtenerContratoToken(ctx) {
        // En un entorno real, aquí se implementaría la lógica para obtener
        // una referencia al contrato de token. Para este ejemplo, simulamos
        // un contrato de token con funciones básicas.
        
        return {
            balanceOf: async (ctx, address) => {
                // Simulación: devolver un balance aleatorio entre 0 y 1000
                return Math.floor(Math.random() * 1000);
            },
            totalSupply: async (ctx) => {
                // Simulación: devolver un suministro total fijo
                return 1000000;
            }
        };
    }
    
    /**
     * Obtiene el total de tokens en circulación
     * @param {Context} ctx - Contexto de transacción
     * @returns {Number} - Total de tokens
     */
    async obtenerTotalTokens(ctx) {
        const tokenContract = await this.obtenerContratoToken(ctx);
        return await tokenContract.totalSupply(ctx);
    }
    
    /**
     * Añade un comentario a una propuesta
     * @param {Context} ctx - Contexto de transacción
     * @param {String} propuestaId - ID de la propuesta
     * @param {String} comentario - Texto del comentario
     * @returns {Object} - Información de la propuesta actualizada
     */
    async agregarComentario(ctx, propuestaId, comentario) {
        // Obtener la identidad del comentarista
        const clientIdentity = ctx.clientIdentity;
        const comentarista = clientIdentity.getID();
        
        // Validar parámetros
        if (!propuestaId || !comentario) {
            throw new Error('Parámetros inválidos: se requiere ID de propuesta y comentario');
        }
        
        // Obtener propuesta
        const propuestaBuffer = await ctx.stub.getState(propuestaId);
        if (!propuestaBuffer || propuestaBuffer.length === 0) {
            throw new Error(`Propuesta con ID ${propuestaId} no encontrada`);
        }
        
        const propuesta = JSON.parse(propuestaBuffer.toString());
        
        // Verificar que la propuesta esté activa o finalizada
        if (propuesta.estado !== 'activa' && propuesta.estado !== 'finalizada') {
            throw new Error(`No se pueden añadir comentarios a propuestas en estado: ${propuesta.estado}`);
        }
        
        // Verificar que el comentarista tenga un rol permitido
        const rolComentarista = await this.obtenerRolUsuario(ctx, comentarista);
        
        // Obtener configuración DAO
        const configBuffer = await ctx.stub.getState('daoConfig');
        const config = JSON.parse(configBuffer.toString());
        
        if (!config.rolesPermitidos.includes(rolComentarista)) {
            throw new Error(`No tienes permiso para comentar. Tu rol es: ${rolComentarista}`);
        }
        
        // Añadir comentario
        const now = new Date();
        const nuevoComentario = {
            autor: comentarista,
            texto: comentario,
            timestamp: now.toISOString()
        };
        
        propuesta.comentarios.push(nuevoComentario);
        
        // Guardar propuesta actualizada
        await ctx.stub.putState(propuestaId, Buffer.from(JSON.stringify(propuesta)));
        
        // Emitir evento de comentario añadido
        const comentarioEvent = {
            type: 'comentario',
            propuestaId: propuestaId,
            autor: comentarista,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('ComentarioAgregado', Buffer.from(JSON.stringify(comentarioEvent)));
        
        return propuesta;
    }
    
    /**
     * Obtiene los votos de una propuesta
     * @param {Context} ctx - Contexto de transacción
     * @param {String} propuestaId - ID de la propuesta
     * @returns {Array} - Lista de votos de la propuesta
     */
    async obtenerVotosPropuesta(ctx, propuestaId) {
        // Validar parámetros
        if (!propuestaId) {
            throw new Error('Parámetros inválidos: se requiere ID de la propuesta');
        }
        
        // Verificar que la propuesta exista
        const propuestaBuffer = await ctx.stub.getState(propuestaId);
        if (!propuestaBuffer || propuestaBuffer.length === 0) {
            throw new Error(`Propuesta con ID ${propuestaId} no encontrada`);
        }
        
        // Consultar votos de la propuesta
        const query = {
            selector: {
                propuestaId: propuestaId
            }
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const votos = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const voto = JSON.parse(result.value.value.toString());
            votos.push(voto);
            result = await iterator.next();
        }
        
        return votos;
    }
    
    /**
     * Obtiene el historial de propuestas de un miembro
     * @param {Context} ctx - Contexto de transacción
     * @param {String} miembroId - ID del miembro
     * @returns {Object} - Historial de propuestas del miembro
     */
    async obtenerHistorialMiembro(ctx, miembroId) {
        // Validar parámetros
        if (!miembroId) {
            throw new Error('Parámetros inválidos: se requiere ID del miembro');
        }
        
        // Verificar que el miembro exista
        const miembroBuffer = await ctx.stub.getState(`miembro_${miembroId}`);
        if (!miembroBuffer || miembroBuffer.length === 0) {
            throw new Error(`Miembro con ID ${miembroId} no encontrado`);
        }
        
        // Consultar propuestas creadas por el miembro
        const queryCreadas = {
            selector: {
                creador: miembroId
            }
        };
        
        const iteratorCreadas = await ctx.stub.getQueryResult(JSON.stringify(queryCreadas));
        const propuestasCreadas = [];
        
        let resultCreadas = await iteratorCreadas.next();
        while (!resultCreadas.done) {
            const propuesta = JSON.parse(resultCreadas.value.value.toString());
            propuestasCreadas.push(propuesta);
            resultCreadas = await iteratorCreadas.next();
        }
        
        // Consultar votos del miembro
        const queryVotos = {
            selector: {
                votante: miembroId
            }
        };
        
        const iteratorVotos = await ctx.stub.getQueryResult(JSON.stringify(queryVotos));
        const votos = [];
        
        let resultVotos = await iteratorVotos.next();
        while (!resultVotos.done) {
            const voto = JSON.parse(resultVotos.value.value.toString());
            votos.push(voto);
            resultVotos = await iteratorVotos.next();
        }
        
        return {
            propuestasCreadas: propuestasCreadas,
            votos: votos
        };
    }
}

module.exports = DAOContract;
