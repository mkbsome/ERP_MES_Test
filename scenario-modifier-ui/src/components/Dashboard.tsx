import { useEffect, useState } from 'react';
import {
  Database,
  Factory,
  Package,
  ShoppingCart,
  Truck,
  FileText,
  AlertCircle,
  RefreshCw,
  Calendar,
  Loader2,
} from 'lucide-react';
import { baseDataApi } from '../services/api';
import type { BaseDataSummary } from '../types/api';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div
      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
      style={{ borderLeftWidth: '4px', borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div
          className="p-3 rounded-full"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<BaseDataSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await baseDataApi.getSummary();
      setSummary(data);
    } catch (err) {
      setError('데이터를 불러오는 데 실패했습니다. API 서버 연결을 확인하세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="ml-3 text-slate-400">데이터 로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center">
        <AlertCircle className="w-6 h-6 text-red-400 mr-3" />
        <span className="text-red-400 flex-1">{error}</span>
        <button
          onClick={fetchSummary}
          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!summary) return null;

  const erpRecords = summary.erp_records;
  const mesRecords = summary.mes_records;
  const dateRange = summary.date_range;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">데이터 현황</h2>
          <p className="text-slate-400 mt-1">현재 데이터베이스에 저장된 ERP/MES 데이터 요약</p>
        </div>
        <button
          onClick={fetchSummary}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </button>
      </div>

      {/* Date Range */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Calendar className="w-6 h-6 mr-2 text-white" />
          <h3 className="text-lg font-semibold text-white">데이터 기간</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-emerald-100 text-sm">시작일</p>
            <p className="text-xl font-bold text-white">{dateRange.start}</p>
          </div>
          <div>
            <p className="text-emerald-100 text-sm">종료일</p>
            <p className="text-xl font-bold text-white">{dateRange.end}</p>
          </div>
          <div>
            <p className="text-emerald-100 text-sm">총 주문</p>
            <p className="text-xl font-bold text-white">{dateRange.total_orders?.toLocaleString() || 0}건</p>
          </div>
        </div>
      </div>

      {/* ERP Records */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2 text-blue-400" />
          ERP 데이터
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="판매 주문"
            value={erpRecords['erp_sales_order'] || 0}
            icon={<ShoppingCart className="w-6 h-6 text-indigo-400" />}
            color="#818cf8"
          />
          <StatCard
            title="작업 지시"
            value={erpRecords['erp_work_order'] || 0}
            icon={<FileText className="w-6 h-6 text-blue-400" />}
            color="#60a5fa"
          />
          <StatCard
            title="구매 발주"
            value={erpRecords['erp_purchase_order'] || 0}
            icon={<Package className="w-6 h-6 text-yellow-400" />}
            color="#facc15"
          />
          <StatCard
            title="입고"
            value={erpRecords['erp_goods_receipt'] || 0}
            icon={<Truck className="w-6 h-6 text-emerald-400" />}
            color="#34d399"
          />
          <StatCard
            title="출하"
            value={erpRecords['erp_shipment'] || 0}
            icon={<Truck className="w-6 h-6 text-purple-400" />}
            color="#c084fc"
          />
        </div>
      </div>

      {/* MES Records */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Factory className="w-5 h-5 mr-2 text-orange-400" />
          MES 데이터
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="생산 지시"
            value={mesRecords['mes_production_order'] || 0}
            icon={<FileText className="w-6 h-6 text-orange-400" />}
            color="#fb923c"
          />
          <StatCard
            title="생산 실적"
            value={mesRecords['mes_production_result'] || 0}
            icon={<Factory className="w-6 h-6 text-teal-400" />}
            color="#2dd4bf"
          />
          <StatCard
            title="불량 상세"
            value={mesRecords['mes_defect_detail'] || 0}
            icon={<AlertCircle className="w-6 h-6 text-red-400" />}
            color="#f87171"
          />
          <StatCard
            title="비가동 이벤트"
            value={mesRecords['mes_downtime_event'] || 0}
            icon={<AlertCircle className="w-6 h-6 text-slate-400" />}
            color="#94a3b8"
          />
        </div>
      </div>

      {/* Order Status Distribution */}
      {summary.business_flow_stats?.orders_by_status && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">주문 상태별 분포</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(summary.business_flow_stats.orders_by_status).map(([status, count]) => (
              <div key={status} className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg">
                <span className="text-sm text-slate-400 capitalize">{status}</span>
                <span className="ml-2 font-bold text-white">{(count as number).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
