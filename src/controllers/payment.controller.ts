import {
    Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { PaymentService } from 'src/services/payment.service';
import type { RequestWithUser } from 'src/types/express';

@Controller('/api/payments')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor)
export class PaymentController {
  constructor(private readonly paymentSerivce: PaymentService) {}

  @Post(':contractId')
  createPayment(
    @Param('contractId') contractId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.paymentSerivce.createPayment(contractId, req.user._id);
  }

  @Get(':userId')
  getPaymentsUser(@Param('userId') id: string) {
    return this.paymentSerivce.getPaymentsUser(id);
  }

  @Put(':paymentId')
  releasePayment(
    @Req() req: RequestWithUser,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentSerivce.releasePayment(req.user, paymentId);
  }

  @Patch(':paymentId')
  refundPayment(
    @Req() req: RequestWithUser,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentSerivce.refundPayment(req.user, paymentId);
  }

  @Post('recharge')
  rechargeBalance(@Req() req: RequestWithUser, @Body() amount: number) {
    return this.paymentSerivce.rechargeBalance(req.user._id, amount);
  }
}
