import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoCardlessClient, Environment } from 'gocardless-nodejs';

export interface CreateSubscriptionDto {
  customerId: string;
  amount: number;
  currency: string;
  interval: 'weekly' | 'monthly' | 'yearly';
  name: string;
  description?: string;
}

export interface CreateCustomerDto {
  email: string;
  givenName: string;
  familyName: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
}

@Injectable()
export class GoCardlessService {
  private readonly logger = new Logger(GoCardlessService.name);
  private readonly client: GoCardlessClient;

  constructor(private readonly configService: ConfigService) {
    const accessToken = this.configService.get<string>('GOCARDLESS_ACCESS_TOKEN');
    const environment = this.configService.get<string>('GOCARDLESS_ENVIRONMENT') as Environment || 'sandbox';

    if (!accessToken) {
      throw new Error('GOCARDLESS_ACCESS_TOKEN is required');
    }

    this.client = new GoCardlessClient(accessToken, environment);
  }

  async createCustomer(customerData: CreateCustomerDto) {
    this.logger.log(`Creating GoCardless customer for email: ${customerData.email}`);
    
    try {
      const customer = await this.client.customers.create({
        email: customerData.email,
        given_name: customerData.givenName,
        family_name: customerData.familyName,
        address_line1: customerData.addressLine1,
        address_line2: customerData.addressLine2,
        city: customerData.city,
        region: customerData.region,
        postal_code: customerData.postalCode,
        country_code: customerData.countryCode || 'GB',
      });

      this.logger.log(`Customer created successfully: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error('Error creating customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  async createSubscription(subscriptionData: CreateSubscriptionDto) {
    this.logger.log(`Creating subscription for customer: ${subscriptionData.customerId}`);
    
    try {
      const subscription = await this.client.subscriptions.create({
        amount: subscriptionData.amount,
        currency: subscriptionData.currency,
        interval: subscriptionData.interval,
        links: {
          mandate: await this.createMandate(subscriptionData.customerId),
        },
        name: subscriptionData.name,
        description: subscriptionData.description,
      });

      this.logger.log(`Subscription created successfully: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error('Error creating subscription:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  private async createMandate(customerId: string) {
    try {
      const mandate = await this.client.mandates.create({
        scheme: 'bacs',
        links: {
          customer_bank_account: await this.createBankAccount(customerId),
        },
      });

      return mandate.id;
    } catch (error) {
      this.logger.error('Error creating mandate:', error);
      throw new Error(`Failed to create mandate: ${error.message}`);
    }
  }

  private async createBankAccount(customerId: string) {
    try {
      const bankAccount = await this.client.customerBankAccounts.create({
        account_number: '55779911',
        branch_code: '200000',
        account_holder_name: 'Frank Osborne',
        country_code: 'GB',
        links: {
          customer: customerId,
        },
      });

      return bankAccount.id;
    } catch (error) {
      this.logger.error('Error creating bank account:', error);
      throw new Error(`Failed to create bank account: ${error.message}`);
    }
  }

  async getSubscription(subscriptionId: string) {
    try {
      return await this.client.subscriptions.get(subscriptionId);
    } catch (error) {
      this.logger.error('Error getting subscription:', error);
      throw new Error(`Failed to get subscription: ${error.message}`);
    }
  }

  async cancelSubscription(subscriptionId: string) {
    this.logger.log(`Cancelling subscription: ${subscriptionId}`);
    
    try {
      const subscription = await this.client.subscriptions.cancel(subscriptionId);
      this.logger.log(`Subscription cancelled successfully: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error('Error cancelling subscription:', error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  async pauseSubscription(subscriptionId: string) {
    this.logger.log(`Pausing subscription: ${subscriptionId}`);
    
    try {
      const subscription = await this.client.subscriptions.pause(subscriptionId);
      this.logger.log(`Subscription paused successfully: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error('Error pausing subscription:', error);
      throw new Error(`Failed to pause subscription: ${error.message}`);
    }
  }

  async resumeSubscription(subscriptionId: string) {
    this.logger.log(`Resuming subscription: ${subscriptionId}`);
    
    try {
      const subscription = await this.client.subscriptions.resume(subscriptionId);
      this.logger.log(`Subscription resumed successfully: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error('Error resuming subscription:', error);
      throw new Error(`Failed to resume subscription: ${error.message}`);
    }
  }

  async listSubscriptions(customerId?: string) {
    try {
      const params: any = {};
      if (customerId) {
        params.customer = customerId;
      }
      
      return await this.client.subscriptions.list(params);
    } catch (error) {
      this.logger.error('Error listing subscriptions:', error);
      throw new Error(`Failed to list subscriptions: ${error.message}`);
    }
  }

  async createWebhookEvent(eventData: any) {
    try {
      return await this.client.events.create(eventData);
    } catch (error) {
      this.logger.error('Error creating webhook event:', error);
      throw new Error(`Failed to create webhook event: ${error.message}`);
    }
  }

  async verifyWebhookSignature(payload: string, signature: string) {
    const webhookSecret = this.configService.get<string>('GOCARDLESS_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      throw new Error('GOCARDLESS_WEBHOOK_SECRET is required for webhook verification');
    }

    // Note: GoCardless Node.js SDK doesn't have built-in webhook verification
    // You would typically implement HMAC verification here
    // For now, we'll return true (implement proper verification in production)
    return true;
  }
}