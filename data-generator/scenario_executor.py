"""
실시간 시나리오 실행기
각 시나리오를 실제 DB에 반영
"""
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import yaml
from db_connection import execute, execute_batch, fetch_all, fetch_one, insert_returning
from config import TENANT_ID

class ScenarioExecutor:
    """시나리오 실행기"""

    def __init__(self):
        self.load_scenarios()

    def load_scenarios(self):
        """시나리오 정의 로드"""
        with open('scenarios/realtime_scenarios.yaml', 'r', encoding='utf-8') as f:
            self.scenarios = yaml.safe_load(f)['realtime_scenarios']

    def get_available_scenarios(self) -> Dict[str, Any]:
        """사용 가능한 시나리오 목록 반환"""
        result = {}
        for category, scenarios in self.scenarios.items():
            result[category] = {}
            for scenario_key, scenario in scenarios.items():
                result[category][scenario_key] = {
                    'id': scenario['id'],
                    'name': scenario['name'],
                    'description': scenario['description'],
                    'icon': scenario.get('icon', 'circle'),
                    'color': scenario.get('color', 'gray'),
                    'parameters': scenario['parameters']
                }
        return result

    def get_parameter_options(self, source: str, filter_condition: str = None) -> List[Dict]:
        """파라미터 선택 옵션 조회 (DB에서)"""
        table_mapping = {
            'mes_production_line': ('line_code', 'line_name', 'mes_production_line'),
            'mes_equipment': ('equipment_code', 'equipment_name', 'mes_equipment'),
            'erp_customer_master': ('customer_code', 'customer_name', 'erp_customer_master'),
            'erp_product_master': ('product_code', 'product_name', 'erp_product_master'),
            'erp_work_order': ('work_order_no', 'work_order_no', 'erp_work_order'),
            'erp_sales_order': ('order_no', 'order_no', 'erp_sales_order'),
            'erp_purchase_order': ('po_no', 'po_no', 'erp_purchase_order'),
            'erp_goods_receipt': ('receipt_no', 'receipt_no', 'erp_goods_receipt'),
            'erp_department': ('department_code', 'department_name', 'erp_department'),
        }

        if source not in table_mapping:
            return []

        code_col, name_col, table = table_mapping[source]

        query = f"SELECT {code_col} as value, {name_col} as label FROM {table} WHERE tenant_id = %s"
        if filter_condition:
            query += f" AND {filter_condition}"
        query += f" ORDER BY {name_col} LIMIT 100"

        rows = fetch_all(query, (TENANT_ID,))
        return [{'value': r['value'], 'label': r['label']} for r in rows]

    def execute_scenario(self, scenario_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """시나리오 실행"""
        # 시나리오 찾기
        scenario = self._find_scenario_by_id(scenario_id)
        if not scenario:
            return {'success': False, 'error': f'시나리오를 찾을 수 없습니다: {scenario_id}'}

        # 실행 메서드 매핑
        executor_map = {
            'QS001': self._execute_defect_spike,
            'QS002': self._execute_quality_hold,
            'EQ001': self._execute_equipment_breakdown,
            'EQ002': self._execute_oee_degradation,
            'EQ003': self._execute_preventive_maintenance,
            'PR001': self._execute_urgent_order,
            'PR002': self._execute_production_delay,
            'PR003': self._execute_shift_change,
            'MT001': self._execute_material_shortage,
            'MT002': self._execute_incoming_inspection_fail,
            'BS001': self._execute_order_cancellation,
            'BS002': self._execute_supplier_delay,
            'HR001': self._execute_mass_absence,
            'HR002': self._execute_overtime_request,
        }

        executor = executor_map.get(scenario_id)
        if not executor:
            return {'success': False, 'error': f'실행기가 구현되지 않았습니다: {scenario_id}'}

        try:
            result = executor(params)
            return {'success': True, 'result': result, 'scenario': scenario['name']}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def _find_scenario_by_id(self, scenario_id: str) -> Optional[Dict]:
        """ID로 시나리오 찾기"""
        for category, scenarios in self.scenarios.items():
            for key, scenario in scenarios.items():
                if scenario['id'] == scenario_id:
                    return scenario
        return None

    # ==========================================
    # 품질 시나리오 실행기
    # ==========================================

    def _execute_defect_spike(self, params: Dict[str, Any]) -> Dict:
        """불량률 급증 시나리오"""
        line_code = params['line_code']
        defect_rate = params['defect_rate'] / 100
        duration_type = params.get('duration_type', 'instant')
        duration_value = params.get('duration_value', 1)
        defect_types = params.get('defect_types', ['solder', 'missing'])

        # 해당 라인의 진행중인 작업지시 조회
        orders = fetch_all("""
            SELECT id, production_order_no, product_code, target_qty, good_qty
            FROM mes_production_order
            WHERE tenant_id = %s AND line_code = %s AND status IN ('started', 'completed')
            ORDER BY created_at DESC LIMIT 10
        """, (TENANT_ID, line_code))

        if not orders:
            return {'message': '해당 라인에 진행중인 작업이 없습니다', 'affected_records': 0}

        # 기간 계산
        if duration_type == 'instant':
            start_date = datetime.now()
            end_date = datetime.now()
        elif duration_type == 'hours':
            start_date = datetime.now()
            end_date = datetime.now() + timedelta(hours=duration_value)
        else:  # days
            start_date = datetime.now()
            end_date = datetime.now() + timedelta(days=duration_value)

        defect_type_names = {
            'solder': '납땜불량',
            'missing': '부품누락',
            'polarity': '극성반전',
            'damage': '부품파손',
            'position': '위치불량'
        }

        inserted_count = 0
        for order in orders:
            # 불량 수량 계산
            defect_qty = int(order['target_qty'] * defect_rate)
            if defect_qty == 0:
                defect_qty = max(1, int(defect_rate * 100))

            # 생산실적 업데이트
            execute("""
                UPDATE mes_production_order
                SET defect_qty = defect_qty + %s,
                    good_qty = GREATEST(0, good_qty - %s)
                WHERE id = %s
            """, (defect_qty, defect_qty, order['id']))

            # 불량 상세 기록 생성
            for _ in range(defect_qty):
                defect_type = random.choice(defect_types)
                execute("""
                    INSERT INTO mes_defect_record
                    (tenant_id, production_order_id, defect_time, defect_type,
                     defect_code, line_code, product_code, quantity, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 1, %s)
                """, (
                    TENANT_ID, order['id'],
                    start_date + timedelta(minutes=random.randint(0, 60)),
                    defect_type_names.get(defect_type, defect_type),
                    f"DEF-{defect_type.upper()[:3]}",
                    line_code, order['product_code'], datetime.now()
                ))
                inserted_count += 1

        return {
            'message': f'불량률 급증 시나리오 실행 완료',
            'line_code': line_code,
            'defect_rate': f'{defect_rate*100}%',
            'affected_orders': len(orders),
            'defect_records_created': inserted_count,
            'period': f'{start_date.strftime("%Y-%m-%d %H:%M")} ~ {end_date.strftime("%Y-%m-%d %H:%M")}'
        }

    def _execute_quality_hold(self, params: Dict[str, Any]) -> Dict:
        """품질 홀드 시나리오"""
        target_type = params['target_type']
        target_code = params['target_code']
        hold_reason = params['hold_reason']

        # 품질 홀드 기록 생성
        execute("""
            INSERT INTO mes_quality_hold
            (tenant_id, hold_type, target_code, hold_reason, hold_status,
             hold_date, created_at)
            VALUES (%s, %s, %s, %s, 'hold', %s, %s)
        """, (TENANT_ID, target_type, target_code, hold_reason, datetime.now(), datetime.now()))

        return {
            'message': '품질 홀드 처리 완료',
            'target_type': target_type,
            'target_code': target_code,
            'reason': hold_reason
        }

    # ==========================================
    # 설비 시나리오 실행기
    # ==========================================

    def _execute_equipment_breakdown(self, params: Dict[str, Any]) -> Dict:
        """설비 고장 시나리오"""
        equipment_code = params['equipment_code']
        failure_type = params['failure_type']
        severity = params['severity']
        estimated_hours = params['estimated_repair_hours']

        # 설비 상태 업데이트
        execute("""
            UPDATE mes_equipment
            SET status = 'breakdown'
            WHERE tenant_id = %s AND equipment_code = %s
        """, (TENANT_ID, equipment_code))

        # 다운타임 기록
        execute("""
            INSERT INTO mes_downtime
            (tenant_id, equipment_code, downtime_start, downtime_type,
             failure_type, severity, estimated_repair_time, status, created_at)
            VALUES (%s, %s, %s, 'breakdown', %s, %s, %s, 'ongoing', %s)
        """, (TENANT_ID, equipment_code, datetime.now(), failure_type,
              severity, estimated_hours, datetime.now()))

        # 해당 설비 사용 중인 작업 일시정지
        affected = execute("""
            UPDATE mes_production_order
            SET status = 'paused'
            WHERE tenant_id = %s
            AND line_code IN (SELECT line_code FROM mes_equipment WHERE equipment_code = %s)
            AND status = 'started'
        """, (TENANT_ID, equipment_code))

        return {
            'message': '설비 고장 시나리오 실행 완료',
            'equipment_code': equipment_code,
            'failure_type': failure_type,
            'severity': severity,
            'estimated_repair_hours': estimated_hours
        }

    def _execute_oee_degradation(self, params: Dict[str, Any]) -> Dict:
        """OEE 저하 시나리오"""
        equipment_code = params['equipment_code']
        degradation_types = params['degradation_type']
        degradation_percent = params['degradation_percent'] / 100
        duration_days = params['duration_days']

        # 기간 동안의 OEE 데이터 생성
        start_date = datetime.now()
        records_created = 0

        for day in range(duration_days):
            current_date = start_date + timedelta(days=day)
            for hour in range(24):
                record_time = current_date.replace(hour=hour, minute=0, second=0)

                # 기본 OEE 값 (정상: 85% 정도)
                base_availability = 0.90
                base_performance = 0.95
                base_quality = 0.99

                # 저하 적용
                if 'availability' in degradation_types:
                    base_availability *= (1 - degradation_percent)
                if 'performance' in degradation_types:
                    base_performance *= (1 - degradation_percent)
                if 'quality' in degradation_types:
                    base_quality *= (1 - degradation_percent)

                oee = base_availability * base_performance * base_quality

                execute("""
                    INSERT INTO mes_equipment_status
                    (tenant_id, equipment_code, record_time, availability,
                     performance, quality, oee, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                """, (TENANT_ID, equipment_code, record_time,
                      base_availability, base_performance, base_quality, oee, datetime.now()))
                records_created += 1

        return {
            'message': 'OEE 저하 시나리오 실행 완료',
            'equipment_code': equipment_code,
            'degradation_types': degradation_types,
            'degradation_percent': f'{degradation_percent*100}%',
            'duration_days': duration_days,
            'records_created': records_created
        }

    def _execute_preventive_maintenance(self, params: Dict[str, Any]) -> Dict:
        """예방 정비 시나리오"""
        equipment_code = params['equipment_code']
        maintenance_type = params['maintenance_type']
        duration_hours = params['duration_hours']

        # 설비 상태 업데이트
        execute("""
            UPDATE mes_equipment
            SET status = 'maintenance'
            WHERE tenant_id = %s AND equipment_code = %s
        """, (TENANT_ID, equipment_code))

        # 정비 이력 기록
        execute("""
            INSERT INTO mes_maintenance_history
            (tenant_id, equipment_code, maintenance_type, start_time,
             planned_duration, status, created_at)
            VALUES (%s, %s, %s, %s, %s, 'in_progress', %s)
        """, (TENANT_ID, equipment_code, maintenance_type,
              datetime.now(), duration_hours, datetime.now()))

        return {
            'message': '예방 정비 시나리오 실행 완료',
            'equipment_code': equipment_code,
            'maintenance_type': maintenance_type,
            'duration_hours': duration_hours
        }

    # ==========================================
    # 생산 시나리오 실행기
    # ==========================================

    def _execute_urgent_order(self, params: Dict[str, Any]) -> Dict:
        """긴급 주문 시나리오"""
        customer_code = params['customer_code']
        product_code = params['product_code']
        quantity = params['quantity']
        due_days = params['due_days']
        priority = params['priority']

        order_date = datetime.now().date()
        delivery_date = order_date + timedelta(days=due_days)

        # 제품 가격 조회
        product = fetch_one("""
            SELECT selling_price FROM erp_product_master
            WHERE tenant_id = %s AND product_code = %s
        """, (TENANT_ID, product_code))
        unit_price = product['selling_price'] if product else 10000
        total_amount = quantity * float(unit_price)

        # 수주 생성
        order_no = f"SO{datetime.now().strftime('%Y%m%d')}{random.randint(9000, 9999)}"
        order_id = insert_returning("""
            INSERT INTO erp_sales_order
            (tenant_id, order_no, order_date, customer_code, status,
             delivery_date, total_amount, priority, created_at)
            VALUES (%s, %s, %s, %s, 'confirmed', %s, %s, %s, %s)
            RETURNING id
        """, (TENANT_ID, order_no, order_date, customer_code,
              delivery_date, total_amount, priority, datetime.now()))

        # 수주 품목
        execute("""
            INSERT INTO erp_sales_order_item
            (order_id, line_no, product_code, order_qty, unit_price, created_at)
            VALUES (%s, 1, %s, %s, %s, %s)
        """, (order_id, product_code, quantity, unit_price, datetime.now()))

        # 제조오더 생성
        wo_no = f"WO{datetime.now().strftime('%Y%m%d')}{random.randint(9000, 9999)}"
        execute("""
            INSERT INTO erp_work_order
            (tenant_id, work_order_no, order_date, product_code, order_qty,
             sales_order_id, planned_start, planned_end, status, priority, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'released', %s, %s)
        """, (TENANT_ID, wo_no, order_date, product_code, quantity,
              order_id, order_date, delivery_date, priority, datetime.now()))

        # MES 작업지시 생성
        line = fetch_one("""
            SELECT line_code FROM mes_production_line
            WHERE tenant_id = %s AND is_active = true LIMIT 1
        """, (TENANT_ID,))
        line_code = line['line_code'] if line else 'LINE001'

        mo_no = f"MO{datetime.now().strftime('%Y%m%d')}{random.randint(90000, 99999)}"
        execute("""
            INSERT INTO mes_production_order
            (tenant_id, production_order_no, erp_work_order_no, order_date,
             product_code, line_code, target_qty, status, priority, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'planned', %s, %s)
        """, (TENANT_ID, mo_no, wo_no, order_date, product_code,
              line_code, quantity, priority, datetime.now()))

        return {
            'message': '긴급 주문 생성 완료',
            'order_no': order_no,
            'work_order_no': wo_no,
            'production_order_no': mo_no,
            'customer_code': customer_code,
            'product_code': product_code,
            'quantity': quantity,
            'delivery_date': str(delivery_date),
            'priority': priority
        }

    def _execute_production_delay(self, params: Dict[str, Any]) -> Dict:
        """생산 지연 시나리오"""
        work_order_no = params['work_order_no']
        delay_reason = params['delay_reason']
        delay_days = params['delay_days']

        # 제조오더 납기 연장
        execute("""
            UPDATE erp_work_order
            SET planned_end = planned_end + INTERVAL '%s days',
                status = 'in_progress'
            WHERE tenant_id = %s AND work_order_no = %s
        """, (delay_days, TENANT_ID, work_order_no))

        # 관련 수주 납기 조정
        execute("""
            UPDATE erp_sales_order
            SET delivery_date = delivery_date + INTERVAL '%s days'
            WHERE id IN (
                SELECT sales_order_id FROM erp_work_order
                WHERE tenant_id = %s AND work_order_no = %s
            )
        """, (delay_days, TENANT_ID, work_order_no))

        return {
            'message': '생산 지연 처리 완료',
            'work_order_no': work_order_no,
            'delay_reason': delay_reason,
            'delay_days': delay_days
        }

    def _execute_shift_change(self, params: Dict[str, Any]) -> Dict:
        """교대 근무 변경 시나리오"""
        line_code = params['line_code']
        shift_pattern = params['shift_pattern']

        execute("""
            UPDATE mes_production_line
            SET shift_pattern = %s
            WHERE tenant_id = %s AND line_code = %s
        """, (shift_pattern, TENANT_ID, line_code))

        return {
            'message': '교대 근무 변경 완료',
            'line_code': line_code,
            'shift_pattern': shift_pattern
        }

    # ==========================================
    # 자재 시나리오 실행기
    # ==========================================

    def _execute_material_shortage(self, params: Dict[str, Any]) -> Dict:
        """자재 부족 시나리오"""
        item_code = params['item_code']
        shortage_percent = params['shortage_percent'] / 100

        # 현재 재고 조회 및 감소
        execute("""
            UPDATE erp_inventory
            SET quantity = quantity * (1 - %s)
            WHERE tenant_id = %s AND item_code = %s
        """, (shortage_percent, TENANT_ID, item_code))

        # 긴급 자재 요청 생성
        request_no = f"MR{datetime.now().strftime('%Y%m%d')}{random.randint(1000, 9999)}"
        execute("""
            INSERT INTO mes_material_request
            (tenant_id, request_no, request_date, item_code,
             request_type, status, priority, created_at)
            VALUES (%s, %s, %s, %s, 'urgent', 'pending', 'high', %s)
        """, (TENANT_ID, request_no, datetime.now().date(), item_code, datetime.now()))

        return {
            'message': '자재 부족 시나리오 실행 완료',
            'item_code': item_code,
            'reduction': f'{shortage_percent*100}%',
            'material_request_no': request_no
        }

    def _execute_incoming_inspection_fail(self, params: Dict[str, Any]) -> Dict:
        """입고 검사 불합격 시나리오"""
        receipt_no = params['receipt_no']
        reject_rate = params['reject_rate'] / 100
        reject_reason = params['reject_reason']

        # 입고 품목 불합격 처리
        execute("""
            UPDATE erp_goods_receipt_item
            SET inspection_result = 'FAIL',
                accepted_qty = receipt_qty * (1 - %s)
            WHERE receipt_id IN (
                SELECT id FROM erp_goods_receipt
                WHERE tenant_id = %s AND receipt_no = %s
            )
        """, (reject_rate, TENANT_ID, receipt_no))

        return {
            'message': '입고 검사 불합격 처리 완료',
            'receipt_no': receipt_no,
            'reject_rate': f'{reject_rate*100}%',
            'reject_reason': reject_reason
        }

    # ==========================================
    # 영업/구매 시나리오 실행기
    # ==========================================

    def _execute_order_cancellation(self, params: Dict[str, Any]) -> Dict:
        """주문 취소 시나리오"""
        order_no = params['order_no']
        cancel_reason = params['cancel_reason']
        cancel_production = params.get('cancel_production', True)

        # 주문 취소
        execute("""
            UPDATE erp_sales_order
            SET status = 'cancelled'
            WHERE tenant_id = %s AND order_no = %s
        """, (TENANT_ID, order_no))

        # 관련 제조오더 취소
        if cancel_production:
            execute("""
                UPDATE erp_work_order
                SET status = 'cancelled'
                WHERE sales_order_id IN (
                    SELECT id FROM erp_sales_order
                    WHERE tenant_id = %s AND order_no = %s
                )
            """, (TENANT_ID, order_no))

        return {
            'message': '주문 취소 처리 완료',
            'order_no': order_no,
            'cancel_reason': cancel_reason,
            'production_cancelled': cancel_production
        }

    def _execute_supplier_delay(self, params: Dict[str, Any]) -> Dict:
        """공급업체 납기 지연 시나리오"""
        po_no = params['po_no']
        delay_days = params['delay_days']

        execute("""
            UPDATE erp_purchase_order
            SET expected_date = expected_date + INTERVAL '%s days'
            WHERE tenant_id = %s AND po_no = %s
        """, (delay_days, TENANT_ID, po_no))

        return {
            'message': '공급업체 납기 지연 처리 완료',
            'po_no': po_no,
            'delay_days': delay_days
        }

    # ==========================================
    # HR 시나리오 실행기
    # ==========================================

    def _execute_mass_absence(self, params: Dict[str, Any]) -> Dict:
        """대량 결근 시나리오"""
        department_code = params['department_code']
        absence_rate = params['absence_rate'] / 100
        absence_reason = params['absence_reason']
        duration_days = params['duration_days']

        # 해당 부서 직원 조회
        employees = fetch_all("""
            SELECT employee_id FROM erp_employee
            WHERE tenant_id = %s AND department_code = %s AND status = 'active'
        """, (TENANT_ID, department_code))

        # 결근 처리할 직원 수
        absent_count = int(len(employees) * absence_rate)
        absent_employees = random.sample(employees, min(absent_count, len(employees)))

        # 근태 데이터 생성
        for day in range(duration_days):
            work_date = datetime.now().date() + timedelta(days=day)
            for emp in absent_employees:
                execute("""
                    INSERT INTO erp_attendance
                    (tenant_id, employee_id, work_date, status, created_at)
                    VALUES (%s, %s, %s, 'absent', %s)
                    ON CONFLICT (tenant_id, employee_id, work_date)
                    DO UPDATE SET status = 'absent'
                """, (TENANT_ID, emp['employee_id'], work_date, datetime.now()))

        return {
            'message': '대량 결근 시나리오 실행 완료',
            'department_code': department_code,
            'total_employees': len(employees),
            'absent_employees': len(absent_employees),
            'duration_days': duration_days,
            'reason': absence_reason
        }

    def _execute_overtime_request(self, params: Dict[str, Any]) -> Dict:
        """특근 요청 시나리오"""
        department_code = params['department_code']
        overtime_hours = params['overtime_hours']
        overtime_date = params.get('overtime_date', datetime.now().date())
        participation_rate = params['participation_rate'] / 100

        if isinstance(overtime_date, str):
            overtime_date = datetime.strptime(overtime_date, '%Y-%m-%d').date()

        # 해당 부서 직원 조회
        employees = fetch_all("""
            SELECT employee_id FROM erp_employee
            WHERE tenant_id = %s AND department_code = %s AND status = 'active'
        """, (TENANT_ID, department_code))

        # 특근 참여 직원
        participate_count = int(len(employees) * participation_rate)
        participate_employees = random.sample(employees, min(participate_count, len(employees)))

        # 근태 데이터 업데이트
        for emp in participate_employees:
            execute("""
                UPDATE erp_attendance
                SET overtime_hours = %s
                WHERE tenant_id = %s AND employee_id = %s AND work_date = %s
            """, (overtime_hours, TENANT_ID, emp['employee_id'], overtime_date))

        return {
            'message': '특근 요청 처리 완료',
            'department_code': department_code,
            'overtime_hours': overtime_hours,
            'participating_employees': len(participate_employees),
            'date': str(overtime_date)
        }


# 테스트용 메인
if __name__ == '__main__':
    executor = ScenarioExecutor()

    # 사용 가능한 시나리오 출력
    scenarios = executor.get_available_scenarios()
    print("\n=== 사용 가능한 시나리오 ===")
    for category, items in scenarios.items():
        print(f"\n[{category}]")
        for key, scenario in items.items():
            print(f"  - {scenario['id']}: {scenario['name']}")
            print(f"    {scenario['description']}")

    # 테스트 실행 예시
    # result = executor.execute_scenario('QS001', {
    #     'line_code': 'LINE001',
    #     'defect_rate': 15,
    #     'duration_type': 'instant',
    #     'defect_types': ['solder', 'missing']
    # })
    # print(result)
