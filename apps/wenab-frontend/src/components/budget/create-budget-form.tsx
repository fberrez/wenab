import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Plus, Trash2, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface Category {
  name: string;
  description?: string;
  budgetedAmount: number;
  color?: string;
  icon?: string;
  isHidden: boolean;
}

interface CreateBudgetFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateBudgetForm({ onSuccess, onCancel }: CreateBudgetFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    totalIncome: 0,
  });
  const [categories, setCategories] = useState<Category[]>([
    {
      name: 'Groceries',
      description: 'Food and household items',
      budgetedAmount: 0,
      color: '#3B82F6',
      icon: 'shopping-cart',
      isHidden: false,
    },
    {
      name: 'Transportation',
      description: 'Gas, public transport, car maintenance',
      budgetedAmount: 0,
      color: '#10B981',
      icon: 'car',
      isHidden: false,
    },
    {
      name: 'Entertainment',
      description: 'Movies, restaurants, hobbies',
      budgetedAmount: 0,
      color: '#F59E0B',
      icon: 'music',
      isHidden: false,
    },
    {
      name: 'Utilities',
      description: 'Electricity, water, internet, phone',
      budgetedAmount: 0,
      color: '#EF4444',
      icon: 'zap',
      isHidden: false,
    },
  ]);

  const createBudgetMutation = useMutation({
    mutationFn: (data: any) => api.post('/budgets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      onSuccess?.();
    },
  });

  const totalBudgeted = categories.reduce((sum, cat) => sum + cat.budgetedAmount, 0);
  const readyToAssign = formData.totalIncome - totalBudgeted;
  const isZeroBased = totalBudgeted === formData.totalIncome;

  const handleCategoryChange = (index: number, field: keyof Category, value: any) => {
    const updatedCategories = [...categories];
    updatedCategories[index] = { ...updatedCategories[index], [field]: value };
    setCategories(updatedCategories);
  };

  const addCategory = () => {
    setCategories([
      ...categories,
      {
        name: '',
        description: '',
        budgetedAmount: 0,
        color: '#6B7280',
        icon: 'tag',
        isHidden: false,
      },
    ]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isZeroBased) {
      alert('Zero-based budgeting requires all income to be assigned to categories!');
      return;
    }

    createBudgetMutation.mutate({
      ...formData,
      categories: categories.map(cat => ({
        ...cat,
        budgetedAmount: Math.round(cat.budgetedAmount * 100), // Convert to cents
      })),
      totalIncome: Math.round(formData.totalIncome * 100), // Convert to cents
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Zero-Based Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Budget Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Budget Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., March 2024 Budget"
                  required
                />
              </div>
              <div>
                <Label htmlFor="totalIncome">Total Income (€)</Label>
                <Input
                  id="totalIncome"
                  type="number"
                  step="0.01"
                  value={formData.totalIncome || ''}
                  onChange={(e) => setFormData({ ...formData, totalIncome: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your budget goals..."
              />
            </div>

            {/* Zero-Based Budgeting Summary */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-blue-900">Zero-Based Budgeting Status</h3>
                  {isZeroBased ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Total Income:</span>
                    <span className="ml-2 font-medium">{formatCurrency(formData.totalIncome)}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Budgeted:</span>
                    <span className="ml-2 font-medium">{formatCurrency(totalBudgeted)}</span>
                  </div>
                  <div>
                    <span className={`${readyToAssign >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      Ready to Assign:
                    </span>
                    <span className={`ml-2 font-medium ${readyToAssign >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(readyToAssign)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                  {isZeroBased 
                    ? '✅ Every dollar has a job! Your budget is ready.' 
                    : '⚠️ Assign all income to categories to complete your zero-based budget.'
                  }
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Budget Categories</h3>
                <Button type="button" variant="outline" size="sm" onClick={addCategory}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category, index) => (
                  <Card key={index} className="relative">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Input
                            value={category.name}
                            onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                            placeholder="Category name"
                            className="flex-1 mr-2"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCategory(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <Input
                          value={category.description || ''}
                          onChange={(e) => handleCategoryChange(index, 'description', e.target.value)}
                          placeholder="Description (optional)"
                        />

                        <div className="flex items-center space-x-2">
                          <Input
                            type="color"
                            value={category.color}
                            onChange={(e) => handleCategoryChange(index, 'color', e.target.value)}
                            className="w-12 h-8"
                          />
                          <Input
                            value={category.icon || ''}
                            onChange={(e) => handleCategoryChange(index, 'icon', e.target.value)}
                            placeholder="Icon (optional)"
                            className="flex-1"
                          />
                        </div>

                        <div>
                          <Label>Budgeted Amount (€)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={category.budgetedAmount || ''}
                            onChange={(e) => handleCategoryChange(index, 'budgetedAmount', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`hidden-${index}`}
                            checked={category.isHidden}
                            onChange={(e) => handleCategoryChange(index, 'isHidden', e.target.checked)}
                          />
                          <Label htmlFor={`hidden-${index}`} className="text-sm">
                            Hide category
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createBudgetMutation.isPending || !isZeroBased}
              >
                {createBudgetMutation.isPending ? 'Creating...' : 'Create Budget'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}