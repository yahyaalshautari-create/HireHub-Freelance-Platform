import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateProjectDto } from 'src/dtos/project/create-project.dto';
import { ProjectStatus } from 'src/enums/project.enum';
import { AuthGuard } from 'src/guards/auth.guard';
import { ClientGuard } from 'src/guards/client.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { ProjectService } from 'src/services/project.service';
import type { RequestWithUser } from 'src/types/express';

@Controller('/api/projects')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @UseGuards(ClientGuard)
  createProject(@Req() req: RequestWithUser, @Body() data: CreateProjectDto) {
    return this.projectService.createProject(req.user._id, data);
  }

  @Patch(':id')
  reviewProject(
    @Req() req: RequestWithUser,
    @Param('id') projectId: string,
    @Body('status') status: ProjectStatus.OPEN | ProjectStatus.REJECTED,
  ) {
    return this.projectService.reviewProject(req.user._id, projectId, status);
  }

  @Get()
  getAllProjects(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.projectService.getAllProjects(page, limit);
  }

  @Get(':id')
  getProjectById(@Param('id') projectId: string) {
    return this.projectService.getProjectById(projectId);
  }

  @Get('client/:clientId')
  getProjectByClient(@Param('clientId') clientId: string) {
    return this.projectService.getProjectByClient(clientId);
  }

  @Delete(':id')
  deleteProject(@Req() req: RequestWithUser, @Param('id') projectId: string) {
    return this.projectService.deleteProject(req.user, projectId);
  }
}
