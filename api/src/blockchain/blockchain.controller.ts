import { Body, Controller, Get, Post, Param, UseGuards, Query } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get('network-info')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información de la red blockchain' })
  @ApiResponse({ status: 200, description: 'Información de la red obtenida correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async getNetworkInfo() {
    return this.blockchainService.getNetworkInfo();
  }

  @Post('connect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Conectar a la red blockchain' })
  @ApiResponse({ status: 200, description: 'Conexión establecida correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async connect(@Body() body: { userId: string }) {
    await this.blockchainService.connect(body.userId);
    return { message: `Conectado a la red blockchain como ${body.userId}` };
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desconectar de la red blockchain' })
  @ApiResponse({ status: 200, description: 'Desconexión realizada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async disconnect() {
    await this.blockchainService.disconnect();
    return { message: 'Desconectado de la red blockchain' };
  }

  @Post('enroll-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inscribir al administrador en la CA' })
  @ApiResponse({ status: 200, description: 'Administrador inscrito correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async enrollAdmin() {
    await this.blockchainService.enrollAdmin();
    return { message: 'Administrador inscrito correctamente' };
  }

  @Post('register-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar un nuevo usuario en la CA' })
  @ApiResponse({ status: 200, description: 'Usuario registrado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async registerUser(@Body() body: { adminId: string; userId: string; affiliation: string }) {
    await this.blockchainService.registerUser(body.adminId, body.userId, body.affiliation);
    return { message: `Usuario ${body.userId} registrado correctamente` };
  }

  @Post('submit-transaction')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ejecutar una transacción en un contrato específico' })
  @ApiResponse({ status: 200, description: 'Transacción ejecutada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async submitTransaction(
    @Body() body: { moduleName: string; functionName: string; args: string[] },
  ) {
    const result = await this.blockchainService.submitTransaction(
      body.moduleName,
      body.functionName,
      ...body.args,
    );
    
    try {
      // Intentar parsear el resultado como JSON
      return JSON.parse(result.toString());
    } catch (error) {
      // Si no es JSON, devolver como string
      return { result: result.toString() };
    }
  }

  @Get('evaluate-transaction')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Evaluar una transacción en un contrato específico (solo lectura)' })
  @ApiResponse({ status: 200, description: 'Transacción evaluada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async evaluateTransaction(
    @Query('moduleName') moduleName: string,
    @Query('functionName') functionName: string,
    @Query('args') args: string[],
  ) {
    const result = await this.blockchainService.evaluateTransaction(
      moduleName,
      functionName,
      ...(args || []),
    );
    
    try {
      // Intentar parsear el resultado como JSON
      return JSON.parse(result.toString());
    } catch (error) {
      // Si no es JSON, devolver como string
      return { result: result.toString() };
    }
  }

  @Get('is-connected')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar si el servicio está conectado a la red blockchain' })
  @ApiResponse({ status: 200, description: 'Estado de conexión obtenido correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async isConnected() {
    const connected = this.blockchainService.isConnected();
    return { connected };
  }

  @Get('contracts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los contratos inicializados' })
  @ApiResponse({ status: 200, description: 'Contratos obtenidos correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async getContracts() {
    const contracts = this.blockchainService.getContracts();
    const contractsInfo = {};
    
    for (const [moduleName, contract] of Object.entries(contracts)) {
      contractsInfo[moduleName] = {
        initialized: !!contract,
      };
    }
    
    return contractsInfo;
  }
}
