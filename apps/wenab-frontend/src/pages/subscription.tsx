import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Pause, 
  Play,
  X,
  Download,
  Settings
} from 'lucide-react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

export function Subscription() {
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: () => api.get('/payments/subscription').then((res: any) => res.data),
  });

  const { data: paymentHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => api.get('/payments/history').then((res: any) => res.data),
    enabled: !!subscription,
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post('/payments/subscription/cancel'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => api.post('/payments/subscription/pause'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => api.post('/payments/subscription/resume'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'paused':
        return <Pause className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-red-500" />;
      case 'past_due':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
            <p className="text-gray-500 mb-6">
              You don't have an active subscription. Choose a plan to get started.
            </p>
            <Button asChild>
              <Link to="/pricing">View Plans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Subscription Management</h1>
        <Button variant="outline" asChild>
          <Link to="/pricing">Change Plan</Link>
        </Button>
      </div>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Plan</span>
            <Badge className={getStatusColor(subscription.status)}>
              {getStatusIcon(subscription.status)}
              <span className="ml-1 capitalize">{subscription.status}</span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Plan</label>
              <p className="text-lg font-semibold capitalize">{subscription.plan_type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Billing</label>
              <p className="text-lg font-semibold capitalize">{subscription.interval}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Amount</label>
              <p className="text-lg font-semibold">€{(subscription.amount / 100).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Current Period</label>
              <p className="text-sm">
                {new Date(subscription.current_period_start).toLocaleDateString()} - {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Next Payment</label>
              <p className="text-sm">
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {subscription.status === 'active' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => pauseMutation.mutate()}
                  disabled={pauseMutation.isPending}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  {pauseMutation.isPending ? 'Pausing...' : 'Pause Subscription'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="mr-2 h-4 w-4" />
                  {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                </Button>
              </>
            )}
            {subscription.status === 'paused' && (
              <Button
                onClick={() => resumeMutation.mutate()}
                disabled={resumeMutation.isPending}
              >
                <Play className="mr-2 h-4 w-4" />
                {resumeMutation.isPending ? 'Resuming...' : 'Resume Subscription'}
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to="/pricing">
                <Settings className="mr-2 h-4 w-4" />
                Change Plan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded animate-pulse">
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : paymentHistory && paymentHistory.length > 0 ? (
            <div className="space-y-2">
              {paymentHistory.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                  <div>
                    <p className="font-medium">Payment #{payment.id.slice(-8)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">€{(payment.amount / 100).toFixed(2)}</p>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-500">No payment history available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">GoCardless Customer ID</label>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">{subscription.gocardless_customer_id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Subscription ID</label>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">{subscription.gocardless_subscription_id}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download Invoice
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Update Billing
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}