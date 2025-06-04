import { Body, Controller, Get, Post, Put, Delete, Param, UseGuards, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('channels')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo canal de chat' })
  @ApiResponse({ status: 201, description: 'Canal creado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async createChannel(@Body() body: { channelId: string; creatorId: string; channelData: string }) {
    return this.chatService.createChannel(body.channelId, body.creatorId, body.channelData);
  }

  @Get('channels/:channelId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información de un canal de chat' })
  @ApiResponse({ status: 200, description: 'Información del canal obtenida correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getChannel(@Param('channelId') channelId: string) {
    return this.chatService.getChannel(channelId);
  }

  @Put('channels/:channelId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un canal de chat existente' })
  @ApiResponse({ status: 200, description: 'Canal actualizado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async updateChannel(
    @Param('channelId') channelId: string,
    @Body() body: { updaterId: string; channelData: string },
  ) {
    return this.chatService.updateChannel(channelId, body.updaterId, body.channelData);
  }

  @Post('channels/:channelId/participants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Añadir un participante a un canal de chat' })
  @ApiResponse({ status: 201, description: 'Participante añadido correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async addParticipant(
    @Param('channelId') channelId: string,
    @Body() body: { participantId: string; adderId: string; participantData: string },
  ) {
    return this.chatService.addParticipant(
      channelId,
      body.participantId,
      body.adderId,
      body.participantData,
    );
  }

  @Delete('channels/:channelId/participants/:participantId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un participante de un canal de chat' })
  @ApiResponse({ status: 200, description: 'Participante eliminado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async removeParticipant(
    @Param('channelId') channelId: string,
    @Param('participantId') participantId: string,
    @Body() body: { removerId: string; reason: string },
  ) {
    return this.chatService.removeParticipant(
      channelId,
      participantId,
      body.removerId,
      body.reason,
    );
  }

  @Post('channels/:channelId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar un mensaje en un canal de chat' })
  @ApiResponse({ status: 201, description: 'Mensaje enviado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async sendMessage(
    @Param('channelId') channelId: string,
    @Body() body: { messageId: string; senderId: string; messageData: string },
  ) {
    return this.chatService.sendMessage(
      body.messageId,
      channelId,
      body.senderId,
      body.messageData,
    );
  }

  @Put('channels/:channelId/messages/:messageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar un mensaje en un canal de chat' })
  @ApiResponse({ status: 200, description: 'Mensaje editado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async editMessage(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body() body: { editorId: string; messageData: string },
  ) {
    return this.chatService.editMessage(
      messageId,
      channelId,
      body.editorId,
      body.messageData,
    );
  }

  @Delete('channels/:channelId/messages/:messageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un mensaje de un canal de chat' })
  @ApiResponse({ status: 200, description: 'Mensaje eliminado correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async deleteMessage(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body() body: { deleterId: string; reason: string },
  ) {
    return this.chatService.deleteMessage(
      messageId,
      channelId,
      body.deleterId,
      body.reason,
    );
  }

  @Get('channels/:channelId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener los mensajes de un canal de chat' })
  @ApiResponse({ status: 200, description: 'Mensajes obtenidos correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getMessages(
    @Param('channelId') channelId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.chatService.getMessages(channelId, limit, offset);
  }

  @Get('channels/:channelId/messages/:messageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un mensaje específico de un canal de chat' })
  @ApiResponse({ status: 200, description: 'Mensaje obtenido correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getMessage(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.chatService.getMessage(messageId, channelId);
  }

  @Get('users/:userId/channels')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener los canales de chat de un usuario' })
  @ApiResponse({ status: 200, description: 'Canales obtenidos correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserChannels(@Param('userId') userId: string) {
    return this.chatService.getUserChannels(userId);
  }

  @Post('channels/:channelId/messages/:messageId/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar un mensaje como leído' })
  @ApiResponse({ status: 200, description: 'Mensaje marcado como leído correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async markMessageAsRead(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body() body: { userId: string },
  ) {
    return this.chatService.markMessageAsRead(messageId, channelId, body.userId);
  }

  @Get('channels/:channelId/users/:userId/unread')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener los mensajes no leídos de un usuario en un canal' })
  @ApiResponse({ status: 200, description: 'Mensajes no leídos obtenidos correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUnreadMessages(
    @Param('channelId') channelId: string,
    @Param('userId') userId: string,
  ) {
    return this.chatService.getUnreadMessages(channelId, userId);
  }

  @Post('channels/:channelId/messages/:messageId/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Añadir una reacción a un mensaje' })
  @ApiResponse({ status: 201, description: 'Reacción añadida correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async addReaction(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body() body: { userId: string; reactionData: string },
  ) {
    return this.chatService.addReaction(
      messageId,
      channelId,
      body.userId,
      body.reactionData,
    );
  }

  @Delete('channels/:channelId/messages/:messageId/reactions/:reactionType/users/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una reacción de un mensaje' })
  @ApiResponse({ status: 200, description: 'Reacción eliminada correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async removeReaction(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Param('reactionType') reactionType: string,
    @Param('userId') userId: string,
  ) {
    return this.chatService.removeReaction(
      messageId,
      channelId,
      userId,
      reactionType,
    );
  }

  @Get('channels/:channelId/messages/:messageId/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener las reacciones de un mensaje' })
  @ApiResponse({ status: 200, description: 'Reacciones obtenidas correctamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getReactions(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.chatService.getReactions(messageId, channelId);
  }
}
