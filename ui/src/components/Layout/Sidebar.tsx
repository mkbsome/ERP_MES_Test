/**
 * MES/ERP Sidebar 컴포넌트
 * 계층형 메뉴 구조 및 시스템 전환 지원
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  CalendarDays,
  Play,
  Shield,
  Cpu,
  Monitor,
  Settings,
  ChevronDown,
  ChevronRight,
  Factory,
  Menu,
  X,
  ShoppingCart,
  Truck,
  Package,
  Calculator,
} from 'lucide-react';
import clsx from 'clsx';
import {
  mesMenuConfig,
  erpMenuConfig,
  dashboardMenu,
  erpDashboardMenu,
  type MenuGroup,
  type SystemType,
} from '../../config/menuConfig';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={20} />,
  Database: <Database size={20} />,
  CalendarDays: <CalendarDays size={20} />,
  Play: <Play size={20} />,
  Shield: <Shield size={20} />,
  Cpu: <Cpu size={20} />,
  Monitor: <Monitor size={20} />,
  Settings: <Settings size={20} />,
  ShoppingCart: <ShoppingCart size={20} />,
  Truck: <Truck size={20} />,
  Package: <Package size={20} />,
  Factory: <Factory size={20} />,
  Calculator: <Calculator size={20} />,
};

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['master', 'erp-master']);

  // 현재 경로에 따라 시스템 타입 결정
  const currentSystem: SystemType = location.pathname.startsWith('/erp') ? 'erp' : 'mes';
  const menuConfig = currentSystem === 'erp' ? erpMenuConfig : mesMenuConfig;
  const currentDashboard = currentSystem === 'erp' ? erpDashboardMenu : dashboardMenu;

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const isPathActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isGroupActive = (group: MenuGroup) => {
    return group.items.some((item) => isPathActive(item.path));
  };

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-800 border-r border-slate-700 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className={clsx(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              currentSystem === 'erp' ? 'bg-blue-600' : 'bg-emerald-600'
            )}>
              <Factory size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-white">GreenBoard</span>
              <span className={clsx(
                'text-xs ml-1',
                currentSystem === 'erp' ? 'text-blue-400' : 'text-emerald-400'
              )}>
                {currentSystem.toUpperCase()}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* System Switcher */}
      {!collapsed && (
        <div className="px-2 py-2 border-b border-slate-700">
          <div className="flex bg-slate-900 rounded-lg p-1">
            <Link
              to="/"
              className={clsx(
                'flex-1 text-center py-1.5 rounded-md text-xs font-medium transition-all',
                currentSystem === 'mes'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              MES
            </Link>
            <Link
              to="/erp"
              className={clsx(
                'flex-1 text-center py-1.5 rounded-md text-xs font-medium transition-all',
                currentSystem === 'erp'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              ERP
            </Link>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto custom-scrollbar">
        {/* Dashboard */}
        <Link
          to={currentDashboard.path!}
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
            isPathActive(currentDashboard.path)
              ? currentSystem === 'erp' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:bg-slate-700 hover:text-white'
          )}
        >
          {iconMap[currentDashboard.icon!]}
          {!collapsed && <span>{currentDashboard.name}</span>}
        </Link>

        {/* Separator */}
        <div className="my-2 border-t border-slate-700" />

        {/* Menu Groups */}
        {menuConfig.map((group) => (
          <div key={group.id}>
            {/* Group Header */}
            <button
              onClick={() => !collapsed && toggleGroup(group.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isGroupActive(group)
                  ? 'bg-slate-700/50 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              )}
            >
              {iconMap[group.icon]}
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{group.name}</span>
                  {expandedGroups.includes(group.id) ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </>
              )}
            </button>

            {/* Group Items */}
            {!collapsed && expandedGroups.includes(group.id) && (
              <div className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path!}
                    className={clsx(
                      'block px-3 py-1.5 rounded-md text-sm transition-all',
                      isPathActive(item.path)
                        ? currentSystem === 'erp'
                          ? 'bg-blue-600/20 text-blue-400 font-medium'
                          : 'bg-emerald-600/20 text-emerald-400 font-medium'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Version Info */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-700">
          <div className="text-xs text-slate-500">
            <p>GreenBoard {currentSystem.toUpperCase()} v1.0.0</p>
            <p>© 2024 GreenBoard Electronics</p>
          </div>
        </div>
      )}
    </aside>
  );
}
