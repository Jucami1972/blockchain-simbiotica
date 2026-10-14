import { Body, Controller, Get, Post, Put, Param, Query, UseGuards } from '@nestjs/common';
import { AchievexService } from './achievex.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('achievex')
@Controller('achievex')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AchievexController {
  constructor(private readonly achievexService: AchievexService) {}

  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Crear una categoria de logros' })
  @ApiResponse({ status: 201, description: 'Categoria creada correctamente' })
  async createCategory(@Body() body: { categoryId: string; categoryData: string }) {
    return this.achievexService.createCategory(body.categoryId, body.categoryData);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Listar todas las categorias' })
  @ApiResponse({ status: 200, description: 'Categorias obtenidas correctamente' })
  async getAllCategories() {
    return this.achievexService.getAllCategories();
  }

  @Get('categories/:categoryId')
  @ApiOperation({ summary: 'Obtener una categoria' })
  @ApiResponse({ status: 200, description: 'Categoria obtenida correctamente' })
  async getCategory(@Param('categoryId') categoryId: string) {
    return this.achievexService.getCategory(categoryId);
  }

  @Get('categories/:categoryId/achievements')
  @ApiOperation({ summary: 'Listar los logros de una categoria' })
  @ApiResponse({ status: 200, description: 'Logros obtenidos correctamente' })
  async getCategoryAchievements(@Param('categoryId') categoryId: string) {
    return this.achievexService.getCategoryAchievements(categoryId);
  }

  @Post('achievements')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Crear un nuevo logro' })
  @ApiResponse({ status: 201, description: 'Logro creado correctamente' })
  async createAchievement(
    @Body() body: { achievementId: string; categoryId: string; achievementData: string },
  ) {
    return this.achievexService.createAchievement(
      body.achievementId,
      body.categoryId,
      body.achievementData,
    );
  }

  @Get('achievements/:achievementId')
  @ApiOperation({ summary: 'Obtener informacion de un logro' })
  @ApiResponse({ status: 200, description: 'Informacion del logro obtenida correctamente' })
  async getAchievement(@Param('achievementId') achievementId: string) {
    return this.achievexService.getAchievement(achievementId);
  }

  @Put('achievements/:achievementId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar un logro existente' })
  @ApiResponse({ status: 200, description: 'Logro actualizado correctamente' })
  async updateAchievement(
    @Param('achievementId') achievementId: string,
    @Body() body: { achievementData: string },
  ) {
    return this.achievexService.updateAchievement(achievementId, body.achievementData);
  }

  @Post('achievements/:achievementId/award')
  @UseGuards(RolesGuard)
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: 'Otorgar un logro a un usuario' })
  @ApiResponse({ status: 200, description: 'Logro otorgado correctamente' })
  async awardAchievement(
    @Param('achievementId') achievementId: string,
    @Body() body: { userId: string; evidence?: string },
  ) {
    return this.achievexService.awardAchievement(body.userId, achievementId, body.evidence);
  }

  @Get('users/:userId/achievements')
  @ApiOperation({ summary: 'Obtener todos los logros de un usuario' })
  @ApiResponse({ status: 200, description: 'Logros obtenidos correctamente' })
  async getUserAchievements(@Param('userId') userId: string) {
    return this.achievexService.getUserAchievements(userId);
  }

  @Get('users/:userId/achievements/:achievementId')
  @ApiOperation({ summary: 'Verificar si un usuario tiene un logro' })
  @ApiResponse({ status: 200, description: 'Verificacion completada' })
  async hasAchievement(
    @Param('userId') userId: string,
    @Param('achievementId') achievementId: string,
  ) {
    return this.achievexService.hasAchievement(userId, achievementId);
  }

  @Get('users/:userId/profile')
  @ApiOperation({ summary: 'Obtener el perfil de logros de un usuario' })
  @ApiResponse({ status: 200, description: 'Perfil obtenido correctamente' })
  async getUserProfile(@Param('userId') userId: string) {
    return this.achievexService.getUserProfile(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadisticas de logros' })
  @ApiResponse({ status: 200, description: 'Estadisticas obtenidas correctamente' })
  async getAchievementStats() {
    return this.achievexService.getAchievementStats();
  }
}
