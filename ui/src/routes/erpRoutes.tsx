import { Route } from 'react-router-dom';
import {
  ERPDashboard,
  ItemPage,
  CustomerPage,
  VendorPage,
  BOMPage as ERPBOMPage,
  SalesOrderPage,
  PurchaseOrderPage,
  GoodsReceiptPage,
  StockStatusPage,
  StockMovementPage,
  StockAdjustmentPage,
  StockAnalysisPage,
  MPSPage,
  MRPPage,
  ERPWorkOrderPage,
  ERPProductionResultPage,
  StandardCostPage,
  ActualCostPage,
  CostVariancePage,
  CostReportPage,
  RoutingPage,
  WarehousePage,
  DeliveryPage,
  SalesInvoicePage,
  SalesAnalysisPage,
  PurchaseInvoicePage,
  PurchaseAnalysisPage,
  FixedAssetPage,
  DepreciationPage,
  AssetAnalysisPage,
  AccountsPayablePage,
  CashFlowPage,
  GeneralLedgerPage,
  AccountsReceivablePage,
  ProfitLossPage,
  ProfitabilityPage,
  DepartmentPage as ERPDepartmentPage,
  PositionPage,
  EmployeePage,
  AttendancePage,
  PayrollPage,
} from '../pages/erp';

export const erpRoutes = (
  <>
    <Route path="/erp" element={<ERPDashboard />} />

    {/* 기준정보 */}
    <Route path="/erp/master/item" element={<ItemPage />} />
    <Route path="/erp/master/customer" element={<CustomerPage />} />
    <Route path="/erp/master/vendor" element={<VendorPage />} />
    <Route path="/erp/master/bom" element={<ERPBOMPage />} />
    <Route path="/erp/master/routing" element={<RoutingPage />} />
    <Route path="/erp/master/warehouse" element={<WarehousePage />} />

    {/* 영업관리 */}
    <Route path="/erp/sales/order" element={<SalesOrderPage />} />
    <Route path="/erp/sales/delivery" element={<DeliveryPage />} />
    <Route path="/erp/sales/invoice" element={<SalesInvoicePage />} />
    <Route path="/erp/sales/analysis" element={<SalesAnalysisPage />} />

    {/* 구매관리 */}
    <Route path="/erp/purchase/order" element={<PurchaseOrderPage />} />
    <Route path="/erp/purchase/receipt" element={<GoodsReceiptPage />} />
    <Route path="/erp/purchase/invoice" element={<PurchaseInvoicePage />} />
    <Route path="/erp/purchase/analysis" element={<PurchaseAnalysisPage />} />

    {/* 재고관리 */}
    <Route path="/erp/inventory/stock" element={<StockStatusPage />} />
    <Route path="/erp/inventory/movement" element={<StockMovementPage />} />
    <Route path="/erp/inventory/adjustment" element={<StockAdjustmentPage />} />
    <Route path="/erp/inventory/analysis" element={<StockAnalysisPage />} />

    {/* 생산관리 */}
    <Route path="/erp/production/mps" element={<MPSPage />} />
    <Route path="/erp/production/mrp" element={<MRPPage />} />
    <Route path="/erp/production/work-order" element={<ERPWorkOrderPage />} />
    <Route path="/erp/production/result" element={<ERPProductionResultPage />} />

    {/* 원가관리 */}
    <Route path="/erp/cost/standard" element={<StandardCostPage />} />
    <Route path="/erp/cost/actual" element={<ActualCostPage />} />
    <Route path="/erp/cost/variance" element={<CostVariancePage />} />
    <Route path="/erp/cost/report" element={<CostReportPage />} />

    {/* 자산관리 */}
    <Route path="/erp/asset/fixed" element={<FixedAssetPage />} />
    <Route path="/erp/asset/depreciation" element={<DepreciationPage />} />
    <Route path="/erp/asset/analysis" element={<AssetAnalysisPage />} />

    {/* 재무회계 */}
    <Route path="/erp/finance/payable" element={<AccountsPayablePage />} />
    <Route path="/erp/finance/cashflow" element={<CashFlowPage />} />
    <Route path="/erp/finance/ledger" element={<GeneralLedgerPage />} />

    {/* 관리회계 */}
    <Route path="/erp/accounting/receivable" element={<AccountsReceivablePage />} />
    <Route path="/erp/accounting/pl" element={<ProfitLossPage />} />
    <Route path="/erp/accounting/profitability" element={<ProfitabilityPage />} />

    {/* 인사관리 */}
    <Route path="/erp/hr/department" element={<ERPDepartmentPage />} />
    <Route path="/erp/hr/position" element={<PositionPage />} />
    <Route path="/erp/hr/employee" element={<EmployeePage />} />
    <Route path="/erp/hr/attendance" element={<AttendancePage />} />
    <Route path="/erp/hr/payroll" element={<PayrollPage />} />
  </>
);
