"""
ERP HR/Payroll Data Generator
Generates employee attendance, payroll, and workforce data
Supports AI use case scenarios for HR management
"""
import uuid
import random
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
import numpy as np

from generators.core.time_manager import TimeManager, TimeSlot, ShiftType
from generators.core.scenario_manager import ScenarioManager


class AttendanceStatus(Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EARLY_LEAVE = "early_leave"
    VACATION = "vacation"
    SICK = "sick"
    BUSINESS_TRIP = "business_trip"


class EmployeeType(Enum):
    PRODUCTION = "production"
    QUALITY = "quality"
    MAINTENANCE = "maintenance"
    WAREHOUSE = "warehouse"
    OFFICE = "office"


class HRDataGenerator:
    """
    ERP HR/Payroll Data Generator

    Generates:
    - Attendance records (출퇴근)
    - Payroll records (급여)
    - Overtime records (잔업)
    - Skill certifications (기술자격)
    - Training records (교육이력)

    AI Use Cases:
    - CHECK: 근태/인력 현황
    - TREND: 결근률 트렌드
    - COMPARE: 부서별 비교
    - PREDICT: 인력 수요 예측
    - DETECT_ANOMALY: 근태 이상 감지
    """

    def __init__(
        self,
        time_manager: TimeManager,
        scenario_manager: ScenarioManager,
        company_profile: Dict[str, Any],
        tenant_id: str,
        random_seed: int = 42
    ):
        self.time_manager = time_manager
        self.scenario_manager = scenario_manager
        self.company_profile = company_profile
        self.tenant_id = tenant_id

        random.seed(random_seed)
        np.random.seed(random_seed)

        # Generate employee roster
        self.employees = self._generate_employees()

        # Generated data
        self.data = {
            'employees': self.employees,
            'attendance_records': [],
            'payroll_records': [],
            'overtime_records': [],
            'skill_records': [],
            'training_records': [],
            'hr_alerts': []
        }

        self.sequence_counter = 10000

    def _get_next_sequence(self) -> str:
        self.sequence_counter += 1
        return str(self.sequence_counter).zfill(6)

    def _generate_employees(self) -> List[Dict[str, Any]]:
        """Generate employee master data"""
        employees = []

        # Production workers per shift
        for shift in ['DAY', 'EVENING', 'NIGHT']:
            for i in range(60):  # 60 per shift = 180 total
                emp_id = f"EMP{len(employees) + 1:04d}"

                emp = {
                    'id': str(uuid.uuid4()),
                    'tenant_id': self.tenant_id,
                    'employee_id': emp_id,
                    'employee_no': emp_id,
                    'name': f"작업자{len(employees) + 1:03d}",
                    'department': random.choice(['생산1팀', '생산2팀', '생산3팀', '품질팀', '설비팀']),
                    'position': random.choice(['사원', '주임', '대리', '과장']),
                    'employee_type': random.choice([et.value for et in EmployeeType]),
                    'shift': shift,
                    'line_code': f"SMT-L{random.randint(1, 10):02d}" if random.random() < 0.7 else None,
                    'hire_date': date(random.randint(2015, 2023), random.randint(1, 12), random.randint(1, 28)),
                    'base_salary': random.randint(2500000, 5000000),
                    'hourly_rate': random.randint(12000, 25000),
                    'overtime_rate': 1.5,
                    'is_active': True,
                    'skills': random.sample(['SMT', 'THT', 'AOI', 'SPI', 'REFLOW', 'WAVE', 'ICT', 'FCT'],
                                           k=random.randint(1, 4)),
                    'created_at': datetime.now()
                }

                employees.append(emp)

        return employees

    def generate_daily_attendance(
        self,
        time_slot: TimeSlot,
        context: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """Generate daily attendance records"""
        context = context or {}
        scenario_data = self._apply_hr_scenarios(time_slot, context)

        records = []
        shift_employees = [e for e in self.employees if e['shift'] == time_slot.shift.value]

        for emp in shift_employees:
            # Determine attendance status
            status = self._determine_attendance_status(time_slot, emp, scenario_data)

            # Calculate times
            shift_start = self._get_shift_start(time_slot.shift)
            scheduled_start = datetime.combine(time_slot.date, shift_start)

            if status == AttendanceStatus.PRESENT:
                # Slight variation in check-in time
                check_in_variance = random.randint(-10, 30)
                check_in = scheduled_start + timedelta(minutes=check_in_variance)
                check_out = check_in + timedelta(hours=8, minutes=random.randint(-15, 60))
                work_hours = 8.0
            elif status == AttendanceStatus.LATE:
                check_in = scheduled_start + timedelta(minutes=random.randint(10, 60))
                check_out = check_in + timedelta(hours=8)
                work_hours = 8.0
            elif status == AttendanceStatus.EARLY_LEAVE:
                check_in = scheduled_start + timedelta(minutes=random.randint(-10, 10))
                check_out = check_in + timedelta(hours=random.uniform(4, 7))
                work_hours = (check_out - check_in).seconds / 3600
            else:
                check_in = None
                check_out = None
                work_hours = 0

            record = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'attendance_date': time_slot.date,
                'employee_id': emp['employee_id'],
                'employee_name': emp['name'],
                'department': emp['department'],
                'shift': time_slot.shift.value,
                'scheduled_start': scheduled_start,
                'scheduled_end': scheduled_start + timedelta(hours=8),
                'check_in': check_in,
                'check_out': check_out,
                'status': status.value,
                'work_hours': round(work_hours, 2),
                'late_minutes': max(0, (check_in - scheduled_start).seconds // 60) if check_in else 0,
                'early_leave_minutes': 0,
                'line_code': emp.get('line_code'),
                'active_scenarios': scenario_data.get('active_scenarios', []),
                'created_at': datetime.now()
            }

            records.append(record)

        self.data['attendance_records'].extend(records)

        # Check for high absenteeism alert
        absent_count = sum(1 for r in records if r['status'] in ['absent', 'sick'])
        absent_rate = absent_count / len(records) if records else 0

        if absent_rate > 0.1:  # More than 10% absent
            self._generate_hr_alert(
                time_slot, 'HIGH_ABSENTEEISM',
                f"높은 결근율 감지: {absent_rate*100:.1f}% ({absent_count}명)"
            )

        return records

    def generate_overtime_record(
        self,
        time_slot: TimeSlot,
        employee: Dict[str, Any],
        overtime_hours: float,
        reason: str = 'production'
    ) -> Dict[str, Any]:
        """Generate overtime record"""
        rate = employee['hourly_rate'] * employee['overtime_rate']
        amount = overtime_hours * rate

        record = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'overtime_no': f"OT-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'overtime_date': time_slot.date,
            'employee_id': employee['employee_id'],
            'employee_name': employee['name'],
            'department': employee['department'],
            'overtime_hours': overtime_hours,
            'overtime_type': 'weekday' if time_slot.date.weekday() < 5 else 'weekend',
            'rate_multiplier': employee['overtime_rate'],
            'hourly_rate': employee['hourly_rate'],
            'overtime_amount': round(amount, 0),
            'reason': reason,
            'approved_by': f"MGR{random.randint(1, 10):03d}",
            'status': 'approved',
            'created_at': datetime.now()
        }

        self.data['overtime_records'].append(record)
        return record

    def generate_monthly_payroll(
        self,
        year_month: str
    ) -> List[Dict[str, Any]]:
        """Generate monthly payroll records"""
        records = []
        year, month = map(int, year_month.split('-'))

        for emp in self.employees:
            # Get attendance for the month
            emp_attendance = [a for a in self.data['attendance_records']
                             if a['employee_id'] == emp['employee_id']
                             and a['attendance_date'].year == year
                             and a['attendance_date'].month == month]

            work_days = sum(1 for a in emp_attendance if a['status'] == 'present')
            absent_days = sum(1 for a in emp_attendance if a['status'] in ['absent', 'sick'])
            late_count = sum(1 for a in emp_attendance if a['status'] == 'late')

            # Get overtime
            emp_overtime = [o for o in self.data['overtime_records']
                           if o['employee_id'] == emp['employee_id']
                           and o['overtime_date'].year == year
                           and o['overtime_date'].month == month]

            total_overtime_hours = sum(o['overtime_hours'] for o in emp_overtime)
            total_overtime_pay = sum(o['overtime_amount'] for o in emp_overtime)

            # Calculate pay
            base_salary = emp['base_salary']
            attendance_deduction = absent_days * (base_salary / 30) * 0.5  # 50% deduction per absent day
            late_deduction = late_count * 10000  # 10,000 per late

            gross_pay = base_salary + total_overtime_pay
            deductions = attendance_deduction + late_deduction

            # Standard deductions
            income_tax = gross_pay * 0.03  # Simplified
            social_insurance = gross_pay * 0.09  # Simplified

            net_pay = gross_pay - deductions - income_tax - social_insurance

            record = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'payroll_no': f"PAY-{year_month}-{self._get_next_sequence()}",
                'pay_period': year_month,
                'employee_id': emp['employee_id'],
                'employee_name': emp['name'],
                'department': emp['department'],
                'position': emp['position'],
                'work_days': work_days,
                'absent_days': absent_days,
                'late_count': late_count,
                'overtime_hours': total_overtime_hours,
                'base_salary': base_salary,
                'overtime_pay': round(total_overtime_pay, 0),
                'gross_pay': round(gross_pay, 0),
                'attendance_deduction': round(attendance_deduction, 0),
                'late_deduction': round(late_deduction, 0),
                'income_tax': round(income_tax, 0),
                'social_insurance': round(social_insurance, 0),
                'total_deductions': round(deductions + income_tax + social_insurance, 0),
                'net_pay': round(net_pay, 0),
                'payment_date': date(year, month, 25) if month < 12 else date(year + 1, 1, 25),
                'status': 'calculated',
                'created_at': datetime.now()
            }

            records.append(record)

        self.data['payroll_records'].extend(records)
        return records

    def generate_skill_record(
        self,
        time_slot: TimeSlot,
        employee: Dict[str, Any],
        skill_name: str,
        certification_date: date
    ) -> Dict[str, Any]:
        """Generate skill certification record"""
        record = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'skill_no': f"SKL-{self._get_next_sequence()}",
            'employee_id': employee['employee_id'],
            'employee_name': employee['name'],
            'skill_name': skill_name,
            'skill_category': self._get_skill_category(skill_name),
            'proficiency_level': random.choice(['초급', '중급', '고급', '전문가']),
            'certification_date': certification_date,
            'expiry_date': certification_date + timedelta(days=365 * 2),  # 2 years
            'issued_by': '인사팀',
            'status': 'active',
            'created_at': datetime.now()
        }

        self.data['skill_records'].append(record)
        return record

    def generate_training_record(
        self,
        time_slot: TimeSlot,
        employee: Dict[str, Any],
        training_name: str,
        duration_hours: int
    ) -> Dict[str, Any]:
        """Generate training record"""
        record = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'training_no': f"TRN-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'employee_id': employee['employee_id'],
            'employee_name': employee['name'],
            'department': employee['department'],
            'training_name': training_name,
            'training_type': random.choice(['신입교육', '직무교육', '안전교육', '품질교육', '스킬업']),
            'training_date': time_slot.date,
            'duration_hours': duration_hours,
            'trainer': f"강사{random.randint(1, 10):02d}",
            'location': random.choice(['본사 교육장', '현장 OJT', '온라인']),
            'score': random.randint(70, 100) if random.random() < 0.9 else None,
            'passed': True if random.random() < 0.95 else False,
            'certificate_issued': random.random() < 0.3,
            'cost': duration_hours * random.randint(10000, 50000),
            'status': 'completed',
            'created_at': datetime.now()
        }

        self.data['training_records'].append(record)
        return record

    def _determine_attendance_status(
        self,
        time_slot: TimeSlot,
        employee: Dict[str, Any],
        scenario_data: Dict[str, Any]
    ) -> AttendanceStatus:
        """Determine attendance status for an employee"""
        # Apply scenario effects
        absence_rate = scenario_data.get('absence_rate_increase', 0)

        # Base probabilities
        weights = {
            AttendanceStatus.PRESENT: 0.92 - absence_rate,
            AttendanceStatus.LATE: 0.03,
            AttendanceStatus.ABSENT: 0.02 + absence_rate * 0.5,
            AttendanceStatus.SICK: 0.01 + absence_rate * 0.3,
            AttendanceStatus.VACATION: 0.01,
            AttendanceStatus.EARLY_LEAVE: 0.01
        }

        statuses = list(weights.keys())
        probs = list(weights.values())

        # Normalize probabilities
        total = sum(probs)
        probs = [p / total for p in probs]

        return random.choices(statuses, weights=probs)[0]

    def _get_shift_start(self, shift: ShiftType) -> datetime.time:
        """Get shift start time"""
        shift_starts = {
            ShiftType.DAY: datetime.strptime('08:00', '%H:%M').time(),
            ShiftType.EVENING: datetime.strptime('16:00', '%H:%M').time(),
            ShiftType.NIGHT: datetime.strptime('00:00', '%H:%M').time()
        }
        return shift_starts.get(shift, datetime.strptime('08:00', '%H:%M').time())

    def _get_skill_category(self, skill_name: str) -> str:
        """Get skill category"""
        categories = {
            'SMT': '생산설비',
            'THT': '생산설비',
            'AOI': '검사설비',
            'SPI': '검사설비',
            'REFLOW': '생산설비',
            'WAVE': '생산설비',
            'ICT': '검사설비',
            'FCT': '검사설비'
        }
        return categories.get(skill_name, '기타')

    def _generate_hr_alert(
        self,
        time_slot: TimeSlot,
        alert_type: str,
        message: str
    ) -> Dict[str, Any]:
        """Generate HR alert"""
        alert = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'alert_no': f"HRA-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'alert_type': alert_type,
            'severity': 'high' if 'HIGH' in alert_type else 'medium',
            'alert_datetime': time_slot.timestamp,
            'message': message,
            'status': 'active',
            'created_at': datetime.now()
        }

        self.data['hr_alerts'].append(alert)
        return alert

    def _apply_hr_scenarios(
        self,
        time_slot: TimeSlot,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply active scenarios to HR parameters"""
        result = {
            'absence_rate_increase': 0,
            'active_scenarios': []
        }

        active_scenarios = self.scenario_manager.get_active_scenarios(
            time_slot.timestamp,
            context
        )

        for scenario in active_scenarios:
            effect = scenario.get_effect(time_slot.timestamp, context)

            if 'absence_rate_increase' in effect.affected_metrics:
                result['absence_rate_increase'] += effect.affected_metrics['absence_rate_increase']

            result['active_scenarios'].append({
                'id': scenario.id,
                'name': scenario.name
            })

        return result

    def get_data(self) -> Dict[str, List]:
        """Get all generated data"""
        return self.data

    def get_summary(self) -> Dict[str, Any]:
        """Get generation summary"""
        total_payroll = sum(p['gross_pay'] for p in self.data['payroll_records'])
        total_overtime = sum(o['overtime_amount'] for o in self.data['overtime_records'])

        attendance = self.data['attendance_records']
        present_count = sum(1 for a in attendance if a['status'] == 'present')

        return {
            'total_employees': len(self.employees),
            'total_attendance_records': len(attendance),
            'attendance_rate': round(present_count / len(attendance) * 100, 2) if attendance else 0,
            'total_payroll_records': len(self.data['payroll_records']),
            'total_payroll_amount': round(total_payroll, 0),
            'total_overtime_records': len(self.data['overtime_records']),
            'total_overtime_amount': round(total_overtime, 0),
            'total_training_records': len(self.data['training_records']),
            'total_alerts': len(self.data['hr_alerts'])
        }
