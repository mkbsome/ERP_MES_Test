import { useState } from 'react';
import { BookOpen, Search, Plus, Filter, FileText, Calendar, ChevronRight, Download } from 'lucide-react';

interface JournalEntry {
  id: string;
  entryNo: string;
  date: string;
  description: string;
  debitAccount: string;
  debitAccountName: string;
  creditAccount: string;
  creditAccountName: string;
  amount: number;
  status: 'draft' | 'posted' | 'reversed';
  reference?: string;
  createdBy: string;
}

interface AccountBalance {
  accountCode: string;
  accountName: string;
  category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  debitBalance: number;
  creditBalance: number;
  balance: number;
}

const mockJournalEntries: JournalEntry[] = [
  {
    id: '1',
    entryNo: 'JE-2024-0152',
    date: '2024-01-20',
    description: '매출 발생 - 삼성전자',
    debitAccount: '1101',
    debitAccountName: '외상매출금',
    creditAccount: '4101',
    creditAccountName: '제품매출',
    amount: 450000000,
    status: 'posted',
    reference: 'SO-2024-0125',
    createdBy: '김회계',
  },
  {
    id: '2',
    entryNo: 'JE-2024-0151',
    date: '2024-01-19',
    description: '매입채무 지급 - 삼성전기',
    debitAccount: '2101',
    debitAccountName: '외상매입금',
    creditAccount: '1011',
    creditAccountName: '보통예금',
    amount: 285000000,
    status: 'posted',
    reference: 'PO-2024-0089',
    createdBy: '이재무',
  },
  {
    id: '3',
    entryNo: 'JE-2024-0150',
    date: '2024-01-18',
    description: '매출채권 입금 - LG전자',
    debitAccount: '1011',
    debitAccountName: '보통예금',
    creditAccount: '1101',
    creditAccountName: '외상매출금',
    amount: 320000000,
    status: 'posted',
    reference: 'SO-2024-0118',
    createdBy: '김회계',
  },
  {
    id: '4',
    entryNo: 'JE-2024-0149',
    date: '2024-01-17',
    description: '1월 급여 지급',
    debitAccount: '5201',
    debitAccountName: '급여',
    creditAccount: '1011',
    creditAccountName: '보통예금',
    amount: 180000000,
    status: 'posted',
    createdBy: '이재무',
  },
  {
    id: '5',
    entryNo: 'JE-2024-0148',
    date: '2024-01-15',
    description: '감가상각비 계상',
    debitAccount: '5301',
    debitAccountName: '감가상각비',
    creditAccount: '1251',
    creditAccountName: '감가상각누계액',
    amount: 35542000,
    status: 'posted',
    createdBy: '김회계',
  },
  {
    id: '6',
    entryNo: 'JE-2024-0153',
    date: '2024-01-21',
    description: '원자재 매입 - 심텍',
    debitAccount: '1401',
    debitAccountName: '원재료',
    creditAccount: '2101',
    creditAccountName: '외상매입금',
    amount: 220000000,
    status: 'draft',
    reference: 'PO-2024-0095',
    createdBy: '이재무',
  },
];

const accountBalances: AccountBalance[] = [
  { accountCode: '1011', accountName: '보통예금', category: 'asset', debitBalance: 2850000000, creditBalance: 0, balance: 2850000000 },
  { accountCode: '1101', accountName: '외상매출금', category: 'asset', debitBalance: 680000000, creditBalance: 0, balance: 680000000 },
  { accountCode: '1201', accountName: '건물', category: 'asset', debitBalance: 5000000000, creditBalance: 0, balance: 5000000000 },
  { accountCode: '1211', accountName: '기계장치', category: 'asset', debitBalance: 2450000000, creditBalance: 0, balance: 2450000000 },
  { accountCode: '1251', accountName: '감가상각누계액', category: 'asset', debitBalance: 0, creditBalance: 1130000000, balance: -1130000000 },
  { accountCode: '1401', accountName: '원재료', category: 'asset', debitBalance: 450000000, creditBalance: 0, balance: 450000000 },
  { accountCode: '2101', accountName: '외상매입금', category: 'liability', debitBalance: 0, creditBalance: 680000000, balance: 680000000 },
  { accountCode: '3101', accountName: '자본금', category: 'equity', debitBalance: 0, creditBalance: 5000000000, balance: 5000000000 },
  { accountCode: '4101', accountName: '제품매출', category: 'revenue', debitBalance: 0, creditBalance: 8500000000, balance: 8500000000 },
  { accountCode: '5101', accountName: '매출원가', category: 'expense', debitBalance: 5950000000, creditBalance: 0, balance: 5950000000 },
  { accountCode: '5201', accountName: '급여', category: 'expense', debitBalance: 720000000, creditBalance: 0, balance: 720000000 },
  { accountCode: '5301', accountName: '감가상각비', category: 'expense', debitBalance: 142168000, creditBalance: 0, balance: 142168000 },
];

const categoryLabels: Record<string, string> = {
  'asset': '자산',
  'liability': '부채',
  'equity': '자본',
  'revenue': '수익',
  'expense': '비용',
};

export default function GeneralLedgerPage() {
  const [activeTab, setActiveTab] = useState<'journal' | 'ledger'>('journal');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredEntries = mockJournalEntries.filter(entry =>
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.entryNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAccounts = accountBalances.filter(account =>
    selectedCategory === 'all' || account.category === selectedCategory
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-green-500/20 text-green-400';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400';
      case 'reversed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'posted': return '전기완료';
      case 'draft': return '임시저장';
      case 'reversed': return '역분개';
      default: return status;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'asset': return 'bg-blue-500/20 text-blue-400';
      case 'liability': return 'bg-red-500/20 text-red-400';
      case 'equity': return 'bg-purple-500/20 text-purple-400';
      case 'revenue': return 'bg-green-500/20 text-green-400';
      case 'expense': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
    } else if (absValue >= 10000000) {
      return `${(value / 10000000).toFixed(1)}천만`;
    }
    return value.toLocaleString();
  };

  // 계정과목별 합계
  const totalAssets = accountBalances.filter(a => a.category === 'asset').reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = accountBalances.filter(a => a.category === 'liability').reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = accountBalances.filter(a => a.category === 'equity').reduce((sum, a) => sum + a.balance, 0);
  const totalRevenue = accountBalances.filter(a => a.category === 'revenue').reduce((sum, a) => sum + a.balance, 0);
  const totalExpense = accountBalances.filter(a => a.category === 'expense').reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">일반회계</h1>
          <p className="text-slate-400">분개장 및 총계정원장 관리</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            내보내기
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            분개 입력
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">총 자산</p>
          <p className="text-xl font-bold text-blue-400">{formatCurrency(totalAssets)}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">총 부채</p>
          <p className="text-xl font-bold text-red-400">{formatCurrency(totalLiabilities)}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">자본</p>
          <p className="text-xl font-bold text-purple-400">{formatCurrency(totalEquity)}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">매출</p>
          <p className="text-xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">비용</p>
          <p className="text-xl font-bold text-orange-400">{formatCurrency(totalExpense)}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('journal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'journal'
              ? 'bg-slate-700 text-white border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          분개장
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'ledger'
              ? 'bg-slate-700 text-white border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          총계정원장
        </button>
      </div>

      {activeTab === 'journal' ? (
        <>
          {/* Journal Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="전표번호, 적요 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors">
              <Calendar className="w-4 h-4" />
              기간 선택
            </button>
          </div>

          {/* Journal Entries List */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">전표번호</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">일자</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">적요</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">차변</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">대변</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">금액</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-700/30 transition-colors cursor-pointer">
                      <td className="px-4 py-3">
                        <span className="text-blue-400 font-mono text-sm">{entry.entryNo}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{entry.date}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white">{entry.description}</p>
                          {entry.reference && (
                            <p className="text-slate-400 text-xs">참조: {entry.reference}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white">{entry.debitAccountName}</p>
                          <p className="text-slate-400 text-xs">{entry.debitAccount}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white">{entry.creditAccountName}</p>
                          <p className="text-slate-400 text-xs">{entry.creditAccount}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium">
                        {entry.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusColor(entry.status)}`}>
                          {getStatusLabel(entry.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Ledger Filters */}
          <div className="flex items-center gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">전체 계정</option>
              <option value="asset">자산</option>
              <option value="liability">부채</option>
              <option value="equity">자본</option>
              <option value="revenue">수익</option>
              <option value="expense">비용</option>
            </select>
          </div>

          {/* Account Balances */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">계정코드</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">계정명</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">분류</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">차변 합계</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">대변 합계</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">잔액</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredAccounts.map((account) => (
                    <tr key={account.accountCode} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-blue-400 font-mono">{account.accountCode}</span>
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{account.accountName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${getCategoryColor(account.category)}`}>
                          {categoryLabels[account.category]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {account.debitBalance > 0 ? account.debitBalance.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {account.creditBalance > 0 ? account.creditBalance.toLocaleString() : '-'}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        account.balance >= 0 ? 'text-white' : 'text-red-400'
                      }`}>
                        {account.balance.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button className="p-1 hover:bg-slate-600 rounded transition-colors">
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
