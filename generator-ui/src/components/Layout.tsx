import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Database,
  Play,
  History,
  Settings,
  FileJson,
  LayoutDashboard,
  Zap
} from 'lucide-react';
import clsx from 'clsx';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '대시보드' },
  { path: '/realtime', icon: Zap, label: '실시간 시나리오' },
  { path: '/scenarios', icon: Database, label: '시나리오 설정' },
  { path: '/generate', icon: Play, label: '데이터 생성' },
  { path: '/history', icon: History, label: '생성 이력' },
  { path: '/export', icon: FileJson, label: '내보내기' },
  { path: '/settings', icon: Settings, label: '설정' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6 text-primary-400" />
            <span>Data Generator</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">ERP/MES Simulator</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              return (
                <li key={path}>
                  <Link
                    to={path}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
          <p>GreenBoard Electronics</p>
          <p>v2.0.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
