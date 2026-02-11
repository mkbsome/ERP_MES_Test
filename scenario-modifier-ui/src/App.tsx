import { useState } from 'react';
import {
  LayoutDashboard,
  Zap,
  History,
  Menu,
  X,
  Github,
  ExternalLink,
  Factory,
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import ScenarioApply from './components/ScenarioApply';
import HistoryView from './components/History';

type Tab = 'dashboard' | 'scenario' | 'history';

const TABS: { id: Tab; name: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', name: '데이터 현황', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'scenario', name: '시나리오 적용', icon: <Zap className="w-5 h-5" /> },
  { id: 'history', name: '수정 이력', icon: <History className="w-5 h-5" /> },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'scenario':
        return <ScenarioApply />;
      case 'history':
        return <HistoryView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Factory size={18} className="text-white" />
              </div>
              <div className="ml-3">
                <div className="flex items-center">
                  <span className="font-bold text-white">Scenario Modifier</span>
                  <span className="text-xs ml-2 text-emerald-400">v1.0</span>
                </div>
                <p className="text-xs text-slate-400">AI 이상탐지 테스트 도구</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-lg transition text-sm font-medium ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span className="ml-2">{tab.name}</span>
                </button>
              ))}
            </nav>

            {/* External Links */}
            <div className="hidden md:flex items-center space-x-3">
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-1.5 text-sm text-slate-400 hover:text-emerald-400 transition rounded-lg hover:bg-slate-700"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                API Docs
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-1.5 text-sm text-slate-400 hover:text-emerald-400 transition rounded-lg hover:bg-slate-700"
              >
                <Github className="w-4 h-4 mr-1" />
                GitHub
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-3 rounded-lg transition ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span className="ml-3">{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <p>ERP/MES Simulator - Scenario Modifier</p>
            <p>GreenBoard Electronics v1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
