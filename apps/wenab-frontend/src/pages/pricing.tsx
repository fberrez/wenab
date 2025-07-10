import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/auth-context';

interface Plan {
  price: number;
  currency: string;
  interval: string;
  savings?: string;
  features: string[];
}

interface Plans {
  basic: {
    monthly: Plan;
    yearly: Plan;
  };
  premium: {
    monthly: Plan;
    yearly: Plan;
  };
  enterprise: {
    monthly: Plan;
    yearly: Plan;
  };
}

export function Pricing() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.get('/payments/plans').then((res: any) => res.data),
  });

  const { data: currentSubscription } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: () => api.get('/payments/subscription').then((res: any) => res.data),
    enabled: !!user,
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: (data: any) => api.post('/payments/subscribe', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      setSelectedPlan(null);
    },
  });

  const handleSubscribe = (planType: string) => {
    if (!user) {
      // Redirect to sign in
      return;
    }

    setSelectedPlan(planType);
    createSubscriptionMutation.mutate({
      planType,
      interval: selectedInterval,
      customerEmail: user.email,
      customerGivenName: user.user_metadata?.full_name?.split(' ')[0] || 'User',
      customerFamilyName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'Name',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          <p className="text-gray-600 mt-2">Select the perfect plan for your budgeting needs</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const planData = plans as Plans;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Choose Your Plan</h1>
        <p className="text-gray-600 mt-2">Select the perfect plan for your budgeting needs</p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedInterval('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedInterval === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedInterval('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedInterval === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            {selectedInterval === 'yearly' && (
              <span className="ml-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Save 17%
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="flex justify-center">
        <Card className="relative border-blue-500 shadow-lg max-w-md w-full">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              Complete Solution
            </span>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <Crown className="mr-2 h-5 w-5 text-blue-600" />
              WENAB
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold">
                €{planData?.basic[selectedInterval]?.price}
                <span className="text-sm font-normal text-gray-500">/{selectedInterval === 'monthly' ? 'month' : 'year'}</span>
              </div>
              {selectedInterval === 'yearly' && (
                <div className="text-sm text-green-600 font-medium">
                  Save {planData?.basic.yearly.savings}
                </div>
              )}
            </div>
            <ul className="space-y-2">
              {planData?.basic[selectedInterval]?.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className="w-full" 
              onClick={() => handleSubscribe('basic')}
              disabled={createSubscriptionMutation.isPending && selectedPlan === 'basic'}
            >
              {createSubscriptionMutation.isPending && selectedPlan === 'basic' ? 'Processing...' : 'Start Free Trial'}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              34-day free trial • Cancel anytime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Subscription Info */}
      {currentSubscription && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-blue-900">Current Subscription</h3>
              <p className="text-blue-700">
                You are currently on the {currentSubscription.plan_type} plan 
                ({currentSubscription.interval} billing at €{(currentSubscription.amount / 100).toFixed(2)})
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Status: {currentSubscription.status}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-center mb-6">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">What's included in the free trial?</h3>
            <p className="text-gray-600 text-sm">You get 34 days to test all features including zero-based budgeting, envelope system, bank integration, and more. No credit card required.</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Can I cancel anytime?</h3>
            <p className="text-gray-600 text-sm">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600 text-sm">We accept all major debit cards and bank transfers through GoCardless, ensuring secure and reliable payments.</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Is my data secure?</h3>
            <p className="text-gray-600 text-sm">Yes, we use end-to-end encryption to protect your financial data. You control your encryption keys and can choose to decrypt for support.</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Can I self-host WENAB?</h3>
            <p className="text-gray-600 text-sm">Yes! WENAB is fully open-source and well-documented for self-hosting. You can run it on your own server for complete control.</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Do you have a mobile app?</h3>
            <p className="text-gray-600 text-sm">Mobile apps for iOS and Android are in development. The web app is fully responsive and works great on mobile devices.</p>
          </div>
        </div>
      </div>
    </div>
  );
}