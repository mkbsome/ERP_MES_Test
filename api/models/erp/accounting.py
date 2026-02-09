"""
ERP Accounting Management Models
회계관리 - 전표관리, 장부관리, 원가분석, 결산
"""
from datetime import datetime, date
from decimal import Decimal
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Boolean, Text,
    ForeignKey, Enum, Numeric, JSON
)
from sqlalchemy.orm import relationship

from api.models.base import Base


class VoucherType(str, PyEnum):
    """전표 유형"""
    RECEIPT = "RECEIPT"           # 입금전표
    PAYMENT = "PAYMENT"           # 출금전표
    TRANSFER = "TRANSFER"         # 대체전표
    SALES = "SALES"               # 매출전표
    PURCHASE = "PURCHASE"         # 매입전표


class VoucherStatus(str, PyEnum):
    """전표 상태"""
    DRAFT = "DRAFT"               # 작성중
    PENDING = "PENDING"           # 승인대기
    APPROVED = "APPROVED"         # 승인완료
    REJECTED = "REJECTED"         # 반려
    POSTED = "POSTED"             # 전기완료
    CANCELLED = "CANCELLED"       # 취소


class AccountType(str, PyEnum):
    """계정 유형"""
    ASSET = "ASSET"               # 자산
    LIABILITY = "LIABILITY"       # 부채
    EQUITY = "EQUITY"             # 자본
    REVENUE = "REVENUE"           # 수익
    EXPENSE = "EXPENSE"           # 비용


class CostType(str, PyEnum):
    """원가 유형"""
    MATERIAL = "MATERIAL"         # 재료비
    LABOR = "LABOR"               # 노무비
    OVERHEAD = "OVERHEAD"         # 경비
    OUTSOURCING = "OUTSOURCING"   # 외주비


class ClosingType(str, PyEnum):
    """결산 유형"""
    MONTHLY = "MONTHLY"           # 월결산
    QUARTERLY = "QUARTERLY"       # 분기결산
    YEARLY = "YEARLY"             # 연결산


class ClosingStatus(str, PyEnum):
    """결산 상태"""
    OPEN = "OPEN"                 # 미결산
    IN_PROGRESS = "IN_PROGRESS"   # 결산중
    CLOSED = "CLOSED"             # 결산완료
    REOPENED = "REOPENED"         # 재개설


# ============== 계정과목 ==============

class AccountCode(Base):
    """계정과목 마스터"""
    __tablename__ = "erp_account_code"

    account_code = Column(String(20), primary_key=True, comment="계정코드")
    account_name = Column(String(100), nullable=False, comment="계정명")
    account_name_en = Column(String(100), comment="계정명(영문)")
    account_type = Column(Enum(AccountType), nullable=False, comment="계정유형")
    parent_code = Column(String(20), ForeignKey("erp_account_code.account_code"), comment="상위계정코드")
    level = Column(Integer, default=1, comment="계정 레벨")
    is_control = Column(Boolean, default=False, comment="통제계정 여부")
    is_cash = Column(Boolean, default=False, comment="현금성 여부")
    is_bank = Column(Boolean, default=False, comment="은행계정 여부")
    debit_credit = Column(String(1), comment="차대구분 (D/C)")
    budget_control = Column(Boolean, default=False, comment="예산통제 여부")
    is_active = Column(Boolean, default=True, comment="사용 여부")
    description = Column(Text, comment="설명")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")

    # Relationships
    children = relationship("AccountCode", backref="parent", remote_side=[account_code])
    voucher_details = relationship("VoucherDetail", back_populates="account")


# ============== 전표 관리 ==============

class Voucher(Base):
    """전표 헤더"""
    __tablename__ = "erp_voucher"

    voucher_no = Column(String(30), primary_key=True, comment="전표번호")
    voucher_date = Column(Date, nullable=False, comment="전표일자")
    voucher_type = Column(Enum(VoucherType), nullable=False, comment="전표유형")
    status = Column(Enum(VoucherStatus), default=VoucherStatus.DRAFT, comment="상태")
    fiscal_year = Column(String(4), nullable=False, comment="회계연도")
    fiscal_period = Column(String(2), nullable=False, comment="회계기간 (월)")
    description = Column(Text, comment="적요")
    total_debit = Column(Numeric(18, 2), default=0, comment="차변합계")
    total_credit = Column(Numeric(18, 2), default=0, comment="대변합계")
    currency = Column(String(3), default="KRW", comment="통화")
    exchange_rate = Column(Numeric(10, 4), default=1, comment="환율")
    reference_type = Column(String(50), comment="참조유형")
    reference_no = Column(String(50), comment="참조번호")
    department_code = Column(String(20), comment="부서코드")
    cost_center = Column(String(20), comment="코스트센터")
    created_by = Column(String(50), comment="작성자")
    approved_by = Column(String(50), comment="승인자")
    approved_at = Column(DateTime, comment="승인일시")
    posted_at = Column(DateTime, comment="전기일시")
    cancelled_at = Column(DateTime, comment="취소일시")
    cancel_reason = Column(Text, comment="취소사유")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")

    # Relationships
    details = relationship("VoucherDetail", back_populates="voucher", cascade="all, delete-orphan")


class VoucherDetail(Base):
    """전표 상세"""
    __tablename__ = "erp_voucher_detail"

    id = Column(Integer, primary_key=True, autoincrement=True)
    voucher_no = Column(String(30), ForeignKey("erp_voucher.voucher_no"), nullable=False, comment="전표번호")
    line_no = Column(Integer, nullable=False, comment="라인번호")
    account_code = Column(String(20), ForeignKey("erp_account_code.account_code"), nullable=False, comment="계정코드")
    debit_amount = Column(Numeric(18, 2), default=0, comment="차변금액")
    credit_amount = Column(Numeric(18, 2), default=0, comment="대변금액")
    description = Column(Text, comment="적요")
    partner_code = Column(String(20), comment="거래처코드")
    partner_name = Column(String(100), comment="거래처명")
    cost_center = Column(String(20), comment="코스트센터")
    project_code = Column(String(20), comment="프로젝트코드")
    tax_code = Column(String(10), comment="세금코드")
    tax_amount = Column(Numeric(18, 2), default=0, comment="세액")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")

    # Relationships
    voucher = relationship("Voucher", back_populates="details")
    account = relationship("AccountCode", back_populates="voucher_details")


# ============== 장부 관리 ==============

class GeneralLedger(Base):
    """총계정원장"""
    __tablename__ = "erp_general_ledger"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fiscal_year = Column(String(4), nullable=False, comment="회계연도")
    fiscal_period = Column(String(2), nullable=False, comment="회계기간")
    account_code = Column(String(20), ForeignKey("erp_account_code.account_code"), nullable=False, comment="계정코드")
    opening_balance = Column(Numeric(18, 2), default=0, comment="기초잔액")
    debit_total = Column(Numeric(18, 2), default=0, comment="차변합계")
    credit_total = Column(Numeric(18, 2), default=0, comment="대변합계")
    closing_balance = Column(Numeric(18, 2), default=0, comment="기말잔액")
    transaction_count = Column(Integer, default=0, comment="거래건수")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")


class SubsidiaryLedger(Base):
    """보조원장 (거래처별/부서별 등)"""
    __tablename__ = "erp_subsidiary_ledger"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fiscal_year = Column(String(4), nullable=False, comment="회계연도")
    fiscal_period = Column(String(2), nullable=False, comment="회계기간")
    account_code = Column(String(20), nullable=False, comment="계정코드")
    sub_code = Column(String(20), nullable=False, comment="보조코드 (거래처/부서 등)")
    sub_type = Column(String(20), nullable=False, comment="보조유형 (PARTNER/DEPT/PROJECT)")
    sub_name = Column(String(100), comment="보조명")
    opening_balance = Column(Numeric(18, 2), default=0, comment="기초잔액")
    debit_total = Column(Numeric(18, 2), default=0, comment="차변합계")
    credit_total = Column(Numeric(18, 2), default=0, comment="대변합계")
    closing_balance = Column(Numeric(18, 2), default=0, comment="기말잔액")
    transaction_count = Column(Integer, default=0, comment="거래건수")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")


# ============== 원가 관리 ==============

class CostCenter(Base):
    """코스트센터 마스터"""
    __tablename__ = "erp_cost_center"

    cost_center_code = Column(String(20), primary_key=True, comment="코스트센터코드")
    cost_center_name = Column(String(100), nullable=False, comment="코스트센터명")
    parent_code = Column(String(20), ForeignKey("erp_cost_center.cost_center_code"), comment="상위코드")
    department_code = Column(String(20), comment="부서코드")
    factory_code = Column(String(20), comment="공장코드")
    responsible_person = Column(String(50), comment="책임자")
    is_active = Column(Boolean, default=True, comment="사용 여부")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")

    # Relationships
    children = relationship("CostCenter", backref="parent", remote_side=[cost_center_code])


class ProductCost(Base):
    """품목별 원가"""
    __tablename__ = "erp_product_cost"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_code = Column(String(30), nullable=False, comment="품목코드")
    fiscal_year = Column(String(4), nullable=False, comment="회계연도")
    fiscal_period = Column(String(2), nullable=False, comment="회계기간")
    cost_type = Column(Enum(CostType), nullable=False, comment="원가유형")
    standard_cost = Column(Numeric(18, 4), default=0, comment="표준원가")
    actual_cost = Column(Numeric(18, 4), default=0, comment="실제원가")
    variance = Column(Numeric(18, 4), default=0, comment="원가차이")
    variance_rate = Column(Numeric(10, 4), default=0, comment="차이율 (%)")
    production_qty = Column(Numeric(18, 4), default=0, comment="생산수량")
    total_cost = Column(Numeric(18, 2), default=0, comment="총원가")
    unit_cost = Column(Numeric(18, 4), default=0, comment="단위원가")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")


class CostAllocation(Base):
    """원가 배부"""
    __tablename__ = "erp_cost_allocation"

    id = Column(Integer, primary_key=True, autoincrement=True)
    allocation_no = Column(String(30), nullable=False, comment="배부번호")
    allocation_date = Column(Date, nullable=False, comment="배부일자")
    fiscal_year = Column(String(4), nullable=False, comment="회계연도")
    fiscal_period = Column(String(2), nullable=False, comment="회계기간")
    source_cost_center = Column(String(20), nullable=False, comment="배부원 코스트센터")
    target_cost_center = Column(String(20), nullable=False, comment="배부처 코스트센터")
    allocation_base = Column(String(20), comment="배부기준 (TIME/QTY/RATE)")
    allocation_rate = Column(Numeric(10, 6), default=0, comment="배부율")
    allocated_amount = Column(Numeric(18, 2), default=0, comment="배부금액")
    cost_type = Column(Enum(CostType), comment="원가유형")
    description = Column(Text, comment="적요")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")


# ============== 결산 관리 ==============

class FiscalPeriod(Base):
    """회계기간"""
    __tablename__ = "erp_fiscal_period"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fiscal_year = Column(String(4), nullable=False, comment="회계연도")
    fiscal_period = Column(String(2), nullable=False, comment="회계기간 (01-12)")
    period_name = Column(String(50), comment="기간명")
    start_date = Column(Date, nullable=False, comment="시작일")
    end_date = Column(Date, nullable=False, comment="종료일")
    closing_type = Column(Enum(ClosingType), default=ClosingType.MONTHLY, comment="결산유형")
    status = Column(Enum(ClosingStatus), default=ClosingStatus.OPEN, comment="결산상태")
    closed_at = Column(DateTime, comment="마감일시")
    closed_by = Column(String(50), comment="마감자")
    reopened_at = Column(DateTime, comment="재개설일시")
    reopened_by = Column(String(50), comment="재개설자")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")


class ClosingEntry(Base):
    """결산 분개"""
    __tablename__ = "erp_closing_entry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fiscal_year = Column(String(4), nullable=False, comment="회계연도")
    fiscal_period = Column(String(2), nullable=False, comment="회계기간")
    closing_type = Column(Enum(ClosingType), nullable=False, comment="결산유형")
    entry_type = Column(String(50), nullable=False, comment="분개유형 (DEPRECIATION/ACCRUAL/ADJUSTMENT)")
    voucher_no = Column(String(30), comment="전표번호")
    account_code = Column(String(20), nullable=False, comment="계정코드")
    debit_amount = Column(Numeric(18, 2), default=0, comment="차변금액")
    credit_amount = Column(Numeric(18, 2), default=0, comment="대변금액")
    description = Column(Text, comment="적요")
    is_auto = Column(Boolean, default=True, comment="자동생성 여부")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")


# ============== 재무제표 ==============

class FinancialStatement(Base):
    """재무제표"""
    __tablename__ = "erp_financial_statement"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fiscal_year = Column(String(4), nullable=False, comment="회계연도")
    fiscal_period = Column(String(2), nullable=False, comment="회계기간")
    statement_type = Column(String(20), nullable=False, comment="제표유형 (BS/IS/CF)")
    statement_name = Column(String(100), comment="제표명")
    statement_data = Column(JSON, comment="제표 데이터")
    generated_at = Column(DateTime, default=datetime.now, comment="생성일시")
    generated_by = Column(String(50), comment="생성자")
    is_final = Column(Boolean, default=False, comment="확정 여부")
    finalized_at = Column(DateTime, comment="확정일시")
    finalized_by = Column(String(50), comment="확정자")
