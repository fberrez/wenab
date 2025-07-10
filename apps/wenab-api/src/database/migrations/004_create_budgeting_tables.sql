-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_income INTEGER NOT NULL DEFAULT 0, -- Amount in cents
    is_shared BOOLEAN DEFAULT FALSE,
    shared_user_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    budgeted_amount INTEGER NOT NULL DEFAULT 0, -- Amount in cents
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(50),
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Amount in cents (positive for income, negative for expenses)
    description VARCHAR(500) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_shared_user_ids ON budgets USING GIN(shared_user_ids);
CREATE INDEX IF NOT EXISTS idx_categories_budget_id ON categories(budget_id);
CREATE INDEX IF NOT EXISTS idx_transactions_budget_id ON transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Create RLS policies for budgets
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budgets" ON budgets
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = ANY(shared_user_ids)
    );

CREATE POLICY "Users can create their own budgets" ON budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" ON budgets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" ON budgets
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories of their budgets" ON categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM budgets 
            WHERE budgets.id = categories.budget_id 
            AND (budgets.user_id = auth.uid() OR auth.uid() = ANY(budgets.shared_user_ids))
        )
    );

CREATE POLICY "Users can create categories in their budgets" ON categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM budgets 
            WHERE budgets.id = categories.budget_id 
            AND budgets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update categories in their budgets" ON categories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM budgets 
            WHERE budgets.id = categories.budget_id 
            AND budgets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete categories in their budgets" ON categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM budgets 
            WHERE budgets.id = categories.budget_id 
            AND budgets.user_id = auth.uid()
        )
    );

-- Create RLS policies for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions of their budgets" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM budgets 
            WHERE budgets.id = transactions.budget_id 
            AND (budgets.user_id = auth.uid() OR auth.uid() = ANY(budgets.shared_user_ids))
        )
    );

CREATE POLICY "Users can create transactions in their budgets" ON transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM budgets 
            WHERE budgets.id = transactions.budget_id 
            AND budgets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update transactions in their budgets" ON transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM budgets 
            WHERE budgets.id = transactions.budget_id 
            AND budgets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete transactions in their budgets" ON transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM budgets 
            WHERE budgets.id = transactions.budget_id 
            AND budgets.user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate zero-based budgeting
CREATE OR REPLACE FUNCTION validate_zero_based_budget()
RETURNS TRIGGER AS $$
DECLARE
    total_budgeted INTEGER;
    total_income INTEGER;
BEGIN
    -- Get total income for the budget
    SELECT total_income INTO total_income
    FROM budgets
    WHERE id = NEW.budget_id;
    
    -- Get total budgeted amount for all categories in this budget
    SELECT COALESCE(SUM(budgeted_amount), 0) INTO total_budgeted
    FROM categories
    WHERE budget_id = NEW.budget_id;
    
    -- Add the new/updated category amount
    IF TG_OP = 'UPDATE' THEN
        total_budgeted := total_budgeted - OLD.budgeted_amount + NEW.budgeted_amount;
    ELSE
        total_budgeted := total_budgeted + NEW.budgeted_amount;
    END IF;
    
    -- Validate that total budgeted doesn't exceed total income
    IF total_budgeted > total_income THEN
        RAISE EXCEPTION 'Total budgeted amount (% cents) cannot exceed total income (% cents)', 
            total_budgeted, total_income;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to validate zero-based budgeting
CREATE TRIGGER validate_zero_based_budget_trigger
    BEFORE INSERT OR UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION validate_zero_based_budget();

-- Insert some default categories for new budgets
INSERT INTO categories (budget_id, name, description, budgeted_amount, color, icon, is_hidden) VALUES
    ('00000000-0000-0000-0000-000000000000', 'Ready to Assign', 'Money ready to be assigned to categories', 0, '#10B981', 'plus-circle', false),
    ('00000000-0000-0000-0000-000000000000', 'Groceries', 'Food and household items', 0, '#3B82F6', 'shopping-cart', false),
    ('00000000-0000-0000-0000-000000000000', 'Transportation', 'Gas, public transport, car maintenance', 0, '#10B981', 'car', false),
    ('00000000-0000-0000-0000-000000000000', 'Entertainment', 'Movies, restaurants, hobbies', 0, '#F59E0B', 'music', false),
    ('00000000-0000-0000-0000-000000000000', 'Utilities', 'Electricity, water, internet, phone', 0, '#EF4444', 'zap', false),
    ('00000000-0000-0000-0000-000000000000', 'Housing', 'Rent, mortgage, property taxes', 0, '#8B5CF6', 'home', false),
    ('00000000-0000-0000-0000-000000000000', 'Healthcare', 'Medical expenses, insurance', 0, '#EC4899', 'heart', false),
    ('00000000-0000-0000-0000-000000000000', 'Savings', 'Emergency fund, investments', 0, '#06B6D4', 'piggy-bank', false),
    ('00000000-0000-0000-0000-000000000000', 'Debt Payments', 'Credit cards, loans', 0, '#F97316', 'credit-card', false),
    ('00000000-0000-0000-0000-000000000000', 'Personal Care', 'Clothing, grooming, self-care', 0, '#84CC16', 'scissors', false);