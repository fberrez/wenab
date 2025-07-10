import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Routes } from 'react-router-dom';
import { Dashboard } from './pages/dashboard';
import { Budgets } from './pages/budgets';
import { Transactions } from './pages/transactions';
import { Pricing } from './pages/pricing';
import { Subscription } from './pages/subscription';
import { Layout } from './components/layout';
import { AuthProvider } from './contexts/auth-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/subscription" element={<Subscription />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
