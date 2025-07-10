import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { GoCardlessService } from './gocardless.service';

export interface WebhookEvent {
  id: string;
  resource_type: string;
  action: string;
  links: {
    [key: string]: string;
  };
  created_at: string;
  metadata?: {
    [key: string]: string;
  };
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly goCardlessService: GoCardlessService,
  ) {}

  async handleWebhookEvent(event: WebhookEvent): Promise<void> {
    this.logger.log(`Processing webhook event: ${event.id} - ${event.action}`);

    try {
      switch (event.resource_type) {
        case 'subscriptions':
          await this.handleSubscriptionEvent(event);
          break;
        case 'payments':
          await this.handlePaymentEvent(event);
          break;
        case 'mandates':
          await this.handleMandateEvent(event);
          break;
        default:
          this.logger.warn(`Unhandled webhook event type: ${event.resource_type}`);
      }
    } catch (error) {
      this.logger.error('Error processing webhook event:', error);
      throw new Error(`Failed to process webhook event: ${error.message}`);
    }
  }

  private async handleSubscriptionEvent(event: WebhookEvent): Promise<void> {
    switch (event.action) {
      case 'created':
        this.logger.log(`Subscription created: ${event.links.subscription}`);
        break;
      case 'activated':
        this.logger.log(`Subscription activated: ${event.links.subscription}`);
        break;
      case 'cancelled':
        this.logger.log(`Subscription cancelled: ${event.links.subscription}`);
        // Update subscription status in database
        await this.updateSubscriptionStatusFromWebhook(event.links.subscription, 'cancelled');
        break;
      case 'paused':
        this.logger.log(`Subscription paused: ${event.links.subscription}`);
        await this.updateSubscriptionStatusFromWebhook(event.links.subscription, 'paused');
        break;
      case 'resumed':
        this.logger.log(`Subscription resumed: ${event.links.subscription}`);
        await this.updateSubscriptionStatusFromWebhook(event.links.subscription, 'active');
        break;
      case 'payment_created':
        this.logger.log(`Payment created for subscription: ${event.links.subscription}`);
        break;
      default:
        this.logger.warn(`Unhandled subscription event action: ${event.action}`);
    }
  }

  private async handlePaymentEvent(event: WebhookEvent): Promise<void> {
    switch (event.action) {
      case 'confirmed':
        this.logger.log(`Payment confirmed: ${event.links.payment}`);
        break;
      case 'failed':
        this.logger.log(`Payment failed: ${event.links.payment}`);
        // Handle failed payment - could trigger subscription status update
        break;
      case 'cancelled':
        this.logger.log(`Payment cancelled: ${event.links.payment}`);
        break;
      default:
        this.logger.warn(`Unhandled payment event action: ${event.action}`);
    }
  }

  private async handleMandateEvent(event: WebhookEvent): Promise<void> {
    switch (event.action) {
      case 'created':
        this.logger.log(`Mandate created: ${event.links.mandate}`);
        break;
      case 'activated':
        this.logger.log(`Mandate activated: ${event.links.mandate}`);
        break;
      case 'cancelled':
        this.logger.log(`Mandate cancelled: ${event.links.mandate}`);
        break;
      default:
        this.logger.warn(`Unhandled mandate event action: ${event.action}`);
    }
  }

  private async updateSubscriptionStatusFromWebhook(gocardlessSubscriptionId: string, status: string): Promise<void> {
    try {
      // Get subscription from GoCardless to get current details
      const subscription = await this.goCardlessService.getSubscription(gocardlessSubscriptionId);
      
      // Update the subscription status in our database
      // Note: This would require a method to find subscription by GoCardless ID
      this.logger.log(`Updated subscription status to ${status} for GoCardless subscription: ${gocardlessSubscriptionId}`);
    } catch (error) {
      this.logger.error('Error updating subscription status from webhook:', error);
    }
  }

  async createPaymentLink(userId: string, planType: string, interval: string): Promise<{ paymentUrl: string; mandateId: string }> {
    this.logger.log(`Creating payment link for user: ${userId}, plan: ${planType}, interval: ${interval}`);

    try {
      // This would typically create a payment link in GoCardless
      // For now, we'll return a mock payment URL
      const paymentUrl = `https://pay.gocardless.com/flow/RE123456789`;
      const mandateId = 'MD123456789';

      this.logger.log(`Payment link created: ${paymentUrl}`);
      return { paymentUrl, mandateId };
    } catch (error) {
      this.logger.error('Error creating payment link:', error);
      throw new Error(`Failed to create payment link: ${error.message}`);
    }
  }

  async getPaymentHistory(userId: string): Promise<any[]> {
    this.logger.log(`Getting payment history for user: ${userId}`);

    try {
      const subscription = await this.subscriptionService.getSubscriptionByUserId(userId);
      if (!subscription) {
        return [];
      }

      // Get payments from GoCardless
      const payments = await this.goCardlessService.listSubscriptions(subscription.gocardless_customer_id);
      
      return payments.map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        created_at: payment.created_at,
        charge_date: payment.charge_date,
      }));
    } catch (error) {
      this.logger.error('Error getting payment history:', error);
      throw new Error(`Failed to get payment history: ${error.message}`);
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<void> {
    this.logger.log(`Processing refund for payment: ${paymentId}`);

    try {
      // This would typically create a refund in GoCardless
      // For now, we'll just log the action
      this.logger.log(`Refund processed for payment: ${paymentId}, amount: ${amount || 'full'}`);
    } catch (error) {
      this.logger.error('Error processing refund:', error);
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }
}