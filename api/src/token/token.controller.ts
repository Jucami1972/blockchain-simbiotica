import { Body, Controller, Get, Post, Param, UseGuards, Query } from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('token')
@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get('balance/:address')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener balance de tokens de una dirección' })
  @ApiResponse({ status: 200, description: 'Balance obtenido correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getBalance(@Param('address') address: string) {
    return this.tokenService.getBalance(address);
  }

  @Get('total-supply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener suministro total de tokens' })
  @ApiResponse({ status: 200, description: 'Suministro total obtenido correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getTotalSupply() {
    return this.tokenService.getTotalSupply();
  }

  @Post('transfer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transferir tokens de una dirección a otra' })
  @ApiResponse({ status: 200, description: 'Transferencia realizada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async transfer(@Body() body: { from: string; to: string; amount: string }) {
    return this.tokenService.transfer(body.from, body.to, body.amount);
  }

  @Post('approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprobar a una dirección para gastar tokens en nombre del propietario' })
  @ApiResponse({ status: 200, description: 'Aprobación realizada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async approve(@Body() body: { owner: string; spender: string; amount: string }) {
    return this.tokenService.approve(body.owner, body.spender, body.amount);
  }

  @Post('transfer-from')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transferir tokens de una dirección a otra en nombre del propietario' })
  @ApiResponse({ status: 200, description: 'Transferencia realizada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async transferFrom(@Body() body: { spender: string; from: string; to: string; amount: string }) {
    return this.tokenService.transferFrom(body.spender, body.from, body.to, body.amount);
  }

  @Get('allowance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener la cantidad de tokens que un gastador puede gastar en nombre de un propietario' })
  @ApiResponse({ status: 200, description: 'Allowance obtenido correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getAllowance(@Query('owner') owner: string, @Query('spender') spender: string) {
    return this.tokenService.getAllowance(owner, spender);
  }

  @Post('mint')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Acuñar nuevos tokens y asignarlos a una dirección' })
  @ApiResponse({ status: 200, description: 'Tokens acuñados correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async mint(@Body() body: { to: string; amount: string }) {
    return this.tokenService.mint(body.to, body.amount);
  }

  @Post('burn')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quemar tokens de una dirección' })
  @ApiResponse({ status: 200, description: 'Tokens quemados correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async burn(@Body() body: { from: string; amount: string }) {
    return this.tokenService.burn(body.from, body.amount);
  }

  @Get('transaction-history/:address')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener historial de transacciones de una dirección' })
  @ApiResponse({ status: 200, description: 'Historial obtenido correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getTransactionHistory(@Param('address') address: string) {
    return this.tokenService.getTransactionHistory(address);
  }

  @Get('info')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información del token' })
  @ApiResponse({ status: 200, description: 'Información obtenida correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getTokenInfo() {
    return this.tokenService.getTokenInfo();
  }

  @Post('lock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bloquear tokens de una dirección' })
  @ApiResponse({ status: 200, description: 'Tokens bloqueados correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async lockTokens(@Body() body: { address: string; amount: string; reason: string }) {
    return this.tokenService.lockTokens(body.address, body.amount, body.reason);
  }

  @Post('unlock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desbloquear tokens de una dirección' })
  @ApiResponse({ status: 200, description: 'Tokens desbloqueados correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async unlockTokens(@Body() body: { address: string; amount: string }) {
    return this.tokenService.unlockTokens(body.address, body.amount);
  }

  @Get('locked/:address')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener la cantidad de tokens bloqueados de una dirección' })
  @ApiResponse({ status: 200, description: 'Tokens bloqueados obtenidos correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getLockedTokens(@Param('address') address: string) {
    return this.tokenService.getLockedTokens(address);
  }
}
