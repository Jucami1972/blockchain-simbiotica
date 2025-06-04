import { Test, TestingModule } from '@nestjs/testing';
import { TelemedicinService } from './telemedicin.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../logger/logger.service';

describe('TelemedicinService', () => {
  let service: TelemedicinService;
  let blockchainService: BlockchainService;

  const mockBlockchainService = {
    isConnected: jest.fn(),
    submitTransaction: jest.fn(),
    evaluateTransaction: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemedicinService,
        {
          provide: BlockchainService,
          useValue: mockBlockchainService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<TelemedicinService>(TelemedicinService);
    blockchainService = module.get<BlockchainService>(BlockchainService);

    // Restablecer los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerPatient', () => {
    it('should register a patient successfully', async () => {
      // Arrange
      const patientId = 'patient123';
      const patientData = JSON.stringify({
        nombre: 'Juan Pérez',
        edad: 35,
        genero: 'masculino',
        grupoSanguineo: 'O+',
        alergias: ['penicilina']
      });
      const expectedPatient = {
        id: patientId,
        data: JSON.parse(patientData),
        status: 'active',
        registeredAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        consentGiven: false,
        consentHistory: [],
        medicalRecords: [],
        appointments: [],
        prescriptions: []
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedPatient)));

      // Act
      const result = await service.registerPatient(patientId, patientData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'telemedicina',
        'registerPatient',
        patientId,
        patientData
      );
      expect(result).toEqual(expectedPatient);
      expect(mockLogger.log).toHaveBeenCalledTimes(2);
    });

    it('should throw error when blockchain is not connected', async () => {
      // Arrange
      const patientId = 'patient123';
      const patientData = JSON.stringify({
        nombre: 'Juan Pérez',
        edad: 35
      });
      mockBlockchainService.isConnected.mockReturnValue(false);

      // Act & Assert
      await expect(service.registerPatient(patientId, patientData)).rejects.toThrow('No hay conexión con la blockchain');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle blockchain errors properly', async () => {
      // Arrange
      const patientId = 'patient123';
      const patientData = JSON.stringify({
        nombre: 'Juan Pérez',
        edad: 35
      });
      const errorMessage = 'El paciente ya existe';
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.registerPatient(patientId, patientData)).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('registerDoctor', () => {
    it('should register a doctor successfully', async () => {
      // Arrange
      const doctorId = 'doctor123';
      const doctorData = JSON.stringify({
        nombre: 'Dra. María López',
        especialidad: 'Cardiología',
        licencia: 'MED12345',
        hospital: 'Hospital Central'
      });
      const expectedDoctor = {
        id: doctorId,
        data: JSON.parse(doctorData),
        status: 'active',
        registeredAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        patients: [],
        appointments: []
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedDoctor)));

      // Act
      const result = await service.registerDoctor(doctorId, doctorData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'telemedicina',
        'registerDoctor',
        doctorId,
        doctorData
      );
      expect(result).toEqual(expectedDoctor);
    });
  });

  describe('scheduleAppointment', () => {
    it('should schedule an appointment successfully', async () => {
      // Arrange
      const appointmentId = 'appointment123';
      const patientId = 'patient123';
      const doctorId = 'doctor123';
      const appointmentData = JSON.stringify({
        fecha: '2023-02-15T10:00:00Z',
        duracion: 30,
        tipo: 'consulta',
        motivo: 'Revisión cardíaca'
      });
      const expectedAppointment = {
        id: appointmentId,
        patientId,
        doctorId,
        data: JSON.parse(appointmentData),
        status: 'scheduled',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedAppointment)));

      // Act
      const result = await service.scheduleAppointment(appointmentId, patientId, doctorId, appointmentData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'telemedicina',
        'scheduleAppointment',
        appointmentId,
        patientId,
        doctorId,
        appointmentData
      );
      expect(result).toEqual(expectedAppointment);
    });
  });

  describe('updateAppointmentStatus', () => {
    it('should update appointment status successfully', async () => {
      // Arrange
      const appointmentId = 'appointment123';
      const status = 'completed';
      const updateData = JSON.stringify({
        notas: 'Paciente atendido con éxito',
        duracionReal: 25
      });
      const expectedAppointment = {
        id: appointmentId,
        patientId: 'patient123',
        doctorId: 'doctor123',
        status: status,
        updatedAt: '2023-02-15T10:30:00Z',
        updateData: JSON.parse(updateData)
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedAppointment)));

      // Act
      const result = await service.updateAppointmentStatus(appointmentId, status, updateData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'telemedicina',
        'updateAppointmentStatus',
        appointmentId,
        status,
        updateData
      );
      expect(result).toEqual(expectedAppointment);
    });
  });

  describe('recordDiagnosis', () => {
    it('should record diagnosis successfully', async () => {
      // Arrange
      const diagnosisId = 'diagnosis123';
      const appointmentId = 'appointment123';
      const doctorId = 'doctor123';
      const diagnosisData = JSON.stringify({
        condicion: 'Hipertensión arterial',
        descripcion: 'Presión arterial elevada consistentemente',
        codigoICD: 'I10',
        severidad: 'moderada'
      });
      const expectedDiagnosis = {
        id: diagnosisId,
        appointmentId,
        doctorId,
        data: JSON.parse(diagnosisData),
        createdAt: '2023-02-15T10:30:00Z'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedDiagnosis)));

      // Act
      const result = await service.recordDiagnosis(diagnosisId, appointmentId, doctorId, diagnosisData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'telemedicina',
        'recordDiagnosis',
        diagnosisId,
        appointmentId,
        doctorId,
        diagnosisData
      );
      expect(result).toEqual(expectedDiagnosis);
    });
  });

  describe('recordTreatment', () => {
    it('should record treatment successfully', async () => {
      // Arrange
      const treatmentId = 'treatment123';
      const diagnosisId = 'diagnosis123';
      const doctorId = 'doctor123';
      const treatmentData = JSON.stringify({
        tipo: 'medicamento',
        medicamentos: [
          {
            nombre: 'Enalapril',
            dosis: '10mg',
            frecuencia: 'cada 12 horas',
            duracion: '30 días'
          }
        ],
        recomendaciones: 'Dieta baja en sodio, ejercicio moderado'
      });
      const expectedTreatment = {
        id: treatmentId,
        diagnosisId,
        doctorId,
        data: JSON.parse(treatmentData),
        createdAt: '2023-02-15T10:35:00Z'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedTreatment)));

      // Act
      const result = await service.recordTreatment(treatmentId, diagnosisId, doctorId, treatmentData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'telemedicina',
        'recordTreatment',
        treatmentId,
        diagnosisId,
        doctorId,
        treatmentData
      );
      expect(result).toEqual(expectedTreatment);
    });
  });

  describe('recordTestResult', () => {
    it('should record test result successfully', async () => {
      // Arrange
      const testResultId = 'test123';
      const patientId = 'patient123';
      const doctorId = 'doctor123';
      const testResultData = JSON.stringify({
        tipo: 'análisis de sangre',
        fecha: '2023-02-14T09:00:00Z',
        resultados: {
          hemoglobina: '14.5 g/dL',
          glucosa: '95 mg/dL',
          colesterol: '180 mg/dL'
        },
        observaciones: 'Valores dentro de rangos normales'
      });
      const expectedTestResult = {
        id: testResultId,
        patientId,
        doctorId,
        data: JSON.parse(testResultData),
        createdAt: '2023-02-15T11:00:00Z'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedTestResult)));

      // Act
      const result = await service.recordTestResult(testResultId, patientId, doctorId, testResultData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'telemedicina',
        'recordTestResult',
        testResultId,
        patientId,
        doctorId,
        testResultData
      );
      expect(result).toEqual(expectedTestResult);
    });
  });

  describe('recordPrescription', () => {
    it('should record prescription successfully', async () => {
      // Arrange
      const prescriptionId = 'prescription123';
      const patientId = 'patient123';
      const doctorId = 'doctor123';
      const prescriptionData = JSON.stringify({
        fecha: '2023-02-15T10:40:00Z',
        medicamentos: [
          {
            nombre: 'Enalapril',
            dosis: '10mg',
            frecuencia: 'cada 12 horas',
            duracion: '30 días',
            cantidad: 60
          }
        ],
        instrucciones: 'Tomar con alimentos',
        renovable: true,
        renovaciones: 2
      });
      const expectedPrescription = {
        id: prescriptionId,
        patientId,
        doctorId,
        data: JSON.parse(prescriptionData),
        createdAt: '2023-02-15T10:40:00Z',
        status: 'active'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.submitTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedPrescription)));

      // Act
      const result = await service.recordPrescription(prescriptionId, patientId, doctorId, prescriptionData);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.submitTransaction).toHaveBeenCalledWith(
        'telemedicina',
        'recordPrescription',
        prescriptionId,
        patientId,
        doctorId,
        prescriptionData
      );
      expect(result).toEqual(expectedPrescription);
    });
  });

  describe('getPatient', () => {
    it('should return patient information', async () => {
      // Arrange
      const patientId = 'patient123';
      const expectedPatient = {
        id: patientId,
        data: {
          nombre: 'Juan Pérez',
          edad: 35,
          genero: 'masculino',
          grupoSanguineo: 'O+',
          alergias: ['penicilina']
        },
        status: 'active',
        registeredAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-02-15T10:40:00Z',
        consentGiven: true,
        medicalRecords: ['record1', 'record2'],
        appointments: ['appointment123'],
        prescriptions: ['prescription123']
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedPatient)));

      // Act
      const result = await service.getPatient(patientId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'telemedicina',
        'getPatient',
        patientId
      );
      expect(result).toEqual(expectedPatient);
    });
  });

  describe('getDoctor', () => {
    it('should return doctor information', async () => {
      // Arrange
      const doctorId = 'doctor123';
      const expectedDoctor = {
        id: doctorId,
        data: {
          nombre: 'Dra. María López',
          especialidad: 'Cardiología',
          licencia: 'MED12345',
          hospital: 'Hospital Central'
        },
        status: 'active',
        registeredAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-02-15T10:40:00Z',
        patients: ['patient123', 'patient456'],
        appointments: ['appointment123', 'appointment456']
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedDoctor)));

      // Act
      const result = await service.getDoctor(doctorId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'telemedicina',
        'getDoctor',
        doctorId
      );
      expect(result).toEqual(expectedDoctor);
    });
  });

  describe('getAppointment', () => {
    it('should return appointment information', async () => {
      // Arrange
      const appointmentId = 'appointment123';
      const expectedAppointment = {
        id: appointmentId,
        patientId: 'patient123',
        doctorId: 'doctor123',
        data: {
          fecha: '2023-02-15T10:00:00Z',
          duracion: 30,
          tipo: 'consulta',
          motivo: 'Revisión cardíaca'
        },
        status: 'completed',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-02-15T10:30:00Z'
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedAppointment)));

      // Act
      const result = await service.getAppointment(appointmentId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'telemedicina',
        'getAppointment',
        appointmentId
      );
      expect(result).toEqual(expectedAppointment);
    });
  });

  describe('getPatientHistory', () => {
    it('should return patient medical history', async () => {
      // Arrange
      const patientId = 'patient123';
      const expectedHistory = {
        patient: {
          id: patientId,
          nombre: 'Juan Pérez'
        },
        appointments: [
          {
            id: 'appointment123',
            fecha: '2023-02-15T10:00:00Z',
            doctor: 'Dra. María López',
            status: 'completed'
          }
        ],
        diagnoses: [
          {
            id: 'diagnosis123',
            condicion: 'Hipertensión arterial',
            fecha: '2023-02-15T10:30:00Z',
            doctor: 'Dra. María López'
          }
        ],
        treatments: [
          {
            id: 'treatment123',
            tipo: 'medicamento',
            medicamentos: ['Enalapril 10mg'],
            fecha: '2023-02-15T10:35:00Z'
          }
        ],
        testResults: [
          {
            id: 'test123',
            tipo: 'análisis de sangre',
            fecha: '2023-02-14T09:00:00Z'
          }
        ],
        prescriptions: [
          {
            id: 'prescription123',
            medicamentos: ['Enalapril 10mg'],
            fecha: '2023-02-15T10:40:00Z',
            status: 'active'
          }
        ]
      };
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedHistory)));

      // Act
      const result = await service.getPatientHistory(patientId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'telemedicina',
        'getPatientHistory',
        patientId
      );
      expect(result).toEqual(expectedHistory);
    });
  });

  describe('getDoctorAppointments', () => {
    it('should return doctor appointments', async () => {
      // Arrange
      const doctorId = 'doctor123';
      const expectedAppointments = [
        {
          id: 'appointment123',
          patientId: 'patient123',
          patientName: 'Juan Pérez',
          fecha: '2023-02-15T10:00:00Z',
          duracion: 30,
          tipo: 'consulta',
          motivo: 'Revisión cardíaca',
          status: 'completed'
        },
        {
          id: 'appointment456',
          patientId: 'patient456',
          patientName: 'Ana Gómez',
          fecha: '2023-02-16T11:00:00Z',
          duracion: 30,
          tipo: 'consulta',
          motivo: 'Primera visita',
          status: 'scheduled'
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedAppointments)));

      // Act
      const result = await service.getDoctorAppointments(doctorId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'telemedicina',
        'getDoctorAppointments',
        doctorId
      );
      expect(result).toEqual(expectedAppointments);
    });
  });

  describe('getPatientAppointments', () => {
    it('should return patient appointments', async () => {
      // Arrange
      const patientId = 'patient123';
      const expectedAppointments = [
        {
          id: 'appointment123',
          doctorId: 'doctor123',
          doctorName: 'Dra. María López',
          especialidad: 'Cardiología',
          fecha: '2023-02-15T10:00:00Z',
          duracion: 30,
          tipo: 'consulta',
          motivo: 'Revisión cardíaca',
          status: 'completed'
        },
        {
          id: 'appointment789',
          doctorId: 'doctor456',
          doctorName: 'Dr. Carlos Ruiz',
          especialidad: 'Neurología',
          fecha: '2023-03-01T09:00:00Z',
          duracion: 45,
          tipo: 'consulta',
          motivo: 'Dolor de cabeza',
          status: 'scheduled'
        }
      ];
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.evaluateTransaction.mockResolvedValue(Buffer.from(JSON.stringify(expectedAppointments)));

      // Act
      const result = await service.getPatientAppointments(patientId);

      // Assert
      expect(mockBlockchainService.isConnected).toHaveBeenCalled();
      expect(mockBlockchainService.evaluateTransaction).toHaveBeenCalledWith(
        'telemedicina',
        'getPatientAppointments',
        patientId
      );
      expect(result).toEqual(expectedAppointments);
    });
  });
});
