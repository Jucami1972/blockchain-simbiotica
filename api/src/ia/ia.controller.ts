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

import { Body, Controller, Get, Post, Put, Param, Query, UseGuards } from '@nestjs/common';
import { IaService } from './ia.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('ia')
@Controller('ia')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Post('modelos')
  @ApiOperation({ summary: 'Registrar un modelo de IA' })
  @ApiResponse({ status: 201, description: 'Modelo registrado correctamente' })
  async registrarModelo(@Body() body: { modeloId: string; modeloData: string }) {
    return this.iaService.registrarModelo(body.modeloId, body.modeloData);
  }

  @Get('modelos/:modeloId')
  @ApiOperation({ summary: 'Obtener un modelo de IA' })
  @ApiResponse({ status: 200, description: 'Modelo obtenido correctamente' })
  async getModelo(@Param('modeloId') modeloId: string) {
    return this.iaService.getModelo(modeloId);
  }

  @Put('modelos/:modeloId')
  @ApiOperation({ summary: 'Actualizar un modelo de IA' })
  @ApiResponse({ status: 200, description: 'Modelo actualizado correctamente' })
  async actualizarModelo(
    @Param('modeloId') modeloId: string,
    @Body() body: { modeloData: string },
  ) {
    return this.iaService.actualizarModelo(modeloId, body.modeloData);
  }

  @Get('modelos/:modeloId/solicitudes')
  @ApiOperation({ summary: 'Obtener las solicitudes de un modelo' })
  @ApiResponse({ status: 200, description: 'Solicitudes obtenidas correctamente' })
  async getSolicitudesModelo(@Param('modeloId') modeloId: string) {
    return this.iaService.getSolicitudesModelo(modeloId);
  }

  @Post('solicitudes')
  @ApiOperation({ summary: 'Registrar una solicitud a un modelo' })
  @ApiResponse({ status: 201, description: 'Solicitud registrada correctamente' })
  async registrarSolicitud(@Body() body: { modeloId: string; solicitudData: string }) {
    return this.iaService.registrarSolicitud(body.modeloId, body.solicitudData);
  }

  @Get('solicitudes/:solicitudId')
  @ApiOperation({ summary: 'Obtener una solicitud' })
  @ApiResponse({ status: 200, description: 'Solicitud obtenida correctamente' })
  async getSolicitud(@Param('solicitudId') solicitudId: string) {
    return this.iaService.getSolicitud(solicitudId);
  }

  @Post('respuestas')
  @ApiOperation({ summary: 'Registrar la respuesta a una solicitud' })
  @ApiResponse({ status: 201, description: 'Respuesta registrada correctamente' })
  async registrarRespuesta(@Body() body: { solicitudId: string; respuestaData: string }) {
    return this.iaService.registrarRespuesta(body.solicitudId, body.respuestaData);
  }

  @Get('respuestas/:respuestaId')
  @ApiOperation({ summary: 'Obtener una respuesta' })
  @ApiResponse({ status: 200, description: 'Respuesta obtenida correctamente' })
  async getRespuesta(@Param('respuestaId') respuestaId: string) {
    return this.iaService.getRespuesta(respuestaId);
  }

  @Post('respuestas/:respuestaId/evaluaciones')
  @ApiOperation({ summary: 'Registrar una evaluacion de una respuesta' })
  @ApiResponse({ status: 201, description: 'Evaluacion registrada correctamente' })
  async registrarEvaluacion(
    @Param('respuestaId') respuestaId: string,
    @Body() body: { evaluacionData: string },
  ) {
    return this.iaService.registrarEvaluacion(respuestaId, body.evaluacionData);
  }

  @Get('usuarios/:userId/solicitudes')
  @ApiOperation({ summary: 'Obtener las solicitudes de un usuario' })
  @ApiResponse({ status: 200, description: 'Solicitudes obtenidas correctamente' })
  async getSolicitudesUsuario(@Param('userId') userId: string) {
    return this.iaService.getSolicitudesUsuario(userId);
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadisticas de uso' })
  @ApiResponse({ status: 200, description: 'Estadisticas obtenidas correctamente' })
  async getEstadisticasUso(@Query() _query: Record<string, string>) {
    return this.iaService.getEstadisticasUso();
  }
}
