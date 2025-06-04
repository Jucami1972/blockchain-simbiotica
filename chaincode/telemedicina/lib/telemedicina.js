'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Contrato de Telemedicina para la Blockchain Simbiótica
 * Implementa funcionalidades para gestionar registros médicos, citas y prescripciones
 */
class TelemedicinContract extends Contract {
    
    /**
     * Inicializa el contrato con los valores predeterminados
     * @param {Context} ctx - Contexto de transacción
     */
    async init(ctx) {
        console.info('============= Inicializando Contrato de Telemedicina =============');
        
        // Configuración del contrato de telemedicina
        const telemedicinConfig = {
            version: '1.0',
            admin: 'admin',
            dataEncryption: true,
            consentRequired: true,
            auditEnabled: true
        };
        
        await ctx.stub.putState('telemedicinConfig', Buffer.from(JSON.stringify(telemedicinConfig)));
        
        console.info('============= Contrato de Telemedicina inicializado correctamente =============');
        return JSON.stringify(telemedicinConfig);
    }
    
    /**
     * Registra un nuevo paciente en el sistema
     * @param {Context} ctx - Contexto de transacción
     * @param {String} patientId - ID único del paciente
     * @param {String} patientData - Datos del paciente en formato JSON (encriptados)
     * @returns {Object} - Información del paciente registrado
     */
    async registerPatient(ctx, patientId, patientData) {
        // Validar parámetros
        if (!patientId || !patientData) {
            throw new Error('Parámetros inválidos: se requiere ID del paciente y datos del paciente');
        }
        
        // Verificar si el paciente ya existe
        const existingPatientBuffer = await ctx.stub.getState(`patient_${patientId}`);
        if (existingPatientBuffer && existingPatientBuffer.length > 0) {
            throw new Error(`El paciente con ID ${patientId} ya existe`);
        }
        
        // Verificar que los datos sean JSON válido
        let patientDataObj;
        try {
            patientDataObj = JSON.parse(patientData);
        } catch (error) {
            throw new Error('Los datos del paciente deben estar en formato JSON válido');
        }
        
        // Crear registro del paciente
        const now = new Date();
        const patient = {
            id: patientId,
            data: patientDataObj,
            status: 'active',
            registeredAt: now.toISOString(),
            updatedAt: now.toISOString(),
            consentGiven: false,
            consentHistory: [],
            medicalRecords: [],
            appointments: [],
            prescriptions: []
        };
        
        // Guardar paciente
        await ctx.stub.putState(`patient_${patientId}`, Buffer.from(JSON.stringify(patient)));
        
        // Emitir evento de paciente registrado
        const patientEvent = {
            type: 'register',
            patientId: patientId,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('PatientRegistered', Buffer.from(JSON.stringify(patientEvent)));
        
        return patient;
    }
    
    /**
     * Actualiza los datos de un paciente
     * @param {Context} ctx - Contexto de transacción
     * @param {String} patientId - ID del paciente
     * @param {String} patientData - Nuevos datos del paciente en formato JSON (encriptados)
     * @returns {Object} - Información del paciente actualizada
     */
    async updatePatient(ctx, patientId, patientData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!patientId || !patientData) {
            throw new Error('Parámetros inválidos: se requiere ID del paciente y datos del paciente');
        }
        
        // Verificar que los datos sean JSON válido
        let patientDataObj;
        try {
            patientDataObj = JSON.parse(patientData);
        } catch (error) {
            throw new Error('Los datos del paciente deben estar en formato JSON válido');
        }
        
        // Obtener paciente
        const patientBuffer = await ctx.stub.getState(`patient_${patientId}`);
        if (!patientBuffer || patientBuffer.length === 0) {
            throw new Error(`Paciente con ID ${patientId} no encontrado`);
        }
        
        const patient = JSON.parse(patientBuffer.toString());
        
        // Verificar permisos (en un sistema real, aquí se verificaría si el llamante es el paciente o un médico autorizado)
        // Para este ejemplo, asumimos que el llamante tiene permisos
        
        // Actualizar datos del paciente
        patient.data = patientDataObj;
        patient.updatedAt = new Date().toISOString();
        
        // Guardar paciente actualizado
        await ctx.stub.putState(`patient_${patientId}`, Buffer.from(JSON.stringify(patient)));
        
        // Emitir evento de paciente actualizado
        const patientEvent = {
            type: 'update',
            patientId: patientId,
            updatedBy: caller,
            timestamp: patient.updatedAt
        };
        await ctx.stub.setEvent('PatientUpdated', Buffer.from(JSON.stringify(patientEvent)));
        
        return patient;
    }
    
    /**
     * Registra el consentimiento del paciente para compartir datos
     * @param {Context} ctx - Contexto de transacción
     * @param {String} patientId - ID del paciente
     * @param {String} consentData - Datos del consentimiento en formato JSON
     * @returns {Object} - Información del paciente actualizada
     */
    async giveConsent(ctx, patientId, consentData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!patientId || !consentData) {
            throw new Error('Parámetros inválidos: se requiere ID del paciente y datos del consentimiento');
        }
        
        // Verificar que los datos sean JSON válido
        let consentDataObj;
        try {
            consentDataObj = JSON.parse(consentData);
        } catch (error) {
            throw new Error('Los datos del consentimiento deben estar en formato JSON válido');
        }
        
        // Obtener paciente
        const patientBuffer = await ctx.stub.getState(`patient_${patientId}`);
        if (!patientBuffer || patientBuffer.length === 0) {
            throw new Error(`Paciente con ID ${patientId} no encontrado`);
        }
        
        const patient = JSON.parse(patientBuffer.toString());
        
        // Verificar que el llamante sea el paciente
        // En un sistema real, aquí se verificaría la identidad del paciente
        // Para este ejemplo, asumimos que el llamante es el paciente
        
        // Registrar consentimiento
        const now = new Date();
        const consent = {
            givenAt: now.toISOString(),
            data: consentDataObj,
            givenBy: caller
        };
        
        patient.consentGiven = true;
        patient.consentHistory.push(consent);
        patient.updatedAt = now.toISOString();
        
        // Guardar paciente actualizado
        await ctx.stub.putState(`patient_${patientId}`, Buffer.from(JSON.stringify(patient)));
        
        // Emitir evento de consentimiento registrado
        const consentEvent = {
            type: 'consent',
            patientId: patientId,
            givenBy: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('ConsentGiven', Buffer.from(JSON.stringify(consentEvent)));
        
        return patient;
    }
    
    /**
     * Revoca el consentimiento del paciente para compartir datos
     * @param {Context} ctx - Contexto de transacción
     * @param {String} patientId - ID del paciente
     * @param {String} reason - Razón de la revocación
     * @returns {Object} - Información del paciente actualizada
     */
    async revokeConsent(ctx, patientId, reason) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!patientId) {
            throw new Error('Parámetros inválidos: se requiere ID del paciente');
        }
        
        // Obtener paciente
        const patientBuffer = await ctx.stub.getState(`patient_${patientId}`);
        if (!patientBuffer || patientBuffer.length === 0) {
            throw new Error(`Paciente con ID ${patientId} no encontrado`);
        }
        
        const patient = JSON.parse(patientBuffer.toString());
        
        // Verificar que el llamante sea el paciente
        // En un sistema real, aquí se verificaría la identidad del paciente
        // Para este ejemplo, asumimos que el llamante es el paciente
        
        // Registrar revocación de consentimiento
        const now = new Date();
        const revocation = {
            revokedAt: now.toISOString(),
            reason: reason || 'No se proporcionó razón',
            revokedBy: caller
        };
        
        patient.consentGiven = false;
        patient.consentHistory.push(revocation);
        patient.updatedAt = now.toISOString();
        
        // Guardar paciente actualizado
        await ctx.stub.putState(`patient_${patientId}`, Buffer.from(JSON.stringify(patient)));
        
        // Emitir evento de consentimiento revocado
        const revocationEvent = {
            type: 'revocation',
            patientId: patientId,
            revokedBy: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('ConsentRevoked', Buffer.from(JSON.stringify(revocationEvent)));
        
        return patient;
    }
    
    /**
     * Añade un registro médico a un paciente
     * @param {Context} ctx - Contexto de transacción
     * @param {String} patientId - ID del paciente
     * @param {String} recordData - Datos del registro médico en formato JSON (encriptados)
     * @returns {Object} - Información del registro médico añadido
     */
    async addMedicalRecord(ctx, patientId, recordData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!patientId || !recordData) {
            throw new Error('Parámetros inválidos: se requiere ID del paciente y datos del registro médico');
        }
        
        // Verificar que los datos sean JSON válido
        let recordDataObj;
        try {
            recordDataObj = JSON.parse(recordData);
        } catch (error) {
            throw new Error('Los datos del registro médico deben estar en formato JSON válido');
        }
        
        // Obtener paciente
        const patientBuffer = await ctx.stub.getState(`patient_${patientId}`);
        if (!patientBuffer || patientBuffer.length === 0) {
            throw new Error(`Paciente con ID ${patientId} no encontrado`);
        }
        
        const patient = JSON.parse(patientBuffer.toString());
        
        // Verificar consentimiento si es requerido
        const configBuffer = await ctx.stub.getState('telemedicinConfig');
        const config = JSON.parse(configBuffer.toString());
        
        if (config.consentRequired && !patient.consentGiven) {
            throw new Error('Se requiere el consentimiento del paciente para añadir registros médicos');
        }
        
        // Crear registro médico
        const now = new Date();
        const recordId = `record_${patientId}_${now.getTime()}`;
        const record = {
            id: recordId,
            patientId: patientId,
            data: recordDataObj,
            createdAt: now.toISOString(),
            createdBy: caller,
            updatedAt: now.toISOString(),
            updatedBy: caller
        };
        
        // Añadir registro a la lista de registros del paciente
        patient.medicalRecords.push(recordId);
        patient.updatedAt = now.toISOString();
        
        // Guardar registro médico y paciente actualizado
        await ctx.stub.putState(recordId, Buffer.from(JSON.stringify(record)));
        await ctx.stub.putState(`patient_${patientId}`, Buffer.from(JSON.stringify(patient)));
        
        // Emitir evento de registro médico añadido
        const recordEvent = {
            type: 'add',
            recordId: recordId,
            patientId: patientId,
            createdBy: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('MedicalRecordAdded', Buffer.from(JSON.stringify(recordEvent)));
        
        return record;
    }
    
    /**
     * Actualiza un registro médico
     * @param {Context} ctx - Contexto de transacción
     * @param {String} recordId - ID del registro médico
     * @param {String} recordData - Nuevos datos del registro médico en formato JSON (encriptados)
     * @returns {Object} - Información del registro médico actualizado
     */
    async updateMedicalRecord(ctx, recordId, recordData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!recordId || !recordData) {
            throw new Error('Parámetros inválidos: se requiere ID del registro médico y datos del registro');
        }
        
        // Verificar que los datos sean JSON válido
        let recordDataObj;
        try {
            recordDataObj = JSON.parse(recordData);
        } catch (error) {
            throw new Error('Los datos del registro médico deben estar en formato JSON válido');
        }
        
        // Obtener registro médico
        const recordBuffer = await ctx.stub.getState(recordId);
        if (!recordBuffer || recordBuffer.length === 0) {
            throw new Error(`Registro médico con ID ${recordId} no encontrado`);
        }
        
        const record = JSON.parse(recordBuffer.toString());
        
        // Verificar permisos (en un sistema real, aquí se verificaría si el llamante es el creador del registro o un médico autorizado)
        // Para este ejemplo, asumimos que el llamante tiene permisos
        
        // Actualizar registro médico
        record.data = recordDataObj;
        record.updatedAt = new Date().toISOString();
        record.updatedBy = caller;
        
        // Guardar registro médico actualizado
        await ctx.stub.putState(recordId, Buffer.from(JSON.stringify(record)));
        
        // Emitir evento de registro médico actualizado
        const recordEvent = {
            type: 'update',
            recordId: recordId,
            patientId: record.patientId,
            updatedBy: caller,
            timestamp: record.updatedAt
        };
        await ctx.stub.setEvent('MedicalRecordUpdated', Buffer.from(JSON.stringify(recordEvent)));
        
        return record;
    }
    
    /**
     * Programa una cita médica
     * @param {Context} ctx - Contexto de transacción
     * @param {String} patientId - ID del paciente
     * @param {String} doctorId - ID del doctor
     * @param {String} appointmentData - Datos de la cita en formato JSON
     * @returns {Object} - Información de la cita programada
     */
    async scheduleAppointment(ctx, patientId, doctorId, appointmentData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!patientId || !doctorId || !appointmentData) {
            throw new Error('Parámetros inválidos: se requiere ID del paciente, ID del doctor y datos de la cita');
        }
        
        // Verificar que los datos sean JSON válido
        let appointmentDataObj;
        try {
            appointmentDataObj = JSON.parse(appointmentData);
        } catch (error) {
            throw new Error('Los datos de la cita deben estar en formato JSON válido');
        }
        
        // Verificar que la fecha de la cita sea válida
        if (!appointmentDataObj.date) {
            throw new Error('Los datos de la cita deben incluir una fecha');
        }
        
        const appointmentDate = new Date(appointmentDataObj.date);
        if (isNaN(appointmentDate.getTime())) {
            throw new Error('Formato de fecha inválido. Use formato ISO 8601');
        }
        
        const now = new Date();
        if (appointmentDate < now) {
            throw new Error('La fecha de la cita debe ser futura');
        }
        
        // Obtener paciente
        const patientBuffer = await ctx.stub.getState(`patient_${patientId}`);
        if (!patientBuffer || patientBuffer.length === 0) {
            throw new Error(`Paciente con ID ${patientId} no encontrado`);
        }
        
        const patient = JSON.parse(patientBuffer.toString());
        
        // Crear cita
        const appointmentId = `appointment_${patientId}_${now.getTime()}`;
        const appointment = {
            id: appointmentId,
            patientId: patientId,
            doctorId: doctorId,
            data: appointmentDataObj,
            status: 'scheduled',
            createdAt: now.toISOString(),
            createdBy: caller,
            updatedAt: now.toISOString(),
            updatedBy: caller
        };
        
        // Añadir cita a la lista de citas del paciente
        patient.appointments.push(appointmentId);
        patient.updatedAt = now.toISOString();
        
        // Guardar cita y paciente actualizado
        await ctx.stub.putState(appointmentId, Buffer.from(JSON.stringify(appointment)));
        await ctx.stub.putState(`patient_${patientId}`, Buffer.from(JSON.stringify(patient)));
        
        // Emitir evento de cita programada
        const appointmentEvent = {
            type: 'schedule',
            appointmentId: appointmentId,
            patientId: patientId,
            doctorId: doctorId,
            date: appointmentDataObj.date,
            createdBy: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('AppointmentScheduled', Buffer.from(JSON.stringify(appointmentEvent)));
        
        return appointment;
    }
    
    /**
     * Actualiza el estado de una cita médica
     * @param {Context} ctx - Contexto de transacción
     * @param {String} appointmentId - ID de la cita
     * @param {String} status - Nuevo estado (scheduled, completed, cancelled, rescheduled)
     * @param {String} notes - Notas adicionales (opcional)
     * @returns {Object} - Información de la cita actualizada
     */
    async updateAppointmentStatus(ctx, appointmentId, status, notes) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!appointmentId || !status) {
            throw new Error('Parámetros inválidos: se requiere ID de la cita y estado');
        }
        
        // Verificar estado válido
        const validStatus = ['scheduled', 'completed', 'cancelled', 'rescheduled'];
        if (!validStatus.includes(status)) {
            throw new Error(`Estado inválido. Debe ser uno de: ${validStatus.join(', ')}`);
        }
        
        // Obtener cita
        const appointmentBuffer = await ctx.stub.getState(appointmentId);
        if (!appointmentBuffer || appointmentBuffer.length === 0) {
            throw new Error(`Cita con ID ${appointmentId} no encontrada`);
        }
        
        const appointment = JSON.parse(appointmentBuffer.toString());
        
        // Verificar permisos (en un sistema real, aquí se verificaría si el llamante es el paciente, el doctor o un administrador)
        // Para este ejemplo, asumimos que el llamante tiene permisos
        
        // Actualizar estado de la cita
        const now = new Date();
        appointment.status = status;
        appointment.updatedAt = now.toISOString();
        appointment.updatedBy = caller;
        
        if (notes) {
            appointment.notes = notes;
        }
        
        // Guardar cita actualizada
        await ctx.stub.putState(appointmentId, Buffer.from(JSON.stringify(appointment)));
        
        // Emitir evento de cita actualizada
        const appointmentEvent = {
            type: 'update',
            appointmentId: appointmentId,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            status: status,
            updatedBy: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('AppointmentUpdated', Buffer.from(JSON.stringify(appointmentEvent)));
        
        return appointment;
    }
    
    /**
     * Crea una prescripción médica
     * @param {Context} ctx - Contexto de transacción
     * @param {String} patientId - ID del paciente
     * @param {String} doctorId - ID del doctor
     * @param {String} prescriptionData - Datos de la prescripción en formato JSON
     * @returns {Object} - Información de la prescripción creada
     */
    async createPrescription(ctx, patientId, doctorId, prescriptionData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!patientId || !doctorId || !prescriptionData) {
            throw new Error('Parámetros inválidos: se requiere ID del paciente, ID del doctor y datos de la prescripción');
        }
        
        // Verificar que los datos sean JSON válido
        let prescriptionDataObj;
        try {
            prescriptionDataObj = JSON.parse(prescriptionData);
        } catch (error) {
            throw new Error('Los datos de la prescripción deben estar en formato JSON válido');
        }
        
        // Verificar que los datos incluyan medicamentos
        if (!prescriptionDataObj.medications || !Array.isArray(prescriptionDataObj.medications) || prescriptionDataObj.medications.length === 0) {
            throw new Error('Los datos de la prescripción deben incluir al menos un medicamento');
        }
        
        // Obtener paciente
        const patientBuffer = await ctx.stub.getState(`patient_${patientId}`);
        if (!patientBuffer || patientBuffer.length === 0) {
            throw new Error(`Paciente con ID ${patientId} no encontrado`);
        }
        
        const patient = JSON.parse(patientBuffer.toString());
        
        // Verificar consentimiento si es requerido
        const configBuffer = await ctx.stub.getState('telemedicinConfig');
        const config = JSON.parse(configBuffer.toString());
        
        if (config.consentRequired && !patient.consentGiven) {
            throw new Error('Se requiere el consentimiento del paciente para crear prescripciones');
        }
        
        // Crear prescripción
        const now = new Date();
        const prescriptionId = `prescription_${patientId}_${now.getTime()}`;
        const prescription = {
            id: prescriptionId,
            patientId: patientId,
            doctorId: doctorId,
            data: prescriptionDataObj,
            status: 'active',
            createdAt: now.toISOString(),
            createdBy: caller,
            updatedAt: now.toISOString(),
            updatedBy: caller,
            expiryDate: prescriptionDataObj.expiryDate || null,
            dispensed: false,
            dispensedAt: null,
            dispensedBy: null
        };
        
        // Añadir prescripción a la lista de prescripciones del paciente
        patient.prescriptions.push(prescriptionId);
        patient.updatedAt = now.toISOString();
        
        // Guardar prescripción y paciente actualizado
        await ctx.stub.putState(prescriptionId, Buffer.from(JSON.stringify(prescription)));
        await ctx.stub.putState(`patient_${patientId}`, Buffer.from(JSON.stringify(patient)));
        
        // Emitir evento de prescripción creada
        const prescriptionEvent = {
            type: 'create',
            prescriptionId: prescriptionId,
            patientId: patientId,
            doctorId: doctorId,
            createdBy: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('PrescriptionCreated', Buffer.from(JSON.stringify(prescriptionEvent)));
        
        return prescription;
    }
    
    /**
     * Marca una prescripción como dispensada
     * @param {Context} ctx - Contexto de transacción
     * @param {String} prescriptionId - ID de la prescripción
     * @param {String} pharmacistId - ID del farmacéutico
     * @param {String} notes - Notas adicionales (opcional)
     * @returns {Object} - Información de la prescripción actualizada
     */
    async dispensePrescription(ctx, prescriptionId, pharmacistId, notes) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!prescriptionId || !pharmacistId) {
            throw new Error('Parámetros inválidos: se requiere ID de la prescripción e ID del farmacéutico');
        }
        
        // Obtener prescripción
        const prescriptionBuffer = await ctx.stub.getState(prescriptionId);
        if (!prescriptionBuffer || prescriptionBuffer.length === 0) {
            throw new Error(`Prescripción con ID ${prescriptionId} no encontrada`);
        }
        
        const prescription = JSON.parse(prescriptionBuffer.toString());
        
        // Verificar que la prescripción no haya sido dispensada
        if (prescription.dispensed) {
            throw new Error('La prescripción ya ha sido dispensada');
        }
        
        // Verificar que la prescripción no haya expirado
        if (prescription.expiryDate) {
            const now = new Date();
            const expiryDate = new Date(prescription.expiryDate);
            
            if (now > expiryDate) {
                throw new Error('La prescripción ha expirado');
            }
        }
        
        // Marcar prescripción como dispensada
        const now = new Date();
        prescription.dispensed = true;
        prescription.dispensedAt = now.toISOString();
        prescription.dispensedBy = pharmacistId;
        prescription.updatedAt = now.toISOString();
        prescription.updatedBy = caller;
        
        if (notes) {
            prescription.dispensingNotes = notes;
        }
        
        // Guardar prescripción actualizada
        await ctx.stub.putState(prescriptionId, Buffer.from(JSON.stringify(prescription)));
        
        // Emitir evento de prescripción dispensada
        const prescriptionEvent = {
            type: 'dispense',
            prescriptionId: prescriptionId,
            patientId: prescription.patientId,
            pharmacistId: pharmacistId,
            dispensedBy: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('PrescriptionDispensed', Buffer.from(JSON.stringify(prescriptionEvent)));
        
        return prescription;
    }
    
    /**
     * Obtiene la información de un paciente
     * @param {Context} ctx - Contexto de transacción
     * @param {String} patientId - ID del paciente
     * @returns {Object} - Información del paciente
     */
    async getPatient(ctx, patientId) {
        // Validar parámetros
        if (!patientId) {
            throw new Error('Parámetros inválidos: se requiere ID del paciente');
        }
        
        // Obtener paciente
        const patientBuffer = await ctx.stub.getState(`patient_${patientId}`);
        if (!patientBuffer || patientBuffer.length === 0) {
            throw new Error(`Paciente con ID ${patientId} no encontrado`);
        }
        
        return JSON.parse(patientBuffer.toString());
    }
    
    /**
     * Obtiene un registro médico
     * @param {Context} ctx - Contexto de transacción
     * @param {String} recordId - ID del registro médico
     * @returns {Object} - Información del registro médico
     */
    async getMedicalRecord(ctx, recordId) {
        // Validar parámetros
        if (!recordId) {
            throw new Error('Parámetros inválidos: se requiere ID del registro médico');
        }
        
        // Obtener registro médico
        const recordBuffer = await ctx.stub.getState(recordId);
        if (!recordBuffer || recordBuffer.length === 0) {
            throw new Error(`Registro médico con ID ${recordId} no encontrado`);
        }
        
        return JSON.parse(recordBuffer.toString());
    }
    
    /**
     * Obtiene una cita médica
     * @param {Context} ctx - Contexto de transacción
     * @param {String} appointmentId - ID de la cita
     * @returns {Object} - Información de la cita
     */
    async getAppointment(ctx, appointmentId) {
        // Validar parámetros
        if (!appointmentId) {
            throw new Error('Parámetros inválidos: se requiere ID de la cita');
        }
        
        // Obtener cita
        const appointmentBuffer = await ctx.stub.getState(appointmentId);
        if (!appointmentBuffer || appointmentBuffer.length === 0) {
            throw new Error(`Cita con ID ${appointmentId} no encontrada`);
        }
        
        return JSON.parse(appointmentBuffer.toString());
    }
    
    /**
     * Obtiene una prescripción médica
     * @param {Context} ctx - Contexto de transacción
     * @param {String} prescriptionId - ID de la prescripción
     * @returns {Object} - Información de la prescripción
     */
    async getPrescription(ctx, prescriptionId) {
        // Validar parámetros
        if (!prescriptionId) {
            throw new Error('Parámetros inválidos: se requiere ID de la prescripción');
        }
        
        // Obtener prescripción
        const prescriptionBuffer = await ctx.stub.getState(prescriptionId);
        if (!prescriptionBuffer || prescriptionBuffer.length === 0) {
            throw new Error(`Prescripción con ID ${prescriptionId} no encontrada`);
        }
        
        return JSON.parse(prescriptionBuffer.toString());
    }
    
    /**
     * Obtiene todas las citas de un paciente
     * @param {Context} ctx - Contexto de transacción
     * @param {String} patientId - ID del paciente
     * @returns {Array} - Lista de citas del paciente
     */
    async getPatientAppointments(ctx, patientId) {
        // Validar parámetros
        if (!patientId) {
            throw new Error('Parámetros inválidos: se requiere ID del paciente');
        }
        
        // Obtener paciente
        const patientBuffer = await ctx.stub.getState(`patient_${patientId}`);
        if (!patientBuffer || patientBuffer.length === 0) {
            throw new Error(`Paciente con ID ${patientId} no encontrado`);
        }
        
        const patient = JSON.parse(patientBuffer.toString());
        
        // Obtener citas
        const appointments = [];
        for (const appointmentId of patient.appointments) {
            const appointmentBuffer = await ctx.stub.getState(appointmentId);
            if (appointmentBuffer && appointmentBuffer.length > 0) {
                appointments.push(JSON.parse(appointmentBuffer.toString()));
            }
        }
        
        return appointments;
    }
    
    /**
     * Obtiene todas las prescripciones de un paciente
     * @param {Context} ctx - Contexto de transacción
     * @param {String} patientId - ID del paciente
     * @returns {Array} - Lista de prescripciones del paciente
     */
    async getPatientPrescriptions(ctx, patientId) {
        // Validar parámetros
        if (!patientId) {
            throw new Error('Parámetros inválidos: se requiere ID del paciente');
        }
        
        // Obtener paciente
        const patientBuffer = await ctx.stub.getState(`patient_${patientId}`);
        if (!patientBuffer || patientBuffer.length === 0) {
            throw new Error(`Paciente con ID ${patientId} no encontrado`);
        }
        
        const patient = JSON.parse(patientBuffer.toString());
        
        // Obtener prescripciones
        const prescriptions = [];
        for (const prescriptionId of patient.prescriptions) {
            const prescriptionBuffer = await ctx.stub.getState(prescriptionId);
            if (prescriptionBuffer && prescriptionBuffer.length > 0) {
                prescriptions.push(JSON.parse(prescriptionBuffer.toString()));
            }
        }
        
        return prescriptions;
    }
}

module.exports = TelemedicinContract;
