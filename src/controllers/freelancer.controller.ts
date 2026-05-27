import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UpdateFreelancerDto } from 'src/dtos/freelancer/update-freelancer.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { FreelancerGuard } from 'src/guards/freelancer.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { FreelancerService } from 'src/services/freelancer.service';
import type { RequestWithUser } from 'src/types/express';

@Controller('/api/freelancers')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class FreelancerController {
  constructor(private readonly freelancerService: FreelancerService) {}

  @Get()
  getFreelancer(@Req() req: RequestWithUser) {
    return this.freelancerService.getFreelancer(req.user._id);
  }

  @Put()
  @UseGuards(FreelancerGuard)
  updateFreelancer(
    @Req() req: RequestWithUser,
    @Body() data: UpdateFreelancerDto,
  ) {
    return this.freelancerService.updateFreelancer(req.user, data);
  }
}
