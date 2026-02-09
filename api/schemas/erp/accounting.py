"""
ERP Accounting Management Schemas
회계관리 Pydantic 스키마
"""
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field

from api.models.erp.accounting import (
    VoucherType, VoucherStatus, AccountType,
    CostType, ClosingType, ClosingStatus
)


# ============== 계정과목 ==============

class AccountCodeBase(BaseModel):
    """계정과목 기본 스키마"""
    account_name: str = Field(..., description="계정명")
    account_name_en: Optional[str] = Field(None, description="계정명(영문)")
    account_type: AccountType = Field(..., description="계정유형")
    parent_code: Optional[str] = Field(None, description="상위계정코드")
    level: int = Field(1, description="계정 레벨")
    is_control: bool = Field(False, description="통제계정 여부")
    is_cash: bool = Field(False, description="현금성 여부")
    is_bank: bool = Field(False, description="은행계정 여부")
    debit_credit: Optional[str] = Field(None, description="차대구분")
    budget_control: bool = Field(False, description="예산통제 여부")
    is_active: bool = Field(True, description="사용 여부")
    description: Optional[str] = Field(None, description="설명")


class AccountCodeCreate(AccountCodeBase):
    """계정과목 생성"""
    account_code: str = Field(..., description="계정코드")


class AccountCodeResponse(AccountCodeBase):
    """계정과목 응답"""
    account_code: str
    created_at: datetime
    updated_at: datetime
    children: Optional[List['AccountCodeResponse']] = None

    class Config:
        from_attributes = True


class AccountCodeTreeResponse(BaseModel):
    """계정과목 트리"""
    items: List[AccountCodeResponse]


# ============== 전표 관리 ==============

class VoucherDetailBase(BaseModel):
    """전표 상세 기본"""
    line_no: int = Field(..., description="라인번호")
    account_code: str = Field(..., description="계정코드")
    debit_amount: Decimal = Field(Decimal("0"), description="차변금액")
    credit_amount: Decimal = Field(Decimal("0"), description="대변금액")
    description: Optional[str] = Field(None, description="적요")
    partner_code: Optional[str] = Field(None, description="거래처코드")
    partner_name: Optional[str] = Field(None, description="거래처명")
    cost_center: Optional[str] = Field(None, description="코스트센터")
    project_code: Optional[str] = Field(None, description="프로젝트코드")
    tax_code: Optional[str] = Field(None, description="세금코드")
    tax_amount: Decimal = Field(Decimal("0"), description="세액")


class VoucherDetailCreate(VoucherDetailBase):
    """전표 상세 생성"""
    pass


class VoucherDetailResponse(VoucherDetailBase):
    """전표 상세 응답"""
    id: int
    voucher_no: str
    account_name: Optional[str] = Field(None, description="계정명")
    created_at: datetime

    class Config:
        from_attributes = True


class VoucherBase(BaseModel):
    """전표 기본 스키마"""
    voucher_date: date = Field(..., description="전표일자")
    voucher_type: VoucherType = Field(..., description="전표유형")
    description: Optional[str] = Field(None, description="적요")
    currency: str = Field("KRW", description="통화")
    exchange_rate: Decimal = Field(Decimal("1"), description="환율")
    reference_type: Optional[str] = Field(None, description="참조유형")
    reference_no: Optional[str] = Field(None, description="참조번호")
    department_code: Optional[str] = Field(None, description="부서코드")
    cost_center: Optional[str] = Field(None, description="코스트센터")


class VoucherCreate(VoucherBase):
    """전표 생성"""
    details: List[VoucherDetailCreate] = Field(..., description="전표 상세")


class VoucherUpdate(BaseModel):
    """전표 수정"""
    voucher_date: Optional[date] = None
    description: Optional[str] = None
    department_code: Optional[str] = None
    cost_center: Optional[str] = None
    details: Optional[List[VoucherDetailCreate]] = None


class VoucherResponse(VoucherBase):
    """전표 응답"""
    voucher_no: str
    status: VoucherStatus
    fiscal_year: str
    fiscal_period: str
    total_debit: Decimal
    total_credit: Decimal
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    posted_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancel_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    details: Optional[List[VoucherDetailResponse]] = None

    class Config:
        from_attributes = True


class VoucherListResponse(BaseModel):
    """전표 목록"""
    items: List[VoucherResponse]
    total: int
    page: int
    size: int
    total_debit: Decimal
    total_credit: Decimal


class VoucherApproval(BaseModel):
    """전표 승인/반려"""
    action: str = Field(..., description="액션 (approve/reject)")
    comment: Optional[str] = Field(None, description="코멘트")


# ============== 장부 관리 ==============

class GeneralLedgerResponse(BaseModel):
    """총계정원장 응답"""
    id: int
    fiscal_year: str
    fiscal_period: str
    account_code: str
    account_name: Optional[str] = None
    opening_balance: Decimal
    debit_total: Decimal
    credit_total: Decimal
    closing_balance: Decimal
    transaction_count: int

    class Config:
        from_attributes = True


class GeneralLedgerListResponse(BaseModel):
    """총계정원장 목록"""
    items: List[GeneralLedgerResponse]
    total: int
    summary: Dict[str, Decimal]


class LedgerTransactionResponse(BaseModel):
    """원장 거래 내역"""
    voucher_no: str
    voucher_date: date
    voucher_type: VoucherType
    account_code: str
    account_name: str
    debit_amount: Decimal
    credit_amount: Decimal
    balance: Decimal
    description: Optional[str] = None
    partner_name: Optional[str] = None


class LedgerTransactionListResponse(BaseModel):
    """원장 거래 내역 목록"""
    account_code: str
    account_name: str
    fiscal_year: str
    fiscal_period: str
    opening_balance: Decimal
    items: List[LedgerTransactionResponse]
    closing_balance: Decimal


class SubsidiaryLedgerResponse(BaseModel):
    """보조원장 응답"""
    id: int
    fiscal_year: str
    fiscal_period: str
    account_code: str
    account_name: Optional[str] = None
    sub_code: str
    sub_type: str
    sub_name: Optional[str] = None
    opening_balance: Decimal
    debit_total: Decimal
    credit_total: Decimal
    closing_balance: Decimal
    transaction_count: int

    class Config:
        from_attributes = True


# ============== 원가 관리 ==============

class CostCenterBase(BaseModel):
    """코스트센터 기본"""
    cost_center_name: str = Field(..., description="코스트센터명")
    parent_code: Optional[str] = Field(None, description="상위코드")
    department_code: Optional[str] = Field(None, description="부서코드")
    factory_code: Optional[str] = Field(None, description="공장코드")
    responsible_person: Optional[str] = Field(None, description="책임자")
    is_active: bool = Field(True, description="사용 여부")


class CostCenterCreate(CostCenterBase):
    """코스트센터 생성"""
    cost_center_code: str = Field(..., description="코스트센터코드")


class CostCenterResponse(CostCenterBase):
    """코스트센터 응답"""
    cost_center_code: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductCostResponse(BaseModel):
    """품목별 원가 응답"""
    id: int
    product_code: str
    product_name: Optional[str] = None
    fiscal_year: str
    fiscal_period: str
    cost_type: CostType
    standard_cost: Decimal
    actual_cost: Decimal
    variance: Decimal
    variance_rate: Decimal
    production_qty: Decimal
    total_cost: Decimal
    unit_cost: Decimal

    class Config:
        from_attributes = True


class ProductCostSummary(BaseModel):
    """품목별 원가 요약"""
    product_code: str
    product_name: str
    fiscal_year: str
    fiscal_period: str
    material_cost: Decimal = Field(default=Decimal("0"))
    labor_cost: Decimal = Field(default=Decimal("0"))
    overhead_cost: Decimal = Field(default=Decimal("0"))
    outsourcing_cost: Decimal = Field(default=Decimal("0"))
    total_standard_cost: Decimal = Field(default=Decimal("0"))
    total_actual_cost: Decimal = Field(default=Decimal("0"))
    total_variance: Decimal = Field(default=Decimal("0"))
    variance_rate: Decimal = Field(default=Decimal("0"))
    production_qty: Decimal
    unit_cost: Decimal


class CostAnalysisResponse(BaseModel):
    """원가 분석 응답"""
    fiscal_year: str
    fiscal_period: str
    total_material_cost: Decimal
    total_labor_cost: Decimal
    total_overhead_cost: Decimal
    total_outsourcing_cost: Decimal
    total_cost: Decimal
    by_cost_center: List[Dict[str, Any]]
    by_product: List[ProductCostSummary]
    variance_analysis: Dict[str, Any]


class CostAllocationCreate(BaseModel):
    """원가 배부 생성"""
    allocation_date: date = Field(..., description="배부일자")
    source_cost_center: str = Field(..., description="배부원 코스트센터")
    target_cost_center: str = Field(..., description="배부처 코스트센터")
    allocation_base: str = Field(..., description="배부기준")
    allocation_rate: Decimal = Field(..., description="배부율")
    allocated_amount: Decimal = Field(..., description="배부금액")
    cost_type: Optional[CostType] = Field(None, description="원가유형")
    description: Optional[str] = Field(None, description="적요")


class CostAllocationResponse(BaseModel):
    """원가 배부 응답"""
    id: int
    allocation_no: str
    allocation_date: date
    fiscal_year: str
    fiscal_period: str
    source_cost_center: str
    source_cost_center_name: Optional[str] = None
    target_cost_center: str
    target_cost_center_name: Optional[str] = None
    allocation_base: Optional[str] = None
    allocation_rate: Decimal
    allocated_amount: Decimal
    cost_type: Optional[CostType] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============== 결산 관리 ==============

class FiscalPeriodResponse(BaseModel):
    """회계기간 응답"""
    id: int
    fiscal_year: str
    fiscal_period: str
    period_name: Optional[str] = None
    start_date: date
    end_date: date
    closing_type: ClosingType
    status: ClosingStatus
    closed_at: Optional[datetime] = None
    closed_by: Optional[str] = None
    reopened_at: Optional[datetime] = None
    reopened_by: Optional[str] = None

    class Config:
        from_attributes = True


class FiscalPeriodListResponse(BaseModel):
    """회계기간 목록"""
    items: List[FiscalPeriodResponse]
    current_period: Optional[FiscalPeriodResponse] = None


class ClosingAction(BaseModel):
    """결산 액션"""
    action: str = Field(..., description="액션 (close/reopen)")
    comment: Optional[str] = Field(None, description="코멘트")


class ClosingEntryResponse(BaseModel):
    """결산 분개 응답"""
    id: int
    fiscal_year: str
    fiscal_period: str
    closing_type: ClosingType
    entry_type: str
    voucher_no: Optional[str] = None
    account_code: str
    account_name: Optional[str] = None
    debit_amount: Decimal
    credit_amount: Decimal
    description: Optional[str] = None
    is_auto: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ClosingSummary(BaseModel):
    """결산 요약"""
    fiscal_year: str
    fiscal_period: str
    closing_type: ClosingType
    status: ClosingStatus
    total_vouchers: int
    total_debit: Decimal
    total_credit: Decimal
    closing_entries: List[ClosingEntryResponse]
    validation_results: Dict[str, Any]


# ============== 재무제표 ==============

class FinancialStatementResponse(BaseModel):
    """재무제표 응답"""
    id: int
    fiscal_year: str
    fiscal_period: str
    statement_type: str
    statement_name: Optional[str] = None
    statement_data: Optional[Dict[str, Any]] = None
    generated_at: datetime
    generated_by: Optional[str] = None
    is_final: bool
    finalized_at: Optional[datetime] = None
    finalized_by: Optional[str] = None

    class Config:
        from_attributes = True


class BalanceSheetResponse(BaseModel):
    """재무상태표"""
    fiscal_year: str
    fiscal_period: str
    as_of_date: date
    assets: Dict[str, Any]
    liabilities: Dict[str, Any]
    equity: Dict[str, Any]
    total_assets: Decimal
    total_liabilities: Decimal
    total_equity: Decimal


class IncomeStatementResponse(BaseModel):
    """손익계산서"""
    fiscal_year: str
    fiscal_period: str
    period_start: date
    period_end: date
    revenue: Dict[str, Any]
    cost_of_sales: Dict[str, Any]
    gross_profit: Decimal
    operating_expenses: Dict[str, Any]
    operating_income: Decimal
    non_operating: Dict[str, Any]
    income_before_tax: Decimal
    tax_expense: Decimal
    net_income: Decimal


class TrialBalanceResponse(BaseModel):
    """시산표"""
    fiscal_year: str
    fiscal_period: str
    as_of_date: date
    items: List[Dict[str, Any]]
    total_debit: Decimal
    total_credit: Decimal
    is_balanced: bool
