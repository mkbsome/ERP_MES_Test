-- ============================================================
-- ERP-MES 통합 시스템 초기 데이터
-- Version: 1.0.0
-- ============================================================

-- 공통 tenant_id (단일 테넌트 환경용)
DO $$
DECLARE
    v_tenant_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN

-- ============================================================
-- 1. 계정과목 (Chart of Accounts)
-- ============================================================

INSERT INTO erp_account_code (account_code, tenant_id, account_name, account_type, account_category, level) VALUES
-- 자산 (1xxx)
('1000', v_tenant_id, '자산', 'asset', '자산', 1),
('1100', v_tenant_id, '유동자산', 'asset', '유동자산', 2),
('1110', v_tenant_id, '현금및현금성자산', 'asset', '유동자산', 3),
('1120', v_tenant_id, '매출채권', 'asset', '유동자산', 3),
('1130', v_tenant_id, '재고자산', 'asset', '유동자산', 3),
('1131', v_tenant_id, '원재료', 'asset', '유동자산', 4),
('1132', v_tenant_id, '재공품', 'asset', '유동자산', 4),
('1133', v_tenant_id, '제품', 'asset', '유동자산', 4),
('1200', v_tenant_id, '비유동자산', 'asset', '비유동자산', 2),
('1210', v_tenant_id, '유형자산', 'asset', '비유동자산', 3),
('1211', v_tenant_id, '토지', 'asset', '비유동자산', 4),
('1212', v_tenant_id, '건물', 'asset', '비유동자산', 4),
('1213', v_tenant_id, '기계장치', 'asset', '비유동자산', 4),
('1214', v_tenant_id, '차량운반구', 'asset', '비유동자산', 4),
('1215', v_tenant_id, '비품', 'asset', '비유동자산', 4),
('1220', v_tenant_id, '무형자산', 'asset', '비유동자산', 3),
('1230', v_tenant_id, '감가상각누계액', 'asset', '비유동자산', 3),

-- 부채 (2xxx)
('2000', v_tenant_id, '부채', 'liability', '부채', 1),
('2100', v_tenant_id, '유동부채', 'liability', '유동부채', 2),
('2110', v_tenant_id, '매입채무', 'liability', '유동부채', 3),
('2120', v_tenant_id, '미지급금', 'liability', '유동부채', 3),
('2130', v_tenant_id, '미지급비용', 'liability', '유동부채', 3),
('2140', v_tenant_id, '선수금', 'liability', '유동부채', 3),
('2150', v_tenant_id, '예수금', 'liability', '유동부채', 3),
('2200', v_tenant_id, '비유동부채', 'liability', '비유동부채', 2),
('2210', v_tenant_id, '장기차입금', 'liability', '비유동부채', 3),

-- 자본 (3xxx)
('3000', v_tenant_id, '자본', 'equity', '자본', 1),
('3100', v_tenant_id, '자본금', 'equity', '자본금', 2),
('3200', v_tenant_id, '이익잉여금', 'equity', '이익잉여금', 2),
('3210', v_tenant_id, '당기순이익', 'equity', '이익잉여금', 3),

-- 수익 (4xxx)
('4000', v_tenant_id, '수익', 'revenue', '수익', 1),
('4100', v_tenant_id, '매출액', 'revenue', '매출', 2),
('4110', v_tenant_id, '제품매출', 'revenue', '매출', 3),
('4120', v_tenant_id, '상품매출', 'revenue', '매출', 3),
('4200', v_tenant_id, '매출할인', 'revenue', '매출', 2),
('4300', v_tenant_id, '영업외수익', 'revenue', '영업외', 2),
('4310', v_tenant_id, '이자수익', 'revenue', '영업외', 3),
('4320', v_tenant_id, '외환차익', 'revenue', '영업외', 3),

-- 비용 (5xxx)
('5000', v_tenant_id, '비용', 'expense', '비용', 1),
('5100', v_tenant_id, '매출원가', 'expense', '매출원가', 2),
('5110', v_tenant_id, '재료비', 'expense', '매출원가', 3),
('5120', v_tenant_id, '노무비', 'expense', '매출원가', 3),
('5130', v_tenant_id, '제조경비', 'expense', '매출원가', 3),
('5200', v_tenant_id, '판매비와관리비', 'expense', '판관비', 2),
('5210', v_tenant_id, '급여', 'expense', '판관비', 3),
('5220', v_tenant_id, '복리후생비', 'expense', '판관비', 3),
('5230', v_tenant_id, '감가상각비', 'expense', '판관비', 3),
('5240', v_tenant_id, '임차료', 'expense', '판관비', 3),
('5250', v_tenant_id, '통신비', 'expense', '판관비', 3),
('5260', v_tenant_id, '수도광열비', 'expense', '판관비', 3),
('5270', v_tenant_id, '소모품비', 'expense', '판관비', 3),
('5300', v_tenant_id, '영업외비용', 'expense', '영업외', 2),
('5310', v_tenant_id, '이자비용', 'expense', '영업외', 3),
('5320', v_tenant_id, '외환차손', 'expense', '영업외', 3)
ON CONFLICT DO NOTHING;

-- 계정과목 부모 참조 설정
UPDATE erp_account_code SET parent_code = '1000' WHERE account_code IN ('1100', '1200');
UPDATE erp_account_code SET parent_code = '1100' WHERE account_code IN ('1110', '1120', '1130');
UPDATE erp_account_code SET parent_code = '1130' WHERE account_code IN ('1131', '1132', '1133');
UPDATE erp_account_code SET parent_code = '1200' WHERE account_code IN ('1210', '1220', '1230');
UPDATE erp_account_code SET parent_code = '1210' WHERE account_code IN ('1211', '1212', '1213', '1214', '1215');
UPDATE erp_account_code SET parent_code = '2000' WHERE account_code IN ('2100', '2200');
UPDATE erp_account_code SET parent_code = '2100' WHERE account_code IN ('2110', '2120', '2130', '2140', '2150');
UPDATE erp_account_code SET parent_code = '2200' WHERE account_code = '2210';
UPDATE erp_account_code SET parent_code = '3000' WHERE account_code IN ('3100', '3200');
UPDATE erp_account_code SET parent_code = '3200' WHERE account_code = '3210';
UPDATE erp_account_code SET parent_code = '4000' WHERE account_code IN ('4100', '4200', '4300');
UPDATE erp_account_code SET parent_code = '4100' WHERE account_code IN ('4110', '4120');
UPDATE erp_account_code SET parent_code = '4300' WHERE account_code IN ('4310', '4320');
UPDATE erp_account_code SET parent_code = '5000' WHERE account_code IN ('5100', '5200', '5300');
UPDATE erp_account_code SET parent_code = '5100' WHERE account_code IN ('5110', '5120', '5130');
UPDATE erp_account_code SET parent_code = '5200' WHERE account_code IN ('5210', '5220', '5230', '5240', '5250', '5260', '5270');
UPDATE erp_account_code SET parent_code = '5300' WHERE account_code IN ('5310', '5320');

-- ============================================================
-- 2. 원가센터
-- ============================================================

INSERT INTO erp_cost_center (cost_center_code, tenant_id, cost_center_name, cost_center_type) VALUES
('CC-PROD-01', v_tenant_id, 'SMT 생산부', 'production'),
('CC-PROD-02', v_tenant_id, 'DIP 생산부', 'production'),
('CC-PROD-03', v_tenant_id, '조립 생산부', 'production'),
('CC-PROD-04', v_tenant_id, '검사부', 'production'),
('CC-ADMIN-01', v_tenant_id, '경영지원팀', 'admin'),
('CC-ADMIN-02', v_tenant_id, '인사총무팀', 'admin'),
('CC-SALES-01', v_tenant_id, '국내영업팀', 'sales'),
('CC-SALES-02', v_tenant_id, '해외영업팀', 'sales'),
('CC-RD-01', v_tenant_id, '연구개발팀', 'rd')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. 창고
-- ============================================================

INSERT INTO erp_warehouse (tenant_id, warehouse_code, warehouse_name, warehouse_type, location) VALUES
(v_tenant_id, 'WH-RM-01', '원자재 창고', 'raw', '본사 1층'),
(v_tenant_id, 'WH-RM-02', '부자재 창고', 'raw', '본사 1층'),
(v_tenant_id, 'WH-WIP-01', '재공품 창고', 'wip', '공장 2층'),
(v_tenant_id, 'WH-FG-01', '완제품 창고', 'finished', '물류센터'),
(v_tenant_id, 'WH-FG-02', '출하대기 창고', 'finished', '물류센터'),
(v_tenant_id, 'WH-MRO-01', 'MRO 자재 창고', 'mro', '본사 지하1층')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. 부서
-- ============================================================

INSERT INTO erp_department (tenant_id, department_code, department_name, cost_center_code) VALUES
(v_tenant_id, 'DEPT-CEO', '대표이사', NULL),
(v_tenant_id, 'DEPT-PROD', '생산본부', 'CC-PROD-01'),
(v_tenant_id, 'DEPT-PROD-SMT', 'SMT팀', 'CC-PROD-01'),
(v_tenant_id, 'DEPT-PROD-ASSY', '조립팀', 'CC-PROD-03'),
(v_tenant_id, 'DEPT-QC', '품질관리팀', 'CC-PROD-04'),
(v_tenant_id, 'DEPT-SALES', '영업본부', 'CC-SALES-01'),
(v_tenant_id, 'DEPT-SALES-DOM', '국내영업팀', 'CC-SALES-01'),
(v_tenant_id, 'DEPT-SALES-OVS', '해외영업팀', 'CC-SALES-02'),
(v_tenant_id, 'DEPT-ADMIN', '경영지원본부', 'CC-ADMIN-01'),
(v_tenant_id, 'DEPT-HR', '인사총무팀', 'CC-ADMIN-02'),
(v_tenant_id, 'DEPT-FIN', '재무회계팀', 'CC-ADMIN-01'),
(v_tenant_id, 'DEPT-RD', '연구개발팀', 'CC-RD-01')
ON CONFLICT DO NOTHING;

-- 부서 계층 설정
UPDATE erp_department SET parent_code = 'DEPT-CEO' WHERE department_code IN ('DEPT-PROD', 'DEPT-SALES', 'DEPT-ADMIN', 'DEPT-RD');
UPDATE erp_department SET parent_code = 'DEPT-PROD' WHERE department_code IN ('DEPT-PROD-SMT', 'DEPT-PROD-ASSY', 'DEPT-QC');
UPDATE erp_department SET parent_code = 'DEPT-SALES' WHERE department_code IN ('DEPT-SALES-DOM', 'DEPT-SALES-OVS');
UPDATE erp_department SET parent_code = 'DEPT-ADMIN' WHERE department_code IN ('DEPT-HR', 'DEPT-FIN');

-- ============================================================
-- 5. 직급
-- ============================================================

INSERT INTO erp_position (tenant_id, position_code, position_name, position_level) VALUES
(v_tenant_id, 'POS-CEO', '대표이사', 1),
(v_tenant_id, 'POS-EVP', '부사장', 2),
(v_tenant_id, 'POS-VP', '이사', 3),
(v_tenant_id, 'POS-GM', '부장', 4),
(v_tenant_id, 'POS-MGR', '차장', 5),
(v_tenant_id, 'POS-AM', '과장', 6),
(v_tenant_id, 'POS-SR', '대리', 7),
(v_tenant_id, 'POS-JR', '사원', 8)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. 회계기간
-- ============================================================

INSERT INTO erp_fiscal_period (tenant_id, fiscal_year, fiscal_period, period_name, start_date, end_date, status) VALUES
-- 2024년
(v_tenant_id, 2024, 1, '2024년 1월', '2024-01-01', '2024-01-31', 'closed'),
(v_tenant_id, 2024, 2, '2024년 2월', '2024-02-01', '2024-02-29', 'closed'),
(v_tenant_id, 2024, 3, '2024년 3월', '2024-03-01', '2024-03-31', 'closed'),
(v_tenant_id, 2024, 4, '2024년 4월', '2024-04-01', '2024-04-30', 'closed'),
(v_tenant_id, 2024, 5, '2024년 5월', '2024-05-01', '2024-05-31', 'closed'),
(v_tenant_id, 2024, 6, '2024년 6월', '2024-06-01', '2024-06-30', 'closed'),
(v_tenant_id, 2024, 7, '2024년 7월', '2024-07-01', '2024-07-31', 'closed'),
(v_tenant_id, 2024, 8, '2024년 8월', '2024-08-01', '2024-08-31', 'closed'),
(v_tenant_id, 2024, 9, '2024년 9월', '2024-09-01', '2024-09-30', 'closed'),
(v_tenant_id, 2024, 10, '2024년 10월', '2024-10-01', '2024-10-31', 'closed'),
(v_tenant_id, 2024, 11, '2024년 11월', '2024-11-01', '2024-11-30', 'closed'),
(v_tenant_id, 2024, 12, '2024년 12월', '2024-12-01', '2024-12-31', 'open'),
-- 2025년
(v_tenant_id, 2025, 1, '2025년 1월', '2025-01-01', '2025-01-31', 'open'),
(v_tenant_id, 2025, 2, '2025년 2월', '2025-02-01', '2025-02-28', 'open'),
(v_tenant_id, 2025, 3, '2025년 3월', '2025-03-01', '2025-03-31', 'open')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. 시스템 역할
-- ============================================================

INSERT INTO sys_role (tenant_id, role_code, role_name, description) VALUES
(v_tenant_id, 'ROLE-ADMIN', '시스템관리자', '전체 시스템 관리 권한'),
(v_tenant_id, 'ROLE-MANAGER', '관리자', '부서별 관리 권한'),
(v_tenant_id, 'ROLE-USER', '일반사용자', '기본 조회/입력 권한'),
(v_tenant_id, 'ROLE-VIEWER', '조회자', '조회 전용 권한'),
(v_tenant_id, 'ROLE-OPERATOR', '현장작업자', 'MES 생산현장 권한')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. 시스템 메뉴
-- ============================================================

INSERT INTO sys_menu (tenant_id, menu_id, menu_name, parent_id, menu_path, icon, sort_order) VALUES
-- ERP 메뉴
(v_tenant_id, 'ERP', 'ERP', NULL, '/erp', 'Building', 1),
(v_tenant_id, 'ERP-MASTER', '기준정보', 'ERP', '/erp/master', 'Database', 10),
(v_tenant_id, 'ERP-SALES', '영업관리', 'ERP', '/erp/sales', 'ShoppingCart', 20),
(v_tenant_id, 'ERP-PURCHASE', '구매관리', 'ERP', '/erp/purchase', 'Truck', 30),
(v_tenant_id, 'ERP-INVENTORY', '재고관리', 'ERP', '/erp/inventory', 'Package', 40),
(v_tenant_id, 'ERP-PRODUCTION', '생산관리', 'ERP', '/erp/production', 'Factory', 50),
(v_tenant_id, 'ERP-COST', '원가관리', 'ERP', '/erp/cost', 'Calculator', 60),
(v_tenant_id, 'ERP-ASSET', '자산관리', 'ERP', '/erp/asset', 'Landmark', 70),
(v_tenant_id, 'ERP-FINANCE', '재무회계', 'ERP', '/erp/finance', 'Wallet', 80),
(v_tenant_id, 'ERP-ACCOUNTING', '관리회계', 'ERP', '/erp/accounting', 'PieChart', 90),
(v_tenant_id, 'ERP-HR', '인사관리', 'ERP', '/erp/hr', 'Users', 100),

-- MES 메뉴
(v_tenant_id, 'MES', 'MES', NULL, '/mes', 'Activity', 2),
(v_tenant_id, 'MES-DASHBOARD', '대시보드', 'MES', '/', 'LayoutDashboard', 10),
(v_tenant_id, 'MES-PLANNING', '생산계획', 'MES', '/planning', 'Calendar', 20),
(v_tenant_id, 'MES-EXECUTION', '생산실행', 'MES', '/execution', 'Play', 30),
(v_tenant_id, 'MES-QUALITY', '품질관리', 'MES', '/quality', 'CheckCircle', 40),
(v_tenant_id, 'MES-EQUIPMENT', '설비관리', 'MES', '/equipment-mgmt', 'Settings', 50),
(v_tenant_id, 'MES-MONITORING', '모니터링', 'MES', '/monitoring', 'Monitor', 60),

-- 시스템 메뉴
(v_tenant_id, 'SYSTEM', '시스템', NULL, '/system', 'Cog', 99),
(v_tenant_id, 'SYSTEM-USER', '사용자관리', 'SYSTEM', '/system/user', 'UserCog', 10),
(v_tenant_id, 'SYSTEM-ROLE', '권한관리', 'SYSTEM', '/system/role', 'Shield', 20),
(v_tenant_id, 'SYSTEM-MENU', '메뉴관리', 'SYSTEM', '/system/menu', 'Menu', 30),
(v_tenant_id, 'SYSTEM-LOG', '로그관리', 'SYSTEM', '/system/log', 'FileText', 40)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. 품목 마스터 샘플
-- ============================================================

INSERT INTO erp_product_master (tenant_id, product_code, product_name, product_type, product_group, uom, standard_cost, selling_price, safety_stock, lead_time_days) VALUES
-- 완제품 (FG)
(v_tenant_id, 'FG-MB-001', '메인보드 A타입', 'FG', 'PCB', 'EA', 45000, 85000, 100, 7),
(v_tenant_id, 'FG-MB-002', '메인보드 B타입', 'FG', 'PCB', 'EA', 52000, 98000, 80, 7),
(v_tenant_id, 'FG-MB-003', '메인보드 C타입 (고급형)', 'FG', 'PCB', 'EA', 68000, 128000, 50, 10),
(v_tenant_id, 'FG-PS-001', '전원공급장치 500W', 'FG', 'POWER', 'EA', 28000, 52000, 150, 5),
(v_tenant_id, 'FG-PS-002', '전원공급장치 750W', 'FG', 'POWER', 'EA', 38000, 72000, 100, 5),

-- 반제품 (WIP)
(v_tenant_id, 'WIP-PCB-001', 'PCB 기판 A', 'WIP', 'PCB', 'EA', 12000, 0, 200, 3),
(v_tenant_id, 'WIP-PCB-002', 'PCB 기판 B', 'WIP', 'PCB', 'EA', 15000, 0, 150, 3),
(v_tenant_id, 'WIP-ASS-001', '조립품 A', 'WIP', 'ASSY', 'EA', 25000, 0, 100, 2),

-- 원자재 (RM)
(v_tenant_id, 'RM-IC-001', 'CPU 칩셋', 'RM', 'IC', 'EA', 8500, 0, 500, 14),
(v_tenant_id, 'RM-IC-002', '메모리 컨트롤러', 'RM', 'IC', 'EA', 4200, 0, 800, 14),
(v_tenant_id, 'RM-IC-003', 'GPU 칩셋', 'RM', 'IC', 'EA', 12000, 0, 300, 21),
(v_tenant_id, 'RM-CAP-001', '콘덴서 100uF', 'RM', 'PASSIVE', 'EA', 50, 0, 10000, 7),
(v_tenant_id, 'RM-CAP-002', '콘덴서 220uF', 'RM', 'PASSIVE', 'EA', 80, 0, 8000, 7),
(v_tenant_id, 'RM-RES-001', '저항 10K옴', 'RM', 'PASSIVE', 'EA', 10, 0, 20000, 7),
(v_tenant_id, 'RM-RES-002', '저항 4.7K옴', 'RM', 'PASSIVE', 'EA', 10, 0, 20000, 7),
(v_tenant_id, 'RM-CON-001', '커넥터 24핀', 'RM', 'CONNECTOR', 'EA', 350, 0, 2000, 10),
(v_tenant_id, 'RM-CON-002', '커넥터 8핀', 'RM', 'CONNECTOR', 'EA', 120, 0, 3000, 10),
(v_tenant_id, 'RM-PCB-RAW', 'PCB 원판', 'RM', 'PCB', 'EA', 5000, 0, 500, 14),

-- 포장재 (PKG)
(v_tenant_id, 'PKG-BOX-001', '제품 박스 (대)', 'PKG', 'BOX', 'EA', 1500, 0, 500, 5),
(v_tenant_id, 'PKG-BOX-002', '제품 박스 (중)', 'PKG', 'BOX', 'EA', 1000, 0, 800, 5),
(v_tenant_id, 'PKG-FOAM-001', '완충재', 'PKG', 'FOAM', 'EA', 300, 0, 2000, 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. 고객 마스터 샘플
-- ============================================================

INSERT INTO erp_customer_master (tenant_id, customer_code, customer_name, customer_type, customer_grade, business_no, ceo_name, phone, email, credit_limit, payment_terms) VALUES
(v_tenant_id, 'C-001', '삼성전자', 'domestic', 'A', '124-81-00998', '한종희', '02-2255-0114', 'purchase@samsung.com', 5000000000, 'net_30'),
(v_tenant_id, 'C-002', 'LG전자', 'domestic', 'A', '107-86-14075', '조주완', '02-3777-1114', 'purchase@lge.com', 3000000000, 'net_30'),
(v_tenant_id, 'C-003', 'SK하이닉스', 'domestic', 'A', '215-87-00393', '곽노정', '031-5185-4114', 'scm@skhynix.com', 2000000000, 'net_45'),
(v_tenant_id, 'C-004', '현대모비스', 'domestic', 'B', '132-81-00722', '정의선', '02-2018-5114', 'parts@hyundai-mobis.com', 1500000000, 'net_30'),
(v_tenant_id, 'C-005', '한화시스템', 'domestic', 'B', '132-81-26096', '어성철', '02-729-1114', 'purchase@hanwha.com', 1000000000, 'net_30'),
(v_tenant_id, 'C-006', 'Dell Technologies', 'overseas', 'A', NULL, 'Michael Dell', '+1-800-456-3355', 'procurement@dell.com', 3000000000, 'net_45'),
(v_tenant_id, 'C-007', 'HP Inc.', 'overseas', 'B', NULL, 'Enrique Lores', '+1-650-857-1501', 'supply@hp.com', 2000000000, 'net_45')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 11. 거래처(공급업체) 마스터 샘플
-- ============================================================

INSERT INTO erp_vendor_master (tenant_id, vendor_code, vendor_name, vendor_type, vendor_grade, business_no, ceo_name, phone, email, payment_terms) VALUES
(v_tenant_id, 'V-001', '삼성전기', 'manufacturer', 'A', '130-81-02224', '장덕현', '031-300-7114', 'sales@sem.samsung.com', 'net_30'),
(v_tenant_id, 'V-002', 'LG이노텍', 'manufacturer', 'A', '130-81-34984', '문혁수', '02-6987-5114', 'sales@lginnotek.com', 'net_30'),
(v_tenant_id, 'V-003', '대덕전자', 'manufacturer', 'B', '134-81-00854', '이성기', '042-930-7114', 'sales@daeduck.com', 'net_30'),
(v_tenant_id, 'V-004', '인텔코리아', 'distributor', 'A', '220-81-25692', '권명숙', '02-2606-8000', 'sales@intel.co.kr', 'net_45'),
(v_tenant_id, 'V-005', '마우저일렉트로닉스', 'distributor', 'B', NULL, 'Glenn Smith', '+1-817-804-3800', 'sales@mouser.com', 'net_30'),
(v_tenant_id, 'V-006', '디지키', 'distributor', 'B', NULL, 'Dave Doherty', '+1-218-681-6674', 'sales@digikey.com', 'net_30')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 12. MES 생산라인
-- ============================================================

INSERT INTO mes_production_line (tenant_id, line_code, line_name, line_type, factory_code, capacity_per_hour) VALUES
(v_tenant_id, 'SMT-L01', 'SMT 1호 라인', 'SMT', 'F01', 1200),
(v_tenant_id, 'SMT-L02', 'SMT 2호 라인', 'SMT', 'F01', 1000),
(v_tenant_id, 'SMT-L03', 'SMT 3호 라인', 'SMT', 'F01', 800),
(v_tenant_id, 'DIP-L01', 'DIP 1호 라인', 'DIP', 'F01', 600),
(v_tenant_id, 'ASSY-L01', '조립 1호 라인', 'ASSY', 'F01', 400),
(v_tenant_id, 'ASSY-L02', '조립 2호 라인', 'ASSY', 'F01', 350),
(v_tenant_id, 'TEST-L01', '검사 1호 라인', 'TEST', 'F01', 500),
(v_tenant_id, 'PACK-L01', '포장 라인', 'PACK', 'F01', 800)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 13. MES 불량유형
-- ============================================================

INSERT INTO mes_defect_type (tenant_id, defect_code, defect_name, defect_category, severity) VALUES
(v_tenant_id, 'DF-SOL-001', '솔더 불량', 'solder', 'major'),
(v_tenant_id, 'DF-SOL-002', '솔더 브릿지', 'solder', 'critical'),
(v_tenant_id, 'DF-SOL-003', '솔더 미납', 'solder', 'major'),
(v_tenant_id, 'DF-CMP-001', '부품 누락', 'component', 'critical'),
(v_tenant_id, 'DF-CMP-002', '부품 역삽입', 'component', 'critical'),
(v_tenant_id, 'DF-CMP-003', '부품 파손', 'component', 'major'),
(v_tenant_id, 'DF-PCB-001', 'PCB 스크래치', 'pcb', 'minor'),
(v_tenant_id, 'DF-PCB-002', 'PCB 휨', 'pcb', 'major'),
(v_tenant_id, 'DF-FNC-001', '기능 불량', 'functional', 'critical'),
(v_tenant_id, 'DF-FNC-002', '성능 미달', 'functional', 'major'),
(v_tenant_id, 'DF-VIS-001', '외관 불량', 'visual', 'minor')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 14. 시스템 설정
-- ============================================================

INSERT INTO sys_config (tenant_id, config_key, config_value, config_type, description) VALUES
(v_tenant_id, 'company.name', 'GreenBoard Electronics', 'string', '회사명'),
(v_tenant_id, 'company.business_no', '123-45-67890', 'string', '사업자번호'),
(v_tenant_id, 'system.language', 'ko', 'string', '기본 언어'),
(v_tenant_id, 'system.timezone', 'Asia/Seoul', 'string', '시간대'),
(v_tenant_id, 'system.currency', 'KRW', 'string', '기본 통화'),
(v_tenant_id, 'inventory.valuation_method', 'average', 'string', '재고 평가 방법 (average/fifo/lifo)'),
(v_tenant_id, 'accounting.fiscal_year_start', '01', 'string', '회계연도 시작월'),
(v_tenant_id, 'production.auto_lot_generation', 'true', 'boolean', 'LOT 자동 생성 여부'),
(v_tenant_id, 'quality.auto_inspection', 'true', 'boolean', '자동 검사 여부'),
(v_tenant_id, 'alert.low_stock_threshold', '10', 'number', '재고 부족 알림 임계값 (%)')
ON CONFLICT DO NOTHING;

END $$;

-- ============================================================
-- 초기 데이터 로드 완료
-- ============================================================

COMMENT ON TABLE erp_account_code IS '계정과목 - 초기 데이터 로드됨';
