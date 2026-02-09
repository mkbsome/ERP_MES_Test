"""
ERP HR & Payroll Management Models
인사급여관리 - 사원정보, 근태관리, 급여관리
"""
from datetime import datetime, date, time
from decimal import Decimal
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Time, Boolean, Text,
    ForeignKey, Enum, Numeric, JSON
)
from sqlalchemy.orm import relationship

from api.models.base import Base


class EmploymentType(str, PyEnum):
    """고용유형"""
    REGULAR = "REGULAR"           # 정규직
    CONTRACT = "CONTRACT"         # 계약직
    PART_TIME = "PART_TIME"       # 파트타임
    INTERN = "INTERN"             # 인턴
    TEMPORARY = "TEMPORARY"       # 임시직


class EmployeeStatus(str, PyEnum):
    """재직상태"""
    ACTIVE = "ACTIVE"             # 재직
    ON_LEAVE = "ON_LEAVE"         # 휴직
    RESIGNED = "RESIGNED"         # 퇴사
    RETIRED = "RETIRED"           # 정년퇴직


class AttendanceType(str, PyEnum):
    """근태유형"""
    NORMAL = "NORMAL"             # 정상근무
    LATE = "LATE"                 # 지각
    EARLY_LEAVE = "EARLY_LEAVE"   # 조퇴
    ABSENCE = "ABSENCE"           # 결근
    OVERTIME = "OVERTIME"         # 연장근무
    NIGHT = "NIGHT"               # 야간근무
    HOLIDAY = "HOLIDAY"           # 휴일근무


class LeaveType(str, PyEnum):
    """휴가유형"""
    ANNUAL = "ANNUAL"             # 연차휴가
    SICK = "SICK"                 # 병가
    SPECIAL = "SPECIAL"           # 경조사휴가
    MATERNITY = "MATERNITY"       # 출산휴가
    PARENTAL = "PARENTAL"         # 육아휴직
    UNPAID = "UNPAID"             # 무급휴가


class LeaveStatus(str, PyEnum):
    """휴가상태"""
    PENDING = "PENDING"           # 승인대기
    APPROVED = "APPROVED"         # 승인
    REJECTED = "REJECTED"         # 반려
    CANCELLED = "CANCELLED"       # 취소


class PayrollStatus(str, PyEnum):
    """급여상태"""
    DRAFT = "DRAFT"               # 작성중
    CALCULATED = "CALCULATED"     # 계산완료
    APPROVED = "APPROVED"         # 승인완료
    PAID = "PAID"                 # 지급완료


# ============== 조직/부서 ==============

class Department(Base):
    """부서 마스터"""
    __tablename__ = "erp_department"

    department_code = Column(String(20), primary_key=True, comment="부서코드")
    department_name = Column(String(100), nullable=False, comment="부서명")
    department_name_en = Column(String(100), comment="부서명(영문)")
    parent_code = Column(String(20), ForeignKey("erp_department.department_code"), comment="상위부서코드")
    manager_id = Column(String(20), comment="부서장 사번")
    factory_code = Column(String(20), comment="공장코드")
    cost_center = Column(String(20), comment="코스트센터")
    level = Column(Integer, default=1, comment="부서 레벨")
    sort_order = Column(Integer, default=0, comment="정렬 순서")
    is_active = Column(Boolean, default=True, comment="사용 여부")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")

    # Relationships
    children = relationship("Department", backref="parent", remote_side=[department_code])
    employees = relationship("Employee", back_populates="department")


class Position(Base):
    """직위 마스터"""
    __tablename__ = "erp_position"

    position_code = Column(String(20), primary_key=True, comment="직위코드")
    position_name = Column(String(50), nullable=False, comment="직위명")
    position_name_en = Column(String(50), comment="직위명(영문)")
    level = Column(Integer, default=0, comment="직위 레벨")
    base_salary = Column(Numeric(18, 0), default=0, comment="기본급")
    is_manager = Column(Boolean, default=False, comment="관리자 여부")
    is_active = Column(Boolean, default=True, comment="사용 여부")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")

    # Relationships
    employees = relationship("Employee", back_populates="position")


# ============== 사원 정보 ==============

class Employee(Base):
    """사원 마스터"""
    __tablename__ = "erp_employee"

    employee_id = Column(String(20), primary_key=True, comment="사원번호")
    employee_name = Column(String(50), nullable=False, comment="사원명")
    employee_name_en = Column(String(100), comment="사원명(영문)")
    email = Column(String(200), comment="이메일")
    phone = Column(String(20), comment="전화번호")
    mobile = Column(String(20), comment="휴대폰")
    birth_date = Column(Date, comment="생년월일")
    gender = Column(String(1), comment="성별 (M/F)")
    address = Column(Text, comment="주소")

    # 고용 정보
    department_code = Column(String(20), ForeignKey("erp_department.department_code"), comment="부서코드")
    position_code = Column(String(20), ForeignKey("erp_position.position_code"), comment="직위코드")
    job_title = Column(String(50), comment="직책")
    employment_type = Column(Enum(EmploymentType), default=EmploymentType.REGULAR, comment="고용유형")
    status = Column(Enum(EmployeeStatus), default=EmployeeStatus.ACTIVE, comment="재직상태")
    hire_date = Column(Date, nullable=False, comment="입사일")
    resignation_date = Column(Date, comment="퇴사일")
    resignation_reason = Column(Text, comment="퇴사사유")

    # 급여 정보
    base_salary = Column(Numeric(18, 0), default=0, comment="기본급")
    bank_name = Column(String(50), comment="은행명")
    bank_account = Column(String(50), comment="계좌번호")

    # 기타 정보
    photo_url = Column(String(500), comment="사진 URL")
    emergency_contact = Column(String(100), comment="비상연락처")
    notes = Column(Text, comment="메모")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")

    # Relationships
    department = relationship("Department", back_populates="employees")
    position = relationship("Position", back_populates="employees")
    attendance_records = relationship("AttendanceRecord", back_populates="employee", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="employee", cascade="all, delete-orphan")
    payroll_records = relationship("PayrollDetail", back_populates="employee")


# ============== 근태 관리 ==============

class AttendanceRecord(Base):
    """출퇴근 기록"""
    __tablename__ = "erp_attendance_record"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(String(20), ForeignKey("erp_employee.employee_id"), nullable=False, comment="사원번호")
    work_date = Column(Date, nullable=False, comment="근무일")
    attendance_type = Column(Enum(AttendanceType), default=AttendanceType.NORMAL, comment="근태유형")
    check_in = Column(DateTime, comment="출근시각")
    check_out = Column(DateTime, comment="퇴근시각")
    scheduled_start = Column(Time, comment="예정 출근시각")
    scheduled_end = Column(Time, comment="예정 퇴근시각")
    work_hours = Column(Numeric(5, 2), default=0, comment="실제 근무시간")
    overtime_hours = Column(Numeric(5, 2), default=0, comment="연장근무시간")
    night_hours = Column(Numeric(5, 2), default=0, comment="야간근무시간")
    holiday_hours = Column(Numeric(5, 2), default=0, comment="휴일근무시간")
    late_minutes = Column(Integer, default=0, comment="지각 시간(분)")
    early_leave_minutes = Column(Integer, default=0, comment="조퇴 시간(분)")
    remarks = Column(Text, comment="비고")
    is_approved = Column(Boolean, default=False, comment="승인 여부")
    approved_by = Column(String(20), comment="승인자")
    approved_at = Column(DateTime, comment="승인일시")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")

    # Relationships
    employee = relationship("Employee", back_populates="attendance_records")


class LeaveRequest(Base):
    """휴가 신청"""
    __tablename__ = "erp_leave_request"

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_no = Column(String(30), nullable=False, unique=True, comment="신청번호")
    employee_id = Column(String(20), ForeignKey("erp_employee.employee_id"), nullable=False, comment="사원번호")
    leave_type = Column(Enum(LeaveType), nullable=False, comment="휴가유형")
    start_date = Column(Date, nullable=False, comment="시작일")
    end_date = Column(Date, nullable=False, comment="종료일")
    days = Column(Numeric(5, 1), nullable=False, comment="휴가일수")
    reason = Column(Text, comment="사유")
    status = Column(Enum(LeaveStatus), default=LeaveStatus.PENDING, comment="상태")
    requested_at = Column(DateTime, default=datetime.now, comment="신청일시")
    approved_by = Column(String(20), comment="승인자")
    approved_at = Column(DateTime, comment="승인일시")
    rejected_reason = Column(Text, comment="반려사유")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")

    # Relationships
    employee = relationship("Employee", back_populates="leave_requests")


class LeaveBalance(Base):
    """휴가 잔여"""
    __tablename__ = "erp_leave_balance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(String(20), ForeignKey("erp_employee.employee_id"), nullable=False, comment="사원번호")
    year = Column(String(4), nullable=False, comment="연도")
    leave_type = Column(Enum(LeaveType), nullable=False, comment="휴가유형")
    total_days = Column(Numeric(5, 1), default=0, comment="총 휴가일수")
    used_days = Column(Numeric(5, 1), default=0, comment="사용일수")
    remaining_days = Column(Numeric(5, 1), default=0, comment="잔여일수")
    carried_over = Column(Numeric(5, 1), default=0, comment="이월일수")
    expires_at = Column(Date, comment="만료일")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")


# ============== 급여 관리 ==============

class PayrollHeader(Base):
    """급여대장 헤더"""
    __tablename__ = "erp_payroll_header"

    payroll_id = Column(String(30), primary_key=True, comment="급여ID")
    year = Column(String(4), nullable=False, comment="년도")
    month = Column(String(2), nullable=False, comment="월")
    payroll_type = Column(String(20), default="REGULAR", comment="급여유형 (REGULAR/BONUS)")
    pay_date = Column(Date, nullable=False, comment="지급일")
    status = Column(Enum(PayrollStatus), default=PayrollStatus.DRAFT, comment="상태")
    total_employees = Column(Integer, default=0, comment="지급 인원")
    total_gross = Column(Numeric(18, 0), default=0, comment="총 지급액")
    total_deductions = Column(Numeric(18, 0), default=0, comment="총 공제액")
    total_net = Column(Numeric(18, 0), default=0, comment="총 실지급액")
    calculated_at = Column(DateTime, comment="계산일시")
    calculated_by = Column(String(50), comment="계산자")
    approved_at = Column(DateTime, comment="승인일시")
    approved_by = Column(String(50), comment="승인자")
    paid_at = Column(DateTime, comment="지급일시")
    paid_by = Column(String(50), comment="지급자")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")

    # Relationships
    details = relationship("PayrollDetail", back_populates="payroll_header", cascade="all, delete-orphan")


class PayrollDetail(Base):
    """급여대장 상세"""
    __tablename__ = "erp_payroll_detail"

    id = Column(Integer, primary_key=True, autoincrement=True)
    payroll_id = Column(String(30), ForeignKey("erp_payroll_header.payroll_id"), nullable=False, comment="급여ID")
    employee_id = Column(String(20), ForeignKey("erp_employee.employee_id"), nullable=False, comment="사원번호")

    # 지급 항목
    base_salary = Column(Numeric(18, 0), default=0, comment="기본급")
    overtime_pay = Column(Numeric(18, 0), default=0, comment="연장수당")
    night_pay = Column(Numeric(18, 0), default=0, comment="야간수당")
    holiday_pay = Column(Numeric(18, 0), default=0, comment="휴일수당")
    position_allowance = Column(Numeric(18, 0), default=0, comment="직책수당")
    meal_allowance = Column(Numeric(18, 0), default=0, comment="식대")
    transport_allowance = Column(Numeric(18, 0), default=0, comment="교통비")
    bonus = Column(Numeric(18, 0), default=0, comment="상여금")
    other_pay = Column(Numeric(18, 0), default=0, comment="기타수당")
    gross_pay = Column(Numeric(18, 0), default=0, comment="총 지급액")

    # 공제 항목
    income_tax = Column(Numeric(18, 0), default=0, comment="소득세")
    resident_tax = Column(Numeric(18, 0), default=0, comment="주민세")
    national_pension = Column(Numeric(18, 0), default=0, comment="국민연금")
    health_insurance = Column(Numeric(18, 0), default=0, comment="건강보험")
    long_term_care = Column(Numeric(18, 0), default=0, comment="장기요양보험")
    employment_insurance = Column(Numeric(18, 0), default=0, comment="고용보험")
    union_fee = Column(Numeric(18, 0), default=0, comment="조합비")
    other_deductions = Column(Numeric(18, 0), default=0, comment="기타공제")
    total_deductions = Column(Numeric(18, 0), default=0, comment="총 공제액")

    # 실지급액
    net_pay = Column(Numeric(18, 0), default=0, comment="실지급액")

    # 근태 정보
    work_days = Column(Integer, default=0, comment="근무일수")
    overtime_hours = Column(Numeric(5, 2), default=0, comment="연장근무시간")
    night_hours = Column(Numeric(5, 2), default=0, comment="야간근무시간")
    holiday_hours = Column(Numeric(5, 2), default=0, comment="휴일근무시간")
    absent_days = Column(Integer, default=0, comment="결근일수")
    late_count = Column(Integer, default=0, comment="지각횟수")

    remarks = Column(Text, comment="비고")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")

    # Relationships
    payroll_header = relationship("PayrollHeader", back_populates="details")
    employee = relationship("Employee", back_populates="payroll_records")


class SalaryItem(Base):
    """급여항목 마스터"""
    __tablename__ = "erp_salary_item"

    item_code = Column(String(20), primary_key=True, comment="항목코드")
    item_name = Column(String(100), nullable=False, comment="항목명")
    item_type = Column(String(10), nullable=False, comment="항목유형 (PAY/DEDUCT)")
    calculation_type = Column(String(20), comment="계산방식 (FIXED/RATE/FORMULA)")
    default_value = Column(Numeric(18, 4), default=0, comment="기본값")
    is_taxable = Column(Boolean, default=True, comment="과세 여부")
    is_active = Column(Boolean, default=True, comment="사용 여부")
    sort_order = Column(Integer, default=0, comment="정렬 순서")
    description = Column(Text, comment="설명")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")
