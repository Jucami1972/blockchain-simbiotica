import { Body, Controller, Get, Post, Put, Param, UseGuards, Query } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('identity')
@Controller('identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar una nueva identidad' })
  @ApiResponse({ status: 201, description: 'Identidad registrada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async registerIdentity(@Body() body: { identityId: string; ownerDid: string; identityData: string }) {
    return this.identityService.registerIdentity(body.identityId, body.ownerDid, body.identityData);
  }

  @Get(':identityId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información de una identidad' })
  @ApiResponse({ status: 200, description: 'Información de la identidad obtenida correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getIdentity(@Param('identityId') identityId: string) {
    return this.identityService.getIdentity(identityId);
  }

  @Put(':identityId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una identidad existente' })
  @ApiResponse({ status: 200, description: 'Identidad actualizada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async updateIdentity(
    @Param('identityId') identityId: string,
    @Body() body: { ownerDid: string; identityData: string },
  ) {
    return this.identityService.updateIdentity(identityId, body.ownerDid, body.identityData);
  }

  @Post(':identityId/revoke')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revocar una identidad' })
  @ApiResponse({ status: 200, description: 'Identidad revocada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async revokeIdentity(
    @Param('identityId') identityId: string,
    @Body() body: { ownerDid: string; reason: string },
  ) {
    return this.identityService.revokeIdentity(identityId, body.ownerDid, body.reason);
  }

  @Post(':identityId/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar una identidad' })
  @ApiResponse({ status: 200, description: 'Identidad verificada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async verifyIdentity(
    @Param('identityId') identityId: string,
    @Body() body: { verifierDid: string; verificationData: string },
  ) {
    return this.identityService.verifyIdentity(identityId, body.verifierDid, body.verificationData);
  }

  @Get(':identityId/verification-history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener historial de verificaciones de una identidad' })
  @ApiResponse({ status: 200, description: 'Historial de verificaciones obtenido correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getVerificationHistory(@Param('identityId') identityId: string) {
    return this.identityService.getVerificationHistory(identityId);
  }

  @Post(':identityId/credentials')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Añadir una credencial a una identidad' })
  @ApiResponse({ status: 201, description: 'Credencial añadida correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async addCredential(
    @Param('identityId') identityId: string,
    @Body() body: { credentialId: string; issuerDid: string; credentialData: string },
  ) {
    return this.identityService.addCredential(
      identityId,
      body.credentialId,
      body.issuerDid,
      body.credentialData,
    );
  }

  @Post(':identityId/credentials/:credentialId/revoke')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revocar una credencial' })
  @ApiResponse({ status: 200, description: 'Credencial revocada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async revokeCredential(
    @Param('identityId') identityId: string,
    @Param('credentialId') credentialId: string,
    @Body() body: { issuerDid: string; reason: string },
  ) {
    return this.identityService.revokeCredential(
      identityId,
      credentialId,
      body.issuerDid,
      body.reason,
    );
  }

  @Get(':identityId/credentials/:credentialId/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar una credencial' })
  @ApiResponse({ status: 200, description: 'Credencial verificada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async verifyCredential(
    @Param('identityId') identityId: string,
    @Param('credentialId') credentialId: string,
    @Query('verifierDid') verifierDid: string,
  ) {
    return this.identityService.verifyCredential(identityId, credentialId, verifierDid);
  }

  @Get(':identityId/credentials')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las credenciales de una identidad' })
  @ApiResponse({ status: 200, description: 'Credenciales obtenidas correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getCredentials(@Param('identityId') identityId: string) {
    return this.identityService.getCredentials(identityId);
  }

  @Post('verification-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una solicitud de verificación' })
  @ApiResponse({ status: 201, description: 'Solicitud de verificación creada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async createVerificationRequest(
    @Body() body: {
      requestId: string;
      identityId: string;
      verifierDid: string;
      requestData: string;
    },
  ) {
    return this.identityService.createVerificationRequest(
      body.requestId,
      body.identityId,
      body.verifierDid,
      body.requestData,
    );
  }

  @Post('verification-requests/:requestId/respond')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Responder a una solicitud de verificación' })
  @ApiResponse({ status: 200, description: 'Respuesta enviada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async respondToVerificationRequest(
    @Param('requestId') requestId: string,
    @Body() body: { identityId: string; responseData: string },
  ) {
    return this.identityService.respondToVerificationRequest(
      requestId,
      body.identityId,
      body.responseData,
    );
  }

  @Get(':identityId/verification-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las solicitudes de verificación para una identidad' })
  @ApiResponse({ status: 200, description: 'Solicitudes de verificación obtenidas correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getVerificationRequests(@Param('identityId') identityId: string) {
    return this.identityService.getVerificationRequests(identityId);
  }

  @Get('generate-did')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generar un DID para una nueva identidad' })
  @ApiResponse({ status: 200, description: 'DID generado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async generateDID(@Query('method') method?: string) {
    return { did: await this.identityService.generateDID(method) };
  }
}
