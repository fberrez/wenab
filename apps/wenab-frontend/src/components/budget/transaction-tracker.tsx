import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Plus, TrendingUp, TrendingDown, Calendar, Tag } from 'lucide-react';
import { api } from '../../lib/api';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  categoryName: string;
  type: 'expense' | 'income';
}

interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

interface TransactionTrackerProps {
  budgetId: string;
}

export function TransactionTracker({ budgetId }: TransactionTrackerProps) {
  const queryClient = useQueryClient();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    type: 'expense' as 'expense' | 'income',
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', budgetId],
    queryFn: () => api.get(`/budgets/${budgetId}/transactions`).then((res: any) => res.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', budgetId],
    queryFn: () => api.get(`/budgets/${budgetId}/categories`).then((res: any) => res.data),
  });

  const addTransactionMutation = useMutation({
    mutationFn: (data: any) => api.post(`/budgets/${budgetId}/transactions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary', budgetId] });
      setShowAddTransaction(false);
      setNewTransaction({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
        type: 'expense',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTransaction.amount || !newTransaction.description || !newTransaction.categoryId) {
      alert('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    addTransactionMutation.mutate({
      amount: Math.round(amount * 100), // Convert to cents
      description: newTransaction.description,
      date: newTransaction.date,
      category_id: newTransaction.categoryId,
      type: newTransaction.type,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories?.find((cat: Category) => cat.id === categoryId);
    return category?.color || '#6B7280';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories?.find((cat: Category) => cat.id === categoryId);
    return category?.name || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const transactionData = transactions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <Button onClick={() => setShowAddTransaction(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Add Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <div className="flex space-x-2 mt-1">
                    <Button
                      type="button"
                      variant={newTransaction.type === 'expense' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                    >
                      <TrendingDown className="mr-1 h-3 w-3" />
                      Expense
                    </Button>
                    <Button
                      type="button"
                      variant={newTransaction.type === 'income' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                    >
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Income
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Amount (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    className="w-full mt-1 p-2 border rounded"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <input
                    type="text"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    className="w-full mt-1 p-2 border rounded"
                    placeholder="What was this for?"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={newTransaction.categoryId}
                    onChange={(e) => setNewTransaction({ ...newTransaction, categoryId: e.target.value })}
                    className="w-full mt-1 p-2 border rounded"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories?.map((category: Category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Date</label>
                  <input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    className="w-full mt-1 p-2 border rounded"
                    required
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddTransaction(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addTransactionMutation.isPending}
                    className="flex-1"
                  >
                    {addTransactionMutation.isPending ? 'Adding...' : 'Add Transaction'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-2">
        {transactionData.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <TrendingDown className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                <p className="text-sm">Start tracking your spending by adding your first transaction.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          transactionData.map((transaction: Transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(transaction.categoryId) }}
                    />
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Tag className="h-3 w-3" />
                        <span>{getCategoryName(transaction.categoryId)}</span>
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {transaction.type === 'income' ? 'Income' : 'Expense'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {transactionData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(
                    transactionData
                      .filter((t: Transaction) => t.type === 'expense')
                      .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
                  )}
                </div>
                <div className="text-sm text-gray-500">Total Expenses</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    transactionData
                      .filter((t: Transaction) => t.type === 'income')
                      .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
                  )}
                </div>
                <div className="text-sm text-gray-500">Total Income</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${
                  transactionData.reduce((sum: number, t: Transaction) => 
                    sum + (t.type === 'income' ? t.amount : -t.amount), 0
                  ) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(
                    transactionData.reduce((sum: number, t: Transaction) => 
                      sum + (t.type === 'income' ? t.amount : -t.amount), 0
                    )
                  )}
                </div>
                <div className="text-sm text-gray-500">Net</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}