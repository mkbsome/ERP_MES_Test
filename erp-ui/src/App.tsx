import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import {
  Dashboard,
  Sales,
  Purchase,
  Inventory,
  Production,
  Master,
  Settings,
} from './pages';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/purchase" element={<Purchase />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/production" element={<Production />} />
        <Route path="/master" element={<Master />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
