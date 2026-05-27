import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateFreelancerProjectDto } from 'src/dtos/freelancer-project/create-freelancer-project.dto';
import { FreelancerGuard } from 'src/guards/freelancer.guard';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import { FreelancerProjectService } from 'src/services/freelancer-project.service';
import type { RequestWithUser } from 'src/types/express';
import { ResponseInterceptor } from 'src/response.interceptor';

@Controller('/api/freelancer-projects')
@UseGuards(FreelancerGuard)
@UseInterceptors(ResponseInterceptor)
export class FreelancerProjectController {
  constructor(
    private readonly freelancerProjectService: FreelancerProjectService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 5))
  createFreelancerProject(
    @Req() req: RequestWithUser,
    @Body() data: CreateFreelancerProjectDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const authUser = req.user as AuthUser;
    return this.freelancerProjectService.crearteFreelancerProject(
      authUser,
      data,
      files,
    );
  }

  @Get(':freelancerId')
  getFreelancerProjects(@Param('freelancerId') freelancerId: string) {
    return this.freelancerProjectService.getFreelancerProjects(freelancerId);
  }

  @Get('/my-projects')
  getMyProjects(@Req() req: RequestWithUser) {
    return this.freelancerProjectService.getMyProjects(req.user._id);
  }

  @Put(':projectId')
  @UseInterceptors(FilesInterceptor('images', 5))
  updateFreelancerProject(
    @Req() req: RequestWithUser,
    @Param('projectId') projectId: string,
    @Body() data: Partial<CreateFreelancerProjectDto>,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.freelancerProjectService.updateFreelancerProject(
      req.user,
      projectId,
      data,
      files,
    );
  }

  @Delete(':projectId')
  deleteFreelancerProject(
    @Req() req: RequestWithUser,
    @Param('projectId') projectId: string,
  ) {
    return this.freelancerProjectService.deleteFreelancerProject(
      req.user,
      projectId,
    );
  }
}
