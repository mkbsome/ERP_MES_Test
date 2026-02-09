"""
ERP HR & Payroll Management Schemas
인사급여관리 Pydantic 스키마
"""
from datetime import datetime, date, time
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from api.models.erp.hr import (
    EmploymentType, EmployeeStatus,
    AttendanceType, LeaveType, LeaveStatus, PayrollStatus
)


# ============== 부서 관리 ==============

class DepartmentBase(BaseModel):
    """부서 기본 스키마"""
    department_name: str = Field(..., description="부서명")
    department_name_en: Optional[str] = Field(None, description="부서명(영문)")
    parent_code: Optional[str] = Field(None, description="상위부서코드")
    manager_id: Optional[str] = Field(None, description="부서장 사번")
    factory_code: Optional[str] = Field(None, description="공장코드")
    cost_center: Optional[str] = Field(None, description="코스트센터")
    level: int = Field(1, description="부서 레벨")
    sort_order: int = Field(0, description="정렬 순서")
    is_active: bool = Field(True, description="사용 여부")


class DepartmentCreate(DepartmentBase):
    """부서 생성"""
    department_code: str = Field(..., description="부서코드")


class DepartmentResponse(DepartmentBase):
    """부서 응답"""
    department_code: str
    manager_name: Optional[str] = None
    employee_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    children: Optional[List['DepartmentResponse']] = None

    class Config:
        from_attributes = True


class DepartmentTreeResponse(BaseModel):
    """부서 트리"""
    items: List[DepartmentResponse]


# ============== 직위 관리 ==============

class PositionBase(BaseModel):
    """직위 기본 스키마"""
    position_name: str = Field(..., description="직위명")
    position_name_en: Optional[str] = Field(None, description="직위명(영문)")
    level: int = Field(0, description="직위 레벨")
    base_salary: Decimal = Field(Decimal("0"), description="기본급")
    is_manager: bool = Field(False, description="관리자 여부")
    is_active: bool = Field(True, description="사용 여부")


class PositionCreate(PositionBase):
    """직위 생성"""
    position_code: str = Field(..., description="직위코드")


class PositionResponse(PositionBase):
    """직위 응답"""
    position_code: str
    employee_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============== 사원 정보 ==============

class EmployeeBase(BaseModel):
    """사원 기본 스키마"""
    employee_name: str = Field(..., description="사원명")
    employee_name_en: Optional[str] = Field(None, description="사원명(영문)")
    email: Optional[str] = Field(None, description="이메일")
    phone: Optional[str] = Field(None, description="전화번호")
    mobile: Optional[str] = Field(None, description="휴대폰")
    birth_date: Optional[date] = Field(None, description="생년월일")
    gender: Optional[str] = Field(None, description="성별")
    address: Optional[str] = Field(None, description="주소")
    department_code: Optional[str] = Field(None, description="부서코드")
    position_code: Optional[str] = Field(None, description="직위코드")
    job_title: Optional[str] = Field(None, description="직책")
    employment_type: EmploymentType = Field(EmploymentType.REGULAR, description="고용유형")
    status: EmployeeStatus = Field(EmployeeStatus.ACTIVE, description="재직상태")
    hire_date: date = Field(..., description="입사일")
    base_salary: Decimal = Field(Decimal("0"), description="기본급")
    bank_name: Optional[str] = Field(None, description="은행명")
    bank_account: Optional[str] = Field(None, description="계좌번호")


class EmployeeCreate(EmployeeBase):
    """사원 생성"""
    employee_id: str = Field(..., description="사원번호")


class EmployeeUpdate(BaseModel):
    """사원 수정"""
    employee_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None
    department_code: Optional[str] = None
    position_code: Optional[str] = None
    job_title: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    status: Optional[EmployeeStatus] = None
    base_salary: Optional[Decimal] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None


class EmployeeResponse(EmployeeBase):
    """사원 응답"""
    employee_id: str
    department_name: Optional[str] = None
    position_name: Optional[str] = None
    resignation_date: Optional[date] = None
    years_of_service: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    """사원 목록"""
    items: List[EmployeeResponse]
    total: int
    page: int
    size: int


class EmployeeSummary(BaseModel):
    """사원 요약 정보"""
    total_employees: int
    active_employees: int
    new_hires_this_month: int
    resignations_this_month: int
    by_department: List[Dict[str, Any]]
    by_employment_type: List[Dict[str, Any]]
    avg_years_of_service: float


# ============== 근태 관리 ==============

class AttendanceRecordBase(BaseModel):
    """근태 기록 기본"""
    employee_id: str = Field(..., description="사원번호")
    work_date: date = Field(..., description="근무일")
    attendance_type: AttendanceType = Field(AttendanceType.NORMAL, description="근태유형")
    check_in: Optional[datetime] = Field(None, description="출근시각")
    check_out: Optional[datetime] = Field(None, description="퇴근시각")
    overtime_hours: Decimal = Field(Decimal("0"), description="연장근무시간")
    night_hours: Decimal = Field(Decimal("0"), description="야간근무시간")
    holiday_hours: Decimal = Field(Decimal("0"), description="휴일근무시간")
    remarks: Optional[str] = Field(None, description="비고")


class AttendanceRecordCreate(AttendanceRecordBase):
    """근태 기록 생성"""
    pass


class AttendanceRecordResponse(AttendanceRecordBase):
    """근태 기록 응답"""
    id: int
    employee_name: Optional[str] = None
    department_name: Optional[str] = None
    scheduled_start: Optional[time] = None
    scheduled_end: Optional[time] = None
    work_hours: Decimal
    late_minutes: int
    early_leave_minutes: int
    is_approved: bool
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AttendanceListResponse(BaseModel):
    """근태 목록"""
    items: List[AttendanceRecordResponse]
    total: int
    page: int
    size: int


class AttendanceSummary(BaseModel):
    """근태 요약"""
    employee_id: str
    employee_name: str
    year_month: str
    total_work_days: int
    actual_work_days: int
    total_work_hours: Decimal
    overtime_hours: Decimal
    night_hours: Decimal
    holiday_hours: Decimal
    late_count: int
    early_leave_count: int
    absent_count: int


class AttendanceDailySummary(BaseModel):
    """일별 근태 현황"""
    work_date: date
    total_employees: int
    present_count: int
    absent_count: int
    late_count: int
    on_leave_count: int
    attendance_rate: float


# ============== 휴가 관리 ==============

class LeaveRequestBase(BaseModel):
    """휴가 신청 기본"""
    employee_id: str = Field(..., description="사원번호")
    leave_type: LeaveType = Field(..., description="휴가유형")
    start_date: date = Field(..., description="시작일")
    end_date: date = Field(..., description="종료일")
    days: Decimal = Field(..., description="휴가일수")
    reason: Optional[str] = Field(None, description="사유")


class LeaveRequestCreate(LeaveRequestBase):
    """휴가 신청 생성"""
    pass


class LeaveRequestResponse(LeaveRequestBase):
    """휴가 신청 응답"""
    id: int
    request_no: str
    employee_name: Optional[str] = None
    department_name: Optional[str] = None
    status: LeaveStatus
    requested_at: datetime
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejected_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LeaveRequestListResponse(BaseModel):
    """휴가 신청 목록"""
    items: List[LeaveRequestResponse]
    total: int
    page: int
    size: int


class LeaveApproval(BaseModel):
    """휴가 승인/반려"""
    action: str = Field(..., description="액션 (approve/reject)")
    comment: Optional[str] = Field(None, description="코멘트")


class LeaveBalanceResponse(BaseModel):
    """휴가 잔여 응답"""
    id: int
    employee_id: str
    employee_name: Optional[str] = None
    year: str
    leave_type: LeaveType
    total_days: Decimal
    used_days: Decimal
    remaining_days: Decimal
    carried_over: Decimal
    expires_at: Optional[date] = None

    class Config:
        from_attributes = True


class LeaveBalanceSummary(BaseModel):
    """휴가 잔여 요약"""
    employee_id: str
    employee_name: str
    year: str
    balances: List[LeaveBalanceResponse]
    total_annual: Decimal
    used_annual: Decimal
    remaining_annual: Decimal


# ============== 급여 관리 ==============

class PayrollDetailBase(BaseModel):
    """급여 상세 기본"""
    employee_id: str = Field(..., description="사원번호")
    base_salary: Decimal = Field(Decimal("0"), description="기본급")
    overtime_pay: Decimal = Field(Decimal("0"), description="연장수당")
    night_pay: Decimal = Field(Decimal("0"), description="야간수당")
    holiday_pay: Decimal = Field(Decimal("0"), description="휴일수당")
    position_allowance: Decimal = Field(Decimal("0"), description="직책수당")
    meal_allowance: Decimal = Field(Decimal("0"), description="식대")
    transport_allowance: Decimal = Field(Decimal("0"), description="교통비")
    bonus: Decimal = Field(Decimal("0"), description="상여금")
    other_pay: Decimal = Field(Decimal("0"), description="기타수당")
    remarks: Optional[str] = Field(None, description="비고")


class PayrollDetailResponse(PayrollDetailBase):
    """급여 상세 응답"""
    id: int
    payroll_id: str
    employee_name: Optional[str] = None
    department_name: Optional[str] = None
    position_name: Optional[str] = None
    gross_pay: Decimal
    income_tax: Decimal
    resident_tax: Decimal
    national_pension: Decimal
    health_insurance: Decimal
    long_term_care: Decimal
    employment_insurance: Decimal
    union_fee: Decimal
    other_deductions: Decimal
    total_deductions: Decimal
    net_pay: Decimal
    work_days: int
    overtime_hours: Decimal
    night_hours: Decimal
    holiday_hours: Decimal
    absent_days: int
    late_count: int

    class Config:
        from_attributes = True


class PayrollHeaderBase(BaseModel):
    """급여대장 기본"""
    year: str = Field(..., description="년도")
    month: str = Field(..., description="월")
    payroll_type: str = Field("REGULAR", description="급여유형")
    pay_date: date = Field(..., description="지급일")


class PayrollHeaderCreate(PayrollHeaderBase):
    """급여대장 생성"""
    pass


class PayrollHeaderResponse(PayrollHeaderBase):
    """급여대장 응답"""
    payroll_id: str
    status: PayrollStatus
    total_employees: int
    total_gross: Decimal
    total_deductions: Decimal
    total_net: Decimal
    calculated_at: Optional[datetime] = None
    calculated_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    paid_at: Optional[datetime] = None
    paid_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    details: Optional[List[PayrollDetailResponse]] = None

    class Config:
        from_attributes = True


class PayrollListResponse(BaseModel):
    """급여대장 목록"""
    items: List[PayrollHeaderResponse]
    total: int
    page: int
    size: int


class PayrollCalculation(BaseModel):
    """급여 계산 요청"""
    year: str
    month: str
    payroll_type: str = "REGULAR"
    pay_date: date


class PayrollSummary(BaseModel):
    """급여 요약"""
    payroll_id: str
    year_month: str
    total_employees: int
    total_gross: Decimal
    total_deductions: Decimal
    total_net: Decimal
    by_department: List[Dict[str, Any]]
    by_item: Dict[str, Decimal]


class PayslipResponse(BaseModel):
    """급여명세서"""
    payroll_id: str
    year_month: str
    pay_date: date
    employee_id: str
    employee_name: str
    department_name: str
    position_name: str
    hire_date: date
    bank_name: str
    bank_account: str
    earnings: Dict[str, Decimal]
    deductions: Dict[str, Decimal]
    gross_pay: Decimal
    total_deductions: Decimal
    net_pay: Decimal
    attendance_info: Dict[str, Any]


# ============== 통계/분석 ==============

class HRDashboard(BaseModel):
    """인사 대시보드"""
    employee_summary: EmployeeSummary
    attendance_today: AttendanceDailySummary
    pending_leaves: int
    recent_hires: List[EmployeeResponse]
    upcoming_birthdays: List[Dict[str, Any]]
    organization_chart: Dict[str, Any]
