import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentTenant } from '../tenants/tenant.decorator';
import type { TenantContext } from '../tenants/tenant.types';
import { ChatService, type ChatMessageDto } from './chat.service';

type ChatMessageBody = {
  message: string;
  history?: ChatMessageDto[];
};

@Controller('/chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('/status')
  status() {
    return { enabled: this.chat.isEnabled() };
  }

  @Post('/message')
  async message(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: ChatMessageBody,
    @Req() req: Request,
  ) {
    const clientKey = req.ip || req.socket.remoteAddress || 'anonymous';
    return await this.chat.sendMessage(tenant, body.message, body.history, clientKey);
  }
}
