import { Body, Controller, Get, Post, Put, Param, UseGuards, Query } from '@nestjs/common';
import { AchievexService } from './achievex.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('achievex')
@Controller('achievex')
export class AchievexController {
  constructor(private readonly achievexService: AchievexService) {}

  @Post('achievements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo logro' })
  @ApiResponse({ status: 201, description: 'Logro creado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async createAchievement(@Body() body: { achievementId: string; creatorId: string; achievementData: string }) {
    return this.achievexService.createAchievement(body.achievementId, body.creatorId, body.achievementData);
  }

  @Get('achievements/:achievementId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información de un logro' })
  @ApiResponse({ status: 200, description: 'Información del logro obtenida correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getAchievement(@Param('achievementId') achievementId: string) {
    return this.achievexService.getAchievement(achievementId);
  }

  @Put('achievements/:achievementId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un logro existente' })
  @ApiResponse({ status: 200, description: 'Logro actualizado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async updateAchievement(
    @Param('achievementId') achievementId: string,
    @Body() body: { creatorId: string; achievementData: string },
  ) {
    return this.achievexService.updateAchievement(achievementId, body.creatorId, body.achievementData);
  }

  @Post('achievements/:achievementId/grant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Otorgar un logro a un usuario' })
  @ApiResponse({ status: 200, description: 'Logro otorgado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async grantAchievement(
    @Param('achievementId') achievementId: string,
    @Body() body: { userId: string; granterId: string; grantData: string },
  ) {
    return this.achievexService.grantAchievement(
      achievementId,
      body.userId,
      body.granterId,
      body.grantData,
    );
  }

  @Post('achievements/:achievementId/revoke')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revocar un logro otorgado a un usuario' })
  @ApiResponse({ status: 200, description: 'Logro revocado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async revokeAchievement(
    @Param('achievementId') achievementId: string,
    @Body() body: { userId: string; revokerId: string; reason: string },
  ) {
    return this.achievexService.revokeAchievement(
      achievementId,
      body.userId,
      body.revokerId,
      body.reason,
    );
  }

  @Get('users/:userId/achievements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los logros de un usuario' })
  @ApiResponse({ status: 200, description: 'Logros obtenidos correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserAchievements(@Param('userId') userId: string) {
    return this.achievexService.getUserAchievements(userId);
  }

  @Post('badges')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva insignia' })
  @ApiResponse({ status: 201, description: 'Insignia creada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async createBadge(@Body() body: { badgeId: string; creatorId: string; badgeData: string }) {
    return this.achievexService.createBadge(body.badgeId, body.creatorId, body.badgeData);
  }

  @Post('badges/:badgeId/grant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Otorgar una insignia a un usuario' })
  @ApiResponse({ status: 200, description: 'Insignia otorgada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async grantBadge(
    @Param('badgeId') badgeId: string,
    @Body() body: { userId: string; granterId: string; grantData: string },
  ) {
    return this.achievexService.grantBadge(
      badgeId,
      body.userId,
      body.granterId,
      body.grantData,
    );
  }

  @Get('users/:userId/badges')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las insignias de un usuario' })
  @ApiResponse({ status: 200, description: 'Insignias obtenidas correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserBadges(@Param('userId') userId: string) {
    return this.achievexService.getUserBadges(userId);
  }

  @Post('rewards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva recompensa' })
  @ApiResponse({ status: 201, description: 'Recompensa creada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async createReward(@Body() body: { rewardId: string; creatorId: string; rewardData: string }) {
    return this.achievexService.createReward(body.rewardId, body.creatorId, body.rewardData);
  }

  @Post('rewards/:rewardId/grant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Otorgar una recompensa a un usuario' })
  @ApiResponse({ status: 200, description: 'Recompensa otorgada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async grantReward(
    @Param('rewardId') rewardId: string,
    @Body() body: { userId: string; granterId: string; grantData: string },
  ) {
    return this.achievexService.grantReward(
      rewardId,
      body.userId,
      body.granterId,
      body.grantData,
    );
  }

  @Get('users/:userId/rewards')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las recompensas de un usuario' })
  @ApiResponse({ status: 200, description: 'Recompensas obtenidas correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserRewards(@Param('userId') userId: string) {
    return this.achievexService.getUserRewards(userId);
  }

  @Post('leaderboard/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar la tabla de clasificación' })
  @ApiResponse({ status: 200, description: 'Tabla de clasificación actualizada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async updateLeaderboard() {
    return this.achievexService.updateLeaderboard();
  }

  @Get('leaderboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener la tabla de clasificación' })
  @ApiResponse({ status: 200, description: 'Tabla de clasificación obtenida correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getLeaderboard(@Query('limit') limit?: number) {
    return this.achievexService.getLeaderboard(limit);
  }

  @Post('users/:userId/points')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Añadir puntos a un usuario' })
  @ApiResponse({ status: 200, description: 'Puntos añadidos correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  async addPoints(
    @Param('userId') userId: string,
    @Body() body: { points: number; reason: string },
  ) {
    return this.achievexService.addPoints(userId, body.points, body.reason);
  }

  @Get('users/:userId/points')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener los puntos de un usuario' })
  @ApiResponse({ status: 200, description: 'Puntos obtenidos correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserPoints(@Param('userId') userId: string) {
    return this.achievexService.getUserPoints(userId);
  }

  @Get('users/:userId/points/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el historial de puntos de un usuario' })
  @ApiResponse({ status: 200, description: 'Historial de puntos obtenido correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserPointsHistory(@Param('userId') userId: string) {
    return this.achievexService.getUserPointsHistory(userId);
  }
}
