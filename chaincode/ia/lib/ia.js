'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

/**
 * Contrato de IA para la Blockchain Simbiótica
 * Implementa funcionalidades para integración con modelos de IA y procesamiento de datos
 */
class IAContract extends Contract {
    
    /**
     * Inicializa el contrato con los valores predeterminados
     * @param {Context} ctx - Contexto de transacción
     */
    async init(ctx) {
        console.info('============= Inicializando Contrato de IA =============');
        
        // Configuración del contrato de IA
        const iaConfig = {
            version: '1.0',
            admin: 'admin',
            modelos: ['gpt-4', 'llama-3', 'claude-3', 'gemini-pro'],
            proveedores: ['openai', 'anthropic', 'google', 'meta', 'local'],
            maxTokens: 4096,
            temperaturaDefecto: 0.7,
            tiempoMaximoRespuesta: 60, // segundos
            almacenamientoHistorial: true,
            periodoRetencionDias: 90,
            verificacionConsentimiento: true
        };
        
        await ctx.stub.putState('iaConfig', Buffer.from(JSON.stringify(iaConfig)));
        
        console.info('============= Contrato de IA inicializado correctamente =============');
        return JSON.stringify(iaConfig);
    }
    
    /**
     * Registra un nuevo modelo de IA
     * @param {Context} ctx - Contexto de transacción
     * @param {String} modeloId - ID único del modelo
     * @param {String} modeloData - Datos del modelo en formato JSON
     * @returns {Object} - Información del modelo registrado
     */
    async registrarModelo(ctx, modeloId, modeloData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!modeloId || !modeloData) {
            throw new Error('Parámetros inválidos: se requiere ID del modelo y datos del modelo');
        }
        
        // Verificar si el modelo ya existe
        const existingModeloBuffer = await ctx.stub.getState(`modelo_${modeloId}`);
        if (existingModeloBuffer && existingModeloBuffer.length > 0) {
            throw new Error(`El modelo con ID ${modeloId} ya existe`);
        }
        
        // Verificar que los datos sean JSON válido
        let modeloDataObj;
        try {
            modeloDataObj = JSON.parse(modeloData);
        } catch (error) {
            throw new Error('Los datos del modelo deben estar en formato JSON válido');
        }
        
        // Verificar campos requeridos
        if (!modeloDataObj.nombre || !modeloDataObj.proveedor || !modeloDataObj.version) {
            throw new Error('Los datos del modelo deben incluir nombre, proveedor y versión');
        }
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('iaConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== config.admin) {
            throw new Error('Solo el administrador puede registrar modelos');
        }
        
        // Verificar que el proveedor sea válido
        if (!config.proveedores.includes(modeloDataObj.proveedor)) {
            throw new Error(`Proveedor inválido. Debe ser uno de: ${config.proveedores.join(', ')}`);
        }
        
        // Crear modelo
        const now = new Date();
        const modelo = {
            id: modeloId,
            nombre: modeloDataObj.nombre,
            proveedor: modeloDataObj.proveedor,
            version: modeloDataObj.version,
            descripcion: modeloDataObj.descripcion || '',
            parametros: modeloDataObj.parametros || {},
            capacidades: modeloDataObj.capacidades || [],
            limitaciones: modeloDataObj.limitaciones || [],
            usoRecomendado: modeloDataObj.usoRecomendado || '',
            fechaCreacion: now.toISOString(),
            creadoPor: caller,
            fechaActualizacion: now.toISOString(),
            activo: true,
            estadisticas: {
                totalSolicitudes: 0,
                solicitudesExitosas: 0,
                solicitudesFallidas: 0,
                tiempoPromedioRespuesta: 0,
                tokenesConsumidos: 0
            }
        };
        
        // Guardar modelo
        await ctx.stub.putState(`modelo_${modeloId}`, Buffer.from(JSON.stringify(modelo)));
        
        // Actualizar lista de modelos en la configuración si es necesario
        if (!config.modelos.includes(modeloId)) {
            config.modelos.push(modeloId);
            await ctx.stub.putState('iaConfig', Buffer.from(JSON.stringify(config)));
        }
        
        // Emitir evento de modelo registrado
        const modeloEvent = {
            type: 'registro',
            modeloId: modeloId,
            nombre: modelo.nombre,
            proveedor: modelo.proveedor,
            creadoPor: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('ModeloRegistrado', Buffer.from(JSON.stringify(modeloEvent)));
        
        return modelo;
    }
    
    /**
     * Registra una solicitud de inferencia de IA
     * @param {Context} ctx - Contexto de transacción
     * @param {String} modeloId - ID del modelo
     * @param {String} solicitudData - Datos de la solicitud en formato JSON
     * @returns {Object} - Información de la solicitud registrada
     */
    async registrarSolicitud(ctx, modeloId, solicitudData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!modeloId || !solicitudData) {
            throw new Error('Parámetros inválidos: se requiere ID del modelo y datos de la solicitud');
        }
        
        // Verificar que el modelo exista
        const modeloBuffer = await ctx.stub.getState(`modelo_${modeloId}`);
        if (!modeloBuffer || modeloBuffer.length === 0) {
            throw new Error(`El modelo con ID ${modeloId} no existe`);
        }
        
        const modelo = JSON.parse(modeloBuffer.toString());
        
        // Verificar que el modelo esté activo
        if (!modelo.activo) {
            throw new Error('El modelo no está activo');
        }
        
        // Verificar que los datos sean JSON válido
        let solicitudDataObj;
        try {
            solicitudDataObj = JSON.parse(solicitudData);
        } catch (error) {
            throw new Error('Los datos de la solicitud deben estar en formato JSON válido');
        }
        
        // Verificar campos requeridos
        if (!solicitudDataObj.prompt || !solicitudDataObj.parametros) {
            throw new Error('Los datos de la solicitud deben incluir prompt y parámetros');
        }
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('iaConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar consentimiento si es necesario
        if (config.verificacionConsentimiento && !solicitudDataObj.consentimiento) {
            throw new Error('Se requiere consentimiento para procesar la solicitud');
        }
        
        // Crear solicitud
        const now = new Date();
        const solicitudId = `solicitud_${modeloId}_${now.getTime()}`;
        
        // Generar hash del prompt para privacidad y trazabilidad
        const promptHash = crypto.createHash('sha256').update(solicitudDataObj.prompt).digest('hex');
        
        const solicitud = {
            id: solicitudId,
            modeloId: modeloId,
            usuario: caller,
            promptHash: promptHash,
            parametros: solicitudDataObj.parametros,
            metadatos: solicitudDataObj.metadatos || {},
            consentimiento: solicitudDataObj.consentimiento || false,
            fechaSolicitud: now.toISOString(),
            estado: 'pendiente',
            respuestaId: null,
            tiempoRespuesta: null,
            tokenesEntrada: solicitudDataObj.tokenesEntrada || 0,
            tokenesSalida: 0,
            error: null
        };
        
        // Si se almacena el historial completo, guardar el prompt original
        if (config.almacenamientoHistorial && solicitudDataObj.consentimiento) {
            solicitud.promptCompleto = solicitudDataObj.prompt;
        }
        
        // Guardar solicitud
        await ctx.stub.putState(solicitudId, Buffer.from(JSON.stringify(solicitud)));
        
        // Actualizar estadísticas del modelo
        modelo.estadisticas.totalSolicitudes += 1;
        modelo.fechaActualizacion = now.toISOString();
        await ctx.stub.putState(`modelo_${modeloId}`, Buffer.from(JSON.stringify(modelo)));
        
        // Emitir evento de solicitud registrada
        const solicitudEvent = {
            type: 'solicitud',
            solicitudId: solicitudId,
            modeloId: modeloId,
            usuario: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('SolicitudRegistrada', Buffer.from(JSON.stringify(solicitudEvent)));
        
        return solicitud;
    }
    
    /**
     * Registra la respuesta a una solicitud de inferencia
     * @param {Context} ctx - Contexto de transacción
     * @param {String} solicitudId - ID de la solicitud
     * @param {String} respuestaData - Datos de la respuesta en formato JSON
     * @returns {Object} - Información de la respuesta registrada
     */
    async registrarRespuesta(ctx, solicitudId, respuestaData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!solicitudId || !respuestaData) {
            throw new Error('Parámetros inválidos: se requiere ID de la solicitud y datos de la respuesta');
        }
        
        // Verificar que la solicitud exista
        const solicitudBuffer = await ctx.stub.getState(solicitudId);
        if (!solicitudBuffer || solicitudBuffer.length === 0) {
            throw new Error(`La solicitud con ID ${solicitudId} no existe`);
        }
        
        const solicitud = JSON.parse(solicitudBuffer.toString());
        
        // Verificar que la solicitud esté pendiente
        if (solicitud.estado !== 'pendiente') {
            throw new Error('La solicitud ya ha sido procesada');
        }
        
        // Verificar que los datos sean JSON válido
        let respuestaDataObj;
        try {
            respuestaDataObj = JSON.parse(respuestaData);
        } catch (error) {
            throw new Error('Los datos de la respuesta deben estar en formato JSON válido');
        }
        
        // Verificar campos requeridos
        if (respuestaDataObj.exito === undefined) {
            throw new Error('Los datos de la respuesta deben incluir el campo exito');
        }
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('iaConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Crear respuesta
        const now = new Date();
        const respuestaId = `respuesta_${solicitudId}_${now.getTime()}`;
        
        // Calcular tiempo de respuesta en milisegundos
        const fechaSolicitud = new Date(solicitud.fechaSolicitud);
        const tiempoRespuesta = now.getTime() - fechaSolicitud.getTime();
        
        const respuesta = {
            id: respuestaId,
            solicitudId: solicitudId,
            modeloId: solicitud.modeloId,
            exito: respuestaDataObj.exito,
            fechaRespuesta: now.toISOString(),
            tiempoRespuesta: tiempoRespuesta,
            tokenesSalida: respuestaDataObj.tokenesSalida || 0,
            metadatos: respuestaDataObj.metadatos || {}
        };
        
        // Si la respuesta fue exitosa y se almacena el historial completo, guardar el contenido
        if (respuestaDataObj.exito && config.almacenamientoHistorial && solicitud.consentimiento) {
            // Generar hash del contenido para privacidad y trazabilidad
            const contenidoHash = respuestaDataObj.contenido ? 
                crypto.createHash('sha256').update(respuestaDataObj.contenido).digest('hex') : 
                null;
            
            respuesta.contenidoHash = contenidoHash;
            respuesta.contenidoCompleto = respuestaDataObj.contenido;
        }
        
        // Si la respuesta no fue exitosa, registrar el error
        if (!respuestaDataObj.exito) {
            respuesta.error = respuestaDataObj.error || 'Error desconocido';
        }
        
        // Guardar respuesta
        await ctx.stub.putState(respuestaId, Buffer.from(JSON.stringify(respuesta)));
        
        // Actualizar solicitud
        solicitud.estado = respuestaDataObj.exito ? 'completada' : 'fallida';
        solicitud.respuestaId = respuestaId;
        solicitud.tiempoRespuesta = tiempoRespuesta;
        solicitud.tokenesSalida = respuestaDataObj.tokenesSalida || 0;
        solicitud.error = respuestaDataObj.exito ? null : (respuestaDataObj.error || 'Error desconocido');
        
        await ctx.stub.putState(solicitudId, Buffer.from(JSON.stringify(solicitud)));
        
        // Actualizar estadísticas del modelo
        const modeloBuffer = await ctx.stub.getState(`modelo_${solicitud.modeloId}`);
        if (modeloBuffer && modeloBuffer.length > 0) {
            const modelo = JSON.parse(modeloBuffer.toString());
            
            if (respuestaDataObj.exito) {
                modelo.estadisticas.solicitudesExitosas += 1;
            } else {
                modelo.estadisticas.solicitudesFallidas += 1;
            }
            
            // Actualizar tiempo promedio de respuesta
            const totalSolicitudesCompletadas = modelo.estadisticas.solicitudesExitosas + modelo.estadisticas.solicitudesFallidas;
            const tiempoPromedioAnterior = modelo.estadisticas.tiempoPromedioRespuesta;
            
            modelo.estadisticas.tiempoPromedioRespuesta = 
                (tiempoPromedioAnterior * (totalSolicitudesCompletadas - 1) + tiempoRespuesta) / totalSolicitudesCompletadas;
            
            // Actualizar tokens consumidos
            modelo.estadisticas.tokenesConsumidos += (solicitud.tokenesEntrada + respuestaDataObj.tokenesSalida || 0);
            
            modelo.fechaActualizacion = now.toISOString();
            await ctx.stub.putState(`modelo_${solicitud.modeloId}`, Buffer.from(JSON.stringify(modelo)));
        }
        
        // Emitir evento de respuesta registrada
        const respuestaEvent = {
            type: 'respuesta',
            respuestaId: respuestaId,
            solicitudId: solicitudId,
            modeloId: solicitud.modeloId,
            exito: respuestaDataObj.exito,
            tiempoRespuesta: tiempoRespuesta,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('RespuestaRegistrada', Buffer.from(JSON.stringify(respuestaEvent)));
        
        return respuesta;
    }
    
    /**
     * Registra una evaluación de calidad para una respuesta de IA
     * @param {Context} ctx - Contexto de transacción
     * @param {String} respuestaId - ID de la respuesta
     * @param {String} evaluacionData - Datos de la evaluación en formato JSON
     * @returns {Object} - Información de la evaluación registrada
     */
    async registrarEvaluacion(ctx, respuestaId, evaluacionData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!respuestaId || !evaluacionData) {
            throw new Error('Parámetros inválidos: se requiere ID de la respuesta y datos de la evaluación');
        }
        
        // Verificar que la respuesta exista
        const respuestaBuffer = await ctx.stub.getState(respuestaId);
        if (!respuestaBuffer || respuestaBuffer.length === 0) {
            throw new Error(`La respuesta con ID ${respuestaId} no existe`);
        }
        
        const respuesta = JSON.parse(respuestaBuffer.toString());
        
        // Verificar que la solicitud exista
        const solicitudBuffer = await ctx.stub.getState(respuesta.solicitudId);
        if (!solicitudBuffer || solicitudBuffer.length === 0) {
            throw new Error(`La solicitud con ID ${respuesta.solicitudId} no existe`);
        }
        
        const solicitud = JSON.parse(solicitudBuffer.toString());
        
        // Verificar que el llamante sea el usuario que hizo la solicitud
        if (caller !== solicitud.usuario) {
            throw new Error('Solo el usuario que hizo la solicitud puede evaluar la respuesta');
        }
        
        // Verificar que los datos sean JSON válido
        let evaluacionDataObj;
        try {
            evaluacionDataObj = JSON.parse(evaluacionData);
        } catch (error) {
            throw new Error('Los datos de la evaluación deben estar en formato JSON válido');
        }
        
        // Verificar campos requeridos
        if (evaluacionDataObj.puntuacion === undefined) {
            throw new Error('Los datos de la evaluación deben incluir una puntuación');
        }
        
        // Validar puntuación
        const puntuacion = parseFloat(evaluacionDataObj.puntuacion);
        if (isNaN(puntuacion) || puntuacion < 0 || puntuacion > 5) {
            throw new Error('La puntuación debe ser un número entre 0 y 5');
        }
        
        // Crear evaluación
        const now = new Date();
        const evaluacionId = `evaluacion_${respuestaId}_${now.getTime()}`;
        
        const evaluacion = {
            id: evaluacionId,
            respuestaId: respuestaId,
            solicitudId: respuesta.solicitudId,
            modeloId: respuesta.modeloId,
            usuario: caller,
            puntuacion: puntuacion,
            comentario: evaluacionDataObj.comentario || '',
            categorias: evaluacionDataObj.categorias || [],
            fechaEvaluacion: now.toISOString()
        };
        
        // Guardar evaluación
        await ctx.stub.putState(evaluacionId, Buffer.from(JSON.stringify(evaluacion)));
        
        // Actualizar respuesta con referencia a la evaluación
        respuesta.evaluacionId = evaluacionId;
        respuesta.puntuacion = puntuacion;
        await ctx.stub.putState(respuestaId, Buffer.from(JSON.stringify(respuesta)));
        
        // Emitir evento de evaluación registrada
        const evaluacionEvent = {
            type: 'evaluacion',
            evaluacionId: evaluacionId,
            respuestaId: respuestaId,
            modeloId: respuesta.modeloId,
            puntuacion: puntuacion,
            usuario: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('EvaluacionRegistrada', Buffer.from(JSON.stringify(evaluacionEvent)));
        
        return evaluacion;
    }
    
    /**
     * Actualiza la configuración del contrato de IA
     * @param {Context} ctx - Contexto de transacción
     * @param {String} configData - Nuevos datos de configuración en formato JSON
     * @returns {Object} - Configuración actualizada
     */
    async actualizarConfiguracion(ctx, configData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
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
        const configBuffer = await ctx.stub.getState('iaConfig');
        if (!configBuffer || configBuffer.length === 0) {
            throw new Error('No se encontró la configuración del contrato');
        }
        
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== config.admin) {
            throw new Error('Solo el administrador puede actualizar la configuración');
        }
        
        // Actualizar configuración
        const updatedConfig = {
            ...config,
            ...configDataObj,
            // Asegurar que estos campos no se sobrescriban directamente
            version: configDataObj.version || config.version,
            admin: configDataObj.admin || config.admin,
            modelos: configDataObj.modelos || config.modelos,
            proveedores: configDataObj.proveedores || config.proveedores
        };
        
        // Guardar configuración actualizada
        await ctx.stub.putState('iaConfig', Buffer.from(JSON.stringify(updatedConfig)));
        
        // Emitir evento de configuración actualizada
        const configEvent = {
            type: 'configuracion',
            actualizadoPor: caller,
            timestamp: new Date().toISOString()
        };
        await ctx.stub.setEvent('ConfiguracionActualizada', Buffer.from(JSON.stringify(configEvent)));
        
        return updatedConfig;
    }
    
    /**
     * Actualiza un modelo de IA existente
     * @param {Context} ctx - Contexto de transacción
     * @param {String} modeloId - ID del modelo
     * @param {String} modeloData - Nuevos datos del modelo en formato JSON
     * @returns {Object} - Información del modelo actualizado
     */
    async actualizarModelo(ctx, modeloId, modeloData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!modeloId || !modeloData) {
            throw new Error('Parámetros inválidos: se requiere ID del modelo y datos del modelo');
        }
        
        // Verificar que los datos sean JSON válido
        let modeloDataObj;
        try {
            modeloDataObj = JSON.parse(modeloData);
        } catch (error) {
            throw new Error('Los datos del modelo deben estar en formato JSON válido');
        }
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('iaConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== config.admin) {
            throw new Error('Solo el administrador puede actualizar modelos');
        }
        
        // Verificar que el modelo exista
        const modeloBuffer = await ctx.stub.getState(`modelo_${modeloId}`);
        if (!modeloBuffer || modeloBuffer.length === 0) {
            throw new Error(`El modelo con ID ${modeloId} no existe`);
        }
        
        const modelo = JSON.parse(modeloBuffer.toString());
        
        // Verificar que el proveedor sea válido si se está actualizando
        if (modeloDataObj.proveedor && !config.proveedores.includes(modeloDataObj.proveedor)) {
            throw new Error(`Proveedor inválido. Debe ser uno de: ${config.proveedores.join(', ')}`);
        }
        
        // Actualizar modelo
        const updatedModelo = {
            ...modelo,
            nombre: modeloDataObj.nombre || modelo.nombre,
            proveedor: modeloDataObj.proveedor || modelo.proveedor,
            version: modeloDataObj.version || modelo.version,
            descripcion: modeloDataObj.descripcion !== undefined ? modeloDataObj.descripcion : modelo.descripcion,
            parametros: modeloDataObj.parametros || modelo.parametros,
            capacidades: modeloDataObj.capacidades || modelo.capacidades,
            limitaciones: modeloDataObj.limitaciones || modelo.limitaciones,
            usoRecomendado: modeloDataObj.usoRecomendado !== undefined ? modeloDataObj.usoRecomendado : modelo.usoRecomendado,
            fechaActualizacion: new Date().toISOString(),
            activo: modeloDataObj.activo !== undefined ? modeloDataObj.activo : modelo.activo
        };
        
        // Guardar modelo actualizado
        await ctx.stub.putState(`modelo_${modeloId}`, Buffer.from(JSON.stringify(updatedModelo)));
        
        // Emitir evento de modelo actualizado
        const modeloEvent = {
            type: 'actualizacion',
            modeloId: modeloId,
            nombre: updatedModelo.nombre,
            actualizadoPor: caller,
            timestamp: updatedModelo.fechaActualizacion
        };
        await ctx.stub.setEvent('ModeloActualizado', Buffer.from(JSON.stringify(modeloEvent)));
        
        return updatedModelo;
    }
    
    /**
     * Obtiene un modelo de IA
     * @param {Context} ctx - Contexto de transacción
     * @param {String} modeloId - ID del modelo
     * @returns {Object} - Información del modelo
     */
    async obtenerModelo(ctx, modeloId) {
        // Validar parámetros
        if (!modeloId) {
            throw new Error('Parámetros inválidos: se requiere ID del modelo');
        }
        
        // Obtener modelo
        const modeloBuffer = await ctx.stub.getState(`modelo_${modeloId}`);
        if (!modeloBuffer || modeloBuffer.length === 0) {
            throw new Error(`Modelo con ID ${modeloId} no encontrado`);
        }
        
        return JSON.parse(modeloBuffer.toString());
    }
    
    /**
     * Obtiene todos los modelos de IA
     * @param {Context} ctx - Contexto de transacción
     * @param {String} soloActivos - Filtrar solo modelos activos (true/false)
     * @returns {Array} - Lista de modelos
     */
    async obtenerModelos(ctx, soloActivos) {
        // Convertir soloActivos a booleano
        const filtrarActivos = soloActivos === 'true';
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('iaConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Obtener todos los modelos
        const modelos = [];
        for (const modeloId of config.modelos) {
            const modeloBuffer = await ctx.stub.getState(`modelo_${modeloId}`);
            if (modeloBuffer && modeloBuffer.length > 0) {
                const modelo = JSON.parse(modeloBuffer.toString());
                
                // Filtrar por estado si es necesario
                if (!filtrarActivos || modelo.activo) {
                    modelos.push(modelo);
                }
            }
        }
        
        return modelos;
    }
    
    /**
     * Obtiene una solicitud de inferencia
     * @param {Context} ctx - Contexto de transacción
     * @param {String} solicitudId - ID de la solicitud
     * @returns {Object} - Información de la solicitud
     */
    async obtenerSolicitud(ctx, solicitudId) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!solicitudId) {
            throw new Error('Parámetros inválidos: se requiere ID de la solicitud');
        }
        
        // Obtener solicitud
        const solicitudBuffer = await ctx.stub.getState(solicitudId);
        if (!solicitudBuffer || solicitudBuffer.length === 0) {
            throw new Error(`Solicitud con ID ${solicitudId} no encontrada`);
        }
        
        const solicitud = JSON.parse(solicitudBuffer.toString());
        
        // Verificar que el llamante sea el usuario que hizo la solicitud o el administrador
        const configBuffer = await ctx.stub.getState('iaConfig');
        const config = JSON.parse(configBuffer.toString());
        
        if (caller !== solicitud.usuario && caller !== config.admin) {
            throw new Error('No tienes permiso para acceder a esta solicitud');
        }
        
        return solicitud;
    }
    
    /**
     * Obtiene una respuesta de inferencia
     * @param {Context} ctx - Contexto de transacción
     * @param {String} respuestaId - ID de la respuesta
     * @returns {Object} - Información de la respuesta
     */
    async obtenerRespuesta(ctx, respuestaId) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!respuestaId) {
            throw new Error('Parámetros inválidos: se requiere ID de la respuesta');
        }
        
        // Obtener respuesta
        const respuestaBuffer = await ctx.stub.getState(respuestaId);
        if (!respuestaBuffer || respuestaBuffer.length === 0) {
            throw new Error(`Respuesta con ID ${respuestaId} no encontrada`);
        }
        
        const respuesta = JSON.parse(respuestaBuffer.toString());
        
        // Obtener solicitud asociada
        const solicitudBuffer = await ctx.stub.getState(respuesta.solicitudId);
        if (!solicitudBuffer || solicitudBuffer.length === 0) {
            throw new Error(`Solicitud con ID ${respuesta.solicitudId} no encontrada`);
        }
        
        const solicitud = JSON.parse(solicitudBuffer.toString());
        
        // Verificar que el llamante sea el usuario que hizo la solicitud o el administrador
        const configBuffer = await ctx.stub.getState('iaConfig');
        const config = JSON.parse(configBuffer.toString());
        
        if (caller !== solicitud.usuario && caller !== config.admin) {
            throw new Error('No tienes permiso para acceder a esta respuesta');
        }
        
        return respuesta;
    }
    
    /**
     * Obtiene las solicitudes de un usuario
     * @param {Context} ctx - Contexto de transacción
     * @returns {Array} - Lista de solicitudes del usuario
     */
    async obtenerSolicitudesUsuario(ctx) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Consultar solicitudes del usuario
        const query = {
            selector: {
                usuario: caller
            },
            sort: [{ fechaSolicitud: 'desc' }]
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const solicitudes = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const solicitud = JSON.parse(result.value.value.toString());
            solicitudes.push(solicitud);
            result = await iterator.next();
        }
        
        return solicitudes;
    }
    
    /**
     * Obtiene estadísticas de uso de IA
     * @param {Context} ctx - Contexto de transacción
     * @returns {Object} - Estadísticas de uso
     */
    async obtenerEstadisticas(ctx) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('iaConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== config.admin) {
            throw new Error('Solo el administrador puede obtener estadísticas globales');
        }
        
        // Obtener estadísticas de todos los modelos
        const estadisticasModelos = {};
        let totalSolicitudes = 0;
        let totalSolicitudesExitosas = 0;
        let totalSolicitudesFallidas = 0;
        let totalTokenesConsumidos = 0;
        
        for (const modeloId of config.modelos) {
            const modeloBuffer = await ctx.stub.getState(`modelo_${modeloId}`);
            if (modeloBuffer && modeloBuffer.length > 0) {
                const modelo = JSON.parse(modeloBuffer.toString());
                
                estadisticasModelos[modeloId] = modelo.estadisticas;
                
                totalSolicitudes += modelo.estadisticas.totalSolicitudes;
                totalSolicitudesExitosas += modelo.estadisticas.solicitudesExitosas;
                totalSolicitudesFallidas += modelo.estadisticas.solicitudesFallidas;
                totalTokenesConsumidos += modelo.estadisticas.tokenesConsumidos;
            }
        }
        
        // Calcular estadísticas globales
        const estadisticasGlobales = {
            totalSolicitudes,
            totalSolicitudesExitosas,
            totalSolicitudesFallidas,
            tasaExito: totalSolicitudes > 0 ? (totalSolicitudesExitosas / totalSolicitudes) * 100 : 0,
            totalTokenesConsumidos,
            tiempoPromedioRespuestaGlobal: 0,
            modelosActivos: 0
        };
        
        // Calcular tiempo promedio global y contar modelos activos
        let sumaTiemposPromedio = 0;
        let modelosConSolicitudes = 0;
        
        for (const modeloId in estadisticasModelos) {
            const estadisticasModelo = estadisticasModelos[modeloId];
            
            if (estadisticasModelo.solicitudesExitosas + estadisticasModelo.solicitudesFallidas > 0) {
                sumaTiemposPromedio += estadisticasModelo.tiempoPromedioRespuesta;
                modelosConSolicitudes++;
            }
            
            // Obtener modelo para verificar si está activo
            const modeloBuffer = await ctx.stub.getState(`modelo_${modeloId}`);
            if (modeloBuffer && modeloBuffer.length > 0) {
                const modelo = JSON.parse(modeloBuffer.toString());
                if (modelo.activo) {
                    estadisticasGlobales.modelosActivos++;
                }
            }
        }
        
        if (modelosConSolicitudes > 0) {
            estadisticasGlobales.tiempoPromedioRespuestaGlobal = sumaTiemposPromedio / modelosConSolicitudes;
        }
        
        return {
            global: estadisticasGlobales,
            porModelo: estadisticasModelos
        };
    }
    
    /**
     * Registra un proveedor de IA
     * @param {Context} ctx - Contexto de transacción
     * @param {String} proveedorId - ID único del proveedor
     * @param {String} proveedorData - Datos del proveedor en formato JSON
     * @returns {Object} - Información del proveedor registrado
     */
    async registrarProveedor(ctx, proveedorId, proveedorData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!proveedorId || !proveedorData) {
            throw new Error('Parámetros inválidos: se requiere ID del proveedor y datos del proveedor');
        }
        
        // Verificar si el proveedor ya existe
        const existingProveedorBuffer = await ctx.stub.getState(`proveedor_${proveedorId}`);
        if (existingProveedorBuffer && existingProveedorBuffer.length > 0) {
            throw new Error(`El proveedor con ID ${proveedorId} ya existe`);
        }
        
        // Verificar que los datos sean JSON válido
        let proveedorDataObj;
        try {
            proveedorDataObj = JSON.parse(proveedorData);
        } catch (error) {
            throw new Error('Los datos del proveedor deben estar en formato JSON válido');
        }
        
        // Verificar campos requeridos
        if (!proveedorDataObj.nombre || !proveedorDataObj.endpoint) {
            throw new Error('Los datos del proveedor deben incluir nombre y endpoint');
        }
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('iaConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== config.admin) {
            throw new Error('Solo el administrador puede registrar proveedores');
        }
        
        // Crear proveedor
        const now = new Date();
        const proveedor = {
            id: proveedorId,
            nombre: proveedorDataObj.nombre,
            endpoint: proveedorDataObj.endpoint,
            descripcion: proveedorDataObj.descripcion || '',
            autenticacion: proveedorDataObj.autenticacion || {},
            parametrosDefecto: proveedorDataObj.parametrosDefecto || {},
            limitaciones: proveedorDataObj.limitaciones || [],
            fechaCreacion: now.toISOString(),
            creadoPor: caller,
            fechaActualizacion: now.toISOString(),
            activo: true
        };
        
        // Guardar proveedor
        await ctx.stub.putState(`proveedor_${proveedorId}`, Buffer.from(JSON.stringify(proveedor)));
        
        // Actualizar lista de proveedores en la configuración si es necesario
        if (!config.proveedores.includes(proveedorId)) {
            config.proveedores.push(proveedorId);
            await ctx.stub.putState('iaConfig', Buffer.from(JSON.stringify(config)));
        }
        
        // Emitir evento de proveedor registrado
        const proveedorEvent = {
            type: 'registro',
            proveedorId: proveedorId,
            nombre: proveedor.nombre,
            creadoPor: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('ProveedorRegistrado', Buffer.from(JSON.stringify(proveedorEvent)));
        
        return proveedor;
    }
    
    /**
     * Registra un conjunto de datos para entrenamiento de IA
     * @param {Context} ctx - Contexto de transacción
     * @param {String} datasetId - ID único del conjunto de datos
     * @param {String} datasetData - Metadatos del conjunto de datos en formato JSON
     * @returns {Object} - Información del conjunto de datos registrado
     */
    async registrarDataset(ctx, datasetId, datasetData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!datasetId || !datasetData) {
            throw new Error('Parámetros inválidos: se requiere ID del conjunto de datos y metadatos');
        }
        
        // Verificar si el conjunto de datos ya existe
        const existingDatasetBuffer = await ctx.stub.getState(`dataset_${datasetId}`);
        if (existingDatasetBuffer && existingDatasetBuffer.length > 0) {
            throw new Error(`El conjunto de datos con ID ${datasetId} ya existe`);
        }
        
        // Verificar que los datos sean JSON válido
        let datasetDataObj;
        try {
            datasetDataObj = JSON.parse(datasetData);
        } catch (error) {
            throw new Error('Los metadatos del conjunto de datos deben estar en formato JSON válido');
        }
        
        // Verificar campos requeridos
        if (!datasetDataObj.nombre || !datasetDataObj.descripcion || !datasetDataObj.tipo) {
            throw new Error('Los metadatos deben incluir nombre, descripción y tipo');
        }
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('iaConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== config.admin) {
            throw new Error('Solo el administrador puede registrar conjuntos de datos');
        }
        
        // Crear conjunto de datos
        const now = new Date();
        const dataset = {
            id: datasetId,
            nombre: datasetDataObj.nombre,
            descripcion: datasetDataObj.descripcion,
            tipo: datasetDataObj.tipo,
            fuente: datasetDataObj.fuente || '',
            formato: datasetDataObj.formato || '',
            tamanio: datasetDataObj.tamanio || 0,
            numRegistros: datasetDataObj.numRegistros || 0,
            fechaCreacion: datasetDataObj.fechaCreacion || now.toISOString(),
            fechaRegistro: now.toISOString(),
            registradoPor: caller,
            fechaActualizacion: now.toISOString(),
            etiquetas: datasetDataObj.etiquetas || [],
            metadatosAdicionales: datasetDataObj.metadatosAdicionales || {},
            hash: datasetDataObj.hash || '',
            ubicacion: datasetDataObj.ubicacion || '',
            licencia: datasetDataObj.licencia || '',
            consentimiento: datasetDataObj.consentimiento || false,
            activo: true
        };
        
        // Guardar conjunto de datos
        await ctx.stub.putState(`dataset_${datasetId}`, Buffer.from(JSON.stringify(dataset)));
        
        // Emitir evento de conjunto de datos registrado
        const datasetEvent = {
            type: 'registro',
            datasetId: datasetId,
            nombre: dataset.nombre,
            tipo: dataset.tipo,
            registradoPor: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('DatasetRegistrado', Buffer.from(JSON.stringify(datasetEvent)));
        
        return dataset;
    }
    
    /**
     * Registra un entrenamiento de modelo de IA
     * @param {Context} ctx - Contexto de transacción
     * @param {String} entrenamientoId - ID único del entrenamiento
     * @param {String} entrenamientoData - Datos del entrenamiento en formato JSON
     * @returns {Object} - Información del entrenamiento registrado
     */
    async registrarEntrenamiento(ctx, entrenamientoId, entrenamientoData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!entrenamientoId || !entrenamientoData) {
            throw new Error('Parámetros inválidos: se requiere ID del entrenamiento y datos del entrenamiento');
        }
        
        // Verificar si el entrenamiento ya existe
        const existingEntrenamientoBuffer = await ctx.stub.getState(`entrenamiento_${entrenamientoId}`);
        if (existingEntrenamientoBuffer && existingEntrenamientoBuffer.length > 0) {
            throw new Error(`El entrenamiento con ID ${entrenamientoId} ya existe`);
        }
        
        // Verificar que los datos sean JSON válido
        let entrenamientoDataObj;
        try {
            entrenamientoDataObj = JSON.parse(entrenamientoData);
        } catch (error) {
            throw new Error('Los datos del entrenamiento deben estar en formato JSON válido');
        }
        
        // Verificar campos requeridos
        if (!entrenamientoDataObj.modeloBaseId || !entrenamientoDataObj.datasetIds || !entrenamientoDataObj.parametros) {
            throw new Error('Los datos del entrenamiento deben incluir modeloBaseId, datasetIds y parametros');
        }
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('iaConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== config.admin) {
            throw new Error('Solo el administrador puede registrar entrenamientos');
        }
        
        // Verificar que el modelo base exista
        const modeloBaseBuffer = await ctx.stub.getState(`modelo_${entrenamientoDataObj.modeloBaseId}`);
        if (!modeloBaseBuffer || modeloBaseBuffer.length === 0) {
            throw new Error(`El modelo base con ID ${entrenamientoDataObj.modeloBaseId} no existe`);
        }
        
        // Verificar que los datasets existan
        for (const datasetId of entrenamientoDataObj.datasetIds) {
            const datasetBuffer = await ctx.stub.getState(`dataset_${datasetId}`);
            if (!datasetBuffer || datasetBuffer.length === 0) {
                throw new Error(`El dataset con ID ${datasetId} no existe`);
            }
        }
        
        // Crear entrenamiento
        const now = new Date();
        const entrenamiento = {
            id: entrenamientoId,
            modeloBaseId: entrenamientoDataObj.modeloBaseId,
            datasetIds: entrenamientoDataObj.datasetIds,
            parametros: entrenamientoDataObj.parametros,
            descripcion: entrenamientoDataObj.descripcion || '',
            fechaInicio: now.toISOString(),
            fechaFin: null,
            estado: 'iniciado',
            progreso: 0,
            resultados: null,
            modeloResultanteId: null,
            metricas: {},
            logs: [],
            iniciadoPor: caller,
            fechaActualizacion: now.toISOString()
        };
        
        // Guardar entrenamiento
        await ctx.stub.putState(`entrenamiento_${entrenamientoId}`, Buffer.from(JSON.stringify(entrenamiento)));
        
        // Emitir evento de entrenamiento registrado
        const entrenamientoEvent = {
            type: 'registro',
            entrenamientoId: entrenamientoId,
            modeloBaseId: entrenamiento.modeloBaseId,
            iniciadoPor: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('EntrenamientoRegistrado', Buffer.from(JSON.stringify(entrenamientoEvent)));
        
        return entrenamiento;
    }
    
    /**
     * Actualiza el estado de un entrenamiento
     * @param {Context} ctx - Contexto de transacción
     * @param {String} entrenamientoId - ID del entrenamiento
     * @param {String} estadoData - Datos del estado en formato JSON
     * @returns {Object} - Información del entrenamiento actualizado
     */
    async actualizarEstadoEntrenamiento(ctx, entrenamientoId, estadoData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!entrenamientoId || !estadoData) {
            throw new Error('Parámetros inválidos: se requiere ID del entrenamiento y datos del estado');
        }
        
        // Verificar que los datos sean JSON válido
        let estadoDataObj;
        try {
            estadoDataObj = JSON.parse(estadoData);
        } catch (error) {
            throw new Error('Los datos del estado deben estar en formato JSON válido');
        }
        
        // Verificar campos requeridos
        if (!estadoDataObj.estado) {
            throw new Error('Los datos del estado deben incluir el campo estado');
        }
        
        // Verificar estado válido
        const estadosValidos = ['iniciado', 'en_progreso', 'completado', 'fallido', 'cancelado'];
        if (!estadosValidos.includes(estadoDataObj.estado)) {
            throw new Error(`Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`);
        }
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('iaConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== config.admin) {
            throw new Error('Solo el administrador puede actualizar el estado de los entrenamientos');
        }
        
        // Verificar que el entrenamiento exista
        const entrenamientoBuffer = await ctx.stub.getState(`entrenamiento_${entrenamientoId}`);
        if (!entrenamientoBuffer || entrenamientoBuffer.length === 0) {
            throw new Error(`El entrenamiento con ID ${entrenamientoId} no existe`);
        }
        
        const entrenamiento = JSON.parse(entrenamientoBuffer.toString());
        
        // Actualizar entrenamiento
        const now = new Date();
        const updatedEntrenamiento = {
            ...entrenamiento,
            estado: estadoDataObj.estado,
            progreso: estadoDataObj.progreso !== undefined ? estadoDataObj.progreso : entrenamiento.progreso,
            fechaActualizacion: now.toISOString()
        };
        
        // Si el estado es completado o fallido, actualizar fecha de fin
        if (estadoDataObj.estado === 'completado' || estadoDataObj.estado === 'fallido') {
            updatedEntrenamiento.fechaFin = now.toISOString();
        }
        
        // Si se proporcionan resultados, actualizarlos
        if (estadoDataObj.resultados) {
            updatedEntrenamiento.resultados = estadoDataObj.resultados;
        }
        
        // Si se proporciona ID de modelo resultante, actualizarlo
        if (estadoDataObj.modeloResultanteId) {
            updatedEntrenamiento.modeloResultanteId = estadoDataObj.modeloResultanteId;
        }
        
        // Si se proporcionan métricas, actualizarlas
        if (estadoDataObj.metricas) {
            updatedEntrenamiento.metricas = {
                ...entrenamiento.metricas,
                ...estadoDataObj.metricas
            };
        }
        
        // Si se proporciona un log, añadirlo
        if (estadoDataObj.log) {
            updatedEntrenamiento.logs.push({
                timestamp: now.toISOString(),
                mensaje: estadoDataObj.log,
                nivel: estadoDataObj.nivelLog || 'info'
            });
        }
        
        // Guardar entrenamiento actualizado
        await ctx.stub.putState(`entrenamiento_${entrenamientoId}`, Buffer.from(JSON.stringify(updatedEntrenamiento)));
        
        // Emitir evento de estado de entrenamiento actualizado
        const estadoEvent = {
            type: 'actualizacionEstado',
            entrenamientoId: entrenamientoId,
            estado: updatedEntrenamiento.estado,
            progreso: updatedEntrenamiento.progreso,
            actualizadoPor: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('EstadoEntrenamientoActualizado', Buffer.from(JSON.stringify(estadoEvent)));
        
        return updatedEntrenamiento;
    }
}

module.exports = IAContract;
