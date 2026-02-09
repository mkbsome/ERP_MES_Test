import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Globe,
  Bell,
  Monitor,
  Shield,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import clsx from 'clsx';

type TabType = 'general' | 'database' | 'api' | 'notifications' | 'display';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [dbTestStatus, setDbTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [apiTestStatus, setApiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const tabs = [
    { id: 'general', name: '일반 설정', icon: SettingsIcon },
    { id: 'database', name: '데이터베이스', icon: Database },
    { id: 'api', name: 'API 연결', icon: Globe },
    { id: 'notifications', name: '알림 설정', icon: Bell },
    { id: 'display', name: '화면 설정', icon: Monitor },
  ];

  const handleDbTest = () => {
    setDbTestStatus('testing');
    setTimeout(() => {
      setDbTestStatus('success');
    }, 1500);
  };

  const handleApiTest = () => {
    setApiTestStatus('testing');
    setTimeout(() => {
      setApiTestStatus('success');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-slate-700">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              )}
            >
              <tab.icon size={18} />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="card">
          <h3 className="card-title mb-6">일반 설정</h3>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">회사명</label>
                <input
                  type="text"
                  defaultValue="(주)그린보드 일렉트로닉스"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">사업자번호</label>
                <input
                  type="text"
                  defaultValue="123-45-67890"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">기본 통화</label>
                <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500">
                  <option value="KRW">KRW (원)</option>
                  <option value="USD">USD (달러)</option>
                  <option value="EUR">EUR (유로)</option>
                  <option value="JPY">JPY (엔)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">회계연도 시작월</label>
                <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500">
                  <option value="1">1월</option>
                  <option value="4">4월</option>
                  <option value="7">7월</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">타임존</label>
              <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500">
                <option value="Asia/Seoul">Asia/Seoul (KST, UTC+9)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-white hover:bg-primary-700">
                <Save size={16} />
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Settings */}
      {activeTab === 'database' && (
        <div className="card">
          <h3 className="card-title mb-6">데이터베이스 연결</h3>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">호스트</label>
                <input
                  type="text"
                  defaultValue="localhost"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">포트</label>
                <input
                  type="text"
                  defaultValue="5432"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">데이터베이스명</label>
                <input
                  type="text"
                  defaultValue="erp_mes_db"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">스키마</label>
                <input
                  type="text"
                  defaultValue="erp"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">사용자명</label>
                <input
                  type="text"
                  defaultValue="erp_user"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">비밀번호</label>
                <input
                  type="password"
                  defaultValue="password123"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                {dbTestStatus === 'idle' && <Database size={20} className="text-slate-400" />}
                {dbTestStatus === 'testing' && <RefreshCw size={20} className="text-yellow-400 animate-spin" />}
                {dbTestStatus === 'success' && <CheckCircle size={20} className="text-green-400" />}
                {dbTestStatus === 'error' && <XCircle size={20} className="text-red-400" />}
                <div>
                  <p className="text-sm font-medium text-slate-200">연결 상태</p>
                  <p className="text-xs text-slate-400">
                    {dbTestStatus === 'idle' && '테스트를 실행하세요'}
                    {dbTestStatus === 'testing' && '연결 테스트 중...'}
                    {dbTestStatus === 'success' && '연결 성공'}
                    {dbTestStatus === 'error' && '연결 실패'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDbTest}
                disabled={dbTestStatus === 'testing'}
                className="px-4 py-2 bg-slate-600 rounded-lg text-sm text-white hover:bg-slate-500 disabled:opacity-50"
              >
                연결 테스트
              </button>
            </div>

            <div className="flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-white hover:bg-primary-700">
                <Save size={16} />
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Settings */}
      {activeTab === 'api' && (
        <div className="card">
          <h3 className="card-title mb-6">API 연결 설정</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">API Base URL</label>
              <input
                type="text"
                defaultValue="http://localhost:8000/api/v1"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">MES API URL</label>
              <input
                type="text"
                defaultValue="http://localhost:8000/api/v1/mes"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">요청 타임아웃 (초)</label>
                <input
                  type="number"
                  defaultValue="30"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">재시도 횟수</label>
                <input
                  type="number"
                  defaultValue="3"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                {apiTestStatus === 'idle' && <Globe size={20} className="text-slate-400" />}
                {apiTestStatus === 'testing' && <RefreshCw size={20} className="text-yellow-400 animate-spin" />}
                {apiTestStatus === 'success' && <CheckCircle size={20} className="text-green-400" />}
                {apiTestStatus === 'error' && <XCircle size={20} className="text-red-400" />}
                <div>
                  <p className="text-sm font-medium text-slate-200">API 상태</p>
                  <p className="text-xs text-slate-400">
                    {apiTestStatus === 'idle' && '테스트를 실행하세요'}
                    {apiTestStatus === 'testing' && '연결 테스트 중...'}
                    {apiTestStatus === 'success' && '연결 성공'}
                    {apiTestStatus === 'error' && '연결 실패'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleApiTest}
                disabled={apiTestStatus === 'testing'}
                className="px-4 py-2 bg-slate-600 rounded-lg text-sm text-white hover:bg-slate-500 disabled:opacity-50"
              >
                연결 테스트
              </button>
            </div>

            <div className="flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-white hover:bg-primary-700">
                <Save size={16} />
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="card">
          <h3 className="card-title mb-6">알림 설정</h3>

          <div className="space-y-4">
            {[
              { key: 'order_approval', label: '수주 승인 요청', description: '새로운 수주 승인 요청시 알림' },
              { key: 'low_stock', label: '안전재고 미달', description: '재고가 안전재고 이하로 떨어질 때 알림' },
              { key: 'po_due', label: '발주 납기 임박', description: '발주 납기일 3일 전 알림' },
              { key: 'wo_delay', label: '작업지시 지연', description: '작업지시 완료 예정일 초과시 알림' },
              { key: 'quality_issue', label: '품질 이슈', description: '품질 검사 불합격 발생시 알림' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-200">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-white hover:bg-primary-700">
              <Save size={16} />
              저장
            </button>
          </div>
        </div>
      )}

      {/* Display Settings */}
      {activeTab === 'display' && (
        <div className="card">
          <h3 className="card-title mb-6">화면 설정</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">테마</label>
              <div className="flex gap-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 border-2 border-primary-500 rounded-lg text-white">
                  <Monitor size={18} />
                  다크 모드
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 hover:border-slate-500">
                  <Monitor size={18} />
                  라이트 모드
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">언어</label>
              <select className="w-full max-w-xs px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500">
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">날짜 형식</label>
              <select className="w-full max-w-xs px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500">
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">목록 페이지 크기</label>
              <select className="w-full max-w-xs px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500">
                <option value="10">10개</option>
                <option value="20">20개</option>
                <option value="50">50개</option>
                <option value="100">100개</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-white hover:bg-primary-700">
                <Save size={16} />
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
