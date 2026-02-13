"""
ERP Accounting Management API Router
회계관리 - 전표, 장부, 원가, 결산, 재무제표
실제 DB 연결 버전
"""
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from api.database import get_db
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
    CostType, ClosingType, ClosingStatus,
    AccountCode, Voucher, VoucherDetail,
    GeneralLedger, SubsidiaryLedger,
    CostCenter, ProductCost, CostAllocation,
    FiscalPeriod, ClosingEntry, FinancialStatement
)

router = APIRouter(prefix="/accounting", tags=["ERP Accounting"])


# ==================== Helper Functions ====================

def account_to_dict(account: AccountCode, include_children: bool = False) -> dict:
    """계정과목 모델을 딕셔너리로 변환"""
    result = {
        "account_code": account.account_code,
        "account_name": account.account_name,
        "account_name_en": account.account_name_en,
        "account_type": account.account_type,
        "parent_code": account.parent_code,
        "level": account.level or 1,
        "is_control": account.is_control or False,
        "is_cash": account.is_cash or False,
        "is_bank": account.is_bank or False,
        "debit_credit": account.debit_credit,
        "budget_control": account.budget_control or False,
        "is_active": account.is_active if account.is_active is not None else True,
        "description": account.description,
        "created_at": account.created_at or datetime.now(),
        "updated_at": account.updated_at or datetime.now(),
        "children": None
    }

    if include_children and hasattr(account, 'children') and account.children:
        result["children"] = [account_to_dict(child, True) for child in account.children]

    return result


def voucher_detail_to_dict(detail: VoucherDetail) -> dict:
    """전표 상세 모델을 딕셔너리로 변환"""
    return {
        "id": detail.id,
        "voucher_no": detail.voucher_no,
        "line_no": detail.line_no,
        "account_code": detail.account_code,
        "account_name": detail.account.account_name if detail.account else None,
        "debit_amount": detail.debit_amount or Decimal("0"),
        "credit_amount": detail.credit_amount or Decimal("0"),
        "description": detail.description,
        "partner_code": detail.partner_code,
        "partner_name": detail.partner_name,
        "cost_center": detail.cost_center,
        "project_code": detail.project_code,
        "tax_code": detail.tax_code,
        "tax_amount": detail.tax_amount or Decimal("0"),
        "created_at": detail.created_at or datetime.now()
    }


def voucher_to_dict(voucher: Voucher, include_details: bool = False) -> dict:
    """전표 모델을 딕셔너리로 변환"""
    result = {
        "voucher_no": voucher.voucher_no,
        "voucher_date": voucher.voucher_date,
        "voucher_type": voucher.voucher_type,
        "status": voucher.status,
        "fiscal_year": voucher.fiscal_year,
        "fiscal_period": voucher.fiscal_period,
        "description": voucher.description,
        "total_debit": voucher.total_debit or Decimal("0"),
        "total_credit": voucher.total_credit or Decimal("0"),
        "currency": voucher.currency or "KRW",
        "exchange_rate": voucher.exchange_rate or Decimal("1"),
        "reference_type": voucher.reference_type,
        "reference_no": voucher.reference_no,
        "department_code": voucher.department_code,
        "cost_center": voucher.cost_center,
        "created_by": voucher.created_by,
        "approved_by": voucher.approved_by,
        "approved_at": voucher.approved_at,
        "posted_at": voucher.posted_at,
        "cancelled_at": voucher.cancelled_at,
        "cancel_reason": voucher.cancel_reason,
        "created_at": voucher.created_at or datetime.now(),
        "updated_at": voucher.updated_at or datetime.now(),
        "details": None
    }

    if include_details and hasattr(voucher, 'details') and voucher.details:
        result["details"] = [voucher_detail_to_dict(d) for d in voucher.details]

    return result


def ledger_to_dict(ledger: GeneralLedger, account_name: str = None) -> dict:
    """총계정원장 모델을 딕셔너리로 변환"""
    return {
        "id": ledger.id,
        "fiscal_year": ledger.fiscal_year,
        "fiscal_period": ledger.fiscal_period,
        "account_code": ledger.account_code,
        "account_name": account_name,
        "opening_balance": ledger.opening_balance or Decimal("0"),
        "debit_total": ledger.debit_total or Decimal("0"),
        "credit_total": ledger.credit_total or Decimal("0"),
        "closing_balance": ledger.closing_balance or Decimal("0"),
        "transaction_count": ledger.transaction_count or 0
    }


def subsidiary_to_dict(sub: SubsidiaryLedger) -> dict:
    """보조원장 모델을 딕셔너리로 변환"""
    return {
        "id": sub.id,
        "fiscal_year": sub.fiscal_year,
        "fiscal_period": sub.fiscal_period,
        "account_code": sub.account_code,
        "account_name": None,
        "sub_code": sub.sub_code,
        "sub_type": sub.sub_type,
        "sub_name": sub.sub_name,
        "opening_balance": sub.opening_balance or Decimal("0"),
        "debit_total": sub.debit_total or Decimal("0"),
        "credit_total": sub.credit_total or Decimal("0"),
        "closing_balance": sub.closing_balance or Decimal("0"),
        "transaction_count": sub.transaction_count or 0
    }


def cost_center_to_dict(cc: CostCenter) -> dict:
    """코스트센터 모델을 딕셔너리로 변환"""
    return {
        "cost_center_code": cc.cost_center_code,
        "cost_center_name": cc.cost_center_name,
        "parent_code": cc.parent_code,
        "department_code": cc.department_code,
        "factory_code": cc.factory_code,
        "responsible_person": cc.responsible_person,
        "is_active": cc.is_active if cc.is_active is not None else True,
        "created_at": cc.created_at or datetime.now(),
        "updated_at": cc.updated_at or datetime.now()
    }


def fiscal_period_to_dict(fp: FiscalPeriod) -> dict:
    """회계기간 모델을 딕셔너리로 변환"""
    return {
        "id": fp.id,
        "fiscal_year": fp.fiscal_year,
        "fiscal_period": fp.fiscal_period,
        "period_name": fp.period_name,
        "start_date": fp.start_date,
        "end_date": fp.end_date,
        "closing_type": fp.closing_type,
        "status": fp.status,
        "closed_at": fp.closed_at,
        "closed_by": fp.closed_by,
        "reopened_at": fp.reopened_at,
        "reopened_by": fp.reopened_by
    }


def closing_entry_to_dict(entry: ClosingEntry) -> dict:
    """결산 분개 모델을 딕셔너리로 변환"""
    return {
        "id": entry.id,
        "fiscal_year": entry.fiscal_year,
        "fiscal_period": entry.fiscal_period,
        "closing_type": entry.closing_type,
        "entry_type": entry.entry_type,
        "voucher_no": entry.voucher_no,
        "account_code": entry.account_code,
        "account_name": None,
        "debit_amount": entry.debit_amount or Decimal("0"),
        "credit_amount": entry.credit_amount or Decimal("0"),
        "description": entry.description,
        "is_auto": entry.is_auto if entry.is_auto is not None else True,
        "created_at": entry.created_at or datetime.now()
    }


# ============== 계정과목 관리 ==============

@router.get("/accounts", response_model=AccountCodeTreeResponse, summary="계정과목 트리 조회")
async def get_account_tree(
    db: AsyncSession = Depends(get_db),
    account_type: Optional[AccountType] = Query(None, description="계정유형 필터"),
    is_active: Optional[bool] = Query(None, description="사용 여부")
):
    """계정과목 트리를 조회합니다."""
    try:
        # 최상위 계정 조회 (parent_code가 없는 것)
        query = select(AccountCode).where(AccountCode.parent_code.is_(None))

        if account_type:
            query = query.where(AccountCode.account_type == account_type)
        if is_active is not None:
            query = query.where(AccountCode.is_active == is_active)

        query = query.options(selectinload(AccountCode.children))

        result = await db.execute(query)
        accounts = result.scalars().all()

        return AccountCodeTreeResponse(
            items=[AccountCodeResponse(**account_to_dict(a, True)) for a in accounts]
        )
    except Exception as e:
        print(f"Error fetching account tree: {e}")
        raise HTTPException(status_code=500, detail=f"계정과목 트리 조회 실패: {str(e)}")


@router.get("/accounts/{account_code}", response_model=AccountCodeResponse, summary="계정과목 상세 조회")
async def get_account(
    account_code: str,
    db: AsyncSession = Depends(get_db)
):
    """계정과목 상세 정보를 조회합니다."""
    try:
        query = select(AccountCode).where(AccountCode.account_code == account_code)
        query = query.options(selectinload(AccountCode.children))

        result = await db.execute(query)
        account = result.scalar_one_or_none()

        if not account:
            raise HTTPException(status_code=404, detail=f"계정코드 {account_code}를 찾을 수 없습니다.")

        return AccountCodeResponse(**account_to_dict(account, True))
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching account: {e}")
        raise HTTPException(status_code=500, detail=f"계정과목 조회 실패: {str(e)}")


@router.post("/accounts", response_model=AccountCodeResponse, summary="계정과목 생성")
async def create_account(
    data: AccountCodeCreate,
    db: AsyncSession = Depends(get_db)
):
    """새로운 계정과목을 생성합니다."""
    try:
        # 중복 체크
        existing = await db.execute(
            select(AccountCode).where(AccountCode.account_code == data.account_code)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="이미 존재하는 계정코드입니다.")

        account = AccountCode(
            account_code=data.account_code,
            account_name=data.account_name,
            account_name_en=data.account_name_en,
            account_type=data.account_type,
            parent_code=data.parent_code,
            level=data.level,
            is_control=data.is_control,
            is_cash=data.is_cash,
            is_bank=data.is_bank,
            debit_credit=data.debit_credit,
            budget_control=data.budget_control,
            is_active=data.is_active,
            description=data.description,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        db.add(account)
        await db.commit()
        await db.refresh(account)

        return AccountCodeResponse(**account_to_dict(account))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error creating account: {e}")
        raise HTTPException(status_code=500, detail=f"계정과목 생성 실패: {str(e)}")


# ============== 전표 관리 ==============

@router.get("/vouchers", response_model=VoucherListResponse, summary="전표 목록 조회")
async def get_vouchers(
    db: AsyncSession = Depends(get_db),
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
    try:
        query = select(Voucher)

        # 필터 적용
        if voucher_no:
            query = query.where(Voucher.voucher_no.ilike(f"%{voucher_no}%"))
        if voucher_type:
            query = query.where(Voucher.voucher_type == voucher_type)
        if status:
            query = query.where(Voucher.status == status)
        if fiscal_year:
            query = query.where(Voucher.fiscal_year == fiscal_year)
        if fiscal_period:
            query = query.where(Voucher.fiscal_period == fiscal_period)
        if start_date:
            query = query.where(Voucher.voucher_date >= start_date)
        if end_date:
            query = query.where(Voucher.voucher_date <= end_date)

        # 총 개수 조회
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # 합계 조회
        sum_query = select(
            func.coalesce(func.sum(Voucher.total_debit), 0),
            func.coalesce(func.sum(Voucher.total_credit), 0)
        ).select_from(query.subquery())
        sum_result = await db.execute(sum_query)
        sums = sum_result.first()

        # 페이지네이션
        offset = (page - 1) * size
        query = query.order_by(Voucher.voucher_date.desc(), Voucher.voucher_no.desc())
        query = query.offset(offset).limit(size)

        result = await db.execute(query)
        vouchers = result.scalars().all()

        return VoucherListResponse(
            items=[VoucherResponse(**voucher_to_dict(v)) for v in vouchers],
            total=total,
            page=page,
            size=size,
            total_debit=Decimal(str(sums[0])) if sums else Decimal("0"),
            total_credit=Decimal(str(sums[1])) if sums else Decimal("0")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"전표 목록 조회 실패: {str(e)}")


@router.get("/vouchers/{voucher_no}", response_model=VoucherResponse, summary="전표 상세 조회")
async def get_voucher(
    voucher_no: str,
    db: AsyncSession = Depends(get_db)
):
    """전표 상세 정보를 조회합니다."""
    try:
        query = select(Voucher).where(Voucher.voucher_no == voucher_no)
        query = query.options(selectinload(Voucher.details).selectinload(VoucherDetail.account))

        result = await db.execute(query)
        voucher = result.scalar_one_or_none()

        if not voucher:
            raise HTTPException(status_code=404, detail=f"전표 {voucher_no}를 찾을 수 없습니다.")

        return VoucherResponse(**voucher_to_dict(voucher, True))
    except Exception as e:
        print(f"Error fetching voucher: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vouchers", response_model=VoucherResponse, summary="전표 생성")
async def create_voucher(
    data: VoucherCreate,
    db: AsyncSession = Depends(get_db)
):
    """새로운 전표를 생성합니다."""
    try:
        voucher_no = f"VCH-{datetime.now().strftime('%Y-%m')}-{datetime.now().strftime('%H%M%S')}"

        total_debit = sum(d.debit_amount for d in data.details)
        total_credit = sum(d.credit_amount for d in data.details)

        if total_debit != total_credit:
            raise HTTPException(status_code=400, detail="차변합계와 대변합계가 일치하지 않습니다.")

        voucher = Voucher(
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
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        db.add(voucher)

        # 전표 상세 추가
        for detail_data in data.details:
            detail = VoucherDetail(
                voucher_no=voucher_no,
                line_no=detail_data.line_no,
                account_code=detail_data.account_code,
                debit_amount=detail_data.debit_amount,
                credit_amount=detail_data.credit_amount,
                description=detail_data.description,
                partner_code=detail_data.partner_code,
                partner_name=detail_data.partner_name,
                cost_center=detail_data.cost_center,
                project_code=detail_data.project_code,
                tax_code=detail_data.tax_code,
                tax_amount=detail_data.tax_amount,
                created_at=datetime.now()
            )
            db.add(detail)

        await db.commit()
        await db.refresh(voucher)

        return VoucherResponse(**voucher_to_dict(voucher))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error creating voucher: {e}")
        raise HTTPException(status_code=500, detail=f"전표 생성 실패: {str(e)}")


@router.put("/vouchers/{voucher_no}", response_model=VoucherResponse, summary="전표 수정")
async def update_voucher(
    voucher_no: str,
    data: VoucherUpdate,
    db: AsyncSession = Depends(get_db)
):
    """전표를 수정합니다."""
    try:
        query = select(Voucher).where(Voucher.voucher_no == voucher_no)
        result = await db.execute(query)
        voucher = result.scalar_one_or_none()

        if not voucher:
            raise HTTPException(status_code=404, detail="전표를 찾을 수 없습니다.")

        if voucher.status not in [VoucherStatus.DRAFT, VoucherStatus.REJECTED]:
            raise HTTPException(status_code=400, detail="수정 가능한 상태가 아닙니다.")

        if data.voucher_date:
            voucher.voucher_date = data.voucher_date
        if data.description is not None:
            voucher.description = data.description
        if data.department_code is not None:
            voucher.department_code = data.department_code
        if data.cost_center is not None:
            voucher.cost_center = data.cost_center

        voucher.updated_at = datetime.now()

        await db.commit()
        await db.refresh(voucher)

        return VoucherResponse(**voucher_to_dict(voucher))
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error updating voucher: {e}")
        raise HTTPException(status_code=500, detail=f"전표 수정 실패: {str(e)}")


@router.post("/vouchers/{voucher_no}/approve", summary="전표 승인/반려")
async def approve_voucher(
    voucher_no: str,
    data: VoucherApproval,
    db: AsyncSession = Depends(get_db)
):
    """전표를 승인하거나 반려합니다."""
    try:
        query = select(Voucher).where(Voucher.voucher_no == voucher_no)
        result = await db.execute(query)
        voucher = result.scalar_one_or_none()

        if voucher:
            if data.action == "approve":
                voucher.status = VoucherStatus.APPROVED
                voucher.approved_by = "current_user"
                voucher.approved_at = datetime.now()
            else:
                voucher.status = VoucherStatus.REJECTED

            voucher.updated_at = datetime.now()
            await db.commit()

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
    except Exception as e:
        await db.rollback()
        print(f"Error approving voucher: {e}")
        raise HTTPException(status_code=500, detail=f"전표 승인/반려 실패: {str(e)}")


@router.post("/vouchers/{voucher_no}/post", summary="전표 전기")
async def post_voucher(
    voucher_no: str,
    db: AsyncSession = Depends(get_db)
):
    """전표를 전기합니다."""
    try:
        query = select(Voucher).where(Voucher.voucher_no == voucher_no)
        result = await db.execute(query)
        voucher = result.scalar_one_or_none()

        if voucher:
            if voucher.status != VoucherStatus.APPROVED:
                raise HTTPException(status_code=400, detail="승인된 전표만 전기할 수 있습니다.")

            voucher.status = VoucherStatus.POSTED
            voucher.posted_at = datetime.now()
            voucher.updated_at = datetime.now()
            await db.commit()

        return {
            "message": f"전표 {voucher_no}이(가) 전기되었습니다.",
            "status": VoucherStatus.POSTED,
            "posted_at": datetime.now()
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error posting voucher: {e}")
        raise HTTPException(status_code=500, detail=f"전표 전기 실패: {str(e)}")


@router.post("/vouchers/{voucher_no}/cancel", summary="전표 취소")
async def cancel_voucher(
    voucher_no: str,
    reason: str = Query(..., description="취소 사유"),
    db: AsyncSession = Depends(get_db)
):
    """전표를 취소합니다."""
    try:
        query = select(Voucher).where(Voucher.voucher_no == voucher_no)
        result = await db.execute(query)
        voucher = result.scalar_one_or_none()

        if voucher:
            voucher.status = VoucherStatus.CANCELLED
            voucher.cancel_reason = reason
            voucher.cancelled_at = datetime.now()
            voucher.updated_at = datetime.now()
            await db.commit()

        return {
            "message": f"전표 {voucher_no}이(가) 취소되었습니다.",
            "status": VoucherStatus.CANCELLED,
            "cancel_reason": reason,
            "cancelled_at": datetime.now()
        }
    except Exception as e:
        await db.rollback()
        print(f"Error cancelling voucher: {e}")
        raise HTTPException(status_code=500, detail=f"전표 취소 실패: {str(e)}")


# ============== 장부 관리 ==============

@router.get("/ledger/general", response_model=GeneralLedgerListResponse, summary="총계정원장 조회")
async def get_general_ledger(
    db: AsyncSession = Depends(get_db),
    fiscal_year: str = Query(..., description="회계연도"),
    fiscal_period: Optional[str] = Query(None, description="회계기간"),
    account_code: Optional[str] = Query(None, description="계정코드")
):
    """총계정원장을 조회합니다."""
    try:
        query = select(GeneralLedger).where(GeneralLedger.fiscal_year == fiscal_year)

        if fiscal_period:
            query = query.where(GeneralLedger.fiscal_period == fiscal_period)
        if account_code:
            query = query.where(GeneralLedger.account_code == account_code)

        result = await db.execute(query)
        ledgers = result.scalars().all()

        if not ledgers:
            return GeneralLedgerListResponse(
                items=[],
                total=0,
                summary={"total_debit": Decimal("0"), "total_credit": Decimal("0")}
            )

        # 계정명 조회
        account_codes = list(set(l.account_code for l in ledgers))
        account_query = select(AccountCode).where(AccountCode.account_code.in_(account_codes))
        account_result = await db.execute(account_query)
        accounts = {a.account_code: a.account_name for a in account_result.scalars().all()}

        items = []
        total_debit = Decimal("0")
        total_credit = Decimal("0")

        for ledger in ledgers:
            ledger_dict = ledger_to_dict(ledger, accounts.get(ledger.account_code))
            items.append(GeneralLedgerResponse(**ledger_dict))
            total_debit += ledger.debit_total or Decimal("0")
            total_credit += ledger.credit_total or Decimal("0")

        return GeneralLedgerListResponse(
            items=items,
            total=len(items),
            summary={"total_debit": total_debit, "total_credit": total_credit}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"총계정원장 조회 실패: {str(e)}")


@router.get("/ledger/general/{account_code}/transactions", response_model=LedgerTransactionListResponse, summary="계정별 거래 내역")
async def get_ledger_transactions(
    account_code: str,
    db: AsyncSession = Depends(get_db),
    fiscal_year: str = Query(..., description="회계연도"),
    fiscal_period: str = Query(..., description="회계기간")
):
    """계정별 거래 내역을 조회합니다."""
    try:
        # 계정명 조회
        account_query = select(AccountCode).where(AccountCode.account_code == account_code)
        account_result = await db.execute(account_query)
        account = account_result.scalar_one_or_none()
        account_name = account.account_name if account else "보통예금"

        # 해당 계정의 전표 상세 조회
        query = select(VoucherDetail).join(Voucher).where(
            and_(
                VoucherDetail.account_code == account_code,
                Voucher.fiscal_year == fiscal_year,
                Voucher.fiscal_period == fiscal_period,
                Voucher.status == VoucherStatus.POSTED
            )
        ).order_by(Voucher.voucher_date)

        result = await db.execute(query)
        details = result.scalars().all()

        if not details:
            # 데이터 없음 - 빈 응답 반환
            return LedgerTransactionListResponse(
                account_code=account_code,
                account_name=account_name,
                fiscal_year=fiscal_year,
                fiscal_period=fiscal_period,
                opening_balance=Decimal("0"),
                items=[],
                closing_balance=Decimal("0")
            )

        # 기초잔액 조회
        ledger_query = select(GeneralLedger).where(
            and_(
                GeneralLedger.account_code == account_code,
                GeneralLedger.fiscal_year == fiscal_year,
                GeneralLedger.fiscal_period == fiscal_period
            )
        )
        ledger_result = await db.execute(ledger_query)
        ledger = ledger_result.scalar_one_or_none()
        opening_balance = ledger.opening_balance if ledger else Decimal("0")

        # 거래 내역 생성
        transactions = []
        balance = opening_balance

        for detail in details:
            balance = balance + (detail.debit_amount or Decimal("0")) - (detail.credit_amount or Decimal("0"))

            trans = {
                "voucher_no": detail.voucher_no,
                "voucher_date": detail.voucher.voucher_date if detail.voucher else date.today(),
                "voucher_type": detail.voucher.voucher_type if detail.voucher else VoucherType.TRANSFER,
                "account_code": account_code,
                "account_name": account_name,
                "debit_amount": detail.debit_amount or Decimal("0"),
                "credit_amount": detail.credit_amount or Decimal("0"),
                "balance": balance,
                "description": detail.description,
                "partner_name": detail.partner_name
            }
            transactions.append(LedgerTransactionResponse(**trans))

        return LedgerTransactionListResponse(
            account_code=account_code,
            account_name=account_name,
            fiscal_year=fiscal_year,
            fiscal_period=fiscal_period,
            opening_balance=opening_balance,
            items=transactions,
            closing_balance=balance
        )
    except Exception as e:
        print(f"Error fetching ledger transactions: {e}")
        raise HTTPException(status_code=500, detail=f"계정별 거래 내역 조회 실패: {str(e)}")


@router.get("/ledger/subsidiary", response_model=List[SubsidiaryLedgerResponse], summary="보조원장 조회")
async def get_subsidiary_ledger(
    db: AsyncSession = Depends(get_db),
    fiscal_year: str = Query(..., description="회계연도"),
    fiscal_period: str = Query(..., description="회계기간"),
    account_code: str = Query(..., description="계정코드"),
    sub_type: str = Query(..., description="보조유형 (PARTNER/DEPT/PROJECT)")
):
    """보조원장을 조회합니다."""
    try:
        query = select(SubsidiaryLedger).where(
            and_(
                SubsidiaryLedger.fiscal_year == fiscal_year,
                SubsidiaryLedger.fiscal_period == fiscal_period,
                SubsidiaryLedger.account_code == account_code,
                SubsidiaryLedger.sub_type == sub_type
            )
        )

        result = await db.execute(query)
        subsidiaries = result.scalars().all()

        if not subsidiaries:
            # 데이터 없음 - 빈 응답 반환
            return []

        return [SubsidiaryLedgerResponse(**subsidiary_to_dict(s)) for s in subsidiaries]
    except Exception as e:
        print(f"Error fetching subsidiary ledger: {e}")
        raise HTTPException(status_code=500, detail=f"보조원장 조회 실패: {str(e)}")


# ============== 원가 관리 ==============

@router.get("/cost-centers", response_model=List[CostCenterResponse], summary="코스트센터 목록")
async def get_cost_centers(
    db: AsyncSession = Depends(get_db),
    factory_code: Optional[str] = Query(None, description="공장코드 필터"),
    is_active: Optional[bool] = Query(None, description="사용 여부")
):
    """코스트센터 목록을 조회합니다."""
    try:
        query = select(CostCenter)

        if factory_code:
            query = query.where(CostCenter.factory_code == factory_code)
        if is_active is not None:
            query = query.where(CostCenter.is_active == is_active)

        result = await db.execute(query)
        cost_centers = result.scalars().all()

        return [CostCenterResponse(**cost_center_to_dict(cc)) for cc in cost_centers]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"코스트센터 목록 조회 실패: {str(e)}")


@router.get("/cost/products", response_model=List[ProductCostSummary], summary="품목별 원가 조회")
async def get_product_costs(
    db: AsyncSession = Depends(get_db),
    fiscal_year: str = Query(..., description="회계연도"),
    fiscal_period: str = Query(..., description="회계기간"),
    product_code: Optional[str] = Query(None, description="품목코드")
):
    """품목별 원가를 조회합니다."""
    try:
        query = select(ProductCost).where(
            and_(
                ProductCost.fiscal_year == fiscal_year,
                ProductCost.fiscal_period == fiscal_period
            )
        )

        if product_code:
            query = query.where(ProductCost.product_code == product_code)

        result = await db.execute(query)
        costs = result.scalars().all()

        if not costs:
            return []

        # 품목별로 그룹화하여 원가 유형별 합계 계산
        product_costs = {}
        for cost in costs:
            if cost.product_code not in product_costs:
                product_costs[cost.product_code] = {
                    "product_code": cost.product_code,
                    "product_name": cost.product_code,
                    "fiscal_year": fiscal_year,
                    "fiscal_period": fiscal_period,
                    "material_cost": Decimal("0"),
                    "labor_cost": Decimal("0"),
                    "overhead_cost": Decimal("0"),
                    "outsourcing_cost": Decimal("0"),
                    "total_standard_cost": Decimal("0"),
                    "total_actual_cost": Decimal("0"),
                    "total_variance": Decimal("0"),
                    "variance_rate": Decimal("0"),
                    "production_qty": cost.production_qty or Decimal("0"),
                    "unit_cost": cost.unit_cost or Decimal("0")
                }

            if cost.cost_type == CostType.MATERIAL:
                product_costs[cost.product_code]["material_cost"] = cost.actual_cost or Decimal("0")
            elif cost.cost_type == CostType.LABOR:
                product_costs[cost.product_code]["labor_cost"] = cost.actual_cost or Decimal("0")
            elif cost.cost_type == CostType.OVERHEAD:
                product_costs[cost.product_code]["overhead_cost"] = cost.actual_cost or Decimal("0")
            elif cost.cost_type == CostType.OUTSOURCING:
                product_costs[cost.product_code]["outsourcing_cost"] = cost.actual_cost or Decimal("0")

            product_costs[cost.product_code]["total_standard_cost"] += cost.standard_cost or Decimal("0")
            product_costs[cost.product_code]["total_actual_cost"] += cost.actual_cost or Decimal("0")
            product_costs[cost.product_code]["total_variance"] += cost.variance or Decimal("0")

        # 차이율 계산
        for pc in product_costs.values():
            if pc["total_standard_cost"] > 0:
                pc["variance_rate"] = (pc["total_variance"] / pc["total_standard_cost"]) * 100

        return [ProductCostSummary(**pc) for pc in product_costs.values()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"품목별 원가 조회 실패: {str(e)}")


@router.get("/cost/analysis", response_model=CostAnalysisResponse, summary="원가 분석")
async def get_cost_analysis(
    db: AsyncSession = Depends(get_db),
    fiscal_year: str = Query(..., description="회계연도"),
    fiscal_period: str = Query(..., description="회계기간")
):
    """원가 분석 데이터를 조회합니다."""
    try:
        # 원가 유형별 합계 조회
        query = select(
            ProductCost.cost_type,
            func.sum(ProductCost.actual_cost)
        ).where(
            and_(
                ProductCost.fiscal_year == fiscal_year,
                ProductCost.fiscal_period == fiscal_period
            )
        ).group_by(ProductCost.cost_type)

        result = await db.execute(query)
        cost_by_type = {row[0]: row[1] or Decimal("0") for row in result}

        total_material = cost_by_type.get(CostType.MATERIAL, Decimal("0"))
        total_labor = cost_by_type.get(CostType.LABOR, Decimal("0"))
        total_overhead = cost_by_type.get(CostType.OVERHEAD, Decimal("0"))
        total_outsourcing = cost_by_type.get(CostType.OUTSOURCING, Decimal("0"))
        total_cost = total_material + total_labor + total_overhead + total_outsourcing

        if total_cost == 0:
            # 데이터 없음 - 빈 응답 반환
            return CostAnalysisResponse(
                fiscal_year=fiscal_year,
                fiscal_period=fiscal_period,
                total_material_cost=Decimal("0"),
                total_labor_cost=Decimal("0"),
                total_overhead_cost=Decimal("0"),
                total_outsourcing_cost=Decimal("0"),
                total_cost=Decimal("0"),
                by_cost_center=[],
                by_product=[],
                variance_analysis={
                    "total_variance": Decimal("0"),
                    "variance_rate": Decimal("0"),
                    "favorable": [],
                    "unfavorable": []
                }
            )

        # 품목별 원가 조회
        product_costs = await get_product_costs(db, fiscal_year, fiscal_period, None)

        return CostAnalysisResponse(
            fiscal_year=fiscal_year,
            fiscal_period=fiscal_period,
            total_material_cost=total_material,
            total_labor_cost=total_labor,
            total_overhead_cost=total_overhead,
            total_outsourcing_cost=total_outsourcing,
            total_cost=total_cost,
            by_cost_center=[],
            by_product=product_costs,
            variance_analysis={
                "total_variance": Decimal("0"),
                "variance_rate": Decimal("0"),
                "favorable": [],
                "unfavorable": []
            }
        )
    except Exception as e:
        print(f"Error fetching cost analysis: {e}")
        raise HTTPException(status_code=500, detail=f"원가 분석 조회 실패: {str(e)}")


@router.post("/cost/allocations", response_model=CostAllocationResponse, summary="원가 배부")
async def create_cost_allocation(
    data: CostAllocationCreate,
    db: AsyncSession = Depends(get_db)
):
    """원가를 배부합니다."""
    try:
        allocation_no = f"ALLOC-{datetime.now().strftime('%Y%m%d%H%M%S')}"

        allocation = CostAllocation(
            allocation_no=allocation_no,
            allocation_date=data.allocation_date,
            fiscal_year=str(data.allocation_date.year),
            fiscal_period=f"{data.allocation_date.month:02d}",
            source_cost_center=data.source_cost_center,
            target_cost_center=data.target_cost_center,
            allocation_base=data.allocation_base,
            allocation_rate=data.allocation_rate,
            allocated_amount=data.allocated_amount,
            cost_type=data.cost_type,
            description=data.description,
            created_at=datetime.now()
        )

        db.add(allocation)
        await db.commit()
        await db.refresh(allocation)

        # 코스트센터명 조회
        source_query = select(CostCenter).where(CostCenter.cost_center_code == data.source_cost_center)
        target_query = select(CostCenter).where(CostCenter.cost_center_code == data.target_cost_center)

        source_result = await db.execute(source_query)
        target_result = await db.execute(target_query)

        source_cc = source_result.scalar_one_or_none()
        target_cc = target_result.scalar_one_or_none()

        return CostAllocationResponse(
            id=allocation.id,
            allocation_no=allocation_no,
            allocation_date=data.allocation_date,
            fiscal_year=str(data.allocation_date.year),
            fiscal_period=f"{data.allocation_date.month:02d}",
            source_cost_center=data.source_cost_center,
            source_cost_center_name=source_cc.cost_center_name if source_cc else "관리부",
            target_cost_center=data.target_cost_center,
            target_cost_center_name=target_cc.cost_center_name if target_cc else "SMT 생산부",
            allocation_base=data.allocation_base,
            allocation_rate=data.allocation_rate,
            allocated_amount=data.allocated_amount,
            cost_type=data.cost_type,
            description=data.description,
            created_at=datetime.now()
        )
    except Exception as e:
        await db.rollback()
        print(f"Error creating cost allocation: {e}")
        raise HTTPException(status_code=500, detail=f"원가 배부 실패: {str(e)}")


# ============== 결산 관리 ==============

@router.get("/fiscal-periods", response_model=FiscalPeriodListResponse, summary="회계기간 목록")
async def get_fiscal_periods(
    db: AsyncSession = Depends(get_db),
    fiscal_year: str = Query(..., description="회계연도")
):
    """회계기간 목록을 조회합니다."""
    try:
        query = select(FiscalPeriod).where(FiscalPeriod.fiscal_year == fiscal_year)
        query = query.order_by(FiscalPeriod.fiscal_period)

        result = await db.execute(query)
        periods = result.scalars().all()

        items = [FiscalPeriodResponse(**fiscal_period_to_dict(p)) for p in periods]
        current = next((p for p in items if p.status == ClosingStatus.OPEN), None)

        return FiscalPeriodListResponse(
            items=items,
            current_period=current
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"회계기간 목록 조회 실패: {str(e)}")


@router.post("/fiscal-periods/{fiscal_year}/{fiscal_period}/close", summary="회계기간 마감")
async def close_fiscal_period(
    fiscal_year: str,
    fiscal_period: str,
    data: ClosingAction,
    db: AsyncSession = Depends(get_db)
):
    """회계기간을 마감합니다."""
    try:
        query = select(FiscalPeriod).where(
            and_(
                FiscalPeriod.fiscal_year == fiscal_year,
                FiscalPeriod.fiscal_period == fiscal_period
            )
        )
        result = await db.execute(query)
        period = result.scalar_one_or_none()

        if period:
            if data.action == "close":
                period.status = ClosingStatus.CLOSED
                period.closed_at = datetime.now()
                period.closed_by = "current_user"
            else:
                period.status = ClosingStatus.REOPENED
                period.reopened_at = datetime.now()
                period.reopened_by = "current_user"

            await db.commit()

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
    except Exception as e:
        await db.rollback()
        print(f"Error closing fiscal period: {e}")
        raise HTTPException(status_code=500, detail=f"회계기간 마감 실패: {str(e)}")


@router.get("/closing/{fiscal_year}/{fiscal_period}/summary", response_model=ClosingSummary, summary="결산 요약")
async def get_closing_summary(
    fiscal_year: str,
    fiscal_period: str,
    db: AsyncSession = Depends(get_db)
):
    """결산 요약 정보를 조회합니다."""
    try:
        # 전표 통계 조회
        voucher_query = select(
            func.count(Voucher.voucher_no),
            func.coalesce(func.sum(Voucher.total_debit), 0),
            func.coalesce(func.sum(Voucher.total_credit), 0)
        ).where(
            and_(
                Voucher.fiscal_year == fiscal_year,
                Voucher.fiscal_period == fiscal_period
            )
        )

        voucher_result = await db.execute(voucher_query)
        voucher_stats = voucher_result.first()

        total_vouchers = voucher_stats[0] if voucher_stats else 0
        total_debit = Decimal(str(voucher_stats[1])) if voucher_stats else Decimal("0")
        total_credit = Decimal(str(voucher_stats[2])) if voucher_stats else Decimal("0")

        # 결산 분개 조회
        entry_query = select(ClosingEntry).where(
            and_(
                ClosingEntry.fiscal_year == fiscal_year,
                ClosingEntry.fiscal_period == fiscal_period
            )
        )
        entry_result = await db.execute(entry_query)
        entries = entry_result.scalars().all()

        # 회계기간 상태 조회
        period_query = select(FiscalPeriod).where(
            and_(
                FiscalPeriod.fiscal_year == fiscal_year,
                FiscalPeriod.fiscal_period == fiscal_period
            )
        )
        period_result = await db.execute(period_query)
        period = period_result.scalar_one_or_none()

        status = period.status if period else ClosingStatus.IN_PROGRESS

        # 미전기 전표 수 조회
        unposted_query = select(func.count(Voucher.voucher_no)).where(
            and_(
                Voucher.fiscal_year == fiscal_year,
                Voucher.fiscal_period == fiscal_period,
                Voucher.status != VoucherStatus.POSTED
            )
        )
        unposted_result = await db.execute(unposted_query)
        unposted_count = unposted_result.scalar() or 0

        # 승인대기 전표 수 조회
        pending_query = select(func.count(Voucher.voucher_no)).where(
            and_(
                Voucher.fiscal_year == fiscal_year,
                Voucher.fiscal_period == fiscal_period,
                Voucher.status == VoucherStatus.PENDING
            )
        )
        pending_result = await db.execute(pending_query)
        pending_count = pending_result.scalar() or 0

        warnings = []
        if unposted_count > 0:
            warnings.append(f"미결 전표 {unposted_count}건 존재")
        if pending_count > 0:
            warnings.append(f"승인대기 전표 {pending_count}건 존재")

        can_close = total_debit == total_credit and unposted_count == 0 and pending_count == 0

        if total_vouchers == 0:
            # 데이터 없음 - 빈 응답 반환
            return ClosingSummary(
                fiscal_year=fiscal_year,
                fiscal_period=fiscal_period,
                closing_type=ClosingType.MONTHLY,
                status=status,
                total_vouchers=0,
                total_debit=Decimal("0"),
                total_credit=Decimal("0"),
                closing_entries=[],
                validation_results={
                    "is_balanced": True,
                    "unposted_vouchers": 0,
                    "pending_approvals": 0,
                    "warnings": [],
                    "can_close": True
                }
            )

        return ClosingSummary(
            fiscal_year=fiscal_year,
            fiscal_period=fiscal_period,
            closing_type=ClosingType.MONTHLY,
            status=status,
            total_vouchers=total_vouchers,
            total_debit=total_debit,
            total_credit=total_credit,
            closing_entries=[ClosingEntryResponse(**closing_entry_to_dict(e)) for e in entries],
            validation_results={
                "is_balanced": total_debit == total_credit,
                "unposted_vouchers": unposted_count,
                "pending_approvals": pending_count,
                "warnings": warnings,
                "can_close": can_close
            }
        )
    except Exception as e:
        print(f"Error fetching closing summary: {e}")
        raise HTTPException(status_code=500, detail=f"결산 요약 조회 실패: {str(e)}")


# ============== 재무제표 ==============

@router.get("/statements/balance-sheet", response_model=BalanceSheetResponse, summary="재무상태표")
async def get_balance_sheet(
    db: AsyncSession = Depends(get_db),
    fiscal_year: str = Query(..., description="회계연도"),
    fiscal_period: str = Query(..., description="회계기간")
):
    """재무상태표를 조회합니다."""
    try:
        # 저장된 재무제표 조회
        query = select(FinancialStatement).where(
            and_(
                FinancialStatement.fiscal_year == fiscal_year,
                FinancialStatement.fiscal_period == fiscal_period,
                FinancialStatement.statement_type == "BS"
            )
        )
        result = await db.execute(query)
        statement = result.scalar_one_or_none()

        if statement and statement.statement_data:
            return BalanceSheetResponse(**statement.statement_data)

        # 총계정원장에서 계정 유형별 잔액 집계
        ledger_query = select(
            AccountCode.account_type,
            func.sum(GeneralLedger.closing_balance)
        ).join(
            AccountCode, GeneralLedger.account_code == AccountCode.account_code
        ).where(
            and_(
                GeneralLedger.fiscal_year == fiscal_year,
                GeneralLedger.fiscal_period == fiscal_period
            )
        ).group_by(AccountCode.account_type)

        ledger_result = await db.execute(ledger_query)
        balances = {row[0]: row[1] or Decimal("0") for row in ledger_result}

        total_assets = balances.get(AccountType.ASSET, Decimal("0"))
        total_liabilities = balances.get(AccountType.LIABILITY, Decimal("0"))
        total_equity = balances.get(AccountType.EQUITY, Decimal("0"))

        if total_assets == 0 and total_liabilities == 0 and total_equity == 0:
            # 데이터 없음 - 빈 응답 반환
            return BalanceSheetResponse(
                fiscal_year=fiscal_year,
                fiscal_period=fiscal_period,
                as_of_date=date(int(fiscal_year), int(fiscal_period), 28),
                assets={
                    "current_assets": {"total": Decimal("0")},
                    "non_current_assets": {"total": Decimal("0")}
                },
                liabilities={
                    "current_liabilities": {"total": Decimal("0")},
                    "non_current_liabilities": {"total": Decimal("0")}
                },
                equity={
                    "capital_stock": Decimal("0"),
                    "retained_earnings": Decimal("0"),
                    "total": Decimal("0")
                },
                total_assets=Decimal("0"),
                total_liabilities=Decimal("0"),
                total_equity=Decimal("0")
            )

        return BalanceSheetResponse(
            fiscal_year=fiscal_year,
            fiscal_period=fiscal_period,
            as_of_date=date(int(fiscal_year), int(fiscal_period), 28),
            assets={
                "current_assets": {"total": total_assets},
                "non_current_assets": {"total": Decimal("0")}
            },
            liabilities={
                "current_liabilities": {"total": total_liabilities},
                "non_current_liabilities": {"total": Decimal("0")}
            },
            equity={
                "capital_stock": total_equity,
                "retained_earnings": Decimal("0"),
                "total": total_equity
            },
            total_assets=total_assets,
            total_liabilities=total_liabilities,
            total_equity=total_equity
        )
    except Exception as e:
        print(f"Error fetching balance sheet: {e}")
        raise HTTPException(status_code=500, detail=f"재무상태표 조회 실패: {str(e)}")


@router.get("/statements/income-statement", response_model=IncomeStatementResponse, summary="손익계산서")
async def get_income_statement(
    db: AsyncSession = Depends(get_db),
    fiscal_year: str = Query(..., description="회계연도"),
    fiscal_period: str = Query(..., description="회계기간")
):
    """손익계산서를 조회합니다."""
    try:
        # 저장된 재무제표 조회
        query = select(FinancialStatement).where(
            and_(
                FinancialStatement.fiscal_year == fiscal_year,
                FinancialStatement.fiscal_period == fiscal_period,
                FinancialStatement.statement_type == "IS"
            )
        )
        result = await db.execute(query)
        statement = result.scalar_one_or_none()

        if statement and statement.statement_data:
            return IncomeStatementResponse(**statement.statement_data)

        # 총계정원장에서 수익/비용 계정 집계
        ledger_query = select(
            AccountCode.account_type,
            func.sum(GeneralLedger.closing_balance)
        ).join(
            AccountCode, GeneralLedger.account_code == AccountCode.account_code
        ).where(
            and_(
                GeneralLedger.fiscal_year == fiscal_year,
                GeneralLedger.fiscal_period == fiscal_period,
                AccountCode.account_type.in_([AccountType.REVENUE, AccountType.EXPENSE])
            )
        ).group_by(AccountCode.account_type)

        ledger_result = await db.execute(ledger_query)
        balances = {row[0]: row[1] or Decimal("0") for row in ledger_result}

        total_revenue = balances.get(AccountType.REVENUE, Decimal("0"))
        total_expense = balances.get(AccountType.EXPENSE, Decimal("0"))

        period_end = date(int(fiscal_year), int(fiscal_period), 28)
        period_start = date(int(fiscal_year), int(fiscal_period), 1)

        if total_revenue == 0 and total_expense == 0:
            # 데이터 없음 - 빈 응답 반환
            return IncomeStatementResponse(
                fiscal_year=fiscal_year,
                fiscal_period=fiscal_period,
                period_start=period_start,
                period_end=period_end,
                revenue={"total": Decimal("0")},
                cost_of_sales={"total": Decimal("0")},
                gross_profit=Decimal("0"),
                operating_expenses={"total": Decimal("0")},
                operating_income=Decimal("0"),
                non_operating={"total": Decimal("0")},
                income_before_tax=Decimal("0"),
                tax_expense=Decimal("0"),
                net_income=Decimal("0")
            )

        net_income = total_revenue - total_expense

        return IncomeStatementResponse(
            fiscal_year=fiscal_year,
            fiscal_period=fiscal_period,
            period_start=period_start,
            period_end=period_end,
            revenue={"total": total_revenue},
            cost_of_sales={"total": Decimal("0")},
            gross_profit=total_revenue,
            operating_expenses={"total": total_expense},
            operating_income=net_income,
            non_operating={"total": Decimal("0")},
            income_before_tax=net_income,
            tax_expense=Decimal("0"),
            net_income=net_income
        )
    except Exception as e:
        print(f"Error fetching income statement: {e}")
        raise HTTPException(status_code=500, detail=f"손익계산서 조회 실패: {str(e)}")


@router.get("/statements/trial-balance", response_model=TrialBalanceResponse, summary="시산표")
async def get_trial_balance(
    db: AsyncSession = Depends(get_db),
    fiscal_year: str = Query(..., description="회계연도"),
    fiscal_period: str = Query(..., description="회계기간")
):
    """시산표를 조회합니다."""
    try:
        # 총계정원장에서 계정별 잔액 조회
        query = select(
            GeneralLedger.account_code,
            AccountCode.account_name,
            GeneralLedger.debit_total,
            GeneralLedger.credit_total
        ).join(
            AccountCode, GeneralLedger.account_code == AccountCode.account_code
        ).where(
            and_(
                GeneralLedger.fiscal_year == fiscal_year,
                GeneralLedger.fiscal_period == fiscal_period
            )
        ).order_by(GeneralLedger.account_code)

        result = await db.execute(query)
        rows = result.all()

        if not rows:
            # 데이터 없음 - 빈 응답 반환
            return TrialBalanceResponse(
                fiscal_year=fiscal_year,
                fiscal_period=fiscal_period,
                as_of_date=date(int(fiscal_year), int(fiscal_period), 28),
                items=[],
                total_debit=Decimal("0"),
                total_credit=Decimal("0"),
                is_balanced=True
            )

        items = []
        total_debit = Decimal("0")
        total_credit = Decimal("0")

        for row in rows:
            debit = row[2] or Decimal("0")
            credit = row[3] or Decimal("0")

            items.append({
                "account_code": row[0],
                "account_name": row[1],
                "debit": debit,
                "credit": credit
            })

            total_debit += debit
            total_credit += credit

        return TrialBalanceResponse(
            fiscal_year=fiscal_year,
            fiscal_period=fiscal_period,
            as_of_date=date(int(fiscal_year), int(fiscal_period), 28),
            items=items,
            total_debit=total_debit,
            total_credit=total_credit,
            is_balanced=total_debit == total_credit
        )
    except Exception as e:
        print(f"Error fetching trial balance: {e}")
        raise HTTPException(status_code=500, detail=f"시산표 조회 실패: {str(e)}")
