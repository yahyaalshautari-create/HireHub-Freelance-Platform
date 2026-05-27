import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UpdateClientDto } from 'src/dtos/client/UpdateClientDto';
import { AuthGuard } from 'src/guards/auth.guard';
import { ClientGuard } from 'src/guards/client.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { ClientService } from 'src/services/client.service';
import type { RequestWithUser } from 'src/types/express';

@Controller('/api/clients')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  getClient(@Req() req: RequestWithUser) {
    return this.clientService.getClient(req.user._id);
  }

  @Put()
  @UseGuards(ClientGuard)
  updateClient(@Req() req: RequestWithUser, @Body() data: UpdateClientDto) {
    return this.clientService.updateClient(req.user, data);
  }
}
