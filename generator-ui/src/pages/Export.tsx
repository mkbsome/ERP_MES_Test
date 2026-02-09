import { useState } from 'react';
import {
  Download,
  FileJson,
  Database,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  HardDrive,
  File
} from 'lucide-react';
import clsx from 'clsx';

interface ExportOption {
  id: string;
  label: string;
  description: string;
  icon: typeof FileJson;
  format: 'json' | 'csv' | 'sql';
}

const exportOptions: ExportOption[] = [
  { id: 'json', label: 'JSON', description: 'JSON 형식으로 내보내기', icon: FileJson, format: 'json' },
  { id: 'csv', label: 'CSV', description: 'CSV 형식으로 내보내기', icon: File, format: 'csv' },
  { id: 'sql', label: 'SQL', description: 'SQL INSERT 문으로 내보내기', icon: Database, format: 'sql' },
];

interface DataModule {
  id: string;
  name: string;
  tables: { id: string; name: string; records: number }[];
}

const dataModules: DataModule[] = [
  {
    id: 'mes',
    name: 'MES 데이터',
    tables: [
      { id: 'production_orders', name: '생산지시', records: 14720 },
      { id: 'production_results', name: '생산실적', records: 441600 },
      { id: 'equipment_status', name: '설비상태', records: 25760 },
      { id: 'equipment_oee', name: '설비 OEE', records: 2760 },
      { id: 'quality_inspections', name: '품질검사', records: 119600 },
      { id: 'defect_records', name: '불량기록', records: 18400 },
      { id: 'material_consumption', name: '자재소비', records: 79120 },
    ]
  },
  {
    id: 'erp',
    name: 'ERP 데이터',
    tables: [
      { id: 'sales_orders', name: '판매주문', records: 8280 },
      { id: 'sales_order_lines', name: '판매주문 상세', records: 33120 },
      { id: 'purchase_orders', name: '구매발주', records: 5520 },
      { id: 'purchase_order_lines', name: '구매발주 상세', records: 27600 },
      { id: 'inventory_transactions', name: '재고이동', records: 34960 },
      { id: 'journal_entries', name: '회계전표', records: 45080 },
      { id: 'attendance_records', name: '근태기록', records: 64400 },
    ]
  }
];

export default function Export() {
  const [selectedFormat, setSelectedFormat] = useState<string>('json');
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set(
    dataModules.flatMap(m => m.tables.map(t => t.id))
  ));
  const [outputPath, setOutputPath] = useState('output/');
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string } | null>(null);

  const toggleTable = (tableId: string) => {
    const newSelected = new Set(selectedTables);
    if (newSelected.has(tableId)) {
      newSelected.delete(tableId);
    } else {
      newSelected.add(tableId);
    }
    setSelectedTables(newSelected);
  };

  const toggleModule = (moduleId: string) => {
    const module = dataModules.find(m => m.id === moduleId);
    if (!module) return;

    const tableIds = module.tables.map(t => t.id);
    const allSelected = tableIds.every(id => selectedTables.has(id));

    const newSelected = new Set(selectedTables);
    if (allSelected) {
      tableIds.forEach(id => newSelected.delete(id));
    } else {
      tableIds.forEach(id => newSelected.add(id));
    }
    setSelectedTables(newSelected);
  };

  const getTotalRecords = () => {
    return dataModules
      .flatMap(m => m.tables)
      .filter(t => selectedTables.has(t.id))
      .reduce((sum, t) => sum + t.records, 0);
  };

  const handleExport = async () => {
    if (selectedTables.size === 0) {
      alert('내보낼 테이블을 선택해주세요.');
      return;
    }

    setIsExporting(true);
    setExportResult(null);

    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsExporting(false);
    setExportResult({
      success: true,
      message: `${selectedTables.size}개 테이블, ${getTotalRecords().toLocaleString()}개 레코드를 ${outputPath}에 내보냈습니다.`
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">내보내기</h1>
        <p className="text-gray-500">생성된 데이터를 파일로 내보냅니다</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Export Format */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-900 mb-4">출력 형식</h2>
            <div className="space-y-2">
              {exportOptions.map(option => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.id}
                    className={clsx(
                      'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                      selectedFormat === option.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={option.id}
                      checked={selectedFormat === option.id}
                      onChange={() => setSelectedFormat(option.id)}
                      className="sr-only"
                    />
                    <Icon className={clsx(
                      'w-5 h-5',
                      selectedFormat === option.id ? 'text-primary-500' : 'text-gray-400'
                    )} />
                    <div>
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Output Path */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-gray-500" />
              출력 경로
            </h2>
            <input
              type="text"
              value={outputPath}
              onChange={(e) => setOutputPath(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="output/"
            />
            <p className="text-xs text-gray-500 mt-2">
              프로젝트 루트 기준 상대 경로
            </p>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-gray-500" />
              내보내기 요약
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">선택된 테이블</span>
                <span className="font-medium">{selectedTables.size}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">총 레코드</span>
                <span className="font-medium">{getTotalRecords().toLocaleString()}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">예상 크기</span>
                <span className="font-medium">~{(getTotalRecords() * 0.5 / 1024).toFixed(1)} MB</span>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting || selectedTables.size === 0}
            className={clsx(
              'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors',
              isExporting || selectedTables.size === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            )}
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                내보내는 중...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                내보내기
              </>
            )}
          </button>

          {/* Export Result */}
          {exportResult && (
            <div className={clsx(
              'p-4 rounded-lg flex items-start gap-3',
              exportResult.success ? 'bg-green-50' : 'bg-red-50'
            )}>
              {exportResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <p className={clsx(
                'text-sm',
                exportResult.success ? 'text-green-800' : 'text-red-800'
              )}>
                {exportResult.message}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Table Selection */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">테이블 선택</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTables(new Set(dataModules.flatMap(m => m.tables.map(t => t.id))))}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  전체 선택
                </button>
                <button
                  onClick={() => setSelectedTables(new Set())}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  전체 해제
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {dataModules.map(module => {
                const moduleTableIds = module.tables.map(t => t.id);
                const selectedCount = moduleTableIds.filter(id => selectedTables.has(id)).length;
                const allSelected = selectedCount === module.tables.length;
                const someSelected = selectedCount > 0 && !allSelected;

                return (
                  <div key={module.id}>
                    {/* Module Header */}
                    <div
                      onClick={() => toggleModule(module.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={input => {
                            if (input) input.indeterminate = someSelected;
                          }}
                          onChange={() => toggleModule(module.id)}
                          className="w-5 h-5 rounded text-primary-500 focus:ring-primary-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{module.name}</p>
                          <p className="text-sm text-gray-500">
                            {selectedCount}/{module.tables.length}개 선택됨
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {module.tables.filter(t => selectedTables.has(t.id)).reduce((sum, t) => sum + t.records, 0).toLocaleString()} 레코드
                      </span>
                    </div>

                    {/* Tables */}
                    <div className="pl-12 pr-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {module.tables.map(table => (
                        <label
                          key={table.id}
                          className={clsx(
                            'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                            selectedTables.has(table.id)
                              ? 'border-primary-300 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedTables.has(table.id)}
                              onChange={() => toggleTable(table.id)}
                              className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                            />
                            <span className="text-gray-900">{table.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {table.records.toLocaleString()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
