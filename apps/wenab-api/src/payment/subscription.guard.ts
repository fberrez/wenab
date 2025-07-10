import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const { hasActiveSubscription } = await this.subscriptionService.checkSubscriptionStatus(user.id);

    if (!hasActiveSubscription) {
      throw new ForbiddenException('Active subscription required');
    }

    return true;
  }
}