import {
  Controller,
  Param,
  Post,
  Get,
  Req,
  UseGuards,
  UseInterceptors,
  Query,
  Delete,
} from '@nestjs/common';
import { AdminGuard } from 'src/guards/admin.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { ClientGuard } from 'src/guards/client.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { ContractService } from 'src/services/contract.service';
import type { RequestWithUser } from 'src/types/express';

@Controller('/api/contracts')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post(':proposalId')
  @UseGuards(ClientGuard)
  createContract(
    @Req() req: RequestWithUser,
    @Param('proposalId') proposalId: string,
  ) {
    return this.contractService.createContract(req.user, proposalId);
  }

  @Get()
  @UseGuards(AdminGuard)
  getAllContracts(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.contractService.getAllContracts(page, limit);
  }

  @Get(':otherUserId')
  getMyContractWithUser(
    @Req() req: RequestWithUser,
    @Param('otherUserId') otherUserId: string,
  ) {
    return this.contractService.getMyContractWithUser(req.user, otherUserId);
  }

  @Get(':contractId')
  getContractById(@Param('contractId') contractId: string) {
    return this.contractService.getContractById(contractId);
  }

  @Delete(':contractId')
  @UseGuards(AdminGuard)
  deleteContract(@Param('contractId') contractId: string) {
    return this.contractService.deleteContract(contractId);
  }
}
