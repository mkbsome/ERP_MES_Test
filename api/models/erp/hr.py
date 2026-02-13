"""
ERP HR & Payroll Management Models
인사급여관리 - 사원정보, 근태관리, 급여관리

실제 DB 스키마 기반 모델 (2024-01 수정)
"""
from datetime import datetime, date
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Boolean, Text,
    ForeignKey, Numeric
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship

from api.models.base import Base


# ============== 조직/부서 ==============

class Department(Base):
    """부서 마스터 - 실제 DB: erp_department"""
    __tablename__ = "erp_department"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    department_code = Column(String(20), nullable=False, unique=True, index=True, comment="부서코드")
    department_name = Column(String(100), nullable=False, comment="부서명")
    parent_code = Column(String(20), comment="상위부서코드")
    manager_id = Column(String(20), comment="부서장 사번")
    cost_center_code = Column(String(20), comment="코스트센터코드")
    is_active = Column(Boolean, default=True, comment="사용 여부")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, comment="생성일시")



class Position(Base):
    """직위 마스터 - 실제 DB: erp_position"""
    __tablename__ = "erp_position"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    position_code = Column(String(20), nullable=False, unique=True, index=True, comment="직위코드")
    position_name = Column(String(50), nullable=False, comment="직위명")
    position_level = Column(Integer, default=0, comment="직위 레벨")
    is_active = Column(Boolean, default=True, comment="사용 여부")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, comment="생성일시")



# ============== 사원 정보 ==============

class Employee(Base):
    """사원 마스터 - 실제 DB: erp_employee"""
    __tablename__ = "erp_employee"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    employee_id = Column(String(20), nullable=False, unique=True, index=True, comment="사원번호")
    employee_name = Column(String(50), nullable=False, comment="사원명")
    department_code = Column(String(20), comment="부서코드")
    position_code = Column(String(20), comment="직위코드")
    hire_date = Column(Date, nullable=False, comment="입사일")
    resign_date = Column(Date, comment="퇴사일")
    email = Column(String(200), comment="이메일")
    phone = Column(String(20), comment="전화번호")
    birth_date = Column(Date, comment="생년월일")
    gender = Column(String(10), comment="성별")
    address = Column(Text, comment="주소")
    bank_name = Column(String(50), comment="은행명")
    bank_account = Column(String(50), comment="계좌번호")
    base_salary = Column(Numeric(18, 2), default=0, comment="기본급")
    employment_type = Column(String(20), comment="고용유형")
    status = Column(String(20), comment="재직상태")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, comment="생성일시")
    updated_at = Column(DateTime(timezone=True), comment="수정일시")



# ============== 근태 관리 ==============

class Attendance(Base):
    """출퇴근 기록 - 실제 DB: erp_attendance"""
    __tablename__ = "erp_attendance"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    employee_id = Column(String(20), nullable=False, index=True, comment="사원번호")
    work_date = Column(Date, nullable=False, comment="근무일")
    check_in = Column(DateTime(timezone=True), comment="출근시각")
    check_out = Column(DateTime(timezone=True), comment="퇴근시각")
    work_hours = Column(Numeric(5, 2), default=0, comment="근무시간")
    overtime_hours = Column(Numeric(5, 2), default=0, comment="연장근무시간")
    status = Column(String(20), comment="상태")
    leave_type = Column(String(20), comment="휴가유형")
    remark = Column(Text, comment="비고")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, comment="생성일시")



# ============== 급여 관리 ==============

class Payroll(Base):
    """급여대장 - 실제 DB: erp_payroll"""
    __tablename__ = "erp_payroll"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    payroll_no = Column(String(30), nullable=False, unique=True, index=True, comment="급여번호")
    employee_id = Column(String(20), nullable=False, index=True, comment="사원번호")
    pay_year = Column(Integer, nullable=False, comment="지급년도")
    pay_month = Column(Integer, nullable=False, comment="지급월")
    base_salary = Column(Numeric(18, 2), default=0, comment="기본급")
    overtime_pay = Column(Numeric(18, 2), default=0, comment="연장수당")
    bonus = Column(Numeric(18, 2), default=0, comment="상여금")
    allowances = Column(Numeric(18, 2), default=0, comment="수당")
    gross_pay = Column(Numeric(18, 2), default=0, comment="총지급액")
    income_tax = Column(Numeric(18, 2), default=0, comment="소득세")
    social_insurance = Column(Numeric(18, 2), default=0, comment="사회보험")
    other_deductions = Column(Numeric(18, 2), default=0, comment="기타공제")
    total_deductions = Column(Numeric(18, 2), default=0, comment="총공제액")
    net_pay = Column(Numeric(18, 2), default=0, comment="실지급액")
    payment_date = Column(Date, comment="지급일")
    status = Column(String(20), comment="상태")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, comment="생성일시")

