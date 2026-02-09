"""
ERP HR & Payroll Management API Router
인사급여관리 - 조직, 사원, 근태, 휴가, 급여
"""
from datetime import datetime, date, time, timedelta
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException

from api.schemas.erp.hr import (
    DepartmentCreate, DepartmentResponse, DepartmentTreeResponse,
    PositionCreate, PositionResponse,
    EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeListResponse, EmployeeSummary,
    AttendanceRecordCreate, AttendanceRecordResponse, AttendanceListResponse,
    AttendanceSummary, AttendanceDailySummary,
    LeaveRequestCreate, LeaveRequestResponse, LeaveRequestListResponse,
    LeaveApproval, LeaveBalanceResponse, LeaveBalanceSummary,
    PayrollHeaderCreate, PayrollHeaderResponse, PayrollListResponse,
    PayrollDetailResponse, PayrollCalculation, PayrollSummary, PayslipResponse,
    HRDashboard
)
from api.models.erp.hr import (
    EmploymentType, EmployeeStatus,
    AttendanceType, LeaveType, LeaveStatus, PayrollStatus
)

router = APIRouter(prefix="/hr", tags=["ERP HR & Payroll"])


# ============== 조직/부서 관리 ==============

@router.get("/departments", response_model=DepartmentTreeResponse, summary="부서 트리 조회")
async def get_department_tree(
    factory_code: Optional[str] = Query(None, description="공장코드 필터"),
    is_active: Optional[bool] = Query(None, description="사용 여부")
):
    """부서 트리를 조회합니다."""
    mock_departments = [
        {
            "department_code": "CEO",
            "department_name": "대표이사",
            "department_name_en": "CEO Office",
            "parent_code": None,
            "manager_id": "E001",
            "manager_name": "김대표",
            "factory_code": None,
            "cost_center": "CC-EXEC",
            "level": 1,
            "sort_order": 1,
            "is_active": True,
            "employee_count": 3,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30),
            "children": [
                {
                    "department_code": "PROD",
                    "department_name": "생산본부",
                    "department_name_en": "Production Division",
                    "parent_code": "CEO",
                    "manager_id": "E010",
                    "manager_name": "이생산",
                    "factory_code": "F001",
                    "cost_center": "CC-PROD",
                    "level": 2,
                    "sort_order": 1,
                    "is_active": True,
                    "employee_count": 180,
                    "created_at": datetime.now() - timedelta(days=365),
                    "updated_at": datetime.now() - timedelta(days=30),
                    "children": [
                        {
                            "department_code": "SMT1",
                            "department_name": "SMT1팀",
                            "department_name_en": "SMT Team 1",
                            "parent_code": "PROD",
                            "manager_id": "E101",
                            "manager_name": "박에스엠티",
                            "factory_code": "F001",
                            "cost_center": "CC-SMT1",
                            "level": 3,
                            "sort_order": 1,
                            "is_active": True,
                            "employee_count": 45,
                            "created_at": datetime.now() - timedelta(days=365),
                            "updated_at": datetime.now() - timedelta(days=30),
                            "children": None
                        },
                        {
                            "department_code": "SMT2",
                            "department_name": "SMT2팀",
                            "department_name_en": "SMT Team 2",
                            "parent_code": "PROD",
                            "manager_id": "E102",
                            "manager_name": "최에스엠티",
                            "factory_code": "F001",
                            "cost_center": "CC-SMT2",
                            "level": 3,
                            "sort_order": 2,
                            "is_active": True,
                            "employee_count": 42,
                            "created_at": datetime.now() - timedelta(days=365),
                            "updated_at": datetime.now() - timedelta(days=30),
                            "children": None
                        },
                        {
                            "department_code": "ASSY",
                            "department_name": "조립팀",
                            "department_name_en": "Assembly Team",
                            "parent_code": "PROD",
                            "manager_id": "E103",
                            "manager_name": "정조립",
                            "factory_code": "F001",
                            "cost_center": "CC-ASSY",
                            "level": 3,
                            "sort_order": 3,
                            "is_active": True,
                            "employee_count": 38,
                            "created_at": datetime.now() - timedelta(days=365),
                            "updated_at": datetime.now() - timedelta(days=30),
                            "children": None
                        }
                    ]
                },
                {
                    "department_code": "QC",
                    "department_name": "품질관리부",
                    "department_name_en": "Quality Control",
                    "parent_code": "CEO",
                    "manager_id": "E020",
                    "manager_name": "김품질",
                    "factory_code": "F001",
                    "cost_center": "CC-QC",
                    "level": 2,
                    "sort_order": 2,
                    "is_active": True,
                    "employee_count": 35,
                    "created_at": datetime.now() - timedelta(days=365),
                    "updated_at": datetime.now() - timedelta(days=30),
                    "children": None
                },
                {
                    "department_code": "ADMIN",
                    "department_name": "경영지원본부",
                    "department_name_en": "Administration",
                    "parent_code": "CEO",
                    "manager_id": "E030",
                    "manager_name": "박경영",
                    "factory_code": None,
                    "cost_center": "CC-ADMIN",
                    "level": 2,
                    "sort_order": 3,
                    "is_active": True,
                    "employee_count": 45,
                    "created_at": datetime.now() - timedelta(days=365),
                    "updated_at": datetime.now() - timedelta(days=30),
                    "children": [
                        {
                            "department_code": "HR",
                            "department_name": "인사팀",
                            "department_name_en": "HR Team",
                            "parent_code": "ADMIN",
                            "manager_id": "E301",
                            "manager_name": "이인사",
                            "factory_code": None,
                            "cost_center": "CC-HR",
                            "level": 3,
                            "sort_order": 1,
                            "is_active": True,
                            "employee_count": 8,
                            "created_at": datetime.now() - timedelta(days=365),
                            "updated_at": datetime.now() - timedelta(days=30),
                            "children": None
                        },
                        {
                            "department_code": "FIN",
                            "department_name": "재무팀",
                            "department_name_en": "Finance Team",
                            "parent_code": "ADMIN",
                            "manager_id": "E302",
                            "manager_name": "최재무",
                            "factory_code": None,
                            "cost_center": "CC-FIN",
                            "level": 3,
                            "sort_order": 2,
                            "is_active": True,
                            "employee_count": 10,
                            "created_at": datetime.now() - timedelta(days=365),
                            "updated_at": datetime.now() - timedelta(days=30),
                            "children": None
                        }
                    ]
                }
            ]
        }
    ]

    return DepartmentTreeResponse(items=[DepartmentResponse(**d) for d in mock_departments])


@router.get("/departments/{department_code}", response_model=DepartmentResponse, summary="부서 상세 조회")
async def get_department(department_code: str):
    """부서 상세 정보를 조회합니다."""
    return DepartmentResponse(
        department_code=department_code,
        department_name="SMT1팀",
        department_name_en="SMT Team 1",
        parent_code="PROD",
        manager_id="E101",
        manager_name="박에스엠티",
        factory_code="F001",
        cost_center="CC-SMT1",
        level=3,
        sort_order=1,
        is_active=True,
        employee_count=45,
        created_at=datetime.now() - timedelta(days=365),
        updated_at=datetime.now() - timedelta(days=30),
        children=None
    )


@router.post("/departments", response_model=DepartmentResponse, summary="부서 생성")
async def create_department(data: DepartmentCreate):
    """새로운 부서를 생성합니다."""
    return DepartmentResponse(
        **data.model_dump(),
        manager_name=None,
        employee_count=0,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        children=None
    )


# ============== 직위 관리 ==============

@router.get("/positions", response_model=List[PositionResponse], summary="직위 목록 조회")
async def get_positions(
    is_active: Optional[bool] = Query(None, description="사용 여부")
):
    """직위 목록을 조회합니다."""
    mock_positions = [
        {
            "position_code": "P01",
            "position_name": "대표이사",
            "position_name_en": "CEO",
            "level": 1,
            "base_salary": Decimal("15000000"),
            "is_manager": True,
            "is_active": True,
            "employee_count": 1,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30)
        },
        {
            "position_code": "P02",
            "position_name": "본부장",
            "position_name_en": "Executive Director",
            "level": 2,
            "base_salary": Decimal("10000000"),
            "is_manager": True,
            "is_active": True,
            "employee_count": 5,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30)
        },
        {
            "position_code": "P03",
            "position_name": "부장",
            "position_name_en": "Department Manager",
            "level": 3,
            "base_salary": Decimal("7000000"),
            "is_manager": True,
            "is_active": True,
            "employee_count": 15,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30)
        },
        {
            "position_code": "P04",
            "position_name": "과장",
            "position_name_en": "Manager",
            "level": 4,
            "base_salary": Decimal("5500000"),
            "is_manager": True,
            "is_active": True,
            "employee_count": 35,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30)
        },
        {
            "position_code": "P05",
            "position_name": "대리",
            "position_name_en": "Assistant Manager",
            "level": 5,
            "base_salary": Decimal("4200000"),
            "is_manager": False,
            "is_active": True,
            "employee_count": 65,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30)
        },
        {
            "position_code": "P06",
            "position_name": "사원",
            "position_name_en": "Staff",
            "level": 6,
            "base_salary": Decimal("3500000"),
            "is_manager": False,
            "is_active": True,
            "employee_count": 180,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30)
        },
        {
            "position_code": "P07",
            "position_name": "기사",
            "position_name_en": "Technician",
            "level": 7,
            "base_salary": Decimal("3200000"),
            "is_manager": False,
            "is_active": True,
            "employee_count": 120,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30)
        }
    ]

    return [PositionResponse(**p) for p in mock_positions]


# ============== 사원 관리 ==============

@router.get("/employees", response_model=EmployeeListResponse, summary="사원 목록 조회")
async def get_employees(
    employee_id: Optional[str] = Query(None, description="사원번호"),
    employee_name: Optional[str] = Query(None, description="사원명"),
    department_code: Optional[str] = Query(None, description="부서코드"),
    position_code: Optional[str] = Query(None, description="직위코드"),
    employment_type: Optional[EmploymentType] = Query(None, description="고용유형"),
    status: Optional[EmployeeStatus] = Query(None, description="재직상태"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기")
):
    """사원 목록을 조회합니다."""
    mock_employees = [
        {
            "employee_id": "E001",
            "employee_name": "김대표",
            "employee_name_en": "Kim Daepyo",
            "email": "ceo@greenboard.co.kr",
            "phone": "02-1234-5678",
            "mobile": "010-1234-5678",
            "birth_date": date(1965, 5, 15),
            "gender": "M",
            "address": "서울시 강남구",
            "department_code": "CEO",
            "department_name": "대표이사",
            "position_code": "P01",
            "position_name": "대표이사",
            "job_title": "대표이사",
            "employment_type": EmploymentType.REGULAR,
            "status": EmployeeStatus.ACTIVE,
            "hire_date": date(2000, 1, 1),
            "base_salary": Decimal("15000000"),
            "bank_name": "국민은행",
            "bank_account": "123-456-789012",
            "resignation_date": None,
            "years_of_service": 25.1,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30)
        },
        {
            "employee_id": "E101",
            "employee_name": "박에스엠티",
            "employee_name_en": "Park SMT",
            "email": "smt1@greenboard.co.kr",
            "phone": "031-123-4567",
            "mobile": "010-2345-6789",
            "birth_date": date(1980, 8, 20),
            "gender": "M",
            "address": "경기도 수원시",
            "department_code": "SMT1",
            "department_name": "SMT1팀",
            "position_code": "P03",
            "position_name": "부장",
            "job_title": "팀장",
            "employment_type": EmploymentType.REGULAR,
            "status": EmployeeStatus.ACTIVE,
            "hire_date": date(2010, 3, 1),
            "base_salary": Decimal("7000000"),
            "bank_name": "신한은행",
            "bank_account": "110-234-567890",
            "resignation_date": None,
            "years_of_service": 14.9,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30)
        },
        {
            "employee_id": "E201",
            "employee_name": "이작업",
            "employee_name_en": "Lee Worker",
            "email": "worker01@greenboard.co.kr",
            "phone": "031-123-4568",
            "mobile": "010-3456-7890",
            "birth_date": date(1990, 11, 25),
            "gender": "M",
            "address": "경기도 화성시",
            "department_code": "SMT1",
            "department_name": "SMT1팀",
            "position_code": "P07",
            "position_name": "기사",
            "job_title": None,
            "employment_type": EmploymentType.REGULAR,
            "status": EmployeeStatus.ACTIVE,
            "hire_date": date(2018, 7, 1),
            "base_salary": Decimal("3200000"),
            "bank_name": "농협",
            "bank_account": "301-0123-4567-89",
            "resignation_date": None,
            "years_of_service": 6.6,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30)
        },
        {
            "employee_id": "E301",
            "employee_name": "이인사",
            "employee_name_en": "Lee HR",
            "email": "hr@greenboard.co.kr",
            "phone": "02-1234-5679",
            "mobile": "010-4567-8901",
            "birth_date": date(1985, 3, 10),
            "gender": "F",
            "address": "서울시 송파구",
            "department_code": "HR",
            "department_name": "인사팀",
            "position_code": "P04",
            "position_name": "과장",
            "job_title": "팀장",
            "employment_type": EmploymentType.REGULAR,
            "status": EmployeeStatus.ACTIVE,
            "hire_date": date(2012, 9, 1),
            "base_salary": Decimal("5500000"),
            "bank_name": "우리은행",
            "bank_account": "1002-123-456789",
            "resignation_date": None,
            "years_of_service": 12.4,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30)
        },
        {
            "employee_id": "E401",
            "employee_name": "신입사원",
            "employee_name_en": "New Employee",
            "email": "new@greenboard.co.kr",
            "phone": None,
            "mobile": "010-5678-9012",
            "birth_date": date(1998, 12, 5),
            "gender": "F",
            "address": "경기도 성남시",
            "department_code": "SMT1",
            "department_name": "SMT1팀",
            "position_code": "P06",
            "position_name": "사원",
            "job_title": None,
            "employment_type": EmploymentType.CONTRACT,
            "status": EmployeeStatus.ACTIVE,
            "hire_date": date(2025, 1, 2),
            "base_salary": Decimal("3500000"),
            "bank_name": "카카오뱅크",
            "bank_account": "3333-01-1234567",
            "resignation_date": None,
            "years_of_service": 0.1,
            "created_at": datetime.now() - timedelta(days=30),
            "updated_at": datetime.now() - timedelta(days=1)
        }
    ]

    total = len(mock_employees)
    start = (page - 1) * size
    end = start + size

    return EmployeeListResponse(
        items=[EmployeeResponse(**e) for e in mock_employees[start:end]],
        total=total,
        page=page,
        size=size
    )


@router.get("/employees/summary", response_model=EmployeeSummary, summary="사원 현황 요약")
async def get_employee_summary():
    """사원 현황 요약을 조회합니다."""
    return EmployeeSummary(
        total_employees=350,
        active_employees=338,
        new_hires_this_month=5,
        resignations_this_month=2,
        by_department=[
            {"department": "생산본부", "count": 180, "ratio": 51.4},
            {"department": "품질관리부", "count": 35, "ratio": 10.0},
            {"department": "경영지원본부", "count": 45, "ratio": 12.9},
            {"department": "기타", "count": 90, "ratio": 25.7}
        ],
        by_employment_type=[
            {"type": "정규직", "count": 310, "ratio": 88.6},
            {"type": "계약직", "count": 25, "ratio": 7.1},
            {"type": "파트타임", "count": 10, "ratio": 2.9},
            {"type": "인턴", "count": 5, "ratio": 1.4}
        ],
        avg_years_of_service=6.8
    )


@router.get("/employees/{employee_id}", response_model=EmployeeResponse, summary="사원 상세 조회")
async def get_employee(employee_id: str):
    """사원 상세 정보를 조회합니다."""
    return EmployeeResponse(
        employee_id=employee_id,
        employee_name="이작업",
        employee_name_en="Lee Worker",
        email="worker01@greenboard.co.kr",
        phone="031-123-4568",
        mobile="010-3456-7890",
        birth_date=date(1990, 11, 25),
        gender="M",
        address="경기도 화성시",
        department_code="SMT1",
        department_name="SMT1팀",
        position_code="P07",
        position_name="기사",
        job_title=None,
        employment_type=EmploymentType.REGULAR,
        status=EmployeeStatus.ACTIVE,
        hire_date=date(2018, 7, 1),
        base_salary=Decimal("3200000"),
        bank_name="농협",
        bank_account="301-0123-4567-89",
        resignation_date=None,
        years_of_service=6.6,
        created_at=datetime.now() - timedelta(days=365),
        updated_at=datetime.now() - timedelta(days=30)
    )


@router.post("/employees", response_model=EmployeeResponse, summary="사원 등록")
async def create_employee(data: EmployeeCreate):
    """새로운 사원을 등록합니다."""
    return EmployeeResponse(
        **data.model_dump(),
        department_name="부서명",
        position_name="직위명",
        resignation_date=None,
        years_of_service=0.0,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )


@router.put("/employees/{employee_id}", response_model=EmployeeResponse, summary="사원 정보 수정")
async def update_employee(employee_id: str, data: EmployeeUpdate):
    """사원 정보를 수정합니다."""
    return EmployeeResponse(
        employee_id=employee_id,
        employee_name=data.employee_name or "이작업",
        employee_name_en="Lee Worker",
        email=data.email,
        phone=data.phone,
        mobile=data.mobile,
        birth_date=date(1990, 11, 25),
        gender="M",
        address=data.address,
        department_code=data.department_code or "SMT1",
        department_name="SMT1팀",
        position_code=data.position_code or "P07",
        position_name="기사",
        job_title=data.job_title,
        employment_type=data.employment_type or EmploymentType.REGULAR,
        status=data.status or EmployeeStatus.ACTIVE,
        hire_date=date(2018, 7, 1),
        base_salary=data.base_salary or Decimal("3200000"),
        bank_name=data.bank_name,
        bank_account=data.bank_account,
        resignation_date=None,
        years_of_service=6.6,
        created_at=datetime.now() - timedelta(days=365),
        updated_at=datetime.now()
    )


# ============== 근태 관리 ==============

@router.get("/attendance", response_model=AttendanceListResponse, summary="근태 기록 조회")
async def get_attendance_records(
    employee_id: Optional[str] = Query(None, description="사원번호"),
    department_code: Optional[str] = Query(None, description="부서코드"),
    start_date: Optional[date] = Query(None, description="시작일"),
    end_date: Optional[date] = Query(None, description="종료일"),
    attendance_type: Optional[AttendanceType] = Query(None, description="근태유형"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(50, ge=1, le=200, description="페이지 크기")
):
    """근태 기록을 조회합니다."""
    today = date.today()
    mock_records = [
        {
            "id": 1,
            "employee_id": "E201",
            "employee_name": "이작업",
            "department_name": "SMT1팀",
            "work_date": today,
            "attendance_type": AttendanceType.NORMAL,
            "check_in": datetime.combine(today, time(8, 55)),
            "check_out": datetime.combine(today, time(18, 10)),
            "scheduled_start": time(9, 0),
            "scheduled_end": time(18, 0),
            "work_hours": Decimal("8.25"),
            "overtime_hours": Decimal("0.17"),
            "night_hours": Decimal("0"),
            "holiday_hours": Decimal("0"),
            "late_minutes": 0,
            "early_leave_minutes": 0,
            "remarks": None,
            "is_approved": True,
            "approved_by": "E101",
            "approved_at": datetime.now() - timedelta(hours=2),
            "created_at": datetime.now() - timedelta(hours=10)
        },
        {
            "id": 2,
            "employee_id": "E202",
            "employee_name": "박생산",
            "department_name": "SMT1팀",
            "work_date": today,
            "attendance_type": AttendanceType.LATE,
            "check_in": datetime.combine(today, time(9, 15)),
            "check_out": datetime.combine(today, time(18, 0)),
            "scheduled_start": time(9, 0),
            "scheduled_end": time(18, 0),
            "work_hours": Decimal("7.75"),
            "overtime_hours": Decimal("0"),
            "night_hours": Decimal("0"),
            "holiday_hours": Decimal("0"),
            "late_minutes": 15,
            "early_leave_minutes": 0,
            "remarks": "교통 지연",
            "is_approved": True,
            "approved_by": "E101",
            "approved_at": datetime.now() - timedelta(hours=1),
            "created_at": datetime.now() - timedelta(hours=9)
        },
        {
            "id": 3,
            "employee_id": "E203",
            "employee_name": "최조립",
            "department_name": "SMT1팀",
            "work_date": today,
            "attendance_type": AttendanceType.OVERTIME,
            "check_in": datetime.combine(today, time(8, 50)),
            "check_out": datetime.combine(today, time(21, 0)),
            "scheduled_start": time(9, 0),
            "scheduled_end": time(18, 0),
            "work_hours": Decimal("12.17"),
            "overtime_hours": Decimal("3.0"),
            "night_hours": Decimal("1.0"),
            "holiday_hours": Decimal("0"),
            "late_minutes": 0,
            "early_leave_minutes": 0,
            "remarks": "긴급 납기 대응",
            "is_approved": True,
            "approved_by": "E101",
            "approved_at": datetime.now() - timedelta(minutes=30),
            "created_at": datetime.now() - timedelta(hours=12)
        }
    ]

    return AttendanceListResponse(
        items=[AttendanceRecordResponse(**r) for r in mock_records],
        total=len(mock_records),
        page=page,
        size=size
    )


@router.get("/attendance/daily-summary", response_model=AttendanceDailySummary, summary="일별 근태 현황")
async def get_daily_attendance_summary(
    work_date: date = Query(..., description="근무일")
):
    """일별 근태 현황을 조회합니다."""
    return AttendanceDailySummary(
        work_date=work_date,
        total_employees=350,
        present_count=328,
        absent_count=5,
        late_count=12,
        on_leave_count=17,
        attendance_rate=93.7
    )


@router.get("/attendance/summary/{employee_id}", response_model=AttendanceSummary, summary="사원별 근태 요약")
async def get_attendance_summary(
    employee_id: str,
    year: str = Query(..., description="년도"),
    month: str = Query(..., description="월")
):
    """사원별 월간 근태 요약을 조회합니다."""
    return AttendanceSummary(
        employee_id=employee_id,
        employee_name="이작업",
        year_month=f"{year}-{month}",
        total_work_days=22,
        actual_work_days=21,
        total_work_hours=Decimal("176.5"),
        overtime_hours=Decimal("15.5"),
        night_hours=Decimal("8.0"),
        holiday_hours=Decimal("0"),
        late_count=1,
        early_leave_count=0,
        absent_count=0
    )


@router.post("/attendance", response_model=AttendanceRecordResponse, summary="근태 기록 등록")
async def create_attendance_record(data: AttendanceRecordCreate):
    """근태 기록을 등록합니다."""
    return AttendanceRecordResponse(
        id=100,
        **data.model_dump(),
        employee_name="사원명",
        department_name="부서명",
        scheduled_start=time(9, 0),
        scheduled_end=time(18, 0),
        work_hours=Decimal("8.0"),
        late_minutes=0,
        early_leave_minutes=0,
        is_approved=False,
        approved_by=None,
        approved_at=None,
        created_at=datetime.now()
    )


# ============== 휴가 관리 ==============

@router.get("/leaves", response_model=LeaveRequestListResponse, summary="휴가 신청 목록")
async def get_leave_requests(
    employee_id: Optional[str] = Query(None, description="사원번호"),
    department_code: Optional[str] = Query(None, description="부서코드"),
    leave_type: Optional[LeaveType] = Query(None, description="휴가유형"),
    status: Optional[LeaveStatus] = Query(None, description="상태"),
    start_date: Optional[date] = Query(None, description="시작일"),
    end_date: Optional[date] = Query(None, description="종료일"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기")
):
    """휴가 신청 목록을 조회합니다."""
    mock_leaves = [
        {
            "id": 1,
            "request_no": "LV-2025-0101",
            "employee_id": "E201",
            "employee_name": "이작업",
            "department_name": "SMT1팀",
            "leave_type": LeaveType.ANNUAL,
            "start_date": date(2025, 2, 3),
            "end_date": date(2025, 2, 5),
            "days": Decimal("3.0"),
            "reason": "가족 여행",
            "status": LeaveStatus.APPROVED,
            "requested_at": datetime.now() - timedelta(days=10),
            "approved_by": "E101",
            "approved_at": datetime.now() - timedelta(days=9),
            "rejected_reason": None,
            "created_at": datetime.now() - timedelta(days=10)
        },
        {
            "id": 2,
            "request_no": "LV-2025-0102",
            "employee_id": "E202",
            "employee_name": "박생산",
            "department_name": "SMT1팀",
            "leave_type": LeaveType.SICK,
            "start_date": date(2025, 1, 28),
            "end_date": date(2025, 1, 28),
            "days": Decimal("1.0"),
            "reason": "병원 진료",
            "status": LeaveStatus.APPROVED,
            "requested_at": datetime.now() - timedelta(days=5),
            "approved_by": "E101",
            "approved_at": datetime.now() - timedelta(days=4),
            "rejected_reason": None,
            "created_at": datetime.now() - timedelta(days=5)
        },
        {
            "id": 3,
            "request_no": "LV-2025-0103",
            "employee_id": "E203",
            "employee_name": "최조립",
            "department_name": "SMT1팀",
            "leave_type": LeaveType.ANNUAL,
            "start_date": date(2025, 2, 10),
            "end_date": date(2025, 2, 11),
            "days": Decimal("2.0"),
            "reason": "개인 사정",
            "status": LeaveStatus.PENDING,
            "requested_at": datetime.now() - timedelta(days=1),
            "approved_by": None,
            "approved_at": None,
            "rejected_reason": None,
            "created_at": datetime.now() - timedelta(days=1)
        }
    ]

    return LeaveRequestListResponse(
        items=[LeaveRequestResponse(**l) for l in mock_leaves],
        total=len(mock_leaves),
        page=page,
        size=size
    )


@router.get("/leaves/balance/{employee_id}", response_model=LeaveBalanceSummary, summary="휴가 잔여 조회")
async def get_leave_balance(
    employee_id: str,
    year: str = Query(..., description="년도")
):
    """사원의 휴가 잔여를 조회합니다."""
    mock_balances = [
        LeaveBalanceResponse(
            id=1,
            employee_id=employee_id,
            employee_name="이작업",
            year=year,
            leave_type=LeaveType.ANNUAL,
            total_days=Decimal("15.0"),
            used_days=Decimal("5.0"),
            remaining_days=Decimal("10.0"),
            carried_over=Decimal("3.0"),
            expires_at=date(int(year), 12, 31)
        ),
        LeaveBalanceResponse(
            id=2,
            employee_id=employee_id,
            employee_name="이작업",
            year=year,
            leave_type=LeaveType.SICK,
            total_days=Decimal("3.0"),
            used_days=Decimal("1.0"),
            remaining_days=Decimal("2.0"),
            carried_over=Decimal("0"),
            expires_at=None
        )
    ]

    return LeaveBalanceSummary(
        employee_id=employee_id,
        employee_name="이작업",
        year=year,
        balances=mock_balances,
        total_annual=Decimal("15.0"),
        used_annual=Decimal("5.0"),
        remaining_annual=Decimal("10.0")
    )


@router.post("/leaves", response_model=LeaveRequestResponse, summary="휴가 신청")
async def create_leave_request(data: LeaveRequestCreate):
    """휴가를 신청합니다."""
    request_no = f"LV-{datetime.now().strftime('%Y-%m%d%H%M%S')}"

    return LeaveRequestResponse(
        id=100,
        request_no=request_no,
        employee_id=data.employee_id,
        employee_name="사원명",
        department_name="부서명",
        leave_type=data.leave_type,
        start_date=data.start_date,
        end_date=data.end_date,
        days=data.days,
        reason=data.reason,
        status=LeaveStatus.PENDING,
        requested_at=datetime.now(),
        approved_by=None,
        approved_at=None,
        rejected_reason=None,
        created_at=datetime.now()
    )


@router.post("/leaves/{leave_id}/approve", summary="휴가 승인/반려")
async def approve_leave_request(leave_id: int, data: LeaveApproval):
    """휴가 신청을 승인하거나 반려합니다."""
    if data.action == "approve":
        return {
            "message": f"휴가 신청 {leave_id}이(가) 승인되었습니다.",
            "status": LeaveStatus.APPROVED,
            "approved_at": datetime.now()
        }
    else:
        return {
            "message": f"휴가 신청 {leave_id}이(가) 반려되었습니다.",
            "status": LeaveStatus.REJECTED,
            "rejected_reason": data.comment
        }


# ============== 급여 관리 ==============

@router.get("/payroll", response_model=PayrollListResponse, summary="급여대장 목록")
async def get_payroll_list(
    year: Optional[str] = Query(None, description="년도"),
    month: Optional[str] = Query(None, description="월"),
    status: Optional[PayrollStatus] = Query(None, description="상태"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기")
):
    """급여대장 목록을 조회합니다."""
    mock_payroll = [
        {
            "payroll_id": "PAY-2025-01",
            "year": "2025",
            "month": "01",
            "payroll_type": "REGULAR",
            "pay_date": date(2025, 1, 25),
            "status": PayrollStatus.PAID,
            "total_employees": 338,
            "total_gross": Decimal("1520000000"),
            "total_deductions": Decimal("285000000"),
            "total_net": Decimal("1235000000"),
            "calculated_at": datetime.now() - timedelta(days=10),
            "calculated_by": "hr_admin",
            "approved_at": datetime.now() - timedelta(days=8),
            "approved_by": "finance_mgr",
            "paid_at": datetime.now() - timedelta(days=6),
            "paid_by": "finance_admin",
            "created_at": datetime.now() - timedelta(days=15),
            "updated_at": datetime.now() - timedelta(days=6),
            "details": None
        },
        {
            "payroll_id": "PAY-2024-12",
            "year": "2024",
            "month": "12",
            "payroll_type": "REGULAR",
            "pay_date": date(2024, 12, 25),
            "status": PayrollStatus.PAID,
            "total_employees": 340,
            "total_gross": Decimal("1510000000"),
            "total_deductions": Decimal("283000000"),
            "total_net": Decimal("1227000000"),
            "calculated_at": datetime.now() - timedelta(days=40),
            "calculated_by": "hr_admin",
            "approved_at": datetime.now() - timedelta(days=38),
            "approved_by": "finance_mgr",
            "paid_at": datetime.now() - timedelta(days=36),
            "paid_by": "finance_admin",
            "created_at": datetime.now() - timedelta(days=45),
            "updated_at": datetime.now() - timedelta(days=36),
            "details": None
        }
    ]

    return PayrollListResponse(
        items=[PayrollHeaderResponse(**p) for p in mock_payroll],
        total=len(mock_payroll),
        page=page,
        size=size
    )


@router.get("/payroll/{payroll_id}", response_model=PayrollHeaderResponse, summary="급여대장 상세")
async def get_payroll_detail(payroll_id: str):
    """급여대장 상세를 조회합니다."""
    mock_details = [
        {
            "id": 1,
            "payroll_id": payroll_id,
            "employee_id": "E201",
            "employee_name": "이작업",
            "department_name": "SMT1팀",
            "position_name": "기사",
            "base_salary": Decimal("3200000"),
            "overtime_pay": Decimal("280000"),
            "night_pay": Decimal("96000"),
            "holiday_pay": Decimal("0"),
            "position_allowance": Decimal("0"),
            "meal_allowance": Decimal("100000"),
            "transport_allowance": Decimal("100000"),
            "bonus": Decimal("0"),
            "other_pay": Decimal("0"),
            "gross_pay": Decimal("3776000"),
            "income_tax": Decimal("152400"),
            "resident_tax": Decimal("15240"),
            "national_pension": Decimal("169920"),
            "health_insurance": Decimal("129878"),
            "long_term_care": Decimal("16790"),
            "employment_insurance": Decimal("34890"),
            "union_fee": Decimal("30000"),
            "other_deductions": Decimal("0"),
            "total_deductions": Decimal("549118"),
            "net_pay": Decimal("3226882"),
            "work_days": 22,
            "overtime_hours": Decimal("15.5"),
            "night_hours": Decimal("8.0"),
            "holiday_hours": Decimal("0"),
            "absent_days": 0,
            "late_count": 1,
            "remarks": None
        }
    ]

    return PayrollHeaderResponse(
        payroll_id=payroll_id,
        year="2025",
        month="01",
        payroll_type="REGULAR",
        pay_date=date(2025, 1, 25),
        status=PayrollStatus.PAID,
        total_employees=338,
        total_gross=Decimal("1520000000"),
        total_deductions=Decimal("285000000"),
        total_net=Decimal("1235000000"),
        calculated_at=datetime.now() - timedelta(days=10),
        calculated_by="hr_admin",
        approved_at=datetime.now() - timedelta(days=8),
        approved_by="finance_mgr",
        paid_at=datetime.now() - timedelta(days=6),
        paid_by="finance_admin",
        created_at=datetime.now() - timedelta(days=15),
        updated_at=datetime.now() - timedelta(days=6),
        details=[PayrollDetailResponse(**d) for d in mock_details]
    )


@router.post("/payroll/calculate", response_model=PayrollHeaderResponse, summary="급여 계산")
async def calculate_payroll(data: PayrollCalculation):
    """급여를 계산합니다."""
    payroll_id = f"PAY-{data.year}-{data.month}"

    return PayrollHeaderResponse(
        payroll_id=payroll_id,
        year=data.year,
        month=data.month,
        payroll_type=data.payroll_type,
        pay_date=data.pay_date,
        status=PayrollStatus.CALCULATED,
        total_employees=338,
        total_gross=Decimal("1520000000"),
        total_deductions=Decimal("285000000"),
        total_net=Decimal("1235000000"),
        calculated_at=datetime.now(),
        calculated_by="current_user",
        approved_at=None,
        approved_by=None,
        paid_at=None,
        paid_by=None,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        details=None
    )


@router.post("/payroll/{payroll_id}/approve", summary="급여 승인")
async def approve_payroll(payroll_id: str):
    """급여대장을 승인합니다."""
    return {
        "message": f"급여대장 {payroll_id}이(가) 승인되었습니다.",
        "status": PayrollStatus.APPROVED,
        "approved_at": datetime.now()
    }


@router.post("/payroll/{payroll_id}/pay", summary="급여 지급")
async def process_payment(payroll_id: str):
    """급여를 지급합니다."""
    return {
        "message": f"급여대장 {payroll_id}의 급여가 지급되었습니다.",
        "status": PayrollStatus.PAID,
        "paid_at": datetime.now(),
        "total_employees": 338,
        "total_net": Decimal("1235000000")
    }


@router.get("/payroll/{payroll_id}/payslip/{employee_id}", response_model=PayslipResponse, summary="급여명세서")
async def get_payslip(payroll_id: str, employee_id: str):
    """급여명세서를 조회합니다."""
    return PayslipResponse(
        payroll_id=payroll_id,
        year_month="2025-01",
        pay_date=date(2025, 1, 25),
        employee_id=employee_id,
        employee_name="이작업",
        department_name="SMT1팀",
        position_name="기사",
        hire_date=date(2018, 7, 1),
        bank_name="농협",
        bank_account="301-0123-4567-89",
        earnings={
            "base_salary": Decimal("3200000"),
            "overtime_pay": Decimal("280000"),
            "night_pay": Decimal("96000"),
            "holiday_pay": Decimal("0"),
            "meal_allowance": Decimal("100000"),
            "transport_allowance": Decimal("100000")
        },
        deductions={
            "income_tax": Decimal("152400"),
            "resident_tax": Decimal("15240"),
            "national_pension": Decimal("169920"),
            "health_insurance": Decimal("129878"),
            "long_term_care": Decimal("16790"),
            "employment_insurance": Decimal("34890"),
            "union_fee": Decimal("30000")
        },
        gross_pay=Decimal("3776000"),
        total_deductions=Decimal("549118"),
        net_pay=Decimal("3226882"),
        attendance_info={
            "work_days": 22,
            "overtime_hours": 15.5,
            "night_hours": 8.0,
            "late_count": 1,
            "absent_days": 0
        }
    )


@router.get("/payroll/summary", response_model=PayrollSummary, summary="급여 요약")
async def get_payroll_summary(
    year: str = Query(..., description="년도"),
    month: str = Query(..., description="월")
):
    """급여 요약 정보를 조회합니다."""
    return PayrollSummary(
        payroll_id=f"PAY-{year}-{month}",
        year_month=f"{year}-{month}",
        total_employees=338,
        total_gross=Decimal("1520000000"),
        total_deductions=Decimal("285000000"),
        total_net=Decimal("1235000000"),
        by_department=[
            {"department": "생산본부", "employees": 180, "gross": Decimal("680000000"), "net": Decimal("552000000")},
            {"department": "품질관리부", "employees": 35, "gross": Decimal("165000000"), "net": Decimal("134000000")},
            {"department": "경영지원본부", "employees": 45, "gross": Decimal("255000000"), "net": Decimal("207000000")},
            {"department": "기타", "employees": 78, "gross": Decimal("420000000"), "net": Decimal("342000000")}
        ],
        by_item={
            "base_salary": Decimal("1150000000"),
            "overtime_pay": Decimal("125000000"),
            "allowances": Decimal("245000000"),
            "income_tax": Decimal("115000000"),
            "insurance": Decimal("150000000"),
            "other_deductions": Decimal("20000000")
        }
    )


# ============== 대시보드 ==============

@router.get("/dashboard", response_model=HRDashboard, summary="인사 대시보드")
async def get_hr_dashboard():
    """인사 대시보드 정보를 조회합니다."""
    return HRDashboard(
        employee_summary=EmployeeSummary(
            total_employees=350,
            active_employees=338,
            new_hires_this_month=5,
            resignations_this_month=2,
            by_department=[
                {"department": "생산본부", "count": 180, "ratio": 51.4}
            ],
            by_employment_type=[
                {"type": "정규직", "count": 310, "ratio": 88.6}
            ],
            avg_years_of_service=6.8
        ),
        attendance_today=AttendanceDailySummary(
            work_date=date.today(),
            total_employees=350,
            present_count=328,
            absent_count=5,
            late_count=12,
            on_leave_count=17,
            attendance_rate=93.7
        ),
        pending_leaves=8,
        recent_hires=[
            EmployeeResponse(
                employee_id="E401",
                employee_name="신입사원",
                employee_name_en="New Employee",
                email="new@greenboard.co.kr",
                phone=None,
                mobile="010-5678-9012",
                birth_date=date(1998, 12, 5),
                gender="F",
                address="경기도 성남시",
                department_code="SMT1",
                department_name="SMT1팀",
                position_code="P06",
                position_name="사원",
                job_title=None,
                employment_type=EmploymentType.CONTRACT,
                status=EmployeeStatus.ACTIVE,
                hire_date=date(2025, 1, 2),
                base_salary=Decimal("3500000"),
                bank_name="카카오뱅크",
                bank_account="3333-01-1234567",
                resignation_date=None,
                years_of_service=0.1,
                created_at=datetime.now() - timedelta(days=30),
                updated_at=datetime.now() - timedelta(days=1)
            )
        ],
        upcoming_birthdays=[
            {"employee_id": "E105", "employee_name": "김생일", "birth_date": date.today() + timedelta(days=3), "department": "SMT2팀"},
            {"employee_id": "E210", "employee_name": "박축하", "birth_date": date.today() + timedelta(days=5), "department": "조립팀"}
        ],
        organization_chart={
            "total_departments": 15,
            "total_teams": 25,
            "management_positions": 56,
            "production_ratio": 51.4
        }
    )
