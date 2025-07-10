# Payment System Documentation

## Overview

WENAB (We Need A Budget) includes a comprehensive payment system built with GoCardless as the payment provider. The system supports subscription management, payment processing, and webhook handling.

## Features

### Subscription Plans
- **Basic Plan**: £9.99/month or £99.90/year (17% savings)
- **Premium Plan**: £19.99/month or £199.90/year (17% savings)
- **Enterprise Plan**: £49.99/month or £499.90/year (17% savings)

### Payment Features
- Secure payment processing via GoCardless
- Subscription management (create, pause, resume, cancel)
- Payment history tracking
- Webhook event handling
- Automatic subscription status updates
- Row Level Security (RLS) for data protection

## Backend Implementation

### Services

#### GoCardlessService (`apps/wenab-api/src/payment/gocardless.service.ts`)
- Handles direct communication with GoCardless API
- Customer creation and management
- Subscription creation and management
- Payment processing
- Webhook signature verification

#### SubscriptionService (`apps/wenab-api/src/payment/subscription.service.ts`)
- Manages subscription lifecycle
- Plan configuration and pricing
- Subscription status tracking
- Integration with database

#### PaymentService (`apps/wenab-api/src/payment/payment.service.ts`)
- Webhook event processing
- Payment link generation
- Payment history management
- Refund processing

### Controllers

#### PaymentController (`apps/wenab-api/src/payment/payment.controller.ts`)
- REST API endpoints for payment operations
- Webhook endpoint for GoCardless events
- Subscription management endpoints
- Payment history endpoints

### Database Schema

#### Subscriptions Table
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    gocardless_customer_id VARCHAR(255),
    gocardless_subscription_id VARCHAR(255),
    plan_type VARCHAR(20),
    status VARCHAR(20),
    amount INTEGER,
    currency VARCHAR(3),
    interval VARCHAR(10),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Payments Table
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    subscription_id UUID REFERENCES subscriptions(id),
    gocardless_payment_id VARCHAR(255),
    amount INTEGER,
    currency VARCHAR(3),
    status VARCHAR(20),
    charge_date DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Webhook Events Table
```sql
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY,
    gocardless_event_id VARCHAR(255) UNIQUE,
    resource_type VARCHAR(50),
    action VARCHAR(50),
    resource_id VARCHAR(255),
    processed BOOLEAN,
    processed_at TIMESTAMP,
    created_at TIMESTAMP
);
```

## Frontend Implementation

### Pages

#### Pricing Page (`apps/wenab-frontend/src/pages/pricing.tsx`)
- Displays available subscription plans
- Monthly/yearly billing toggle
- Plan comparison with features
- Subscription creation flow
- FAQ section

#### Subscription Management (`apps/wenab-frontend/src/pages/subscription.tsx`)
- Current subscription details
- Payment history
- Subscription actions (pause, resume, cancel)
- Billing information
- Plan change options

### Components

#### SubscriptionGuard (`apps/wenab-frontend/src/components/subscription-guard.tsx`)
- Protects routes requiring active subscription
- Handles authentication and subscription checks
- Provides fallback UI for non-subscribers

## API Endpoints

### Authentication Required
- `GET /payments/plans` - Get available subscription plans
- `POST /payments/subscribe` - Create new subscription
- `GET /payments/subscription` - Get current subscription
- `POST /payments/subscription/cancel` - Cancel subscription
- `POST /payments/subscription/pause` - Pause subscription
- `POST /payments/subscription/resume` - Resume subscription
- `GET /payments/history` - Get payment history
- `POST /payments/payment-link` - Create payment link
- `POST /payments/refund/:paymentId` - Process refund

### Public
- `POST /payments/webhook` - GoCardless webhook endpoint

## Environment Configuration

### Required Environment Variables

```bash
# GoCardless Configuration
GOCARDLESS_ACCESS_TOKEN=your-gocardless-access-token
GOCARDLESS_ENVIRONMENT=sandbox  # or 'live'
GOCARDLESS_WEBHOOK_SECRET=your-gocardless-webhook-secret

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/wenab
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
```

## Setup Instructions

### 1. GoCardless Account Setup
1. Create a GoCardless account at https://gocardless.com
2. Set up your merchant account
3. Generate API access tokens (sandbox and live)
4. Configure webhook endpoints
5. Set up bank account details for testing

### 2. Database Migration
```bash
# Run the subscription tables migration
psql -d your_database -f apps/wenab-api/migrations/002_create_subscription_tables.sql
```

### 3. Environment Configuration
```bash
# Copy the example environment file
cp apps/wenab-api/.env.example apps/wenab-api/.env

# Update with your actual values
nano apps/wenab-api/.env
```

### 4. Install Dependencies
```bash
# Backend dependencies
cd apps/wenab-api
npm install gocardless-nodejs

# Frontend dependencies
cd apps/wenab-frontend
npm install
```

### 5. Webhook Configuration
1. Set up webhook endpoint in GoCardless dashboard
2. URL: `https://your-domain.com/payments/webhook`
3. Events to subscribe to:
   - `subscriptions.created`
   - `subscriptions.activated`
   - `subscriptions.cancelled`
   - `subscriptions.paused`
   - `subscriptions.resumed`
   - `payments.confirmed`
   - `payments.failed`
   - `mandates.created`
   - `mandates.activated`

## Security Features

### Row Level Security (RLS)
- Users can only access their own subscription data
- Payment history is restricted to user's subscriptions
- Webhook events are system-only accessible

### Webhook Verification
- HMAC signature verification for webhook authenticity
- Event deduplication to prevent replay attacks
- Secure webhook secret management

### Data Protection
- Sensitive payment data stored in GoCardless
- Only reference IDs stored in local database
- Encrypted communication with payment provider

## Testing

### Sandbox Environment
- Use GoCardless sandbox for development
- Test bank account details provided by GoCardless
- Webhook testing with GoCardless webhook simulator

### Test Data
```javascript
// Test bank account details (sandbox only)
{
  account_number: '55779911',
  branch_code: '200000',
  account_holder_name: 'Frank Osborne',
  country_code: 'GB'
}
```

## Production Deployment

### GoCardless Live Environment
1. Switch to live GoCardless environment
2. Update environment variables
3. Configure live webhook endpoints
4. Set up proper SSL certificates
5. Monitor webhook delivery and processing

### Monitoring
- Webhook event processing logs
- Payment failure alerts
- Subscription status monitoring
- API rate limiting compliance

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Check webhook URL configuration
   - Verify webhook secret
   - Check server logs for errors

2. **Subscription Creation Fails**
   - Verify GoCardless access token
   - Check customer data format
   - Ensure bank account details are valid

3. **Payment Processing Issues**
   - Check subscription status
   - Verify mandate activation
   - Review payment failure reasons

### Support
- GoCardless API documentation: https://developer.gocardless.com/
- GoCardless support: https://support.gocardless.com/
- Webhook testing: https://developer.gocardless.com/api-reference/#webhooks

## Future Enhancements

### Planned Features
- Invoice generation and download
- Multiple payment methods support
- Subscription upgrade/downgrade with proration
- Advanced analytics and reporting
- Team billing and management
- Custom plan creation
- Payment retry logic
- Subscription renewal reminders