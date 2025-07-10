import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSubscriptionDto } from './dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle GoCardless webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['webhook-signature'] as string;
    const payload = req.rawBody as string;

    // Verify webhook signature
    const isValid = await this.paymentService['goCardlessService'].verifyWebhookSignature(payload, signature);
    
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    const event = JSON.parse(payload);
    await this.paymentService.handleWebhookEvent(event);

    return { received: true };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({ status: 200, description: 'Subscription plans retrieved successfully' })
  async getSubscriptionPlans() {
    return this.subscriptionService.getSubscriptionPlans();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('subscribe')
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    
    return this.subscriptionService.createSubscription({
      ...createSubscriptionDto,
      userId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('subscription')
  @ApiOperation({ summary: 'Get current user subscription' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentSubscription(@Request() req: any) {
    const userId = req.user.id;
    return this.subscriptionService.getSubscriptionByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('subscription/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel current subscription' })
  @ApiResponse({ status: 204, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancelSubscription(@Request() req: any) {
    const userId = req.user.id;
    await this.subscriptionService.cancelSubscription(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('subscription/pause')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Pause current subscription' })
  @ApiResponse({ status: 204, description: 'Subscription paused successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async pauseSubscription(@Request() req: any) {
    const userId = req.user.id;
    await this.subscriptionService.pauseSubscription(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('subscription/resume')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Resume current subscription' })
  @ApiResponse({ status: 204, description: 'Subscription resumed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resumeSubscription(@Request() req: any) {
    const userId = req.user.id;
    await this.subscriptionService.resumeSubscription(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('history')
  @ApiOperation({ summary: 'Get payment history' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPaymentHistory(@Request() req: any) {
    const userId = req.user.id;
    return this.paymentService.getPaymentHistory(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('payment-link')
  @ApiOperation({ summary: 'Create payment link for subscription' })
  @ApiResponse({ status: 200, description: 'Payment link created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPaymentLink(
    @Body() body: { planType: string; interval: string },
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.paymentService.createPaymentLink(userId, body.planType, body.interval);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('refund/:paymentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Process refund for payment' })
  @ApiResponse({ status: 204, description: 'Refund processed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refundPayment(
    @Param('paymentId') paymentId: string,
    @Body() body: { amount?: number },
    @Request() req: any,
  ) {
    await this.paymentService.refundPayment(paymentId, body.amount);
  }
}