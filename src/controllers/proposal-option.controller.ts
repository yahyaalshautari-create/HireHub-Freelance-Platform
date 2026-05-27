import {
  Controller,
  Put,
  Req,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  Get,
  Post,
  Patch,
} from '@nestjs/common';
import { CreateProposalDto } from 'src/dtos/proposal/create-proposal.dto';
import { ProposalStatus } from 'src/enums/proposal.enum';
import { AuthGuard } from 'src/guards/auth.guard';
import { ClientGuard } from 'src/guards/client.guard';
import { FreelancerGuard } from 'src/guards/freelancer.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { ProposalOptionService } from 'src/services/proposal-option.service';
import type { RequestWithUser } from 'src/types/express';

@Controller('/api/proposal-options')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class ProposalOptionController {
  constructor(private readonly proposalOptionService: ProposalOptionService) {}

  @Put(':proposalId')
  @UseGuards(FreelancerGuard)
  updateProposal(
    @Req() req: RequestWithUser,
    @Param('proposalId') proposalId: string,
    @Body() data: CreateProposalDto,
  ) {
    return this.proposalOptionService.updateProposal(
      req.user,
      proposalId,
      data,
    );
  }

  @Get()
  @UseGuards(ClientGuard)
  getPendingProposalUpdates(@Req() req: RequestWithUser) {
    return this.proposalOptionService.getPendingProposalUpdates(req.user);
  }

  @Post(':proposalId')
  approveProposal(
    @Req() req: RequestWithUser,
    @Param('proposalId') proposalId: string,
  ) {
    return this.proposalOptionService.approveProposal(req.user, proposalId);
  }

  @Patch(':proposalId')
  updateProposalStatus(
    @Req() req: RequestWithUser,
    @Param('proposalId') proposalId: string,
    @Body('status') status: ProposalStatus,
  ) {
    return this.proposalOptionService.updateProposalStatus(
      req.user,
      proposalId,
      status,
    );
  }
}
