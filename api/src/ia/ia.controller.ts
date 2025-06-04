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

import { Body, Controller, Get, Post, Param, UseGuards, Query } from '@nestjs/common';
import { IAService } from './ia.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('ia')
@Controller('ia')
export class IAController {
  constructor(private readonly iaService: IAService) {}

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar una nueva solicitud de IA' })
  @ApiResponse({ status: 201, description: 'Solicitud registrada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async registerRequest(@Body() body: { requestId: string; userId: string; requestData: string }) {
    return this.iaService.registerRequest(body.requestId, body.userId, body.requestData);
  }

  @Post('responses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'ia')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar una respuesta de IA' })
  @ApiResponse({ status: 201, description: 'Respuesta registrada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async registerResponse(@Body() body: { requestId: string; responseData: string }) {
    return this.iaService.registerResponse(body.requestId, body.responseData);
  }

  @Get('requests/:requestId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información de una solicitud de IA' })
  @ApiResponse({ status: 200, description: 'Información de la solicitud obtenida correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getRequest(@Param('requestId') requestId: string) {
    return this.iaService.getRequest(requestId);
  }

  @Get('users/:userId/requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las solicitudes de IA de un usuario' })
  @ApiResponse({ status: 200, description: 'Solicitudes obtenidas correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserRequests(@Param('userId') userId: string) {
    return this.iaService.getUserRequests(userId);
  }

  @Post('text/openai')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Procesar texto con OpenAI' })
  @ApiResponse({ status: 200, description: 'Texto procesado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async processTextWithOpenAI(
    @Body() body: { prompt: string; userId: string; options?: any }
  ) {
    return this.iaService.processTextWithOpenAI(body.prompt, body.userId, body.options);
  }

  @Post('text/huggingface')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Procesar texto con Hugging Face' })
  @ApiResponse({ status: 200, description: 'Texto procesado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async processTextWithHuggingFace(
    @Body() body: { prompt: string; userId: string; options?: any }
  ) {
    return this.iaService.processTextWithHuggingFace(body.prompt, body.userId, body.options);
  }

  @Post('image/openai')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generar imagen con OpenAI' })
  @ApiResponse({ status: 200, description: 'Imagen generada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async generateImageWithOpenAI(
    @Body() body: { prompt: string; userId: string; options?: any }
  ) {
    return this.iaService.generateImageWithOpenAI(body.prompt, body.userId, body.options);
  }

  @Post('image/stablediffusion')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generar imagen con Stable Diffusion' })
  @ApiResponse({ status: 200, description: 'Imagen generada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async generateImageWithStableDiffusion(
    @Body() body: { prompt: string; userId: string; options?: any }
  ) {
    return this.iaService.generateImageWithStableDiffusion(body.prompt, body.userId, body.options);
  }

  @Post('analyze/text')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analizar texto con IA' })
  @ApiResponse({ status: 200, description: 'Texto analizado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async analyzeText(
    @Body() body: { text: string; userId: string; options?: any }
  ) {
    return this.iaService.analyzeText(body.text, body.userId, body.options);
  }
}
