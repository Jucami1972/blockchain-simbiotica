import { Body, Controller, Get, Post, Param, UseGuards, Query } from '@nestjs/common';
import { TelemedicinService } from './telemedicin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('telemedicina')
@Controller('telemedicina')
export class TelemedicinController {
  constructor(private readonly telemedicinService: TelemedicinService) {}

  @Post('patients')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar un nuevo paciente' })
  @ApiResponse({ status: 201, description: 'Paciente registrado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async registerPatient(@Body() body: { patientId: string; patientData: string }) {
    return this.telemedicinService.registerPatient(body.patientId, body.patientData);
  }

  @Post('doctors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar un nuevo médico' })
  @ApiResponse({ status: 201, description: 'Médico registrado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async registerDoctor(@Body() body: { doctorId: string; doctorData: string }) {
    return this.telemedicinService.registerDoctor(body.doctorId, body.doctorData);
  }

  @Post('appointments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Programar una consulta médica' })
  @ApiResponse({ status: 201, description: 'Consulta programada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async scheduleAppointment(
    @Body() body: {
      appointmentId: string;
      patientId: string;
      doctorId: string;
      appointmentData: string;
    },
  ) {
    return this.telemedicinService.scheduleAppointment(
      body.appointmentId,
      body.patientId,
      body.doctorId,
      body.appointmentData,
    );
  }

  @Post('appointments/:appointmentId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar el estado de una consulta médica' })
  @ApiResponse({ status: 200, description: 'Estado de consulta actualizado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async updateAppointmentStatus(
    @Param('appointmentId') appointmentId: string,
    @Body() body: { status: string; updateData: string },
  ) {
    return this.telemedicinService.updateAppointmentStatus(
      appointmentId,
      body.status,
      body.updateData,
    );
  }

  @Post('diagnoses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar un diagnóstico médico' })
  @ApiResponse({ status: 201, description: 'Diagnóstico registrado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async recordDiagnosis(
    @Body() body: {
      diagnosisId: string;
      appointmentId: string;
      doctorId: string;
      diagnosisData: string;
    },
  ) {
    return this.telemedicinService.recordDiagnosis(
      body.diagnosisId,
      body.appointmentId,
      body.doctorId,
      body.diagnosisData,
    );
  }

  @Post('treatments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar un tratamiento médico' })
  @ApiResponse({ status: 201, description: 'Tratamiento registrado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async recordTreatment(
    @Body() body: {
      treatmentId: string;
      diagnosisId: string;
      doctorId: string;
      treatmentData: string;
    },
  ) {
    return this.telemedicinService.recordTreatment(
      body.treatmentId,
      body.diagnosisId,
      body.doctorId,
      body.treatmentData,
    );
  }

  @Post('test-results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'lab')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar un resultado de prueba médica' })
  @ApiResponse({ status: 201, description: 'Resultado de prueba registrado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async recordTestResult(
    @Body() body: {
      testResultId: string;
      patientId: string;
      doctorId: string;
      testResultData: string;
    },
  ) {
    return this.telemedicinService.recordTestResult(
      body.testResultId,
      body.patientId,
      body.doctorId,
      body.testResultData,
    );
  }

  @Post('prescriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar una prescripción médica' })
  @ApiResponse({ status: 201, description: 'Prescripción registrada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async recordPrescription(
    @Body() body: {
      prescriptionId: string;
      patientId: string;
      doctorId: string;
      prescriptionData: string;
    },
  ) {
    return this.telemedicinService.recordPrescription(
      body.prescriptionId,
      body.patientId,
      body.doctorId,
      body.prescriptionData,
    );
  }

  @Get('patients/:patientId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información de un paciente' })
  @ApiResponse({ status: 200, description: 'Información del paciente obtenida correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getPatient(@Param('patientId') patientId: string) {
    return this.telemedicinService.getPatient(patientId);
  }

  @Get('doctors/:doctorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información de un médico' })
  @ApiResponse({ status: 200, description: 'Información del médico obtenida correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getDoctor(@Param('doctorId') doctorId: string) {
    return this.telemedicinService.getDoctor(doctorId);
  }

  @Get('appointments/:appointmentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información de una consulta médica' })
  @ApiResponse({ status: 200, description: 'Información de la consulta obtenida correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getAppointment(@Param('appointmentId') appointmentId: string) {
    return this.telemedicinService.getAppointment(appointmentId);
  }

  @Get('patients/:patientId/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener historial médico de un paciente' })
  @ApiResponse({ status: 200, description: 'Historial médico obtenido correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getPatientHistory(@Param('patientId') patientId: string) {
    return this.telemedicinService.getPatientHistory(patientId);
  }

  @Get('doctors/:doctorId/appointments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener consultas programadas para un médico' })
  @ApiResponse({ status: 200, description: 'Consultas obtenidas correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getDoctorAppointments(@Param('doctorId') doctorId: string) {
    return this.telemedicinService.getDoctorAppointments(doctorId);
  }

  @Get('patients/:patientId/appointments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener consultas programadas para un paciente' })
  @ApiResponse({ status: 200, description: 'Consultas obtenidas correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getPatientAppointments(@Param('patientId') patientId: string) {
    return this.telemedicinService.getPatientAppointments(patientId);
  }

  @Post('appointments/:appointmentId/ratings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar una valoración de consulta médica' })
  @ApiResponse({ status: 201, description: 'Valoración registrada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async rateAppointment(
    @Param('appointmentId') appointmentId: string,
    @Body() body: { patientId: string; ratingData: string },
  ) {
    return this.telemedicinService.rateAppointment(
      appointmentId,
      body.patientId,
      body.ratingData,
    );
  }

  @Put('patients/:patientId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar información de un paciente' })
  @ApiResponse({ status: 200, description: 'Información del paciente actualizada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async updatePatient(
    @Param('patientId') patientId: string,
    @Body() body: { patientData: string },
  ) {
    return this.telemedicinService.updatePatient(patientId, body.patientData);
  }

  @Put('doctors/:doctorId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar información de un médico' })
  @ApiResponse({ status: 200, description: 'Información del médico actualizada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async updateDoctor(
    @Param('doctorId') doctorId: string,
    @Body() body: { doctorData: string },
  ) {
    return this.telemedicinService.updateDoctor(doctorId, body.doctorData);
  }
}
