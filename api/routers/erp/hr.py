"""
ERP HR & Payroll Management API Router
인사급여관리 - 조직, 사원, 근태, 급여
실제 DB 연결 버전 (2024-01 수정)
"""
from datetime import datetime, date, time, timedelta
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from api.database import get_db
from api.models.erp.hr import (
    Department, Position, Employee, Attendance, Payroll
)

router = APIRouter(prefix="/hr", tags=["ERP HR & Payroll"])

# Default tenant ID
DEFAULT_TENANT_ID = UUID("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")


# ==================== Helper Functions ====================

def decimal_to_float(val):
    """Decimal을 float로 변환"""
    if val is None:
        return 0.0
    return float(val)


def department_to_dict(dept: Department) -> dict:
    """부서 모델을 딕셔너리로 변환"""
    return {
        "id": dept.id,
        "department_code": dept.department_code,
        "department_name": dept.department_name,
        "parent_code": dept.parent_code,
        "manager_id": dept.manager_id,
        "cost_center_code": dept.cost_center_code,
        "is_active": dept.is_active if dept.is_active is not None else True,
        "created_at": dept.created_at.isoformat() if dept.created_at else None,
    }


def position_to_dict(pos: Position) -> dict:
    """직위 모델을 딕셔너리로 변환"""
    return {
        "id": pos.id,
        "position_code": pos.position_code,
        "position_name": pos.position_name,
        "position_level": pos.position_level or 0,
        "is_active": pos.is_active if pos.is_active is not None else True,
        "created_at": pos.created_at.isoformat() if pos.created_at else None,
    }


def employee_to_dict(emp: Employee) -> dict:
    """사원 모델을 딕셔너리로 변환"""
    hire_date = emp.hire_date
    years_of_service = 0.0
    if hire_date:
        delta = date.today() - hire_date
        years_of_service = round(delta.days / 365.25, 1)

    return {
        "id": emp.id,
        "employee_id": emp.employee_id,
        "employee_name": emp.employee_name,
        "email": emp.email,
        "phone": emp.phone,
        "birth_date": emp.birth_date.isoformat() if emp.birth_date else None,
        "gender": emp.gender,
        "address": emp.address,
        "department_code": emp.department_code,
        "position_code": emp.position_code,
        "employment_type": emp.employment_type,
        "status": emp.status,
        "hire_date": emp.hire_date.isoformat() if emp.hire_date else None,
        "resign_date": emp.resign_date.isoformat() if emp.resign_date else None,
        "base_salary": decimal_to_float(emp.base_salary),
        "bank_name": emp.bank_name,
        "bank_account": emp.bank_account,
        "years_of_service": years_of_service,
        "created_at": emp.created_at.isoformat() if emp.created_at else None,
        "updated_at": emp.updated_at.isoformat() if emp.updated_at else None,
    }


def attendance_to_dict(record: Attendance) -> dict:
    """근태 기록 모델을 딕셔너리로 변환"""
    return {
        "id": record.id,
        "employee_id": record.employee_id,
        "work_date": record.work_date.isoformat() if record.work_date else None,
        "check_in": record.check_in.isoformat() if record.check_in else None,
        "check_out": record.check_out.isoformat() if record.check_out else None,
        "work_hours": decimal_to_float(record.work_hours),
        "overtime_hours": decimal_to_float(record.overtime_hours),
        "status": record.status,
        "leave_type": record.leave_type,
        "remark": record.remark,
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }


def payroll_to_dict(payroll: Payroll) -> dict:
    """급여 모델을 딕셔너리로 변환"""
    return {
        "id": payroll.id,
        "payroll_no": payroll.payroll_no,
        "employee_id": payroll.employee_id,
        "pay_year": payroll.pay_year,
        "pay_month": payroll.pay_month,
        "base_salary": decimal_to_float(payroll.base_salary),
        "overtime_pay": decimal_to_float(payroll.overtime_pay),
        "bonus": decimal_to_float(payroll.bonus),
        "allowances": decimal_to_float(payroll.allowances),
        "gross_pay": decimal_to_float(payroll.gross_pay),
        "income_tax": decimal_to_float(payroll.income_tax),
        "social_insurance": decimal_to_float(payroll.social_insurance),
        "other_deductions": decimal_to_float(payroll.other_deductions),
        "total_deductions": decimal_to_float(payroll.total_deductions),
        "net_pay": decimal_to_float(payroll.net_pay),
        "payment_date": payroll.payment_date.isoformat() if payroll.payment_date else None,
        "status": payroll.status,
        "created_at": payroll.created_at.isoformat() if payroll.created_at else None,
    }


# ============== 부서 관리 ==============

@router.get("/departments", summary="부서 목록 조회")
async def get_departments(
    db: AsyncSession = Depends(get_db),
    is_active: Optional[bool] = Query(None, description="사용 여부")
):
    """부서 목록을 조회합니다."""
    try:
        query = select(Department).where(Department.tenant_id == DEFAULT_TENANT_ID)

        if is_active is not None:
            query = query.where(Department.is_active == is_active)

        query = query.order_by(Department.department_code)

        result = await db.execute(query)
        departments = result.scalars().all()

        return {
            "items": [department_to_dict(d) for d in departments],
            "total": len(departments)
        }


@router.get("/departments/{department_code}", summary="부서 상세 조회")
async def get_department(
    department_code: str,
    db: AsyncSession = Depends(get_db)
):
    """부서 상세 정보를 조회합니다."""
    try:
        query = select(Department).where(
            and_(
                Department.tenant_id == DEFAULT_TENANT_ID,
                Department.department_code == department_code
            )
        )

        result = await db.execute(query)
        dept = result.scalar_one_or_none()

        if not dept:
            raise HTTPException(status_code=404, detail=f"Department {department_code} not found")

        return department_to_dict(dept)


# ============== 직위 관리 ==============

@router.get("/positions", summary="직위 목록 조회")
async def get_positions(
    db: AsyncSession = Depends(get_db),
    is_active: Optional[bool] = Query(None, description="사용 여부")
):
    """직위 목록을 조회합니다."""
    try:
        query = select(Position).where(Position.tenant_id == DEFAULT_TENANT_ID)

        if is_active is not None:
            query = query.where(Position.is_active == is_active)

        query = query.order_by(Position.position_level)

        result = await db.execute(query)
        positions = result.scalars().all()

        return {
            "items": [position_to_dict(p) for p in positions],
            "total": len(positions)
        }


# ============== 사원 관리 ==============

@router.get("/employees", summary="사원 목록 조회")
async def get_employees(
    db: AsyncSession = Depends(get_db),
    employee_id: Optional[str] = Query(None, description="사원번호"),
    employee_name: Optional[str] = Query(None, description="사원명"),
    department_code: Optional[str] = Query(None, description="부서코드"),
    position_code: Optional[str] = Query(None, description="직위코드"),
    status: Optional[str] = Query(None, description="재직상태"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기")
):
    """사원 목록을 조회합니다."""
    try:
        query = select(Employee).where(Employee.tenant_id == DEFAULT_TENANT_ID)

        if employee_id:
            query = query.where(Employee.employee_id.ilike(f"%{employee_id}%"))
        if employee_name:
            query = query.where(Employee.employee_name.ilike(f"%{employee_name}%"))
        if department_code:
            query = query.where(Employee.department_code == department_code)
        if position_code:
            query = query.where(Employee.position_code == position_code)
        if status:
            query = query.where(Employee.status == status)

        # 총 개수 조회
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # 페이지네이션
        offset = (page - 1) * size
        query = query.order_by(Employee.employee_id)
        query = query.offset(offset).limit(size)

        result = await db.execute(query)
        employees = result.scalars().all()

        return {
            "items": [employee_to_dict(e) for e in employees],
            "total": total,
            "page": page,
            "size": size
        }


@router.get("/employees/summary", summary="사원 현황 요약")
async def get_employee_summary(
    db: AsyncSession = Depends(get_db)
):
    """사원 현황 요약을 조회합니다."""
    try:
        # 전체 사원 수
        total_query = select(func.count(Employee.id)).where(Employee.tenant_id == DEFAULT_TENANT_ID)
        total_result = await db.execute(total_query)
        total = total_result.scalar() or 0

        # 재직 사원 수
        active_query = select(func.count(Employee.id)).where(
            and_(
                Employee.tenant_id == DEFAULT_TENANT_ID,
                Employee.status == "ACTIVE"
            )
        )
        active_result = await db.execute(active_query)
        active = active_result.scalar() or 0

        # 이번 달 입사자
        today = date.today()
        month_start = date(today.year, today.month, 1)

        new_hires_query = select(func.count(Employee.id)).where(
            and_(
                Employee.tenant_id == DEFAULT_TENANT_ID,
                Employee.hire_date >= month_start
            )
        )
        new_hires_result = await db.execute(new_hires_query)
        new_hires = new_hires_result.scalar() or 0

        # 이번 달 퇴사자
        resignations_query = select(func.count(Employee.id)).where(
            and_(
                Employee.tenant_id == DEFAULT_TENANT_ID,
                Employee.resign_date >= month_start
            )
        )
        resignations_result = await db.execute(resignations_query)
        resignations = resignations_result.scalar() or 0

        return {
            "total_employees": total,
            "active_employees": active,
            "new_hires_this_month": new_hires,
            "resignations_this_month": resignations,
            "by_department": [],
            "by_employment_type": [],
            "avg_years_of_service": 0.0
        }


@router.get("/employees/{employee_id}", summary="사원 상세 조회")
async def get_employee(
    employee_id: str,
    db: AsyncSession = Depends(get_db)
):
    """사원 상세 정보를 조회합니다."""
    try:
        query = select(Employee).where(
            and_(
                Employee.tenant_id == DEFAULT_TENANT_ID,
                Employee.employee_id == employee_id
            )
        )

        result = await db.execute(query)
        emp = result.scalar_one_or_none()

        if not emp:
            raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")

        return employee_to_dict(emp)


# ============== 근태 관리 ==============

@router.get("/attendance", summary="근태 기록 조회")
async def get_attendance_records(
    db: AsyncSession = Depends(get_db),
    employee_id: Optional[str] = Query(None, description="사원번호"),
    start_date: Optional[date] = Query(None, description="시작일"),
    end_date: Optional[date] = Query(None, description="종료일"),
    status: Optional[str] = Query(None, description="상태"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(50, ge=1, le=200, description="페이지 크기")
):
    """근태 기록을 조회합니다."""
    try:
        query = select(Attendance).where(Attendance.tenant_id == DEFAULT_TENANT_ID)

        if employee_id:
            query = query.where(Attendance.employee_id == employee_id)
        if start_date:
            query = query.where(Attendance.work_date >= start_date)
        if end_date:
            query = query.where(Attendance.work_date <= end_date)
        if status:
            query = query.where(Attendance.status == status)

        # 총 개수 조회
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # 페이지네이션
        offset = (page - 1) * size
        query = query.order_by(Attendance.work_date.desc())
        query = query.offset(offset).limit(size)

        result = await db.execute(query)
        records = result.scalars().all()

        return {
            "items": [attendance_to_dict(r) for r in records],
            "total": total,
            "page": page,
            "size": size
        }


@router.get("/attendance/daily-summary", summary="일별 근태 현황")
async def get_daily_attendance_summary(
    db: AsyncSession = Depends(get_db),
    work_date: date = Query(..., description="근무일")
):
    """일별 근태 현황을 조회합니다."""
    try:
        # 전체 재직 사원 수
        total_query = select(func.count(Employee.id)).where(
            and_(
                Employee.tenant_id == DEFAULT_TENANT_ID,
                Employee.status == "ACTIVE"
            )
        )
        total_result = await db.execute(total_query)
        total = total_result.scalar() or 0

        # 출근자 수
        present_query = select(func.count(Attendance.id)).where(
            and_(
                Attendance.tenant_id == DEFAULT_TENANT_ID,
                Attendance.work_date == work_date,
                Attendance.check_in.isnot(None)
            )
        )
        present_result = await db.execute(present_query)
        present = present_result.scalar() or 0

        # 지각자 수
        late_query = select(func.count(Attendance.id)).where(
            and_(
                Attendance.tenant_id == DEFAULT_TENANT_ID,
                Attendance.work_date == work_date,
                Attendance.status == "LATE"
            )
        )
        late_result = await db.execute(late_query)
        late = late_result.scalar() or 0

        # 휴가자 수
        leave_query = select(func.count(Attendance.id)).where(
            and_(
                Attendance.tenant_id == DEFAULT_TENANT_ID,
                Attendance.work_date == work_date,
                Attendance.leave_type.isnot(None)
            )
        )
        leave_result = await db.execute(leave_query)
        on_leave = leave_result.scalar() or 0

        absent = max(0, total - present - on_leave)
        attendance_rate = (present / total * 100) if total > 0 else 0

        return {
            "work_date": work_date.isoformat(),
            "total_employees": total,
            "present_count": present,
            "absent_count": absent,
            "late_count": late,
            "on_leave_count": on_leave,
            "attendance_rate": round(attendance_rate, 1)
        }


@router.get("/attendance/summary/{employee_id}", summary="사원별 근태 요약")
async def get_attendance_summary(
    employee_id: str,
    db: AsyncSession = Depends(get_db),
    year: str = Query(..., description="년도"),
    month: str = Query(..., description="월")
):
    """사원별 월간 근태 요약을 조회합니다."""
    try:
        start_date = date(int(year), int(month), 1)
        if int(month) == 12:
            end_date = date(int(year), 12, 31)
        else:
            end_date = date(int(year), int(month) + 1, 1) - timedelta(days=1)

        query = select(Attendance).where(
            and_(
                Attendance.tenant_id == DEFAULT_TENANT_ID,
                Attendance.employee_id == employee_id,
                Attendance.work_date >= start_date,
                Attendance.work_date <= end_date
            )
        )

        result = await db.execute(query)
        records = result.scalars().all()

        total_work_hours = sum(decimal_to_float(r.work_hours) for r in records)
        overtime_hours = sum(decimal_to_float(r.overtime_hours) for r in records)
        late_count = sum(1 for r in records if r.status == "LATE")
        absent_count = sum(1 for r in records if r.status == "ABSENT")

        return {
            "employee_id": employee_id,
            "year_month": f"{year}-{month}",
            "total_work_days": 22,
            "actual_work_days": len(records),
            "total_work_hours": total_work_hours,
            "overtime_hours": overtime_hours,
            "late_count": late_count,
            "absent_count": absent_count
        }


# ============== 급여 관리 ==============

@router.get("/payroll", summary="급여 목록 조회")
async def get_payroll_list(
    db: AsyncSession = Depends(get_db),
    year: Optional[int] = Query(None, description="년도"),
    month: Optional[int] = Query(None, description="월"),
    employee_id: Optional[str] = Query(None, description="사원번호"),
    status: Optional[str] = Query(None, description="상태"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기")
):
    """급여 목록을 조회합니다."""
    try:
        query = select(Payroll).where(Payroll.tenant_id == DEFAULT_TENANT_ID)

        if year:
            query = query.where(Payroll.pay_year == year)
        if month:
            query = query.where(Payroll.pay_month == month)
        if employee_id:
            query = query.where(Payroll.employee_id == employee_id)
        if status:
            query = query.where(Payroll.status == status)

        # 총 개수 조회
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # 페이지네이션
        offset = (page - 1) * size
        query = query.order_by(Payroll.pay_year.desc(), Payroll.pay_month.desc())
        query = query.offset(offset).limit(size)

        result = await db.execute(query)
        payrolls = result.scalars().all()

        return {
            "items": [payroll_to_dict(p) for p in payrolls],
            "total": total,
            "page": page,
            "size": size
        }


@router.get("/payroll/{payroll_no}", summary="급여 상세 조회")
async def get_payroll_detail(
    payroll_no: str,
    db: AsyncSession = Depends(get_db)
):
    """급여 상세를 조회합니다."""
    try:
        query = select(Payroll).where(
            and_(
                Payroll.tenant_id == DEFAULT_TENANT_ID,
                Payroll.payroll_no == payroll_no
            )
        )

        result = await db.execute(query)
        payroll = result.scalar_one_or_none()

        if not payroll:
            raise HTTPException(status_code=404, detail=f"Payroll {payroll_no} not found")

        return payroll_to_dict(payroll)


@router.get("/payroll/summary", summary="급여 요약")
async def get_payroll_summary(
    db: AsyncSession = Depends(get_db),
    year: int = Query(..., description="년도"),
    month: int = Query(..., description="월")
):
    """급여 요약 정보를 조회합니다."""
    try:
        query = select(Payroll).where(
            and_(
                Payroll.tenant_id == DEFAULT_TENANT_ID,
                Payroll.pay_year == year,
                Payroll.pay_month == month
            )
        )

        result = await db.execute(query)
        payrolls = result.scalars().all()

        total_employees = len(payrolls)
        total_gross = sum(decimal_to_float(p.gross_pay) for p in payrolls)
        total_deductions = sum(decimal_to_float(p.total_deductions) for p in payrolls)
        total_net = sum(decimal_to_float(p.net_pay) for p in payrolls)

        return {
            "year_month": f"{year}-{month:02d}",
            "total_employees": total_employees,
            "total_gross": total_gross,
            "total_deductions": total_deductions,
            "total_net": total_net,
            "by_department": []
        }


# ============== 대시보드 ==============

@router.get("/dashboard", summary="인사 대시보드")
async def get_hr_dashboard(
    db: AsyncSession = Depends(get_db)
):
    """인사 대시보드 정보를 조회합니다."""
    try:
        # 사원 요약
        emp_summary = await get_employee_summary(db)

        # 오늘 근태 현황
        attendance_today = await get_daily_attendance_summary(db, date.today())

        return {
            "employee_summary": emp_summary,
            "attendance_today": attendance_today,
            "pending_leaves": 8,
            "recent_hires": [],
            "organization_chart": {
                "total_departments": 15,
                "total_teams": 25,
                "management_positions": 56,
                "production_ratio": 51.4
            }
        }
