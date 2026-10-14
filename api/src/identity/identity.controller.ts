/**
 * Copyright (c) 2025 Blockchain Simbiótica
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Body, Controller, Get, Post, Put, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('identity')
@Controller('identity')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('users')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado correctamente' })
  async registerUser(@Body() body: { userId: string; userData: string }) {
    return this.identityService.registerUser(body.userId, body.userData);
  }

  @Get('users')
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiResponse({ status: 200, description: 'Usuarios obtenidos correctamente' })
  async getUsers(@Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.identityService.getUsers(limit, offset);
  }

  @Get('users/by-username/:username')
  @ApiOperation({ summary: 'Buscar usuario por nombre de usuario' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  async getUserByUsername(@Param('username') username: string) {
    return this.identityService.getUserByUsername(username);
  }

  @Get('users/by-email')
  @ApiOperation({ summary: 'Buscar usuario por correo electronico' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  async getUserByEmail(@Query('email') email: string) {
    return this.identityService.getUserByEmail(email);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Obtener informacion de un usuario' })
  @ApiResponse({ status: 200, description: 'Informacion del usuario obtenida correctamente' })
  async getUser(@Param('userId') userId: string) {
    return this.identityService.getUser(userId);
  }

  @Put('users/:userId')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado correctamente' })
  async updateUser(
    @Param('userId') userId: string,
    @Body() body: { userData: string },
  ) {
    return this.identityService.updateUser(userId, body.userData);
  }

  @Delete('users/:userId')
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado correctamente' })
  async deleteUser(@Param('userId') userId: string) {
    return this.identityService.deleteUser(userId);
  }

  @Get('users/:userId/credentials')
  @ApiOperation({ summary: 'Obtener todas las credenciales de un usuario' })
  @ApiResponse({ status: 200, description: 'Credenciales obtenidas correctamente' })
  async getUserCredentials(@Param('userId') userId: string) {
    return this.identityService.getUserCredentials(userId);
  }

  @Post('credentials')
  @ApiOperation({ summary: 'Registrar una nueva credencial' })
  @ApiResponse({ status: 201, description: 'Credencial registrada correctamente' })
  async registerCredential(
    @Body() body: { credentialId: string; userId: string; issuer: string; credentialData: string },
  ) {
    return this.identityService.registerCredential(
      body.credentialId,
      body.userId,
      body.issuer,
      body.credentialData,
    );
  }

  @Get('credentials/:credentialId')
  @ApiOperation({ summary: 'Obtener una credencial' })
  @ApiResponse({ status: 200, description: 'Credencial obtenida correctamente' })
  async getCredential(@Param('credentialId') credentialId: string) {
    return this.identityService.getCredential(credentialId);
  }

  @Post('credentials/:credentialId/revoke')
  @ApiOperation({ summary: 'Revocar una credencial' })
  @ApiResponse({ status: 200, description: 'Credencial revocada correctamente' })
  async revokeCredential(
    @Param('credentialId') credentialId: string,
    @Body() body: { reason: string },
  ) {
    // El revocador lo registra el chaincode según la identidad del llamante
    return this.identityService.revokeCredential(credentialId, body.reason);
  }

  @Post('credentials/:credentialId/verify')
  @ApiOperation({ summary: 'Verificar una credencial' })
  @ApiResponse({ status: 200, description: 'Credencial verificada correctamente' })
  async verifyCredential(@Param('credentialId') credentialId: string) {
    return this.identityService.verifyCredential(credentialId);
  }
}
