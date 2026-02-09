/**
 * 불량현황 페이지
 * 불량 데이터 조회 및 분석
 */
import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { PageHeader, SearchForm, DataGrid } from '../../components/common';
import type { SearchField } from '../../components/common/SearchForm';
import type { Column } from '../../components/common/DataGrid';

// 불량 타입
interface DefectRecord {
  id: number;
  work_order_no: string;
  product_code: string;
  product_name: string;
  line_code: string;
  line_name: string;
  defect_date: string;
  defect_type: string;
  defect_name: string;
  defect_qty: number;
  lot_no: string;
  inspector: string;
  equipment_code: string;
  description: string;
}

// Mock 데이터
const mockDefects: DefectRecord[] = [
  { id: 1, work_order_no: 'WO-2024-0001', product_code: 'MB-SM-001', product_name: '스마트폰 메인보드 A타입', line_code: 'SMT-L01', line_name: 'SMT Line 1', defect_date: '2024-01-15', defect_type: 'BRIDGE', defect_name: '솔더 브릿지', defect_qty: 5, lot_no: 'LOT-20240115-001', inspector: '김철수', equipment_code: 'SMT-L01-M02', description: 'QFP IC 핀 간 브릿지' },
  { id: 2, work_order_no: 'WO-2024-0001', product_code: 'MB-SM-001', product_name: '스마트폰 메인보드 A타입', line_code: 'SMT-L01', line_name: 'SMT Line 1', defect_date: '2024-01-15', defect_type: 'MISSING', defect_name: '부품 누락', defect_qty: 3, lot_no: 'LOT-20240115-001', inspector: '김철수', equipment_code: 'SMT-L01-M02', description: '0402 저항 미실장' },
  { id: 3, work_order_no: 'WO-2024-0001', product_code: 'MB-SM-001', product_name: '스마트폰 메인보드 A타입', line_code: 'SMT-L01', line_name: 'SMT Line 1', defect_date: '2024-01-15', defect_type: 'COLD', defect_name: '냉납', defect_qty: 2, lot_no: 'LOT-20240115-002', inspector: '이영희', equipment_code: 'SMT-L01-M04', description: '커넥터 핀 납땜 불량' },
  { id: 4, work_order_no: 'WO-2024-0002', product_code: 'MB-SM-002', product_name: '스마트폰 메인보드 B타입', line_code: 'SMT-L02', line_name: 'SMT Line 2', defect_date: '2024-01-15', defect_type: 'BRIDGE', defect_name: '솔더 브릿지', defect_qty: 4, lot_no: 'LOT-20240115-003', inspector: '박민수', equipment_code: 'SMT-L02-M02', description: 'BGA 볼 브릿지' },
  { id: 5, work_order_no: 'WO-2024-0002', product_code: 'MB-SM-002', product_name: '스마트폰 메인보드 B타입', line_code: 'SMT-L02', line_name: 'SMT Line 2', defect_date: '2024-01-15', defect_type: 'SHIFT', defect_name: '부품 틀어짐', defect_qty: 2, lot_no: 'LOT-20240115-003', inspector: '박민수', equipment_code: 'SMT-L02-M02', description: '칩 부품 정렬 불량' },
  { id: 6, work_order_no: 'WO-2024-0003', product_code: 'PB-LED-001', product_name: 'LED 드라이버 보드', line_code: 'SMT-L03', line_name: 'SMT Line 3', defect_date: '2024-01-15', defect_type: 'CRACK', defect_name: '크랙', defect_qty: 8, lot_no: 'LOT-20240115-004', inspector: '최동훈', equipment_code: 'SMT-L03-M04', description: '세라믹 콘덴서 크랙' },
  { id: 7, work_order_no: 'WO-2024-0003', product_code: 'PB-LED-001', product_name: 'LED 드라이버 보드', line_code: 'SMT-L03', line_name: 'SMT Line 3', defect_date: '2024-01-15', defect_type: 'BRIDGE', defect_name: '솔더 브릿지', defect_qty: 5, lot_no: 'LOT-20240115-004', inspector: '최동훈', equipment_code: 'SMT-L03-M02', description: 'SOT-23 핀 간 브릿지' },
  { id: 8, work_order_no: 'WO-2024-0003', product_code: 'PB-LED-001', product_name: 'LED 드라이버 보드', line_code: 'SMT-L03', line_name: 'SMT Line 3', defect_date: '2024-01-15', defect_type: 'MISSING', defect_name: '부품 누락', defect_qty: 2, lot_no: 'LOT-20240115-004', inspector: '최동훈', equipment_code: 'SMT-L03-M02', description: 'LED 미실장' },
];

// 검색 필드 정의
const searchFields: SearchField[] = [
  {
    name: 'defect_date',
    label: '발생일자',
    type: 'dateRange',
  },
  {
    name: 'line_code',
    label: '라인',
    type: 'select',
    options: [
      { value: 'SMT-L01', label: 'SMT Line 1' },
      { value: 'SMT-L02', label: 'SMT Line 2' },
      { value: 'SMT-L03', label: 'SMT Line 3' },
    ],
    placeholder: '전체',
  },
  {
    name: 'defect_type',
    label: '불량유형',
    type: 'select',
    options: [
      { value: 'BRIDGE', label: '솔더 브릿지' },
      { value: 'MISSING', label: '부품 누락' },
      { value: 'COLD', label: '냉납' },
      { value: 'SHIFT', label: '부품 틀어짐' },
      { value: 'CRACK', label: '크랙' },
    ],
    placeholder: '전체',
  },
  {
    name: 'product_code',
    label: '제품코드',
    type: 'text',
    placeholder: '제품코드',
  },
];

// 테이블 컬럼 정의
const columns: Column<DefectRecord>[] = [
  { key: 'defect_date', header: '발생일자', width: '100px', align: 'center' },
  { key: 'work_order_no', header: '작업지시번호', width: '130px' },
  { key: 'product_code', header: '제품코드', width: '110px' },
  { key: 'line_name', header: '라인', width: '100px' },
  {
    key: 'defect_type',
    header: '불량유형',
    width: '100px',
    render: (value) => {
      const typeMap: Record<string, { label: string; color: string }> = {
        BRIDGE: { label: '브릿지', color: 'bg-red-500/20 text-red-400' },
        MISSING: { label: '누락', color: 'bg-yellow-500/20 text-yellow-400' },
        COLD: { label: '냉납', color: 'bg-blue-500/20 text-blue-400' },
        SHIFT: { label: '틀어짐', color: 'bg-purple-500/20 text-purple-400' },
        CRACK: { label: '크랙', color: 'bg-orange-500/20 text-orange-400' },
      };
      const info = typeMap[value] || { label: value, color: 'bg-slate-500/20 text-slate-400' };
      return <span className={`px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>{info.label}</span>;
    },
  },
  { key: 'defect_qty', header: '불량수량', width: '80px', align: 'right', render: (v) => <span className="text-red-400 font-medium">{v}</span> },
  { key: 'lot_no', header: 'LOT번호', width: '150px' },
  { key: 'equipment_code', header: '설비', width: '120px' },
  { key: 'inspector', header: '검사자', width: '80px', align: 'center' },
  { key: 'description', header: '상세내용' },
];

const CHART_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#f97316', '#22c55e', '#06b6d4'];

export default function DefectStatusPage() {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filteredData = useMemo(() => {
    return mockDefects.filter((item) => {
      if (searchParams.line_code && item.line_code !== searchParams.line_code) return false;
      if (searchParams.defect_type && item.defect_type !== searchParams.defect_type) return false;
      if (searchParams.product_code && !item.product_code.includes(searchParams.product_code)) return false;
      if (searchParams.defect_date_from && item.defect_date < searchParams.defect_date_from) return false;
      if (searchParams.defect_date_to && item.defect_date > searchParams.defect_date_to) return false;
      return true;
    });
  }, [searchParams]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // 불량 유형별 집계 (파레토)
  const defectByType = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredData.forEach((d) => {
      grouped[d.defect_name] = (grouped[d.defect_name] || 0) + d.defect_qty;
    });
    return Object.entries(grouped)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);
  }, [filteredData]);

  // 라인별 집계
  const defectByLine = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredData.forEach((d) => {
      grouped[d.line_name] = (grouped[d.line_name] || 0) + d.defect_qty;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // 요약 통계
  const summary = useMemo(() => {
    const totalQty = filteredData.reduce((sum, d) => sum + d.defect_qty, 0);
    const topDefect = defectByType[0];
    return {
      count: filteredData.length,
      totalQty,
      topDefect: topDefect?.name || '-',
      topDefectQty: topDefect?.qty || 0,
    };
  }, [filteredData, defectByType]);

  const handleSearch = (values: Record<string, any>) => {
    setSearchParams(values);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="불량현황"
        description="불량 발생 현황을 조회하고 분석합니다."
        actions={[
          { label: '엑셀 다운로드', icon: 'download', onClick: () => console.log('Download') },
          { label: '새로고침', icon: 'refresh', onClick: () => console.log('Refresh') },
        ]}
      />

      <SearchForm fields={searchFields} onSearch={handleSearch} />

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">총 불량 건수</p>
          <p className="text-2xl font-bold text-white">{summary.count}건</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">총 불량 수량</p>
          <p className="text-2xl font-bold text-red-400">{summary.totalQty.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">최다 불량 유형</p>
          <p className="text-2xl font-bold text-yellow-400">{summary.topDefect}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">최다 불량 수량</p>
          <p className="text-2xl font-bold text-yellow-400">{summary.topDefectQty}</p>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 불량 유형별 파레토 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-4">불량 유형별 현황</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={defectByType} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="qty" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 라인별 불량 분포 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-4">라인별 불량 분포</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={defectByLine}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#64748b' }}
              >
                {defectByLine.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 불량 목록 */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <DataGrid
          columns={columns}
          data={paginatedData}
          keyField="id"
          pagination={{
            page,
            pageSize,
            total: filteredData.length,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </div>
    </div>
  );
}
