import { Route } from 'react-router-dom';

// 기준정보관리
import {
  CommonCodePage,
  ProductPage,
  EquipmentMasterPage,
  LinePage,
  WorkerPage,
  CodeGroupPage,
  DepartmentPage,
  CustomerMasterPage,
  BOMPage,
  InspectionItemPage,
} from '../pages/master';

// 생산계획
import {
  WorkOrderPage,
  ProductionPlanPage,
  WorkOrderStatusPage,
} from '../pages/planning';

// 생산실행
import {
  ProductionResultPage,
  DowntimePage,
  LotTrackingPage,
  SelfInspectionPage,
  MaterialInfoPage,
} from '../pages/execution';

// 품질관리
import {
  DefectStatusPage,
  SPCPage,
  InitialInspectionPage,
  ProcessInspectionPage,
  ClaimPage,
} from '../pages/quality-mgmt';

// 설비관리
import {
  EquipmentUtilizationPage,
  BreakdownPage,
  MaintenanceHistoryPage,
  PMSchedulePage,
  MaintenanceOrderPage,
} from '../pages/equipment-mgmt';

// 시스템관리
import {
  UserPage,
  LogPage,
  RolePage,
  MenuPage,
} from '../pages/system';

// 현황/모니터링
import {
  WorkResultPage,
  LineStatusPage,
  RealtimeMonitorPage,
  OEEAnalysisPage,
  EquipmentHistoryPage,
  WorkerHistoryPage,
} from '../pages/monitoring';

export const mesRoutes = (
  <>
    {/* ========== 기준정보관리 ========== */}
    <Route path="/master/code-group" element={<CodeGroupPage />} />
    <Route path="/master/common-code" element={<CommonCodePage />} />
    <Route path="/master/department" element={<DepartmentPage />} />
    <Route path="/master/customer" element={<CustomerMasterPage />} />
    <Route path="/master/product" element={<ProductPage />} />
    <Route path="/master/bom" element={<BOMPage />} />
    <Route path="/master/equipment" element={<EquipmentMasterPage />} />
    <Route path="/master/worker" element={<WorkerPage />} />
    <Route path="/master/inspection-item" element={<InspectionItemPage />} />
    <Route path="/master/line" element={<LinePage />} />

    {/* ========== 생산계획 ========== */}
    <Route path="/planning/yearly" element={<ProductionPlanPage />} />
    <Route path="/planning/monthly" element={<ProductionPlanPage />} />
    <Route path="/planning/weekly" element={<ProductionPlanPage />} />
    <Route path="/planning/daily" element={<ProductionPlanPage />} />
    <Route path="/planning/work-order" element={<WorkOrderPage />} />
    <Route path="/planning/work-order-confirm" element={<WorkOrderPage />} />
    <Route path="/planning/work-order-status" element={<WorkOrderStatusPage />} />

    {/* ========== 생산실행 ========== */}
    <Route path="/execution/result-input" element={<ProductionResultPage />} />
    <Route path="/execution/self-inspection" element={<SelfInspectionPage />} />
    <Route path="/execution/downtime" element={<DowntimePage />} />
    <Route path="/execution/material-info" element={<MaterialInfoPage />} />
    <Route path="/execution/lot-tracking" element={<LotTrackingPage />} />

    {/* ========== 품질관리 ========== */}
    <Route path="/quality/initial-inspection" element={<InitialInspectionPage />} />
    <Route path="/quality/process-inspection" element={<ProcessInspectionPage />} />
    <Route path="/quality/defect-status" element={<DefectStatusPage />} />
    <Route path="/quality/spc" element={<SPCPage />} />
    <Route path="/quality/claim" element={<ClaimPage />} />

    {/* ========== 설비관리 ========== */}
    <Route path="/equipment-mgmt/utilization" element={<EquipmentUtilizationPage />} />
    <Route path="/equipment-mgmt/breakdown" element={<BreakdownPage />} />
    <Route path="/equipment-mgmt/maintenance-order" element={<MaintenanceOrderPage />} />
    <Route path="/equipment-mgmt/maintenance-history" element={<MaintenanceHistoryPage />} />
    <Route path="/equipment-mgmt/pm-schedule" element={<PMSchedulePage />} />

    {/* ========== 현황/모니터링 ========== */}
    <Route path="/monitoring/work-result" element={<WorkResultPage />} />
    <Route path="/monitoring/equipment-history" element={<EquipmentHistoryPage />} />
    <Route path="/monitoring/worker-history" element={<WorkerHistoryPage />} />
    <Route path="/monitoring/line-status" element={<LineStatusPage />} />
    <Route path="/monitoring/realtime" element={<RealtimeMonitorPage />} />
    <Route path="/monitoring/oee" element={<OEEAnalysisPage />} />

    {/* ========== 시스템관리 ========== */}
    <Route path="/system/user" element={<UserPage />} />
    <Route path="/system/role" element={<RolePage />} />
    <Route path="/system/menu" element={<MenuPage />} />
    <Route path="/system/log" element={<LogPage />} />
  </>
);
