import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateProposalDto } from 'src/dtos/proposal/create-proposal.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { FreelancerGuard } from 'src/guards/freelancer.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { ProposalService } from 'src/services/proposal.service';
import type { RequestWithUser } from 'src/types/express';

@Controller('/api/proposals')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post(':projectId')
  @UseGuards(FreelancerGuard)
  createProposal(
    @Req() req: RequestWithUser,
    @Param('projectId') projectId: string,
    @Body() data: CreateProposalDto,
  ) {
    return this.proposalService.createProposal(req.user, projectId, data);
  }

  @Get(':projectId')
  getProposalsByProject(
    @Param('projectId') projectId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.proposalService.getProposalsByProject(projectId, page, limit);
  }

  @Delete(':proposalId')
  deleteProposal(
    @Req() req: RequestWithUser,
    @Param('proposalId') proposalId: string,
  ) {
    return this.proposalService.deleteProposal(req.user, proposalId);
  }
}
