import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  Factory,
  Database,
  Settings,
  Menu,
  X,
  ChevronDown,
  Bell,
  User,
  Building2,
} from 'lucide-react';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navigation: NavItem[] = [
  { name: '대시보드', path: '/', icon: <LayoutDashboard size={20} /> },
  { name: '판매관리', path: '/sales', icon: <ShoppingCart size={20} /> },
  { name: '구매관리', path: '/purchase', icon: <Truck size={20} /> },
  { name: '재고관리', path: '/inventory', icon: <Package size={20} /> },
  { name: '생산관리', path: '/production', icon: <Factory size={20} /> },
  { name: '기준정보', path: '/master', icon: <Database size={20} /> },
  { name: '설정', path: '/settings', icon: <Settings size={20} /> },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-800 border-r border-slate-700 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Building2 size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-white">GreenBoard ERP</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                )}
              >
                {item.icon}
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                <User size={20} className="text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">ERP 관리자</p>
                <p className="text-xs text-slate-400 truncate">admin@greenboard.co.kr</p>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div
        className={clsx(
          'transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-20'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white">
              {navigation.find((n) => n.path === location.pathname)?.name || '대시보드'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Current Time */}
            <div className="text-sm text-slate-400">
              <CurrentTime />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

function CurrentTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span>
      {time.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}{' '}
      {time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}
