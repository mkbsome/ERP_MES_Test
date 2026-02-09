/**
 * MES 메인 레이아웃 컴포넌트
 * 새로운 계층형 사이드바와 헤더 포함
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, User, ChevronDown, Search } from 'lucide-react';
import clsx from 'clsx';
import Sidebar from './Layout/Sidebar';
import { mesMenuConfig, dashboardMenu } from '../config/menuConfig';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // 현재 페이지 타이틀 찾기
  const getPageTitle = () => {
    if (location.pathname === dashboardMenu.path) {
      return dashboardMenu.name;
    }

    for (const group of mesMenuConfig) {
      for (const item of group.items) {
        if (location.pathname === item.path || location.pathname.startsWith(item.path + '/')) {
          return `${group.name} > ${item.name}`;
        }
      }
    }

    return 'GreenBoard MES';
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div
        className={clsx(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-6 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700">
          <div className="flex items-center gap-4">
            {/* Breadcrumb */}
            <h1 className="text-sm font-medium text-white">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="검색... (Ctrl+K)"
                className="w-64 pl-9 pr-4 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-white">관리자</p>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </div>

            {/* Current Time */}
            <div className="hidden xl:block text-xs text-slate-400 pl-3 border-l border-slate-700">
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
      {time.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}{' '}
      {time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}
