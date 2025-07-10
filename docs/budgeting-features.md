# WENAB Zero-Based Budgeting Features

## Overview

WENAB implements a comprehensive zero-based budgeting system that follows the "Give Every Dollar a Job" principle. This system provides users with powerful tools to take control of their finances through intentional spending and saving.

## Core Features

### 1. Zero-Based Budgeting (ZBB)

**Principle**: Every euro of income must be assigned to a specific category before the month begins.

**Key Components**:
- **Total Income Tracking**: All income sources are captured and totaled
- **Category Assignment**: Every euro is assigned to specific spending/saving categories
- **Validation**: System ensures total budgeted amount equals total income
- **Ready to Assign**: Shows unassigned funds that need to be allocated

**Benefits**:
- Eliminates wasteful spending
- Forces intentional financial decisions
- Provides complete visibility into money allocation
- Prevents overspending through proactive planning

### 2. Envelope System

**Digital Envelopes**: Each category acts as a digital envelope with allocated funds.

**Features**:
- **Visual Progress**: Color-coded progress bars show spending vs. budget
- **Real-time Updates**: Envelope balances update automatically with transactions
- **Over-budget Alerts**: Visual indicators when categories exceed budget
- **Money Movement**: Easy transfer of funds between categories

**Envelope Status**:
- 🟢 **On Track**: Spending within budget
- 🟡 **Warning**: Approaching budget limit
- 🔴 **Over Budget**: Exceeded allocated amount

### 3. Transaction Tracking

**Comprehensive Recording**: Track all income and expenses with detailed categorization.

**Transaction Features**:
- **Income vs. Expenses**: Clear distinction between money in and money out
- **Category Assignment**: Every transaction linked to a budget category
- **Date Tracking**: Chronological organization of financial activity
- **Description Field**: Detailed notes for each transaction
- **Real-time Updates**: Instant reflection in budget calculations

### 4. Budget Dashboard

**Comprehensive Overview**: Single view of all financial activity and status.

**Dashboard Components**:
- **Budget Progress**: Time-based and spending-based progress indicators
- **Category Overview**: Top spending categories and over-budget alerts
- **Financial Summary**: Income, budgeted, spent, and remaining amounts
- **Quick Actions**: Easy access to add transactions and move money

## Technical Implementation

### Backend Architecture

#### Database Schema

```sql
-- Budgets table
CREATE TABLE budgets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_income INTEGER NOT NULL, -- Amount in cents
    is_shared BOOLEAN DEFAULT FALSE,
    shared_user_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    budget_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    budgeted_amount INTEGER NOT NULL DEFAULT 0, -- Amount in cents
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(50),
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    budget_id UUID NOT NULL,
    category_id UUID NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    description VARCHAR(500) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Key Services

1. **ZeroBasedBudgetingService**: Core logic for ZBB operations
2. **BudgetService**: CRUD operations for budgets
3. **CategoryService**: Category management
4. **TransactionService**: Transaction tracking

#### API Endpoints

```typescript
// Budget Management
POST /budgets - Create zero-based budget
GET /budgets - List user budgets
GET /budgets/:id - Get budget details
PUT /budgets/:id - Update budget
DELETE /budgets/:id - Delete budget

// Zero-Based Budgeting
GET /budgets/:id/summary - Get budget summary with calculations
GET /budgets/:id/envelopes - Get envelope status for all categories
GET /budgets/:id/ready-to-assign - Get amount ready to assign
POST /budgets/:id/move-money - Move money between categories
POST /budgets/:id/assign-to-category - Assign money from Ready to Assign
POST /budgets/:id/rollover/:targetBudgetId - Roll over unused funds

// Categories
POST /budgets/:id/categories - Create category
GET /budgets/:id/categories - List categories
PUT /categories/:id - Update category
DELETE /categories/:id - Delete category

// Transactions
POST /budgets/:id/transactions - Add transaction
GET /budgets/:id/transactions - List transactions
PUT /transactions/:id - Update transaction
DELETE /transactions/:id - Delete transaction
```

### Frontend Components

#### Core Components

1. **ZeroBasedBudget**: Main ZBB interface with envelope visualization
2. **CreateBudgetForm**: Zero-based budget creation with validation
3. **TransactionTracker**: Transaction recording and management
4. **BudgetDashboard**: Comprehensive budget overview

#### Key Features

- **Real-time Validation**: Ensures zero-based budgeting compliance
- **Visual Feedback**: Color-coded progress indicators and status badges
- **Responsive Design**: Works seamlessly across devices
- **Intuitive Navigation**: Tabbed interface for different views

## User Workflow

### 1. Creating a Zero-Based Budget

1. **Set Total Income**: Enter all expected income for the budget period
2. **Create Categories**: Define spending and saving categories
3. **Assign Every Euro**: Distribute income across all categories
4. **Validation**: System ensures total budgeted equals total income
5. **Activate Budget**: Begin tracking transactions

### 2. Daily Budget Management

1. **Record Transactions**: Add income and expenses as they occur
2. **Monitor Envelopes**: Check category balances and progress
3. **Move Money**: Reallocate funds between categories as needed
4. **Stay on Track**: Use visual indicators to maintain budget discipline

### 3. Month-End Review

1. **Analyze Spending**: Review category performance and patterns
2. **Roll Over Funds**: Transfer unused amounts to next month
3. **Adjust Categories**: Modify allocations based on actual spending
4. **Plan Ahead**: Create next month's budget with improved accuracy

## Security & Privacy

### Data Protection

- **Row Level Security**: Users can only access their own budgets
- **Encrypted Storage**: All financial data encrypted at rest
- **Secure API**: JWT authentication for all endpoints
- **Audit Trail**: Complete transaction history with timestamps

### Privacy Features

- **Self-Hosted**: Complete control over data storage
- **No Third-Party Access**: No external services access financial data
- **Local Processing**: All calculations performed on user's infrastructure
- **Data Export**: Full data portability and export capabilities

## Integration with Payment System

### Subscription Integration

- **Free Trial**: 34-day free trial for new users
- **Subscription Required**: Active subscription needed for budgeting features
- **Feature Access**: Budgeting features tied to subscription status
- **Graceful Degradation**: Read-only access during payment issues

### Revenue Alignment

- **Value Proposition**: Premium budgeting features justify subscription cost
- **User Retention**: Engaging budgeting tools increase subscription retention
- **Feature Differentiation**: Advanced ZBB features distinguish from free alternatives

## Future Enhancements

### Planned Features

1. **Bank Integration**: Automatic transaction import
2. **Recurring Transactions**: Automated transaction scheduling
3. **Budget Templates**: Pre-built category structures
4. **Advanced Analytics**: Spending patterns and insights
5. **Mobile Apps**: Native iOS and Android applications
6. **Shared Budgets**: Multi-user budget collaboration
7. **Goal Tracking**: Financial goal integration with budgets
8. **Export/Import**: Data portability and backup features

### Technical Roadmap

1. **Performance Optimization**: Database query optimization
2. **Real-time Updates**: WebSocket integration for live updates
3. **Offline Support**: Local storage for offline functionality
4. **API Versioning**: Stable API with backward compatibility
5. **Testing Coverage**: Comprehensive unit and integration tests

## Best Practices

### For Users

1. **Start Small**: Begin with basic categories and expand gradually
2. **Be Consistent**: Record transactions regularly and accurately
3. **Review Regularly**: Weekly budget reviews for better control
4. **Adjust Flexibly**: Modify categories based on actual spending patterns
5. **Plan for Irregular Expenses**: Include annual and irregular costs

### For Developers

1. **Data Validation**: Always validate zero-based budgeting constraints
2. **Error Handling**: Graceful handling of edge cases and errors
3. **Performance**: Optimize database queries for large datasets
4. **Security**: Implement proper authentication and authorization
5. **Testing**: Comprehensive testing of financial calculations

## Conclusion

WENAB's zero-based budgeting system provides a powerful, privacy-focused alternative to existing budgeting tools. By implementing the "Give Every Dollar a Job" principle with modern technology, users gain complete control over their finances while maintaining data privacy and security.

The system's modular architecture allows for continuous improvement and feature expansion, ensuring WENAB remains competitive in the personal finance management space while staying true to its privacy-first mission.