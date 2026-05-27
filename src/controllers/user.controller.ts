import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { UserRole, VerificationStatus } from 'src/enums/user.enum';
import { AdminGuard } from 'src/guards/admin.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { UserService } from 'src/services/user.service';
import type { RequestWithUser } from 'src/types/express';

@Controller('/api/users')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getAllUsers(
    @Req() req: RequestWithUser,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.userService.getAllUsers(
      req.user._id,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  updateUserRole(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() role: UserRole,
  ) {
    return this.userService.updateUserRole(req.user, id, role);
  }

  @Patch()
  @UseInterceptors(FileInterceptor('avatar'))
  updateAvatar(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.updateAvatar(req.user, file);
  }

  @Post('identity')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'idCard', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
    ]),
  )
  uploadIdentity(
    @Req() req: RequestWithUser,
    @UploadedFiles()
    files: { idCard?: Express.Multer.File[]; selfie?: Express.Multer.File[] },
  ) {
    return this.userService.uploadIdentity(req.user, files);
  }

  @Get('requests')
  @UseGuards(AdminGuard)
  getVerificationRequests(@Req() req: RequestWithUser) {
    return this.userService.getVerificationRequests(req.user);
  }

  @Patch('verify-status/:id')
  @UseGuards(AdminGuard)
  verifyUser(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() status: VerificationStatus,
  ) {
    return this.userService.verifyUser(req.user, id, status);
  }
}
