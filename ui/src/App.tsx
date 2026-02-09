// App.tsx 전체를 이걸로 교체하면 됩니다

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';

import {
  Dashboard,
  Production,
  Equipment,
  Quality,
  Material,
  Analytics,
  Settings,
} from './pages';

import { mesRoutes } from './routes/mesRoutes';
import { erpRoutes } from './routes/erpRoutes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchInterval: 1000 * 60,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {mesRoutes}
            {erpRoutes}
            <Route path="/production-legacy" element={<Production />} />
            <Route path="/equipment-legacy" element={<Equipment />} />
            <Route path="/quality-legacy" element={<Quality />} />
            <Route path="/material-legacy" element={<Material />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;