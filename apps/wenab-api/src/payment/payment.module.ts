import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { SubscriptionService } from './subscription.service';
import { GoCardlessService } from './gocardless.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, SubscriptionService, GoCardlessService],
  exports: [PaymentService, SubscriptionService, GoCardlessService],
})
export class PaymentModule {}