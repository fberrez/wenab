import { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/auth-context';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Crown, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SubscriptionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionGuard({ children, fallback }: SubscriptionGuardProps) {
  const { user } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: () => api.get('/payments/subscription').then((res: any) => res.data),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-500 mb-6">
              Please sign in to access this feature.
            </p>
            <Button asChild>
              <Link to="/auth/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!subscription || subscription.status !== 'active') {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Crown className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Subscription Required</h3>
            <p className="text-gray-500 mb-6">
              This feature requires an active subscription. Please upgrade your plan to continue.
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link to="/pricing">View Plans</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/subscription">Manage Subscription</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}