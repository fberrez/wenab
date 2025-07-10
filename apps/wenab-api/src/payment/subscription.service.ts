import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';
import { GoCardlessService } from './gocardless.service';

export interface Subscription {
  id: string;
  user_id: string;
  gocardless_customer_id: string;
  gocardless_subscription_id: string;
  plan_type: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'paused' | 'past_due';
  amount: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionDto {
  userId: string;
  planType: 'basic' | 'premium' | 'enterprise';
  interval: 'monthly' | 'yearly';
  customerData: {
    email: string;
    givenName: string;
    familyName: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    countryCode?: string;
  };
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly goCardlessService: GoCardlessService,
  ) {}

  private getPlanDetails(planType: string, interval: string) {
    const plans = {
      basic: {
        monthly: { amount: 199, name: 'WENAB Basic - Monthly', description: 'Complete budgeting solution' },
        yearly: { amount: 1599, name: 'WENAB Basic - Yearly', description: 'Complete budgeting solution (save 33%)' },
      },
    };

    return plans[planType]?.[interval] || plans.basic.monthly;
  }

  async createSubscription(createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription> {
    this.logger.log(`Creating subscription for user: ${createSubscriptionDto.userId}`);
    
    const supabase = this.supabaseService.getClient();
    const planDetails = this.getPlanDetails(createSubscriptionDto.planType, createSubscriptionDto.interval);

    try {
      // Create GoCardless customer
      const customer = await this.goCardlessService.createCustomer(createSubscriptionDto.customerData);

      // Create GoCardless subscription
      const subscription = await this.goCardlessService.createSubscription({
        customerId: customer.id,
        amount: planDetails.amount,
        currency: 'EUR',
        interval: createSubscriptionDto.interval === 'yearly' ? 'yearly' : 'monthly',
        name: planDetails.name,
        description: planDetails.description,
      });

      // Store subscription in database
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: createSubscriptionDto.userId,
          gocardless_customer_id: customer.id,
          gocardless_subscription_id: subscription.id,
          plan_type: createSubscriptionDto.planType,
          status: subscription.status,
          amount: planDetails.amount,
          currency: 'EUR',
          interval: createSubscriptionDto.interval,
          current_period_start: subscription.start_date,
          current_period_end: subscription.end_date,
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Error storing subscription:', error.message);
        throw new Error(`Failed to store subscription: ${error.message}`);
      }

      this.logger.log(`Subscription created successfully: ${data.id}`);
      return data;
    } catch (error) {
      this.logger.error('Error creating subscription:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    this.logger.log(`Getting subscription for user: ${userId}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      this.logger.error('Error getting subscription:', error.message);
      throw new Error(`Failed to get subscription: ${error.message}`);
    }

    return data;
  }

  async updateSubscriptionStatus(subscriptionId: string, status: string): Promise<Subscription> {
    this.logger.log(`Updating subscription status: ${subscriptionId} to ${status}`);
    
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ status })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating subscription status:', error.message);
      throw new Error(`Failed to update subscription status: ${error.message}`);
    }

    return data;
  }

  async cancelSubscription(userId: string): Promise<void> {
    this.logger.log(`Cancelling subscription for user: ${userId}`);
    
    const subscription = await this.getSubscriptionByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    try {
      // Cancel in GoCardless
      await this.goCardlessService.cancelSubscription(subscription.gocardless_subscription_id);
      
      // Update status in database
      await this.updateSubscriptionStatus(subscription.id, 'cancelled');
      
      this.logger.log(`Subscription cancelled successfully: ${subscription.id}`);
    } catch (error) {
      this.logger.error('Error cancelling subscription:', error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  async pauseSubscription(userId: string): Promise<void> {
    this.logger.log(`Pausing subscription for user: ${userId}`);
    
    const subscription = await this.getSubscriptionByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    try {
      // Pause in GoCardless
      await this.goCardlessService.pauseSubscription(subscription.gocardless_subscription_id);
      
      // Update status in database
      await this.updateSubscriptionStatus(subscription.id, 'paused');
      
      this.logger.log(`Subscription paused successfully: ${subscription.id}`);
    } catch (error) {
      this.logger.error('Error pausing subscription:', error);
      throw new Error(`Failed to pause subscription: ${error.message}`);
    }
  }

  async resumeSubscription(userId: string): Promise<void> {
    this.logger.log(`Resuming subscription for user: ${userId}`);
    
    const subscription = await this.getSubscriptionByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    try {
      // Resume in GoCardless
      await this.goCardlessService.resumeSubscription(subscription.gocardless_subscription_id);
      
      // Update status in database
      await this.updateSubscriptionStatus(subscription.id, 'active');
      
      this.logger.log(`Subscription resumed successfully: ${subscription.id}`);
    } catch (error) {
      this.logger.error('Error resuming subscription:', error);
      throw new Error(`Failed to resume subscription: ${error.message}`);
    }
  }

  async checkSubscriptionStatus(userId: string): Promise<{ hasActiveSubscription: boolean; subscription?: Subscription }> {
    const subscription = await this.getSubscriptionByUserId(userId);
    
    if (!subscription) {
      return { hasActiveSubscription: false };
    }

    const hasActiveSubscription = subscription.status === 'active';
    return { hasActiveSubscription, subscription };
  }

  async getSubscriptionPlans() {
    return {
      basic: {
        monthly: {
          price: 1.99,
          currency: 'EUR',
          interval: 'monthly',
          features: [
            'Zero-based budgeting',
            'Envelope budgeting system',
            'Real-time syncing',
            'End-to-end encryption',
            'Customizable categories',
            'Goal tracking',
            'Shared budgets',
            'Bank integration',
            'Custom reporting',
            'Educational resources',
            'Data export (CSV, PDF)',
            'Roll-over system',
            'Mobile app access',
            'Community support'
          ]
        },
        yearly: {
          price: 15.99,
          currency: 'EUR',
          interval: 'yearly',
          savings: '33%',
          features: [
            'Zero-based budgeting',
            'Envelope budgeting system',
            'Real-time syncing',
            'End-to-end encryption',
            'Customizable categories',
            'Goal tracking',
            'Shared budgets',
            'Bank integration',
            'Custom reporting',
            'Educational resources',
            'Data export (CSV, PDF)',
            'Roll-over system',
            'Mobile app access',
            'Community support'
          ]
        }
      }
    };
  }
}