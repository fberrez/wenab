-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gocardless_customer_id VARCHAR(255) NOT NULL,
    gocardless_subscription_id VARCHAR(255) NOT NULL,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('basic', 'premium', 'enterprise')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused', 'past_due')),
    amount INTEGER NOT NULL, -- Amount in pence (e.g., 999 = £9.99)
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    interval VARCHAR(10) NOT NULL CHECK (interval IN ('monthly', 'yearly')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table for tracking individual payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    gocardless_payment_id VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL, -- Amount in pence
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled', 'charged_back')),
    charge_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhook_events table for tracking webhook processing
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gocardless_event_id VARCHAR(255) NOT NULL UNIQUE,
    resource_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_gocardless_customer_id ON subscriptions(gocardless_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_gocardless_subscription_id ON subscriptions(gocardless_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_gocardless_payment_id ON payments(gocardless_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_gocardless_event_id ON webhook_events(gocardless_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);

-- Create updated_at trigger function (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for payments
CREATE POLICY "Users can view payments for their subscriptions" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM subscriptions 
            WHERE subscriptions.id = payments.subscription_id 
            AND subscriptions.user_id = auth.uid()
        )
    );

-- Webhook events should only be accessible by the system
CREATE POLICY "System can manage webhook events" ON webhook_events
    FOR ALL USING (true);

-- Add subscription status to users table for quick access
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'none';
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20);

-- Create function to update user subscription status
CREATE OR REPLACE FUNCTION update_user_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE auth.users 
        SET 
            subscription_status = NEW.status,
            subscription_plan = NEW.plan_type
        WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE auth.users 
        SET 
            subscription_status = 'none',
            subscription_plan = NULL
        WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update user subscription status
CREATE TRIGGER update_user_subscription_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_user_subscription_status();