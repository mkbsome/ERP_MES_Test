/**
 * MES/ERP 메뉴 구성 설정
 * 실제 MES/ERP 시스템 기능 기반 메뉴 구조
 */

export interface MenuItem {
  id: string;
  name: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
  badge?: string;
}

export interface MenuGroup {
  id: string;
  name: string;
  icon: string;
  items: MenuItem[];
}

export type SystemType = 'mes' | 'erp';

export const mesMenuConfig: MenuGroup[] = [
  {
    id: 'master',
    name: '기준정보관리',
    icon: 'Database',
    items: [
      { id: 'code-group', name: '코드그룹관리', path: '/master/code-group' },
      { id: 'common-code', name: '공통코드관리', path: '/master/common-code' },
      { id: 'department', name: '부서관리', path: '/master/department' },
      { id: 'customer', name: '고객사관리', path: '/master/customer' },
      { id: 'item', name: '품목정보관리', path: '/master/item' },
      { id: 'item-process', name: '품목별공정관리', path: '/master/item-process' },
      { id: 'equipment', name: '설비정보관리', path: '/master/equipment' },
      { id: 'worker', name: '작업자관리', path: '/master/worker' },
      { id: 'inspection-item', name: '검사항목관리', path: '/master/inspection-item' },
      { id: 'defect-type', name: '불량유형관리', path: '/master/defect-type' },
    ],
  },
  {
    id: 'planning',
    name: '생산계획',
    icon: 'CalendarDays',
    items: [
      { id: 'annual-plan', name: '연간생산계획', path: '/planning/annual' },
      { id: 'monthly-plan', name: '월간생산계획', path: '/planning/monthly' },
      { id: 'weekly-plan', name: '주간생산계획', path: '/planning/weekly' },
      { id: 'daily-plan', name: '생산지시관리', path: '/planning/daily' },
      { id: 'work-order', name: '작업지시관리', path: '/planning/work-order' },
      { id: 'work-order-confirm', name: '작업지시확정', path: '/planning/work-order-confirm' },
      { id: 'work-order-status', name: '작업지시현황', path: '/planning/work-order-status' },
    ],
  },
  {
    id: 'execution',
    name: '생산실행',
    icon: 'Play',
    items: [
      { id: 'work-list', name: '작업지시목록', path: '/execution/work-list' },
      { id: 'result-input', name: '실적등록', path: '/execution/result-input' },
      { id: 'self-inspection', name: '자주검사', path: '/execution/self-inspection' },
      { id: 'downtime-input', name: '비가동등록', path: '/execution/downtime-input' },
      { id: 'material-info', name: '원자재정보', path: '/execution/material-info' },
    ],
  },
  {
    id: 'quality',
    name: '품질관리',
    icon: 'Shield',
    items: [
      { id: 'first-mid-final', name: '초중종검사현황', path: '/quality/first-mid-final' },
      { id: 'self-inspection-status', name: '자주검사현황', path: '/quality/self-inspection-status' },
      { id: 'defect-by-equipment', name: '설비별불량현황', path: '/quality/defect-by-equipment' },
      { id: 'defect-by-period', name: '기간별불량현황', path: '/quality/defect-by-period' },
      { id: 'defect-by-work', name: '작업별불량현황', path: '/quality/defect-by-work' },
      { id: 'spc', name: 'SPC관리', path: '/quality/spc' },
      { id: 'nonconformity', name: '부적합품관리', path: '/quality/nonconformity' },
    ],
  },
  {
    id: 'equipment-mgmt',
    name: '설비관리',
    icon: 'Cpu',
    items: [
      { id: 'equipment-status', name: '설비작업현황', path: '/equipment/status' },
      { id: 'equipment-oee', name: '설비가동률조회', path: '/equipment/oee' },
      { id: 'equipment-failure', name: '설비고장내역관리', path: '/equipment/failure' },
      { id: 'maintenance-order', name: '설비보전지시', path: '/equipment/maintenance-order' },
      { id: 'maintenance-history', name: '설비보전이력', path: '/equipment/maintenance-history' },
      { id: 'downtime-by-equipment', name: '설비별비가동현황', path: '/equipment/downtime' },
    ],
  },
  {
    id: 'monitoring',
    name: '현황/모니터링',
    icon: 'Monitor',
    items: [
      { id: 'work-result-status', name: '작업실적현황', path: '/monitoring/work-result' },
      { id: 'work-result-detail', name: '작업실적상세현황', path: '/monitoring/work-result-detail' },
      { id: 'equipment-work-history', name: '설비별작업이력', path: '/monitoring/equipment-history' },
      { id: 'worker-work-history', name: '작업자별작업이력', path: '/monitoring/worker-history' },
      { id: 'overall-status', name: '종합가동현황', path: '/monitoring/overall' },
      { id: 'group-status', name: '그룹별가동현황', path: '/monitoring/group' },
    ],
  },
  {
    id: 'system',
    name: '시스템관리',
    icon: 'Settings',
    items: [
      { id: 'user', name: '사용자관리', path: '/system/user' },
      { id: 'user-group', name: '사용자그룹관리', path: '/system/user-group' },
      { id: 'permission', name: '권한관리', path: '/system/permission' },
      { id: 'menu', name: '메뉴관리', path: '/system/menu' },
      { id: 'login-history', name: '로그인내역', path: '/system/login-history' },
    ],
  },
];

// 대시보드는 별도 처리
export const dashboardMenu: MenuItem = {
  id: 'dashboard',
  name: '대시보드',
  path: '/',
  icon: 'LayoutDashboard',
};

// ERP 메뉴 설정
export const erpMenuConfig: MenuGroup[] = [
  {
    id: 'erp-master',
    name: '기준정보',
    icon: 'Database',
    items: [
      { id: 'erp-item', name: '품목관리', path: '/erp/master/item' },
      { id: 'erp-bom', name: 'BOM관리', path: '/erp/master/bom' },
      { id: 'erp-routing', name: 'Routing관리', path: '/erp/master/routing' },
      { id: 'erp-customer', name: '고객관리', path: '/erp/master/customer' },
      { id: 'erp-vendor', name: '공급업체관리', path: '/erp/master/vendor' },
      { id: 'erp-warehouse', name: '창고관리', path: '/erp/master/warehouse' },
    ],
  },
  {
    id: 'erp-sales',
    name: '영업관리',
    icon: 'ShoppingCart',
    items: [
      { id: 'erp-sales-order', name: '수주관리', path: '/erp/sales/order' },
      { id: 'erp-sales-order-status', name: '수주현황', path: '/erp/sales/order-status' },
      { id: 'erp-delivery', name: '출하관리', path: '/erp/sales/delivery' },
      { id: 'erp-delivery-status', name: '출하현황', path: '/erp/sales/delivery-status' },
      { id: 'erp-sales-return', name: '반품관리', path: '/erp/sales/return' },
    ],
  },
  {
    id: 'erp-purchase',
    name: '구매관리',
    icon: 'Truck',
    items: [
      { id: 'erp-purchase-request', name: '구매요청', path: '/erp/purchase/request' },
      { id: 'erp-purchase-order', name: '발주관리', path: '/erp/purchase/order' },
      { id: 'erp-purchase-order-status', name: '발주현황', path: '/erp/purchase/order-status' },
      { id: 'erp-goods-receipt', name: '입고관리', path: '/erp/purchase/receipt' },
      { id: 'erp-goods-receipt-status', name: '입고현황', path: '/erp/purchase/receipt-status' },
    ],
  },
  {
    id: 'erp-inventory',
    name: '재고관리',
    icon: 'Package',
    items: [
      { id: 'erp-stock-status', name: '재고현황', path: '/erp/inventory/stock' },
      { id: 'erp-stock-movement', name: '재고이동', path: '/erp/inventory/movement' },
      { id: 'erp-stock-adjustment', name: '재고조정', path: '/erp/inventory/adjustment' },
      { id: 'erp-stock-history', name: '재고이력', path: '/erp/inventory/history' },
      { id: 'erp-lot-tracking', name: 'LOT추적', path: '/erp/inventory/lot-tracking' },
    ],
  },
  {
    id: 'erp-production',
    name: '생산관리',
    icon: 'Factory',
    items: [
      { id: 'erp-mps', name: '주생산계획(MPS)', path: '/erp/production/mps' },
      { id: 'erp-mrp', name: '자재소요계획(MRP)', path: '/erp/production/mrp' },
      { id: 'erp-work-order', name: '생산지시', path: '/erp/production/work-order' },
      { id: 'erp-production-result', name: '생산실적', path: '/erp/production/result' },
      { id: 'erp-production-status', name: '생산현황', path: '/erp/production/status' },
    ],
  },
  {
    id: 'erp-cost',
    name: '원가관리',
    icon: 'Calculator',
    items: [
      { id: 'erp-standard-cost', name: '표준원가', path: '/erp/cost/standard' },
      { id: 'erp-actual-cost', name: '실제원가', path: '/erp/cost/actual' },
      { id: 'erp-cost-variance', name: '원가차이분석', path: '/erp/cost/variance' },
      { id: 'erp-cost-report', name: '원가보고서', path: '/erp/cost/report' },
    ],
  },
];

// ERP 대시보드
export const erpDashboardMenu: MenuItem = {
  id: 'erp-dashboard',
  name: 'ERP 대시보드',
  path: '/erp',
  icon: 'LayoutDashboard',
};
