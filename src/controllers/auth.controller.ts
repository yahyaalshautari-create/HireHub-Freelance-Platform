import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SignUpDto } from 'src/dtos/auth/signup.dto';
import { AuthSerivce } from 'src/services/auth.service';
import type { Response } from 'express';
import type { RequestWithUser } from 'src/types/express';
import { LoginDto } from 'src/dtos/auth/login.dto';
import { AuthPipe } from 'src/validation.pipe';
import { AuthGuard } from 'src/guards/auth.guard';
import { ResponseInterceptor } from 'src/response.interceptor';

@Controller('/api/auth')
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthSerivce) {}

  @Post('signup')
  signup(
    @Body(AuthPipe) data: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signup(data, res);
  }

  @Post('login')
  login(
    @Body(AuthPipe) data: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(data, res);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() req: RequestWithUser) {
    return this.authService.me(req.user._id);
  }
}
