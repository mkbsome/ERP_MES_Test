import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Server,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Save
} from 'lucide-react';
import clsx from 'clsx';

interface SettingSection {
  id: string;
  label: string;
  icon: typeof Database;
}

const sections: SettingSection[] = [
  { id: 'general', label: '일반', icon: SettingsIcon },
  { id: 'database', label: '데이터베이스', icon: Database },
  { id: 'api', label: 'API 서버', icon: Server },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  // Settings state
  const [settings, setSettings] = useState({
    // General
    tenantId: 'T001',
    companyName: '(주)그린보드 일렉트로닉스',
    defaultSeed: 42,
    simulationDays: 180,

    // Database
    dbHost: 'localhost',
    dbPort: '5432',
    dbName: 'greenboard_mes',
    dbUser: 'postgres',
    dbPassword: '',

    // API
    apiHost: 'localhost',
    apiPort: '8000',
    wsEnabled: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    setSaveResult(null);

    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSaving(false);
    setSaveResult({ success: true, message: '설정이 저장되었습니다.' });
  };

  const testConnection = async (type: 'database' | 'api') => {
    alert(`${type === 'database' ? '데이터베이스' : 'API 서버'} 연결 테스트 - 실제 구현 시 연결 확인`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-500">데이터 생성기 환경 설정</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors',
                    activeSection === section.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-lg shadow">
          {/* General Settings */}
          {activeSection === 'general' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">일반 설정</h2>
              <div className="space-y-6 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    테넌트 ID
                  </label>
                  <input
                    type="text"
                    value={settings.tenantId}
                    onChange={(e) => setSettings({ ...settings, tenantId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">멀티테넌트 환경에서 사용하는 고유 식별자</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    회사명
                  </label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    기본 Random Seed
                  </label>
                  <input
                    type="number"
                    value={settings.defaultSeed}
                    onChange={(e) => setSettings({ ...settings, defaultSeed: parseInt(e.target.value) || 42 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">동일한 seed 값으로 재현 가능한 데이터 생성</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    기본 시뮬레이션 기간 (일)
                  </label>
                  <input
                    type="number"
                    value={settings.simulationDays}
                    onChange={(e) => setSettings({ ...settings, simulationDays: parseInt(e.target.value) || 180 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Database Settings */}
          {activeSection === 'database' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">데이터베이스 설정</h2>
              <div className="space-y-6 max-w-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      호스트
                    </label>
                    <input
                      type="text"
                      value={settings.dbHost}
                      onChange={(e) => setSettings({ ...settings, dbHost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      포트
                    </label>
                    <input
                      type="text"
                      value={settings.dbPort}
                      onChange={(e) => setSettings({ ...settings, dbPort: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    데이터베이스명
                  </label>
                  <input
                    type="text"
                    value={settings.dbName}
                    onChange={(e) => setSettings({ ...settings, dbName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사용자명
                  </label>
                  <input
                    type="text"
                    value={settings.dbUser}
                    onChange={(e) => setSettings({ ...settings, dbUser: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    value={settings.dbPassword}
                    onChange={(e) => setSettings({ ...settings, dbPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  onClick={() => testConnection('database')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  연결 테스트
                </button>
              </div>
            </div>
          )}

          {/* API Settings */}
          {activeSection === 'api' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">API 서버 설정</h2>
              <div className="space-y-6 max-w-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      호스트
                    </label>
                    <input
                      type="text"
                      value={settings.apiHost}
                      onChange={(e) => setSettings({ ...settings, apiHost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      포트
                    </label>
                    <input
                      type="text"
                      value={settings.apiPort}
                      onChange={(e) => setSettings({ ...settings, apiPort: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">WebSocket 활성화</p>
                    <p className="text-sm text-gray-500">실시간 진행률 업데이트 사용</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.wsEnabled}
                      onChange={(e) => setSettings({ ...settings, wsEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <button
                  onClick={() => testConnection('api')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  연결 테스트
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            {saveResult && (
              <div className={clsx(
                'flex items-center gap-2',
                saveResult.success ? 'text-green-600' : 'text-red-600'
              )}>
                {saveResult.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm">{saveResult.message}</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium ml-auto',
                isSaving
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              )}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  저장
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
