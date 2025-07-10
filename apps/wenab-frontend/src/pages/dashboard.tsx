import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus,
  DollarSign,
  Calendar
} from 'lucide-react';
import { api } from '../lib/api';

export function Dashboard() {
  const { data: budgets, isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.get('/budgets').then(res => res.data),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['summary'],
    queryFn: () => api.get('/budgets/summary').then(res => res.data),
    enabled: budgets && budgets.length > 0,
  });

  if (budgetsLoading || summaryLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalIncome = summary?.totalIncome || 0;
  const totalExpenses = summary?.totalExpenses || 0;
  const netAmount = totalIncome - totalExpenses;
  const activeBudgets = budgets?.length || 0;

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome to WENAB</h1>
        <p className="text-blue-100">
          Take control of your finances with zero-based budgeting
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalIncome.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalExpenses.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="mr-2 h-5 w-5" />
              Active Budgets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">{activeBudgets}</div>
            <Button asChild>
              <Link to="/budgets">
                <Plus className="mr-2 h-4 w-4" />
                Create New Budget
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budgets?.slice(0, 3).map((budget: any) => (
                <div key={budget.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{budget.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${budget.total_income - budget.total_expenses}</p>
                    <p className="text-sm text-gray-500">Net</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/transactions">View All Transactions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent budgets */}
      {budgets && budgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Budgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgets.slice(0, 5).map((budget: any) => (
                <div key={budget.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{budget.name}</h3>
                    <p className="text-sm text-gray-500">{budget.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${budget.total_income}</p>
                    <p className="text-sm text-gray-500">Income</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-medium">${budget.total_expenses}</p>
                    <p className="text-sm text-gray-500">Expenses</p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-4" asChild>
                    <Link to={`/budgets/${budget.id}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {(!budgets || budgets.length === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first budget to start tracking your finances
            </p>
            <Button asChild>
              <Link to="/budgets/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Budget
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}