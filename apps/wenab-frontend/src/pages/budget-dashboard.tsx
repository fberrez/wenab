import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  ArrowLeft, 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { ZeroBasedBudget } from '../components/budget/zero-based-budget';
import { TransactionTracker } from '../components/budget/transaction-tracker';
import { api } from '../lib/api';

interface BudgetSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  readyToAssign: number;
  categories: CategorySummary[];
  isShared: boolean;
  sharedUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface CategorySummary {
  id: string;
  name: string;
  description?: string;
  budgetedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  color?: string;
  icon?: string;
  isHidden: boolean;
  transactions: TransactionSummary[];
}

interface TransactionSummary {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string;
}

export function BudgetDashboard() {
  const { budgetId } = useParams<{ budgetId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showHidden, setShowHidden] = useState(false);

  const { data: budget, isLoading, error } = useQuery({
    queryKey: ['budget-summary', budgetId],
    queryFn: () => api.get(`/budgets/${budgetId}/summary`).then((res: any) => res.data),
    enabled: !!budgetId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !budget) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Budget Not Found</h1>
          <p className="text-gray-600 mb-4">The budget you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/budgets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Budgets
          </Button>
        </div>
      </div>
    );
  }

  const budgetData = budget as BudgetSummary;
  const visibleCategories = budgetData.categories.filter(cat => !cat.isHidden || showHidden);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getBudgetProgress = () => {
    const totalDays = Math.ceil(
      (new Date(budgetData.endDate).getTime() - new Date(budgetData.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysElapsed = Math.ceil(
      (new Date().getTime() - new Date(budgetData.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100);
  };

  const getBudgetStatus = () => {
    if (budgetData.totalSpent > budgetData.totalBudgeted) {
      return { status: 'over', color: 'text-red-600', icon: AlertTriangle };
    } else if (budgetData.totalSpent === budgetData.totalBudgeted) {
      return { status: 'on-track', color: 'text-green-600', icon: CheckCircle };
    } else {
      return { status: 'under', color: 'text-blue-600', icon: TrendingDown };
    }
  };

  const budgetStatus = getBudgetStatus();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/budgets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{budgetData.name}</h1>
            <p className="text-gray-600">
              {formatDate(budgetData.startDate)} - {formatDate(budgetData.endDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHidden(!showHidden)}
          >
            {showHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showHidden ? 'Hide' : 'Show'} Hidden
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(budgetData.totalIncome)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Budgeted</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(budgetData.totalBudgeted)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Spent</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(budgetData.totalSpent)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <budgetStatus.icon className={`h-5 w-5 ${budgetStatus.color}`} />
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className={`text-2xl font-bold ${budgetStatus.color}`}>
                  {formatCurrency(budgetData.totalRemaining)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Budget Progress</h3>
            <Badge variant={budgetStatus.status === 'over' ? 'destructive' : 'secondary'}>
              {budgetStatus.status === 'over' ? 'Over Budget' : 'On Track'}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Time Progress</span>
              <span>{Math.round(getBudgetProgress())}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getBudgetProgress()}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span>Budget Usage</span>
              <span>{Math.round((budgetData.totalSpent / budgetData.totalBudgeted) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  budgetStatus.status === 'over' ? 'bg-red-600' : 'bg-green-600'
                }`}
                style={{ 
                  width: `${Math.min((budgetData.totalSpent / budgetData.totalBudgeted) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zero-Based Budgeting Status */}
      {budgetData.readyToAssign !== 0 && (
        <Card className={budgetData.readyToAssign > 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-medium ${budgetData.readyToAssign > 0 ? 'text-green-900' : 'text-red-900'}`}>
                  Zero-Based Budgeting Status
                </h3>
                <p className={`text-sm ${budgetData.readyToAssign > 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {budgetData.readyToAssign > 0 
                    ? `${formatCurrency(budgetData.readyToAssign)} ready to assign`
                    : `${formatCurrency(Math.abs(budgetData.readyToAssign))} over budget`
                  }
                </p>
              </div>
              {budgetData.readyToAssign === 0 ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="envelopes">Envelopes</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Top Spending Categories</h4>
                    <div className="space-y-2">
                      {visibleCategories
                        .sort((a, b) => b.spentAmount - a.spentAmount)
                        .slice(0, 5)
                        .map((category) => (
                          <div key={category.id} className="flex justify-between items-center">
                            <span className="text-sm">{category.name}</span>
                            <span className="text-sm font-medium">{formatCurrency(category.spentAmount)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Categories Over Budget</h4>
                    <div className="space-y-2">
                      {visibleCategories
                        .filter(cat => cat.spentAmount > cat.budgetedAmount)
                        .map((category) => (
                          <div key={category.id} className="flex justify-between items-center">
                            <span className="text-sm">{category.name}</span>
                            <span className="text-sm font-medium text-red-600">
                              {formatCurrency(category.spentAmount - category.budgetedAmount)} over
                            </span>
                          </div>
                        ))}
                      {visibleCategories.filter(cat => cat.spentAmount > cat.budgetedAmount).length === 0 && (
                        <p className="text-sm text-gray-500">All categories are within budget!</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="envelopes">
          <ZeroBasedBudget budgetId={budgetId!} />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionTracker budgetId={budgetId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}