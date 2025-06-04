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

import { Body, Controller, Get, Post, Put, Delete, Param, UseGuards, Query } from '@nestjs/common';
import { DAOService } from './dao.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('dao')
@Controller('dao')
export class DAOController {
  constructor(private readonly daoService: DAOService) {}

  @Post('proposals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva propuesta en la DAO' })
  @ApiResponse({ status: 201, description: 'Propuesta creada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async createProposal(@Body() body: { proposalId: string; creatorId: string; proposalData: string }) {
    return this.daoService.createProposal(body.proposalId, body.creatorId, body.proposalData);
  }

  @Get('proposals/:proposalId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información de una propuesta' })
  @ApiResponse({ status: 200, description: 'Información de la propuesta obtenida correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProposal(@Param('proposalId') proposalId: string) {
    return this.daoService.getProposal(proposalId);
  }

  @Post('proposals/:proposalId/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Votar en una propuesta' })
  @ApiResponse({ status: 200, description: 'Voto registrado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async voteOnProposal(
    @Param('proposalId') proposalId: string,
    @Body() body: { voterId: string; vote: boolean; voteWeight?: number },
  ) {
    return this.daoService.voteOnProposal(proposalId, body.voterId, body.vote, body.voteWeight);
  }

  @Post('proposals/:proposalId/execute')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'dao_executor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ejecutar una propuesta aprobada' })
  @ApiResponse({ status: 200, description: 'Propuesta ejecutada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async executeProposal(
    @Param('proposalId') proposalId: string,
    @Body() body: { executorId: string },
  ) {
    return this.daoService.executeProposal(proposalId, body.executorId);
  }

  @Post('proposals/:proposalId/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'dao_moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar una propuesta' })
  @ApiResponse({ status: 200, description: 'Propuesta cancelada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async cancelProposal(
    @Param('proposalId') proposalId: string,
    @Body() body: { cancelerId: string; reason: string },
  ) {
    return this.daoService.cancelProposal(proposalId, body.cancelerId, body.reason);
  }

  @Get('proposals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las propuestas' })
  @ApiResponse({ status: 200, description: 'Propuestas obtenidas correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProposals(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.daoService.getProposals(status, limit, offset);
  }

  @Get('users/:userId/proposals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener las propuestas creadas por un usuario' })
  @ApiResponse({ status: 200, description: 'Propuestas obtenidas correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserProposals(@Param('userId') userId: string) {
    return this.daoService.getUserProposals(userId);
  }

  @Get('users/:userId/votes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener los votos de un usuario' })
  @ApiResponse({ status: 200, description: 'Votos obtenidos correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserVotes(@Param('userId') userId: string) {
    return this.daoService.getUserVotes(userId);
  }

  @Get('proposals/:proposalId/votes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener los votos de una propuesta' })
  @ApiResponse({ status: 200, description: 'Votos obtenidos correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProposalVotes(@Param('proposalId') proposalId: string) {
    return this.daoService.getProposalVotes(proposalId);
  }

  @Post('delegations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delegar tokens de votación a otro usuario' })
  @ApiResponse({ status: 201, description: 'Delegación creada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async delegateVotingPower(
    @Body() body: { delegatorId: string; delegateeId: string; amount: number },
  ) {
    return this.daoService.delegateVotingPower(body.delegatorId, body.delegateeId, body.amount);
  }

  @Delete('delegations/:delegatorId/:delegateeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revocar la delegación de tokens de votación' })
  @ApiResponse({ status: 200, description: 'Delegación revocada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async revokeDelegation(
    @Param('delegatorId') delegatorId: string,
    @Param('delegateeId') delegateeId: string,
  ) {
    return this.daoService.revokeDelegation(delegatorId, delegateeId);
  }

  @Get('users/:userId/delegations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener las delegaciones de un usuario' })
  @ApiResponse({ status: 200, description: 'Delegaciones obtenidas correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserDelegations(@Param('userId') userId: string) {
    return this.daoService.getUserDelegations(userId);
  }

  @Put('governance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar los parámetros de gobernanza de la DAO' })
  @ApiResponse({ status: 200, description: 'Parámetros actualizados correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async updateGovernanceParams(
    @Body() body: { adminId: string; governanceParams: string },
  ) {
    return this.daoService.updateGovernanceParams(body.adminId, body.governanceParams);
  }

  @Get('governance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener los parámetros de gobernanza actuales' })
  @ApiResponse({ status: 200, description: 'Parámetros obtenidos correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getGovernanceParams() {
    return this.daoService.getGovernanceParams();
  }
}
