import { Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';

@Injectable()
export class TelemedicinService {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    this.logger.setContext('TelemedicinService');
  }

  /**
   * Registra un nuevo paciente en el sistema de telemedicina
   * @param patientId ID del paciente
   * @param patientData Datos del paciente en formato JSON
   * @returns Información del paciente registrado
   */
  async registerPatient(patientId: string, patientData: string): Promise<any> {
    try {
      this.logger.log(`Registrando paciente con ID: ${patientId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método registerPatient del contrato telemedicina
      const result = await this.blockchainService.submitTransaction(
        'telemedicina',
        'registerPatient',
        patientId,
        patientData
      );
      
      const patient = JSON.parse(result.toString());
      this.logger.log(`Paciente registrado: ${JSON.stringify(patient)}`);
      
      return patient;
    } catch (error) {
      this.logger.error(`Error al registrar paciente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Registra un nuevo médico en el sistema de telemedicina
   * @param doctorId ID del médico
   * @param doctorData Datos del médico en formato JSON
   * @returns Información del médico registrado
   */
  async registerDoctor(doctorId: string, doctorData: string): Promise<any> {
    try {
      this.logger.log(`Registrando médico con ID: ${doctorId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método registerDoctor del contrato telemedicina
      const result = await this.blockchainService.submitTransaction(
        'telemedicina',
        'registerDoctor',
        doctorId,
        doctorData
      );
      
      const doctor = JSON.parse(result.toString());
      this.logger.log(`Médico registrado: ${JSON.stringify(doctor)}`);
      
      return doctor;
    } catch (error) {
      this.logger.error(`Error al registrar médico: ${error.message}`);
      throw error;
    }
  }

  /**
   * Programa una consulta médica
   * @param appointmentId ID de la consulta
   * @param patientId ID del paciente
   * @param doctorId ID del médico
   * @param appointmentData Datos de la consulta en formato JSON
   * @returns Información de la consulta programada
   */
  async scheduleAppointment(
    appointmentId: string,
    patientId: string,
    doctorId: string,
    appointmentData: string
  ): Promise<any> {
    try {
      this.logger.log(`Programando consulta con ID: ${appointmentId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método scheduleAppointment del contrato telemedicina
      const result = await this.blockchainService.submitTransaction(
        'telemedicina',
        'scheduleAppointment',
        appointmentId,
        patientId,
        doctorId,
        appointmentData
      );
      
      const appointment = JSON.parse(result.toString());
      this.logger.log(`Consulta programada: ${JSON.stringify(appointment)}`);
      
      return appointment;
    } catch (error) {
      this.logger.error(`Error al programar consulta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una consulta médica
   * @param appointmentId ID de la consulta
   * @param status Nuevo estado de la consulta
   * @param updateData Datos adicionales de la actualización en formato JSON
   * @returns Información de la consulta actualizada
   */
  async updateAppointmentStatus(
    appointmentId: string,
    status: string,
    updateData: string
  ): Promise<any> {
    try {
      this.logger.log(`Actualizando estado de consulta ${appointmentId} a ${status}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método updateAppointmentStatus del contrato telemedicina
      const result = await this.blockchainService.submitTransaction(
        'telemedicina',
        'updateAppointmentStatus',
        appointmentId,
        status,
        updateData
      );
      
      const appointment = JSON.parse(result.toString());
      this.logger.log(`Estado de consulta actualizado: ${JSON.stringify(appointment)}`);
      
      return appointment;
    } catch (error) {
      this.logger.error(`Error al actualizar estado de consulta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Registra un diagnóstico médico
   * @param diagnosisId ID del diagnóstico
   * @param appointmentId ID de la consulta asociada
   * @param doctorId ID del médico
   * @param diagnosisData Datos del diagnóstico en formato JSON
   * @returns Información del diagnóstico registrado
   */
  async recordDiagnosis(
    diagnosisId: string,
    appointmentId: string,
    doctorId: string,
    diagnosisData: string
  ): Promise<any> {
    try {
      this.logger.log(`Registrando diagnóstico con ID: ${diagnosisId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método recordDiagnosis del contrato telemedicina
      const result = await this.blockchainService.submitTransaction(
        'telemedicina',
        'recordDiagnosis',
        diagnosisId,
        appointmentId,
        doctorId,
        diagnosisData
      );
      
      const diagnosis = JSON.parse(result.toString());
      this.logger.log(`Diagnóstico registrado: ${JSON.stringify(diagnosis)}`);
      
      return diagnosis;
    } catch (error) {
      this.logger.error(`Error al registrar diagnóstico: ${error.message}`);
      throw error;
    }
  }

  /**
   * Registra un tratamiento médico
   * @param treatmentId ID del tratamiento
   * @param diagnosisId ID del diagnóstico asociado
   * @param doctorId ID del médico
   * @param treatmentData Datos del tratamiento en formato JSON
   * @returns Información del tratamiento registrado
   */
  async recordTreatment(
    treatmentId: string,
    diagnosisId: string,
    doctorId: string,
    treatmentData: string
  ): Promise<any> {
    try {
      this.logger.log(`Registrando tratamiento con ID: ${treatmentId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método recordTreatment del contrato telemedicina
      const result = await this.blockchainService.submitTransaction(
        'telemedicina',
        'recordTreatment',
        treatmentId,
        diagnosisId,
        doctorId,
        treatmentData
      );
      
      const treatment = JSON.parse(result.toString());
      this.logger.log(`Tratamiento registrado: ${JSON.stringify(treatment)}`);
      
      return treatment;
    } catch (error) {
      this.logger.error(`Error al registrar tratamiento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Registra un resultado de prueba médica
   * @param testResultId ID del resultado de prueba
   * @param patientId ID del paciente
   * @param doctorId ID del médico
   * @param testResultData Datos del resultado de prueba en formato JSON
   * @returns Información del resultado de prueba registrado
   */
  async recordTestResult(
    testResultId: string,
    patientId: string,
    doctorId: string,
    testResultData: string
  ): Promise<any> {
    try {
      this.logger.log(`Registrando resultado de prueba con ID: ${testResultId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método recordTestResult del contrato telemedicina
      const result = await this.blockchainService.submitTransaction(
        'telemedicina',
        'recordTestResult',
        testResultId,
        patientId,
        doctorId,
        testResultData
      );
      
      const testResult = JSON.parse(result.toString());
      this.logger.log(`Resultado de prueba registrado: ${JSON.stringify(testResult)}`);
      
      return testResult;
    } catch (error) {
      this.logger.error(`Error al registrar resultado de prueba: ${error.message}`);
      throw error;
    }
  }

  /**
   * Registra una prescripción médica
   * @param prescriptionId ID de la prescripción
   * @param patientId ID del paciente
   * @param doctorId ID del médico
   * @param prescriptionData Datos de la prescripción en formato JSON
   * @returns Información de la prescripción registrada
   */
  async recordPrescription(
    prescriptionId: string,
    patientId: string,
    doctorId: string,
    prescriptionData: string
  ): Promise<any> {
    try {
      this.logger.log(`Registrando prescripción con ID: ${prescriptionId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método recordPrescription del contrato telemedicina
      const result = await this.blockchainService.submitTransaction(
        'telemedicina',
        'recordPrescription',
        prescriptionId,
        patientId,
        doctorId,
        prescriptionData
      );
      
      const prescription = JSON.parse(result.toString());
      this.logger.log(`Prescripción registrada: ${JSON.stringify(prescription)}`);
      
      return prescription;
    } catch (error) {
      this.logger.error(`Error al registrar prescripción: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene información de un paciente
   * @param patientId ID del paciente
   * @returns Información del paciente
   */
  async getPatient(patientId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo información del paciente con ID: ${patientId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getPatient del contrato telemedicina
      const result = await this.blockchainService.evaluateTransaction(
        'telemedicina',
        'getPatient',
        patientId
      );
      
      const patient = JSON.parse(result.toString());
      this.logger.log(`Información del paciente obtenida: ${JSON.stringify(patient)}`);
      
      return patient;
    } catch (error) {
      this.logger.error(`Error al obtener información del paciente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene información de un médico
   * @param doctorId ID del médico
   * @returns Información del médico
   */
  async getDoctor(doctorId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo información del médico con ID: ${doctorId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getDoctor del contrato telemedicina
      const result = await this.blockchainService.evaluateTransaction(
        'telemedicina',
        'getDoctor',
        doctorId
      );
      
      const doctor = JSON.parse(result.toString());
      this.logger.log(`Información del médico obtenida: ${JSON.stringify(doctor)}`);
      
      return doctor;
    } catch (error) {
      this.logger.error(`Error al obtener información del médico: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene información de una consulta médica
   * @param appointmentId ID de la consulta
   * @returns Información de la consulta
   */
  async getAppointment(appointmentId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo información de la consulta con ID: ${appointmentId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getAppointment del contrato telemedicina
      const result = await this.blockchainService.evaluateTransaction(
        'telemedicina',
        'getAppointment',
        appointmentId
      );
      
      const appointment = JSON.parse(result.toString());
      this.logger.log(`Información de la consulta obtenida: ${JSON.stringify(appointment)}`);
      
      return appointment;
    } catch (error) {
      this.logger.error(`Error al obtener información de la consulta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene el historial médico de un paciente
   * @param patientId ID del paciente
   * @returns Historial médico del paciente
   */
  async getPatientHistory(patientId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo historial médico del paciente con ID: ${patientId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getPatientHistory del contrato telemedicina
      const result = await this.blockchainService.evaluateTransaction(
        'telemedicina',
        'getPatientHistory',
        patientId
      );
      
      const history = JSON.parse(result.toString());
      this.logger.log(`Historial médico obtenido para el paciente ${patientId}: ${history.length} registros`);
      
      return history;
    } catch (error) {
      this.logger.error(`Error al obtener historial médico del paciente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene las consultas programadas para un médico
   * @param doctorId ID del médico
   * @returns Lista de consultas programadas
   */
  async getDoctorAppointments(doctorId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo consultas programadas para el médico con ID: ${doctorId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getDoctorAppointments del contrato telemedicina
      const result = await this.blockchainService.evaluateTransaction(
        'telemedicina',
        'getDoctorAppointments',
        doctorId
      );
      
      const appointments = JSON.parse(result.toString());
      this.logger.log(`Consultas obtenidas para el médico ${doctorId}: ${appointments.length} consultas`);
      
      return appointments;
    } catch (error) {
      this.logger.error(`Error al obtener consultas del médico: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene las consultas programadas para un paciente
   * @param patientId ID del paciente
   * @returns Lista de consultas programadas
   */
  async getPatientAppointments(patientId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo consultas programadas para el paciente con ID: ${patientId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método getPatientAppointments del contrato telemedicina
      const result = await this.blockchainService.evaluateTransaction(
        'telemedicina',
        'getPatientAppointments',
        patientId
      );
      
      const appointments = JSON.parse(result.toString());
      this.logger.log(`Consultas obtenidas para el paciente ${patientId}: ${appointments.length} consultas`);
      
      return appointments;
    } catch (error) {
      this.logger.error(`Error al obtener consultas del paciente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Registra una valoración de consulta médica
   * @param appointmentId ID de la consulta
   * @param patientId ID del paciente
   * @param ratingData Datos de la valoración en formato JSON
   * @returns Información de la valoración registrada
   */
  async rateAppointment(
    appointmentId: string,
    patientId: string,
    ratingData: string
  ): Promise<any> {
    try {
      this.logger.log(`Registrando valoración para la consulta con ID: ${appointmentId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método rateAppointment del contrato telemedicina
      const result = await this.blockchainService.submitTransaction(
        'telemedicina',
        'rateAppointment',
        appointmentId,
        patientId,
        ratingData
      );
      
      const rating = JSON.parse(result.toString());
      this.logger.log(`Valoración registrada: ${JSON.stringify(rating)}`);
      
      return rating;
    } catch (error) {
      this.logger.error(`Error al registrar valoración: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza la información de un paciente
   * @param patientId ID del paciente
   * @param patientData Nuevos datos del paciente en formato JSON
   * @returns Información actualizada del paciente
   */
  async updatePatient(patientId: string, patientData: string): Promise<any> {
    try {
      this.logger.log(`Actualizando información del paciente con ID: ${patientId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método updatePatient del contrato telemedicina
      const result = await this.blockchainService.submitTransaction(
        'telemedicina',
        'updatePatient',
        patientId,
        patientData
      );
      
      const patient = JSON.parse(result.toString());
      this.logger.log(`Información del paciente actualizada: ${JSON.stringify(patient)}`);
      
      return patient;
    } catch (error) {
      this.logger.error(`Error al actualizar información del paciente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza la información de un médico
   * @param doctorId ID del médico
   * @param doctorData Nuevos datos del médico en formato JSON
   * @returns Información actualizada del médico
   */
  async updateDoctor(doctorId: string, doctorData: string): Promise<any> {
    try {
      this.logger.log(`Actualizando información del médico con ID: ${doctorId}`);
      
      // Verificar que el servicio blockchain esté conectado
      if (!this.blockchainService.isConnected()) {
        throw new Error('No hay conexión con la blockchain');
      }
      
      // Llamar al método updateDoctor del contrato telemedicina
      const result = await this.blockchainService.submitTransaction(
        'telemedicina',
        'updateDoctor',
        doctorId,
        doctorData
      );
      
      const doctor = JSON.parse(result.toString());
      this.logger.log(`Información del médico actualizada: ${JSON.stringify(doctor)}`);
      
      return doctor;
    } catch (error) {
      this.logger.error(`Error al actualizar información del médico: ${error.message}`);
      throw error;
    }
  }
}
