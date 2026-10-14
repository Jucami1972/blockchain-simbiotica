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

import { Body, Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { DaoService } from './dao.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('dao')
@Controller('dao')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DaoController {
  constructor(private readonly daoService: DaoService) {}

  @Post('propuestas')
  @ApiOperation({ summary: 'Crear una nueva propuesta de gobernanza' })
  @ApiResponse({ status: 201, description: 'Propuesta creada correctamente' })
  async crearPropuesta(
    @Body()
    body: { titulo: string; descripcion: string; categoria: string; accionesData: string },
  ) {
    return this.daoService.crearPropuesta(
      body.titulo,
      body.descripcion,
      body.categoria,
      body.accionesData,
    );
  }

  @Get('propuestas')
  @ApiOperation({ summary: 'Listar propuestas (opcionalmente filtradas por estado)' })
  @ApiResponse({ status: 200, description: 'Propuestas obtenidas correctamente' })
  async getPropuestas(@Query('estado') estado?: string) {
    return this.daoService.getPropuestas(estado);
  }

  @Get('propuestas/:propuestaId')
  @ApiOperation({ summary: 'Obtener una propuesta' })
  @ApiResponse({ status: 200, description: 'Propuesta obtenida correctamente' })
  async getPropuesta(@Param('propuestaId') propuestaId: string) {
    return this.daoService.getPropuesta(propuestaId);
  }

  @Post('propuestas/:propuestaId/votos')
  @ApiOperation({ summary: 'Votar una propuesta' })
  @ApiResponse({ status: 200, description: 'Voto registrado correctamente' })
  async votar(
    @Param('propuestaId') propuestaId: string,
    @Body() body: { voto: string; comentario?: string },
  ) {
    return this.daoService.votar(propuestaId, body.voto, body.comentario);
  }

  @Post('propuestas/:propuestaId/finalizar')
  @ApiOperation({ summary: 'Finalizar la votacion de una propuesta' })
  @ApiResponse({ status: 200, description: 'Votacion finalizada correctamente' })
  async finalizarVotacion(@Param('propuestaId') propuestaId: string) {
    return this.daoService.finalizarVotacion(propuestaId);
  }

  @Post('propuestas/:propuestaId/ejecutar')
  @ApiOperation({ summary: 'Ejecutar una propuesta aprobada' })
  @ApiResponse({ status: 200, description: 'Propuesta ejecutada correctamente' })
  async ejecutarPropuesta(@Param('propuestaId') propuestaId: string) {
    return this.daoService.ejecutarPropuesta(propuestaId);
  }

  @Get('propuestas/:propuestaId/votos')
  @ApiOperation({ summary: 'Obtener los votos de una propuesta' })
  @ApiResponse({ status: 200, description: 'Votos obtenidos correctamente' })
  async getVotosPropuesta(@Param('propuestaId') propuestaId: string) {
    return this.daoService.getVotosPropuesta(propuestaId);
  }

  @Get('propuestas/:propuestaId/votos/usuario/:userId')
  @ApiOperation({ summary: 'Obtener el voto de un usuario en una propuesta' })
  @ApiResponse({ status: 200, description: 'Voto obtenido correctamente' })
  async getVotoUsuario(
    @Param('propuestaId') propuestaId: string,
    @Param('userId') userId: string,
  ) {
    return this.daoService.getVotoUsuario(propuestaId, userId);
  }

  @Get('usuarios/:userId/propuestas')
  @ApiOperation({ summary: 'Obtener las propuestas creadas por un usuario' })
  @ApiResponse({ status: 200, description: 'Propuestas obtenidas correctamente' })
  async getPropuestasUsuario(@Param('userId') userId: string) {
    return this.daoService.getPropuestasUsuario(userId);
  }

  @Get('configuracion')
  @ApiOperation({ summary: 'Obtener la configuracion de la DAO' })
  @ApiResponse({ status: 200, description: 'Configuracion obtenida correctamente' })
  async getConfiguracionDAO() {
    return this.daoService.getConfiguracionDAO();
  }

  @Post('configuracion')
  @ApiOperation({ summary: 'Actualizar la configuracion de la DAO' })
  @ApiResponse({ status: 200, description: 'Configuracion actualizada correctamente' })
  async actualizarConfiguracionDAO(@Body() body: { configuracionData: string }) {
    return this.daoService.actualizarConfiguracionDAO(body.configuracionData);
  }
}
