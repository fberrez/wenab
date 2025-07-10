import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Plus, 
  Move, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '../../lib/api';

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

interface ZeroBasedBudgetProps {
  budgetId: string;
}

export function ZeroBasedBudget({ budgetId }: ZeroBasedBudgetProps) {
  const queryClient = useQueryClient();
  const [showHidden, setShowHidden] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [moveMoneyModal, setMoveMoneyModal] = useState(false);
  const [assignMoneyModal, setAssignMoneyModal] = useState(false);

  const { data: budget, isLoading } = useQuery({
    queryKey: ['budget-summary', budgetId],
    queryFn: () => api.get(`/budgets/${budgetId}/summary`).then((res: any) => res.data),
  });

  const { data: envelopeStatus } = useQuery({
    queryKey: ['envelope-status', budgetId],
    queryFn: () => api.get(`/budgets/${budgetId}/envelopes`).then((res: any) => res.data),
    enabled: !!budget,
  });

  const moveMoneyMutation = useMutation({
    mutationFn: (data: { fromCategoryId: string; toCategoryId: string; amount: number }) =>
      api.post(`/budgets/${budgetId}/move-money`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-summary', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['envelope-status', budgetId] });
      setMoveMoneyModal(false);
    },
  });

  const assignMoneyMutation = useMutation({
    mutationFn: (data: { categoryId: string; amount: number }) =>
      api.post(`/budgets/${budgetId}/assign-to-category`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-summary', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['envelope-status', budgetId] });
      setAssignMoneyModal(false);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const budgetData = budget as BudgetSummary;
  const envelopes = envelopeStatus || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);
  };

  const getCategoryStatus = (category: CategorySummary) => {
    if (category.spentAmount > category.budgetedAmount) {
      return { status: 'over', icon: AlertTriangle, color: 'text-red-500' };
    } else if (category.spentAmount === category.budgetedAmount) {
      return { status: 'spent', icon: CheckCircle, color: 'text-green-500' };
    } else {
      return { status: 'under', icon: TrendingDown, color: 'text-blue-500' };
    }
  };

  const visibleCategories = budgetData.categories.filter(cat => !cat.isHidden || showHidden);

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{budgetData.name}</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHidden(!showHidden)}
              >
                {showHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showHidden ? 'Hide' : 'Show'} Hidden
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(budgetData.totalIncome)}
              </div>
              <div className="text-sm text-gray-500">Total Income</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(budgetData.totalBudgeted)}
              </div>
              <div className="text-sm text-gray-500">Budgeted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(budgetData.totalSpent)}
              </div>
              <div className="text-sm text-gray-500">Spent</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${budgetData.readyToAssign >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(budgetData.readyToAssign)}
              </div>
              <div className="text-sm text-gray-500">Ready to Assign</div>
            </div>
          </div>

          {/* Zero-based Budgeting Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Budget Allocation</span>
              <span>{Math.round((budgetData.totalBudgeted / budgetData.totalIncome) * 100)}%</span>
            </div>
            <Progress 
              value={(budgetData.totalBudgeted / budgetData.totalIncome) * 100} 
              className="h-2"
            />
            <div className="text-xs text-gray-500">
              {budgetData.totalBudgeted === budgetData.totalIncome 
                ? '✅ Every dollar has a job!' 
                : '⚠️ Not all income is assigned to categories'
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ready to Assign */}
      {budgetData.readyToAssign > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-900">Ready to Assign</h3>
                <p className="text-green-700">{formatCurrency(budgetData.readyToAssign)}</p>
              </div>
              <Button
                onClick={() => setAssignMoneyModal(true)}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Assign Money
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories/Envelopes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCategories.map((category) => {
          const status = getCategoryStatus(category);
          const envelope = envelopes.find(e => e.categoryId === category.id);
          const percentageUsed = category.budgetedAmount > 0 
            ? (category.spentAmount / category.budgetedAmount) * 100 
            : 0;

          return (
            <Card 
              key={category.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                category.isHidden ? 'opacity-60' : ''
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    {category.icon && <span className="mr-2">{category.icon}</span>}
                    {category.name}
                    {category.isHidden && <EyeOff className="ml-2 h-3 w-3" />}
                  </span>
                  <status.icon className={`h-4 w-4 ${status.color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Budgeted</span>
                    <span className="font-medium">{formatCurrency(category.budgetedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Spent</span>
                    <span className="font-medium">{formatCurrency(category.spentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Remaining</span>
                    <span className={`font-medium ${
                      category.remainingAmount < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(category.remainingAmount)}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress</span>
                      <span>{Math.round(percentageUsed)}%</span>
                    </div>
                    <Progress 
                      value={percentageUsed} 
                      className="h-1"
                      style={{
                        '--progress-background': category.color || '#3B82F6',
                      } as React.CSSProperties}
                    />
                  </div>

                  {/* Status Badge */}
                  <div className="flex justify-center">
                    <Badge 
                      variant={category.remainingAmount < 0 ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {category.remainingAmount < 0 ? 'Over Budget' : 'On Track'}
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-1 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategory(category.id);
                        setMoveMoneyModal(true);
                      }}
                    >
                      <Move className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategory(category.id);
                        setAssignMoneyModal(true);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Move Money Modal */}
      {moveMoneyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Move Money</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">From Category</label>
                  <select className="w-full mt-1 p-2 border rounded">
                    {visibleCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({formatCurrency(cat.remainingAmount)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">To Category</label>
                  <select className="w-full mt-1 p-2 border rounded">
                    {visibleCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount (€)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full mt-1 p-2 border rounded"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setMoveMoneyModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      // Implement move money logic
                      setMoveMoneyModal(false);
                    }}
                    className="flex-1"
                  >
                    Move Money
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Money Modal */}
      {assignMoneyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Assign Money</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">To Category</label>
                  <select className="w-full mt-1 p-2 border rounded">
                    {visibleCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount (€)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full mt-1 p-2 border rounded"
                    placeholder="0.00"
                    max={budgetData.readyToAssign / 100}
                  />
                </div>
                <div className="text-sm text-gray-500">
                  Available: {formatCurrency(budgetData.readyToAssign)}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setAssignMoneyModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      // Implement assign money logic
                      setAssignMoneyModal(false);
                    }}
                    className="flex-1"
                  >
                    Assign Money
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}