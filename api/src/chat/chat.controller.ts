import { Body, Controller, Get, Post, Put, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('channels')
  @ApiOperation({ summary: 'Crear un nuevo canal de chat' })
  @ApiResponse({ status: 201, description: 'Canal creado correctamente' })
  async createChannel(
    @Body() body: { channelType: string; participants: string; metadata?: string },
  ) {
    return this.chatService.createChannel(body.channelType, body.participants, body.metadata);
  }

  @Get('channels/:channelId')
  @ApiOperation({ summary: 'Obtener informacion de un canal de chat' })
  @ApiResponse({ status: 200, description: 'Informacion del canal obtenida correctamente' })
  async getChannel(@Param('channelId') channelId: string) {
    return this.chatService.getChannel(channelId);
  }

  @Post('channels/:channelId/participants')
  @ApiOperation({ summary: 'Anadir un participante a un canal de chat' })
  @ApiResponse({ status: 201, description: 'Participante anadido correctamente' })
  async addParticipant(
    @Param('channelId') channelId: string,
    @Body() body: { participantId: string },
  ) {
    return this.chatService.addParticipant(channelId, body.participantId);
  }

  @Delete('channels/:channelId/participants/:participantId')
  @ApiOperation({ summary: 'Eliminar un participante de un canal de chat' })
  @ApiResponse({ status: 200, description: 'Participante eliminado correctamente' })
  async removeParticipant(
    @Param('channelId') channelId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.chatService.removeParticipant(channelId, participantId);
  }

  @Post('channels/:channelId/messages')
  @ApiOperation({ summary: 'Enviar un mensaje en un canal de chat' })
  @ApiResponse({ status: 201, description: 'Mensaje enviado correctamente' })
  async sendMessage(
    @Param('channelId') channelId: string,
    @Body() body: { messageType: string; content: string; metadata?: string },
  ) {
    return this.chatService.sendMessage(
      channelId,
      body.messageType,
      body.content,
      body.metadata,
    );
  }

  @Get('channels/:channelId/messages')
  @ApiOperation({ summary: 'Obtener los mensajes de un canal de chat' })
  @ApiResponse({ status: 200, description: 'Mensajes obtenidos correctamente' })
  async getChannelMessages(
    @Param('channelId') channelId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.chatService.getChannelMessages(channelId, limit, offset);
  }

  @Get('messages/:messageId')
  @ApiOperation({ summary: 'Obtener un mensaje especifico' })
  @ApiResponse({ status: 200, description: 'Mensaje obtenido correctamente' })
  async getMessage(@Param('messageId') messageId: string) {
    return this.chatService.getMessage(messageId);
  }

  @Put('messages/:messageId')
  @ApiOperation({ summary: 'Editar un mensaje' })
  @ApiResponse({ status: 200, description: 'Mensaje editado correctamente' })
  async editMessage(
    @Param('messageId') messageId: string,
    @Body() body: { newContent: string },
  ) {
    return this.chatService.editMessage(messageId, body.newContent);
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Eliminar un mensaje' })
  @ApiResponse({ status: 200, description: 'Mensaje eliminado correctamente' })
  async deleteMessage(@Param('messageId') messageId: string) {
    return this.chatService.deleteMessage(messageId);
  }

  @Post('messages/:messageId/read')
  @ApiOperation({ summary: 'Marcar un mensaje como leido' })
  @ApiResponse({ status: 200, description: 'Mensaje marcado como leido correctamente' })
  async markAsRead(@Param('messageId') messageId: string) {
    return this.chatService.markAsRead(messageId);
  }

  @Get('users/:userId/channels')
  @ApiOperation({ summary: 'Obtener los canales de chat de un usuario' })
  @ApiResponse({ status: 200, description: 'Canales obtenidos correctamente' })
  async getUserChannels(@Param('userId') userId: string) {
    return this.chatService.getUserChannels(userId);
  }
}
