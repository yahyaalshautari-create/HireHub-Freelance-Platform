import {
  Controller,
  Param,
  Post,
  Patch,
  Put,
  Req,
  Query,
  UseGuards,
  UseInterceptors,
  Body,
  Get,
} from '@nestjs/common';
import { ReviewContractStatus } from 'src/enums/contract.enum';
import { AuthGuard } from 'src/guards/auth.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { ContractOptionService } from 'src/services/contract-option.service';
import type { RequestWithUser } from 'src/types/express';

@Controller('/api/contract-options')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class ContractOptionController {
  constructor(private readonly contractOptionService: ContractOptionService) {}

  @Post(':contractId')
  completeContract(
    @Req() req: RequestWithUser,
    @Param('contractId') contractId: string,
  ) {
    return this.contractOptionService.completeContract(req.user, contractId);
  }

  @Put(':contractId')
  requestCancelContract(
    @Req() req: RequestWithUser,
    @Param('contractId') contractId: string,
  ) {
    return this.contractOptionService.requestCancelContract(
      req.user,
      contractId,
    );
  }

  @Get()
  getPendingCancelRequests(
    @Req() req: RequestWithUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.contractOptionService.getPendingCancelRequests(
      req.user,
      page,
      limit,
    );
  }

  @Patch(':contractId')
  reviewCancelContract(
    @Req() req: RequestWithUser,
    @Param('contractId') contractId: string,
    @Body('status') status: ReviewContractStatus,
  ) {
    return this.contractOptionService.reviewCancelContract(
      req.user,
      contractId,
      status,
    );
  }
}
