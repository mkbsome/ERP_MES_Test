import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Server,
  Bell,
  User,
  Shield,
  Palette,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
} from 'lucide-react';
import clsx from 'clsx';

type SettingsTab = 'general' | 'database' | 'api' | 'notifications' | 'display';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<'success' | 'error' | null>(null);
  const [apiTestResult, setApiTestResult] = useState<'success' | 'error' | null>(null);

  // Settings state
  const [settings, setSettings] = useState({
    // General
    tenantId: 'T001',
    companyName: '(주)그린보드 일렉트로닉스',
    timezone: 'Asia/Seoul',
    language: 'ko',

    // Database
    dbHost: 'localhost',
    dbPort: '5432',
    dbName: 'erp_mes_simulator',
    dbUser: 'postgres',
    dbPassword: '',

    // API
    apiHost: 'localhost',
    apiPort: '8000',
    wsEnabled: true,
    autoRefresh: true,
    refreshInterval: 30,

    // Notifications
    emailEnabled: false,
    emailRecipients: '',
    slackEnabled: false,
    slackWebhook: '',
    criticalAlerts: true,
    warningAlerts: true,
    infoAlerts: false,

    // Display
    theme: 'dark',
    chartAnimations: true,
    compactMode: false,
    showGridLines: true,
    defaultDateRange: '7d',
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    // Show success message (could use toast)
  };

  const handleTestDatabase = async () => {
    setDbTestResult(null);
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1000));
    setDbTestResult(Math.random() > 0.3 ? 'success' : 'error');
  };

  const handleTestApi = async () => {
    setApiTestResult(null);
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 500));
    setApiTestResult('success');
  };

  const tabs = [
    { id: 'general', label: '일반', icon: SettingsIcon },
    { id: 'database', label: '데이터베이스', icon: Database },
    { id: 'api', label: 'API 서버', icon: Server },
    { id: 'notifications', label: '알림', icon: Bell },
    { id: 'display', label: '화면', icon: Palette },
  ] as const;

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-64 shrink-0">
        <div className="card p-2">
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  activeTab === id
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                )}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="card">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div>
              <div className="card-header border-b border-slate-700 pb-4 mb-6">
                <h2 className="card-title flex items-center gap-2">
                  <SettingsIcon className="text-slate-400" size={20} />
                  일반 설정
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">테넌트 ID</label>
                  <input
                    type="text"
                    value={settings.tenantId}
                    onChange={(e) => setSettings({ ...settings, tenantId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">회사명</label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">타임존</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="Asia/Seoul">Asia/Seoul (KST)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">언어</label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="ko">한국어</option>
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Database Settings */}
          {activeTab === 'database' && (
            <div>
              <div className="card-header border-b border-slate-700 pb-4 mb-6">
                <h2 className="card-title flex items-center gap-2">
                  <Database className="text-slate-400" size={20} />
                  데이터베이스 설정
                </h2>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">호스트</label>
                    <input
                      type="text"
                      value={settings.dbHost}
                      onChange={(e) => setSettings({ ...settings, dbHost: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">포트</label>
                    <input
                      type="text"
                      value={settings.dbPort}
                      onChange={(e) => setSettings({ ...settings, dbPort: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">데이터베이스 이름</label>
                  <input
                    type="text"
                    value={settings.dbName}
                    onChange={(e) => setSettings({ ...settings, dbName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">사용자</label>
                    <input
                      type="text"
                      value={settings.dbUser}
                      onChange={(e) => setSettings({ ...settings, dbUser: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">비밀번호</label>
                    <input
                      type="password"
                      value={settings.dbPassword}
                      onChange={(e) => setSettings({ ...settings, dbPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleTestDatabase}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                  >
                    <RefreshCw size={16} />
                    연결 테스트
                  </button>
                  {dbTestResult && (
                    <div className={clsx(
                      'flex items-center gap-2',
                      dbTestResult === 'success' ? 'text-green-400' : 'text-red-400'
                    )}>
                      {dbTestResult === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      {dbTestResult === 'success' ? '연결 성공' : '연결 실패'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* API Settings */}
          {activeTab === 'api' && (
            <div>
              <div className="card-header border-b border-slate-700 pb-4 mb-6">
                <h2 className="card-title flex items-center gap-2">
                  <Server className="text-slate-400" size={20} />
                  API 서버 설정
                </h2>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">호스트</label>
                    <input
                      type="text"
                      value={settings.apiHost}
                      onChange={(e) => setSettings({ ...settings, apiHost: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">포트</label>
                    <input
                      type="text"
                      value={settings.apiPort}
                      onChange={(e) => setSettings({ ...settings, apiPort: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">WebSocket 활성화</p>
                    <p className="text-xs text-slate-400">실시간 데이터 업데이트를 위한 WebSocket 연결</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, wsEnabled: !settings.wsEnabled })}
                    className={clsx(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      settings.wsEnabled ? 'bg-primary-500' : 'bg-slate-600'
                    )}
                  >
                    <span
                      className={clsx(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        settings.wsEnabled ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">자동 새로고침</p>
                    <p className="text-xs text-slate-400">일정 주기로 데이터 자동 갱신</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, autoRefresh: !settings.autoRefresh })}
                    className={clsx(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      settings.autoRefresh ? 'bg-primary-500' : 'bg-slate-600'
                    )}
                  >
                    <span
                      className={clsx(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        settings.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {settings.autoRefresh && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">새로고침 주기 (초)</label>
                    <input
                      type="number"
                      value={settings.refreshInterval}
                      onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) || 30 })}
                      className="w-32 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                      min={5}
                      max={300}
                    />
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleTestApi}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                  >
                    <RefreshCw size={16} />
                    연결 테스트
                  </button>
                  {apiTestResult && (
                    <div className={clsx(
                      'flex items-center gap-2',
                      apiTestResult === 'success' ? 'text-green-400' : 'text-red-400'
                    )}>
                      {apiTestResult === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      {apiTestResult === 'success' ? '연결 성공' : '연결 실패'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div>
              <div className="card-header border-b border-slate-700 pb-4 mb-6">
                <h2 className="card-title flex items-center gap-2">
                  <Bell className="text-slate-400" size={20} />
                  알림 설정
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-white mb-4">알림 수준</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.criticalAlerts}
                        onChange={(e) => setSettings({ ...settings, criticalAlerts: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-300">긴급 알림 (Critical)</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.warningAlerts}
                        onChange={(e) => setSettings({ ...settings, warningAlerts: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-300">경고 알림 (Warning)</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.infoAlerts}
                        onChange={(e) => setSettings({ ...settings, infoAlerts: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-300">정보 알림 (Info)</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-6">
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg mb-4">
                    <div>
                      <p className="text-sm font-medium text-white">이메일 알림</p>
                      <p className="text-xs text-slate-400">중요 알림을 이메일로 수신</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, emailEnabled: !settings.emailEnabled })}
                      className={clsx(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        settings.emailEnabled ? 'bg-primary-500' : 'bg-slate-600'
                      )}
                    >
                      <span
                        className={clsx(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          settings.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  {settings.emailEnabled && (
                    <div className="ml-4 mb-4">
                      <label className="block text-sm font-medium text-slate-300 mb-2">수신자 (쉼표로 구분)</label>
                      <input
                        type="text"
                        value={settings.emailRecipients}
                        onChange={(e) => setSettings({ ...settings, emailRecipients: e.target.value })}
                        placeholder="admin@company.com, manager@company.com"
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">Slack 알림</p>
                      <p className="text-xs text-slate-400">Slack 채널로 알림 전송</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, slackEnabled: !settings.slackEnabled })}
                      className={clsx(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        settings.slackEnabled ? 'bg-primary-500' : 'bg-slate-600'
                      )}
                    >
                      <span
                        className={clsx(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          settings.slackEnabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Display Settings */}
          {activeTab === 'display' && (
            <div>
              <div className="card-header border-b border-slate-700 pb-4 mb-6">
                <h2 className="card-title flex items-center gap-2">
                  <Palette className="text-slate-400" size={20} />
                  화면 설정
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">테마</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="dark">다크 모드</option>
                    <option value="light">라이트 모드</option>
                    <option value="system">시스템 설정 따르기</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">기본 조회 기간</label>
                  <select
                    value={settings.defaultDateRange}
                    onChange={(e) => setSettings({ ...settings, defaultDateRange: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="1d">금일</option>
                    <option value="7d">최근 7일</option>
                    <option value="30d">최근 30일</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">차트 애니메이션</p>
                      <p className="text-xs text-slate-400">차트 로딩 시 애니메이션 효과</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, chartAnimations: !settings.chartAnimations })}
                      className={clsx(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        settings.chartAnimations ? 'bg-primary-500' : 'bg-slate-600'
                      )}
                    >
                      <span
                        className={clsx(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          settings.chartAnimations ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">그리드 라인 표시</p>
                      <p className="text-xs text-slate-400">차트에 그리드 라인 표시</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, showGridLines: !settings.showGridLines })}
                      className={clsx(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        settings.showGridLines ? 'bg-primary-500' : 'bg-slate-600'
                      )}
                    >
                      <span
                        className={clsx(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          settings.showGridLines ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">컴팩트 모드</p>
                      <p className="text-xs text-slate-400">더 많은 정보를 한 화면에 표시</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, compactMode: !settings.compactMode })}
                      className={clsx(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        settings.compactMode ? 'bg-primary-500' : 'bg-slate-600'
                      )}
                    >
                      <span
                        className={clsx(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          settings.compactMode ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-slate-700 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isSaving ? '저장 중...' : '설정 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
