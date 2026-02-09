"""
ERP Accounting Management API Router
회계관리 - 전표, 장부, 원가, 결산, 재무제표
"""
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException

from api.schemas.erp.accounting import (
    AccountCodeCreate, AccountCodeResponse, AccountCodeTreeResponse,
    VoucherCreate, VoucherUpdate, VoucherResponse, VoucherListResponse,
    VoucherDetailResponse, VoucherApproval,
    GeneralLedgerResponse, GeneralLedgerListResponse,
    LedgerTransactionResponse, LedgerTransactionListResponse,
    SubsidiaryLedgerResponse,
    CostCenterCreate, CostCenterResponse,
    ProductCostResponse, ProductCostSummary, CostAnalysisResponse,
    CostAllocationCreate, CostAllocationResponse,
    FiscalPeriodResponse, FiscalPeriodListResponse, ClosingAction,
    ClosingEntryResponse, ClosingSummary,
    FinancialStatementResponse, BalanceSheetResponse, IncomeStatementResponse,
    TrialBalanceResponse
)
from api.models.erp.accounting import (
    VoucherType, VoucherStatus, AccountType,
    CostType, ClosingType, ClosingStatus
)

router = APIRouter(prefix="/accounting", tags=["ERP Accounting"])


# ============== 계정과목 관리 ==============

@router.get("/accounts", response_model=AccountCodeTreeResponse, summary="계정과목 트리 조회")
async def get_account_tree(
    account_type: Optional[AccountType] = Query(None, description="계정유형 필터"),
    is_active: Optional[bool] = Query(None, description="사용 여부")
):
    """계정과목 트리를 조회합니다."""
    mock_accounts = [
        {
            "account_code": "1",
            "account_name": "자산",
            "account_name_en": "Assets",
            "account_type": AccountType.ASSET,
            "parent_code": None,
            "level": 1,
            "is_control": False,
            "is_cash": False,
            "is_bank": False,
            "debit_credit": "D",
            "budget_control": False,
            "is_active": True,
            "description": "자산계정",
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30),
            "children": [
                {
                    "account_code": "11",
                    "account_name": "유동자산",
                    "account_name_en": "Current Assets",
                    "account_type": AccountType.ASSET,
                    "parent_code": "1",
                    "level": 2,
                    "is_control": False,
                    "is_cash": False,
                    "is_bank": False,
                    "debit_credit": "D",
                    "budget_control": False,
                    "is_active": True,
                    "description": None,
                    "created_at": datetime.now() - timedelta(days=365),
                    "updated_at": datetime.now() - timedelta(days=30),
                    "children": [
                        {
                            "account_code": "1101",
                            "account_name": "현금",
                            "account_name_en": "Cash",
                            "account_type": AccountType.ASSET,
                            "parent_code": "11",
                            "level": 3,
                            "is_control": False,
                            "is_cash": True,
                            "is_bank": False,
                            "debit_credit": "D",
                            "budget_control": False,
                            "is_active": True,
                            "description": None,
                            "created_at": datetime.now() - timedelta(days=365),
                            "updated_at": datetime.now() - timedelta(days=30),
                            "children": None
                        },
                        {
                            "account_code": "1102",
                            "account_name": "보통예금",
                            "account_name_en": "Bank Deposits",
                            "account_type": AccountType.ASSET,
                            "parent_code": "11",
                            "level": 3,
                            "is_control": False,
                            "is_cash": True,
                            "is_bank": True,
                            "debit_credit": "D",
                            "budget_control": False,
                            "is_active": True,
                            "description": None,
                            "created_at": datetime.now() - timedelta(days=365),
                            "updated_at": datetime.now() - timedelta(days=30),
                            "children": None
                        },
                        {
                            "account_code": "1103",
                            "account_name": "외상매출금",
                            "account_name_en": "Accounts Receivable",
                            "account_type": AccountType.ASSET,
                            "parent_code": "11",
                            "level": 3,
                            "is_control": True,
                            "is_cash": False,
                            "is_bank": False,
                            "debit_credit": "D",
                            "budget_control": False,
                            "is_active": True,
                            "description": "거래처별 관리",
                            "created_at": datetime.now() - timedelta(days=365),
                            "updated_at": datetime.now() - timedelta(days=30),
                            "children": None
                        }
                    ]
                }
            ]
        },
        {
            "account_code": "2",
            "account_name": "부채",
            "account_name_en": "Liabilities",
            "account_type": AccountType.LIABILITY,
            "parent_code": None,
            "level": 1,
            "is_control": False,
            "is_cash": False,
            "is_bank": False,
            "debit_credit": "C",
            "budget_control": False,
            "is_active": True,
            "description": "부채계정",
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30),
            "children": []
        },
        {
            "account_code": "4",
            "account_name": "수익",
            "account_name_en": "Revenue",
            "account_type": AccountType.REVENUE,
            "parent_code": None,
            "level": 1,
            "is_control": False,
            "is_cash": False,
            "is_bank": False,
            "debit_credit": "C",
            "budget_control": False,
            "is_active": True,
            "description": "수익계정",
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30),
            "children": []
        },
        {
            "account_code": "5",
            "account_name": "비용",
            "account_name_en": "Expenses",
            "account_type": AccountType.EXPENSE,
            "parent_code": None,
            "level": 1,
            "is_control": False,
            "is_cash": False,
            "is_bank": False,
            "debit_credit": "D",
            "budget_control": True,
            "is_active": True,
            "description": "비용계정",
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30),
            "children": []
        }
    ]

    return AccountCodeTreeResponse(items=[AccountCodeResponse(**a) for a in mock_accounts])


@router.get("/accounts/{account_code}", response_model=AccountCodeResponse, summary="계정과목 상세 조회")
async def get_account(account_code: str):
    """계정과목 상세 정보를 조회합니다."""
    return AccountCodeResponse(
        account_code=account_code,
        account_name="보통예금",
        account_name_en="Bank Deposits",
        account_type=AccountType.ASSET,
        parent_code="11",
        level=3,
        is_control=False,
        is_cash=True,
        is_bank=True,
        debit_credit="D",
        budget_control=False,
        is_active=True,
        description=None,
        created_at=datetime.now() - timedelta(days=365),
        updated_at=datetime.now() - timedelta(days=30),
        children=None
    )


@router.post("/accounts", response_model=AccountCodeResponse, summary="계정과목 생성")
async def create_account(data: AccountCodeCreate):
    """새로운 계정과목을 생성합니다."""
    return AccountCodeResponse(
        **data.model_dump(),
        created_at=datetime.now(),
        updated_at=datetime.now(),
        children=None
    )


# ============== 전표 관리 ==============

@router.get("/vouchers", response_model=VoucherListResponse, summary="전표 목록 조회")
async def get_vouchers(
    voucher_no: Optional[str] = Query(None, description="전표번호"),
    voucher_type: Optional[VoucherType] = Query(None, description="전표유형"),
    status: Optional[VoucherStatus] = Query(None, description="상태"),
    fiscal_year: Optional[str] = Query(None, description="회계연도"),
    fiscal_period: Optional[str] = Query(None, description="회계기간"),
    start_date: Optional[date] = Query(None, description="시작일"),
    end_date: Optional[date] = Query(None, description="종료일"),
    account_code: Optional[str] = Query(None, description="계정코드"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기")
):
    """전표 목록을 조회합니다."""
    mock_vouchers = [
        {
            "voucher_no": "VCH-2025-01-0001",
            "voucher_date": date(2025, 1, 15),
            "voucher_type": VoucherType.SALES,
            "status": VoucherStatus.POSTED,
            "fiscal_year": "2025",
            "fiscal_period": "01",
            "description": "삼성전자 매출",
            "total_debit": Decimal("55000000"),
            "total_credit": Decimal("55000000"),
            "currency": "KRW",
            "exchange_rate": Decimal("1"),
            "reference_type": "SALES_ORDER",
            "reference_no": "SO-2025-0001",
            "department_code": "SALES",
            "cost_center": "CC-SALES",
            "created_by": "admin",
            "approved_by": "finance_mgr",
            "approved_at": datetime.now() - timedelta(days=10),
            "posted_at": datetime.now() - timedelta(days=9),
            "cancelled_at": None,
            "cancel_reason": None,
            "created_at": datetime.now() - timedelta(days=15),
            "updated_at": datetime.now() - timedelta(days=9),
            "details": None
        },
        {
            "voucher_no": "VCH-2025-01-0002",
            "voucher_date": date(2025, 1, 20),
            "voucher_type": VoucherType.PURCHASE,
            "status": VoucherStatus.POSTED,
            "fiscal_year": "2025",
            "fiscal_period": "01",
            "description": "원자재 구매 (칩 부품)",
            "total_debit": Decimal("12500000"),
            "total_credit": Decimal("12500000"),
            "currency": "KRW",
            "exchange_rate": Decimal("1"),
            "reference_type": "PURCHASE_ORDER",
            "reference_no": "PO-2025-0015",
            "department_code": "PURCHASE",
            "cost_center": "CC-PROD",
            "created_by": "purchase_staff",
            "approved_by": "finance_mgr",
            "approved_at": datetime.now() - timedelta(days=8),
            "posted_at": datetime.now() - timedelta(days=7),
            "cancelled_at": None,
            "cancel_reason": None,
            "created_at": datetime.now() - timedelta(days=10),
            "updated_at": datetime.now() - timedelta(days=7),
            "details": None
        },
        {
            "voucher_no": "VCH-2025-01-0003",
            "voucher_date": date(2025, 1, 25),
            "voucher_type": VoucherType.PAYMENT,
            "status": VoucherStatus.APPROVED,
            "fiscal_year": "2025",
            "fiscal_period": "01",
            "description": "급여 지급",
            "total_debit": Decimal("180000000"),
            "total_credit": Decimal("180000000"),
            "currency": "KRW",
            "exchange_rate": Decimal("1"),
            "reference_type": "PAYROLL",
            "reference_no": "PAY-2025-01",
            "department_code": "HR",
            "cost_center": None,
            "created_by": "hr_staff",
            "approved_by": "finance_mgr",
            "approved_at": datetime.now() - timedelta(days=3),
            "posted_at": None,
            "cancelled_at": None,
            "cancel_reason": None,
            "created_at": datetime.now() - timedelta(days=5),
            "updated_at": datetime.now() - timedelta(days=3),
            "details": None
        },
        {
            "voucher_no": "VCH-2025-01-0004",
            "voucher_date": date(2025, 1, 28),
            "voucher_type": VoucherType.TRANSFER,
            "status": VoucherStatus.PENDING,
            "fiscal_year": "2025",
            "fiscal_period": "01",
            "description": "감가상각비 계상",
            "total_debit": Decimal("15000000"),
            "total_credit": Decimal("15000000"),
            "currency": "KRW",
            "exchange_rate": Decimal("1"),
            "reference_type": "CLOSING",
            "reference_no": "CLS-2025-01",
            "department_code": "FINANCE",
            "cost_center": None,
            "created_by": "finance_staff",
            "approved_by": None,
            "approved_at": None,
            "posted_at": None,
            "cancelled_at": None,
            "cancel_reason": None,
            "created_at": datetime.now() - timedelta(days=2),
            "updated_at": datetime.now() - timedelta(days=2),
            "details": None
        }
    ]

    total = len(mock_vouchers)
    total_debit = sum(v["total_debit"] for v in mock_vouchers)
    total_credit = sum(v["total_credit"] for v in mock_vouchers)

    return VoucherListResponse(
        items=[VoucherResponse(**v) for v in mock_vouchers],
        total=total,
        page=page,
        size=size,
        total_debit=total_debit,
        total_credit=total_credit
    )


@router.get("/vouchers/{voucher_no}", response_model=VoucherResponse, summary="전표 상세 조회")
async def get_voucher(voucher_no: str):
    """전표 상세 정보를 조회합니다."""
    mock_details = [
        {
            "id": 1,
            "voucher_no": voucher_no,
            "line_no": 1,
            "account_code": "1103",
            "account_name": "외상매출금",
            "debit_amount": Decimal("55000000"),
            "credit_amount": Decimal("0"),
            "description": "삼성전자 매출채권",
            "partner_code": "C001",
            "partner_name": "삼성전자",
            "cost_center": None,
            "project_code": None,
            "tax_code": None,
            "tax_amount": Decimal("0"),
            "created_at": datetime.now() - timedelta(days=15)
        },
        {
            "id": 2,
            "voucher_no": voucher_no,
            "line_no": 2,
            "account_code": "4101",
            "account_name": "제품매출",
            "debit_amount": Decimal("0"),
            "credit_amount": Decimal("50000000"),
            "description": "스마트폰 메인보드 매출",
            "partner_code": "C001",
            "partner_name": "삼성전자",
            "cost_center": "CC-SALES",
            "project_code": None,
            "tax_code": "VAT10",
            "tax_amount": Decimal("0"),
            "created_at": datetime.now() - timedelta(days=15)
        },
        {
            "id": 3,
            "voucher_no": voucher_no,
            "line_no": 3,
            "account_code": "2501",
            "account_name": "부가세예수금",
            "debit_amount": Decimal("0"),
            "credit_amount": Decimal("5000000"),
            "description": "부가가치세",
            "partner_code": None,
            "partner_name": None,
            "cost_center": None,
            "project_code": None,
            "tax_code": "VAT10",
            "tax_amount": Decimal("5000000"),
            "created_at": datetime.now() - timedelta(days=15)
        }
    ]

    return VoucherResponse(
        voucher_no=voucher_no,
        voucher_date=date(2025, 1, 15),
        voucher_type=VoucherType.SALES,
        status=VoucherStatus.POSTED,
        fiscal_year="2025",
        fiscal_period="01",
        description="삼성전자 매출",
        total_debit=Decimal("55000000"),
        total_credit=Decimal("55000000"),
        currency="KRW",
        exchange_rate=Decimal("1"),
        reference_type="SALES_ORDER",
        reference_no="SO-2025-0001",
        department_code="SALES",
        cost_center="CC-SALES",
        created_by="admin",
        approved_by="finance_mgr",
        approved_at=datetime.now() - timedelta(days=10),
        posted_at=datetime.now() - timedelta(days=9),
        cancelled_at=None,
        cancel_reason=None,
        created_at=datetime.now() - timedelta(days=15),
        updated_at=datetime.now() - timedelta(days=9),
        details=[VoucherDetailResponse(**d) for d in mock_details]
    )


@router.post("/vouchers", response_model=VoucherResponse, summary="전표 생성")
async def create_voucher(data: VoucherCreate):
    """새로운 전표를 생성합니다."""
    voucher_no = f"VCH-{datetime.now().strftime('%Y-%m')}-{datetime.now().strftime('%H%M%S')}"

    total_debit = sum(d.debit_amount for d in data.details)
    total_credit = sum(d.credit_amount for d in data.details)

    if total_debit != total_credit:
        raise HTTPException(status_code=400, detail="차변합계와 대변합계가 일치하지 않습니다.")

    return VoucherResponse(
        voucher_no=voucher_no,
        voucher_date=data.voucher_date,
        voucher_type=data.voucher_type,
        status=VoucherStatus.DRAFT,
        fiscal_year=str(data.voucher_date.year),
        fiscal_period=f"{data.voucher_date.month:02d}",
        description=data.description,
        total_debit=total_debit,
        total_credit=total_credit,
        currency=data.currency,
        exchange_rate=data.exchange_rate,
        reference_type=data.reference_type,
        reference_no=data.reference_no,
        department_code=data.department_code,
        cost_center=data.cost_center,
        created_by="current_user",
        approved_by=None,
        approved_at=None,
        posted_at=None,
        cancelled_at=None,
        cancel_reason=None,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        details=None
    )


@router.put("/vouchers/{voucher_no}", response_model=VoucherResponse, summary="전표 수정")
async def update_voucher(voucher_no: str, data: VoucherUpdate):
    """전표를 수정합니다."""
    return VoucherResponse(
        voucher_no=voucher_no,
        voucher_date=data.voucher_date or date.today(),
        voucher_type=VoucherType.TRANSFER,
        status=VoucherStatus.DRAFT,
        fiscal_year="2025",
        fiscal_period="01",
        description=data.description,
        total_debit=Decimal("10000000"),
        total_credit=Decimal("10000000"),
        currency="KRW",
        exchange_rate=Decimal("1"),
        reference_type=None,
        reference_no=None,
        department_code=data.department_code,
        cost_center=data.cost_center,
        created_by="current_user",
        approved_by=None,
        approved_at=None,
        posted_at=None,
        cancelled_at=None,
        cancel_reason=None,
        created_at=datetime.now() - timedelta(days=5),
        updated_at=datetime.now(),
        details=None
    )


@router.post("/vouchers/{voucher_no}/approve", summary="전표 승인/반려")
async def approve_voucher(voucher_no: str, data: VoucherApproval):
    """전표를 승인하거나 반려합니다."""
    if data.action == "approve":
        return {
            "message": f"전표 {voucher_no}이(가) 승인되었습니다.",
            "status": VoucherStatus.APPROVED,
            "approved_at": datetime.now()
        }
    else:
        return {
            "message": f"전표 {voucher_no}이(가) 반려되었습니다.",
            "status": VoucherStatus.REJECTED,
            "comment": data.comment
        }


@router.post("/vouchers/{voucher_no}/post", summary="전표 전기")
async def post_voucher(voucher_no: str):
    """전표를 전기합니다."""
    return {
        "message": f"전표 {voucher_no}이(가) 전기되었습니다.",
        "status": VoucherStatus.POSTED,
        "posted_at": datetime.now()
    }


@router.post("/vouchers/{voucher_no}/cancel", summary="전표 취소")
async def cancel_voucher(voucher_no: str, reason: str = Query(..., description="취소 사유")):
    """전표를 취소합니다."""
    return {
        "message": f"전표 {voucher_no}이(가) 취소되었습니다.",
        "status": VoucherStatus.CANCELLED,
        "cancel_reason": reason,
        "cancelled_at": datetime.now()
    }


# ============== 장부 관리 ==============

@router.get("/ledger/general", response_model=GeneralLedgerListResponse, summary="총계정원장 조회")
async def get_general_ledger(
    fiscal_year: str = Query(..., description="회계연도"),
    fiscal_period: Optional[str] = Query(None, description="회계기간"),
    account_code: Optional[str] = Query(None, description="계정코드")
):
    """총계정원장을 조회합니다."""
    mock_ledger = [
        {
            "id": 1,
            "fiscal_year": fiscal_year,
            "fiscal_period": fiscal_period or "01",
            "account_code": "1101",
            "account_name": "현금",
            "opening_balance": Decimal("50000000"),
            "debit_total": Decimal("120000000"),
            "credit_total": Decimal("80000000"),
            "closing_balance": Decimal("90000000"),
            "transaction_count": 45
        },
        {
            "id": 2,
            "fiscal_year": fiscal_year,
            "fiscal_period": fiscal_period or "01",
            "account_code": "1102",
            "account_name": "보통예금",
            "opening_balance": Decimal("500000000"),
            "debit_total": Decimal("850000000"),
            "credit_total": Decimal("720000000"),
            "closing_balance": Decimal("630000000"),
            "transaction_count": 156
        },
        {
            "id": 3,
            "fiscal_year": fiscal_year,
            "fiscal_period": fiscal_period or "01",
            "account_code": "1103",
            "account_name": "외상매출금",
            "opening_balance": Decimal("320000000"),
            "debit_total": Decimal("1200000000"),
            "credit_total": Decimal("980000000"),
            "closing_balance": Decimal("540000000"),
            "transaction_count": 89
        },
        {
            "id": 4,
            "fiscal_year": fiscal_year,
            "fiscal_period": fiscal_period or "01",
            "account_code": "4101",
            "account_name": "제품매출",
            "opening_balance": Decimal("0"),
            "debit_total": Decimal("0"),
            "credit_total": Decimal("1500000000"),
            "closing_balance": Decimal("1500000000"),
            "transaction_count": 78
        }
    ]

    summary = {
        "total_debit": sum(l["debit_total"] for l in mock_ledger),
        "total_credit": sum(l["credit_total"] for l in mock_ledger)
    }

    return GeneralLedgerListResponse(
        items=[GeneralLedgerResponse(**l) for l in mock_ledger],
        total=len(mock_ledger),
        summary=summary
    )


@router.get("/ledger/general/{account_code}/transactions", response_model=LedgerTransactionListResponse, summary="계정별 거래 내역")
async def get_ledger_transactions(
    account_code: str,
    fiscal_year: str = Query(..., description="회계연도"),
    fiscal_period: str = Query(..., description="회계기간")
):
    """계정별 거래 내역을 조회합니다."""
    mock_transactions = [
        {
            "voucher_no": "VCH-2025-01-0001",
            "voucher_date": date(2025, 1, 5),
            "voucher_type": VoucherType.RECEIPT,
            "account_code": account_code,
            "account_name": "보통예금",
            "debit_amount": Decimal("50000000"),
            "credit_amount": Decimal("0"),
            "balance": Decimal("550000000"),
            "description": "삼성전자 매출대금 입금",
            "partner_name": "삼성전자"
        },
        {
            "voucher_no": "VCH-2025-01-0010",
            "voucher_date": date(2025, 1, 10),
            "voucher_type": VoucherType.PAYMENT,
            "account_code": account_code,
            "account_name": "보통예금",
            "debit_amount": Decimal("0"),
            "credit_amount": Decimal("25000000"),
            "balance": Decimal("525000000"),
            "description": "부품 구매대금 지급",
            "partner_name": "삼성SDI"
        },
        {
            "voucher_no": "VCH-2025-01-0025",
            "voucher_date": date(2025, 1, 25),
            "voucher_type": VoucherType.PAYMENT,
            "account_code": account_code,
            "account_name": "보통예금",
            "debit_amount": Decimal("0"),
            "credit_amount": Decimal("180000000"),
            "balance": Decimal("345000000"),
            "description": "1월 급여 지급",
            "partner_name": None
        }
    ]

    return LedgerTransactionListResponse(
        account_code=account_code,
        account_name="보통예금",
        fiscal_year=fiscal_year,
        fiscal_period=fiscal_period,
        opening_balance=Decimal("500000000"),
        items=[LedgerTransactionResponse(**t) for t in mock_transactions],
        closing_balance=Decimal("345000000")
    )


@router.get("/ledger/subsidiary", response_model=List[SubsidiaryLedgerResponse], summary="보조원장 조회")
async def get_subsidiary_ledger(
    fiscal_year: str = Query(..., description="회계연도"),
    fiscal_period: str = Query(..., description="회계기간"),
    account_code: str = Query(..., description="계정코드"),
    sub_type: str = Query(..., description="보조유형 (PARTNER/DEPT/PROJECT)")
):
    """보조원장을 조회합니다."""
    mock_subsidiary = [
        {
            "id": 1,
            "fiscal_year": fiscal_year,
            "fiscal_period": fiscal_period,
            "account_code": account_code,
            "account_name": "외상매출금",
            "sub_code": "C001",
            "sub_type": sub_type,
            "sub_name": "삼성전자",
            "opening_balance": Decimal("120000000"),
            "debit_total": Decimal("550000000"),
            "credit_total": Decimal("480000000"),
            "closing_balance": Decimal("190000000"),
            "transaction_count": 25
        },
        {
            "id": 2,
            "fiscal_year": fiscal_year,
            "fiscal_period": fiscal_period,
            "account_code": account_code,
            "account_name": "외상매출금",
            "sub_code": "C002",
            "sub_type": sub_type,
            "sub_name": "LG전자",
            "opening_balance": Decimal("80000000"),
            "debit_total": Decimal("320000000"),
            "credit_total": Decimal("290000000"),
            "closing_balance": Decimal("110000000"),
            "transaction_count": 18
        },
        {
            "id": 3,
            "fiscal_year": fiscal_year,
            "fiscal_period": fiscal_period,
            "account_code": account_code,
            "account_name": "외상매출금",
            "sub_code": "C003",
            "sub_type": sub_type,
            "sub_name": "SK하이닉스",
            "opening_balance": Decimal("65000000"),
            "debit_total": Decimal("180000000"),
            "credit_total": Decimal("150000000"),
            "closing_balance": Decimal("95000000"),
            "transaction_count": 12
        }
    ]

    return [SubsidiaryLedgerResponse(**s) for s in mock_subsidiary]


# ============== 원가 관리 ==============

@router.get("/cost-centers", response_model=List[CostCenterResponse], summary="코스트센터 목록")
async def get_cost_centers(
    factory_code: Optional[str] = Query(None, description="공장코드 필터"),
    is_active: Optional[bool] = Query(None, description="사용 여부")
):
    """코스트센터 목록을 조회합니다."""
    mock_cost_centers = [
        {
            "cost_center_code": "CC-PROD-SMT",
            "cost_center_name": "SMT 생산부",
            "parent_code": None,
            "department_code": "PROD",
            "factory_code": "F001",
            "responsible_person": "김생산",
            "is_active": True,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30)
        },
        {
            "cost_center_code": "CC-PROD-ASSY",
            "cost_center_name": "조립 생산부",
            "parent_code": None,
            "department_code": "PROD",
            "factory_code": "F001",
            "responsible_person": "이조립",
            "is_active": True,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30)
        },
        {
            "cost_center_code": "CC-QC",
            "cost_center_name": "품질관리부",
            "parent_code": None,
            "department_code": "QC",
            "factory_code": "F001",
            "responsible_person": "박품질",
            "is_active": True,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30)
        },
        {
            "cost_center_code": "CC-ADMIN",
            "cost_center_name": "관리부",
            "parent_code": None,
            "department_code": "ADMIN",
            "factory_code": None,
            "responsible_person": "최관리",
            "is_active": True,
            "created_at": datetime.now() - timedelta(days=365),
            "updated_at": datetime.now() - timedelta(days=30)
        }
    ]

    return [CostCenterResponse(**cc) for cc in mock_cost_centers]


@router.get("/cost/products", response_model=List[ProductCostSummary], summary="품목별 원가 조회")
async def get_product_costs(
    fiscal_year: str = Query(..., description="회계연도"),
    fiscal_period: str = Query(..., description="회계기간"),
    product_code: Optional[str] = Query(None, description="품목코드")
):
    """품목별 원가를 조회합니다."""
    mock_product_costs = [
        {
            "product_code": "PROD-SMT-001",
            "product_name": "스마트폰 메인보드 A타입",
            "fiscal_year": fiscal_year,
            "fiscal_period": fiscal_period,
            "material_cost": Decimal("15000"),
            "labor_cost": Decimal("3500"),
            "overhead_cost": Decimal("2800"),
            "outsourcing_cost": Decimal("1200"),
            "total_standard_cost": Decimal("22000"),
            "total_actual_cost": Decimal("22500"),
            "total_variance": Decimal("500"),
            "variance_rate": Decimal("2.27"),
            "production_qty": Decimal("15000"),
            "unit_cost": Decimal("22500")
        },
        {
            "product_code": "PROD-SMT-002",
            "product_name": "스마트폰 메인보드 B타입",
            "fiscal_year": fiscal_year,
            "fiscal_period": fiscal_period,
            "material_cost": Decimal("18000"),
            "labor_cost": Decimal("4000"),
            "overhead_cost": Decimal("3200"),
            "outsourcing_cost": Decimal("1500"),
            "total_standard_cost": Decimal("26000"),
            "total_actual_cost": Decimal("26700"),
            "total_variance": Decimal("700"),
            "variance_rate": Decimal("2.69"),
            "production_qty": Decimal("12000"),
            "unit_cost": Decimal("26700")
        },
        {
            "product_code": "PROD-LED-001",
            "product_name": "LED 드라이버 보드",
            "fiscal_year": fiscal_year,
            "fiscal_period": fiscal_period,
            "material_cost": Decimal("8500"),
            "labor_cost": Decimal("2000"),
            "overhead_cost": Decimal("1500"),
            "outsourcing_cost": Decimal("500"),
            "total_standard_cost": Decimal("12500"),
            "total_actual_cost": Decimal("12200"),
            "total_variance": Decimal("-300"),
            "variance_rate": Decimal("-2.40"),
            "production_qty": Decimal("25000"),
            "unit_cost": Decimal("12200")
        }
    ]

    return [ProductCostSummary(**pc) for pc in mock_product_costs]


@router.get("/cost/analysis", response_model=CostAnalysisResponse, summary="원가 분석")
async def get_cost_analysis(
    fiscal_year: str = Query(..., description="회계연도"),
    fiscal_period: str = Query(..., description="회계기간")
):
    """원가 분석 데이터를 조회합니다."""
    return CostAnalysisResponse(
        fiscal_year=fiscal_year,
        fiscal_period=fiscal_period,
        total_material_cost=Decimal("850000000"),
        total_labor_cost=Decimal("180000000"),
        total_overhead_cost=Decimal("120000000"),
        total_outsourcing_cost=Decimal("45000000"),
        total_cost=Decimal("1195000000"),
        by_cost_center=[
            {"cost_center": "CC-PROD-SMT", "name": "SMT 생산부", "amount": Decimal("720000000"), "ratio": 60.2},
            {"cost_center": "CC-PROD-ASSY", "name": "조립 생산부", "amount": Decimal("350000000"), "ratio": 29.3},
            {"cost_center": "CC-QC", "name": "품질관리부", "amount": Decimal("75000000"), "ratio": 6.3},
            {"cost_center": "CC-ADMIN", "name": "관리부", "amount": Decimal("50000000"), "ratio": 4.2}
        ],
        by_product=[
            ProductCostSummary(
                product_code="PROD-SMT-001",
                product_name="스마트폰 메인보드 A타입",
                fiscal_year=fiscal_year,
                fiscal_period=fiscal_period,
                material_cost=Decimal("15000"),
                labor_cost=Decimal("3500"),
                overhead_cost=Decimal("2800"),
                outsourcing_cost=Decimal("1200"),
                total_standard_cost=Decimal("22000"),
                total_actual_cost=Decimal("22500"),
                total_variance=Decimal("500"),
                variance_rate=Decimal("2.27"),
                production_qty=Decimal("15000"),
                unit_cost=Decimal("22500")
            )
        ],
        variance_analysis={
            "total_variance": Decimal("15000000"),
            "variance_rate": Decimal("1.27"),
            "favorable": [
                {"item": "LED 드라이버 보드", "variance": Decimal("-7500000"), "reason": "자재비 절감"}
            ],
            "unfavorable": [
                {"item": "스마트폰 메인보드 A타입", "variance": Decimal("7500000"), "reason": "노무비 상승"},
                {"item": "스마트폰 메인보드 B타입", "variance": Decimal("8400000"), "reason": "외주비 증가"}
            ]
        }
    )


@router.post("/cost/allocations", response_model=CostAllocationResponse, summary="원가 배부")
async def create_cost_allocation(data: CostAllocationCreate):
    """원가를 배부합니다."""
    allocation_no = f"ALLOC-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    return CostAllocationResponse(
        id=1,
        allocation_no=allocation_no,
        allocation_date=data.allocation_date,
        fiscal_year=str(data.allocation_date.year),
        fiscal_period=f"{data.allocation_date.month:02d}",
        source_cost_center=data.source_cost_center,
        source_cost_center_name="관리부",
        target_cost_center=data.target_cost_center,
        target_cost_center_name="SMT 생산부",
        allocation_base=data.allocation_base,
        allocation_rate=data.allocation_rate,
        allocated_amount=data.allocated_amount,
        cost_type=data.cost_type,
        description=data.description,
        created_at=datetime.now()
    )


# ============== 결산 관리 ==============

@router.get("/fiscal-periods", response_model=FiscalPeriodListResponse, summary="회계기간 목록")
async def get_fiscal_periods(
    fiscal_year: str = Query(..., description="회계연도")
):
    """회계기간 목록을 조회합니다."""
    mock_periods = []
    for month in range(1, 13):
        start = date(int(fiscal_year), month, 1)
        if month == 12:
            end = date(int(fiscal_year), 12, 31)
        else:
            end = date(int(fiscal_year), month + 1, 1) - timedelta(days=1)

        status = ClosingStatus.CLOSED if month < datetime.now().month else ClosingStatus.OPEN

        mock_periods.append({
            "id": month,
            "fiscal_year": fiscal_year,
            "fiscal_period": f"{month:02d}",
            "period_name": f"{fiscal_year}년 {month}월",
            "start_date": start,
            "end_date": end,
            "closing_type": ClosingType.MONTHLY,
            "status": status,
            "closed_at": datetime.now() - timedelta(days=30) if status == ClosingStatus.CLOSED else None,
            "closed_by": "finance_mgr" if status == ClosingStatus.CLOSED else None,
            "reopened_at": None,
            "reopened_by": None
        })

    current = next((p for p in mock_periods if p["status"] == ClosingStatus.OPEN), None)

    return FiscalPeriodListResponse(
        items=[FiscalPeriodResponse(**p) for p in mock_periods],
        current_period=FiscalPeriodResponse(**current) if current else None
    )


@router.post("/fiscal-periods/{fiscal_year}/{fiscal_period}/close", summary="회계기간 마감")
async def close_fiscal_period(fiscal_year: str, fiscal_period: str, data: ClosingAction):
    """회계기간을 마감합니다."""
    if data.action == "close":
        return {
            "message": f"{fiscal_year}년 {fiscal_period}월 결산이 완료되었습니다.",
            "status": ClosingStatus.CLOSED,
            "closed_at": datetime.now()
        }
    else:
        return {
            "message": f"{fiscal_year}년 {fiscal_period}월 결산이 재개설되었습니다.",
            "status": ClosingStatus.REOPENED,
            "reopened_at": datetime.now()
        }


@router.get("/closing/{fiscal_year}/{fiscal_period}/summary", response_model=ClosingSummary, summary="결산 요약")
async def get_closing_summary(fiscal_year: str, fiscal_period: str):
    """결산 요약 정보를 조회합니다."""
    mock_entries = [
        {
            "id": 1,
            "fiscal_year": fiscal_year,
            "fiscal_period": fiscal_period,
            "closing_type": ClosingType.MONTHLY,
            "entry_type": "DEPRECIATION",
            "voucher_no": "VCH-CLS-001",
            "account_code": "5301",
            "account_name": "감가상각비",
            "debit_amount": Decimal("15000000"),
            "credit_amount": Decimal("0"),
            "description": "건물 감가상각",
            "is_auto": True,
            "created_at": datetime.now() - timedelta(days=5)
        },
        {
            "id": 2,
            "fiscal_year": fiscal_year,
            "fiscal_period": fiscal_period,
            "closing_type": ClosingType.MONTHLY,
            "entry_type": "DEPRECIATION",
            "voucher_no": "VCH-CLS-001",
            "account_code": "1251",
            "account_name": "감가상각누계액",
            "debit_amount": Decimal("0"),
            "credit_amount": Decimal("15000000"),
            "description": "건물 감가상각",
            "is_auto": True,
            "created_at": datetime.now() - timedelta(days=5)
        }
    ]

    return ClosingSummary(
        fiscal_year=fiscal_year,
        fiscal_period=fiscal_period,
        closing_type=ClosingType.MONTHLY,
        status=ClosingStatus.IN_PROGRESS,
        total_vouchers=156,
        total_debit=Decimal("2500000000"),
        total_credit=Decimal("2500000000"),
        closing_entries=[ClosingEntryResponse(**e) for e in mock_entries],
        validation_results={
            "is_balanced": True,
            "unposted_vouchers": 2,
            "pending_approvals": 1,
            "warnings": ["미결 전표 2건 존재", "승인대기 전표 1건 존재"],
            "can_close": False
        }
    )


# ============== 재무제표 ==============

@router.get("/statements/balance-sheet", response_model=BalanceSheetResponse, summary="재무상태표")
async def get_balance_sheet(
    fiscal_year: str = Query(..., description="회계연도"),
    fiscal_period: str = Query(..., description="회계기간")
):
    """재무상태표를 조회합니다."""
    return BalanceSheetResponse(
        fiscal_year=fiscal_year,
        fiscal_period=fiscal_period,
        as_of_date=date(int(fiscal_year), int(fiscal_period), 28),
        assets={
            "current_assets": {
                "cash": Decimal("90000000"),
                "bank_deposits": Decimal("630000000"),
                "accounts_receivable": Decimal("540000000"),
                "inventory": Decimal("280000000"),
                "total": Decimal("1540000000")
            },
            "non_current_assets": {
                "property_plant_equipment": Decimal("850000000"),
                "intangible_assets": Decimal("120000000"),
                "total": Decimal("970000000")
            }
        },
        liabilities={
            "current_liabilities": {
                "accounts_payable": Decimal("320000000"),
                "short_term_borrowings": Decimal("200000000"),
                "accrued_expenses": Decimal("85000000"),
                "total": Decimal("605000000")
            },
            "non_current_liabilities": {
                "long_term_borrowings": Decimal("400000000"),
                "total": Decimal("400000000")
            }
        },
        equity={
            "capital_stock": Decimal("500000000"),
            "retained_earnings": Decimal("1005000000"),
            "total": Decimal("1505000000")
        },
        total_assets=Decimal("2510000000"),
        total_liabilities=Decimal("1005000000"),
        total_equity=Decimal("1505000000")
    )


@router.get("/statements/income-statement", response_model=IncomeStatementResponse, summary="손익계산서")
async def get_income_statement(
    fiscal_year: str = Query(..., description="회계연도"),
    fiscal_period: str = Query(..., description="회계기간")
):
    """손익계산서를 조회합니다."""
    period_end = date(int(fiscal_year), int(fiscal_period), 28)
    period_start = date(int(fiscal_year), int(fiscal_period), 1)

    return IncomeStatementResponse(
        fiscal_year=fiscal_year,
        fiscal_period=fiscal_period,
        period_start=period_start,
        period_end=period_end,
        revenue={
            "product_sales": Decimal("1500000000"),
            "service_revenue": Decimal("50000000"),
            "total": Decimal("1550000000")
        },
        cost_of_sales={
            "material_cost": Decimal("850000000"),
            "labor_cost": Decimal("180000000"),
            "overhead": Decimal("120000000"),
            "total": Decimal("1150000000")
        },
        gross_profit=Decimal("400000000"),
        operating_expenses={
            "selling_expenses": Decimal("80000000"),
            "admin_expenses": Decimal("120000000"),
            "total": Decimal("200000000")
        },
        operating_income=Decimal("200000000"),
        non_operating={
            "interest_income": Decimal("5000000"),
            "interest_expense": Decimal("-15000000"),
            "other": Decimal("2000000"),
            "total": Decimal("-8000000")
        },
        income_before_tax=Decimal("192000000"),
        tax_expense=Decimal("42240000"),
        net_income=Decimal("149760000")
    )


@router.get("/statements/trial-balance", response_model=TrialBalanceResponse, summary="시산표")
async def get_trial_balance(
    fiscal_year: str = Query(..., description="회계연도"),
    fiscal_period: str = Query(..., description="회계기간")
):
    """시산표를 조회합니다."""
    mock_items = [
        {"account_code": "1101", "account_name": "현금", "debit": Decimal("90000000"), "credit": Decimal("0")},
        {"account_code": "1102", "account_name": "보통예금", "debit": Decimal("630000000"), "credit": Decimal("0")},
        {"account_code": "1103", "account_name": "외상매출금", "debit": Decimal("540000000"), "credit": Decimal("0")},
        {"account_code": "1201", "account_name": "재고자산", "debit": Decimal("280000000"), "credit": Decimal("0")},
        {"account_code": "1301", "account_name": "건물", "debit": Decimal("850000000"), "credit": Decimal("0")},
        {"account_code": "2101", "account_name": "외상매입금", "debit": Decimal("0"), "credit": Decimal("320000000")},
        {"account_code": "2201", "account_name": "단기차입금", "debit": Decimal("0"), "credit": Decimal("200000000")},
        {"account_code": "3101", "account_name": "자본금", "debit": Decimal("0"), "credit": Decimal("500000000")},
        {"account_code": "4101", "account_name": "제품매출", "debit": Decimal("0"), "credit": Decimal("1500000000")},
        {"account_code": "5101", "account_name": "재료비", "debit": Decimal("850000000"), "credit": Decimal("0")},
        {"account_code": "5201", "account_name": "노무비", "debit": Decimal("180000000"), "credit": Decimal("0")},
        {"account_code": "5301", "account_name": "경비", "debit": Decimal("200000000"), "credit": Decimal("0")}
    ]

    total_debit = sum(item["debit"] for item in mock_items)
    total_credit = sum(item["credit"] for item in mock_items)

    return TrialBalanceResponse(
        fiscal_year=fiscal_year,
        fiscal_period=fiscal_period,
        as_of_date=date(int(fiscal_year), int(fiscal_period), 28),
        items=mock_items,
        total_debit=total_debit,
        total_credit=total_credit,
        is_balanced=total_debit == total_credit
    )
