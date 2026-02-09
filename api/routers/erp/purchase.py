"""
ERP Purchase API Router
- 발주 (Purchase Orders)
- 입고 (Goods Receipts)
- 구매 분석 (Purchase Analysis)
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime, timedelta
import random

from api.schemas.erp.purchase import (
    # PO
    POCreate, POUpdate, POResponse, POListResponse,
    POStatus, POType,
    # Receipt
    ReceiptCreate, ReceiptUpdate, ReceiptResponse, ReceiptListResponse,
    ReceiptStatus,
    # Analysis
    PurchaseAnalysis, VendorPerformance,
)

router = APIRouter(prefix="/purchase", tags=["ERP Purchase"])


# ==================== Purchase Orders API ====================

@router.get("/orders", response_model=POListResponse)
async def get_purchase_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    vendor_code: Optional[str] = None,
    status: Optional[POStatus] = None,
    po_type: Optional[POType] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
):
    """발주 목록 조회"""
    orders = [
        {
            "id": 1,
            "po_no": "PO-2024-0050",
            "po_date": "2024-01-20T09:00:00",
            "po_type": "standard",
            "vendor_code": "V-001",
            "vendor_name": "삼성전기",
            "vendor_contact": "정담당",
            "vendor_phone": "031-300-7114",
            "deliver_to_address": "경기도 화성시 제조로 100 A동",
            "deliver_to_contact": "김입고",
            "requested_date": "2024-01-27T00:00:00",
            "confirmed_date": "2024-01-25T00:00:00",
            "payment_terms": "30일",
            "currency": "KRW",
            "exchange_rate": 1.0,
            "subtotal": 15000000,
            "tax_amount": 1500000,
            "total_amount": 16500000,
            "status": "completed",
            "buyer": "이구매",
            "created_by": "이구매",
            "approved_by": "박부장",
            "approved_at": "2024-01-20T10:00:00",
            "mrp_order_id": None,
            "mrp_order_no": None,
            "remarks": "정기 발주",
            "items": [
                {
                    "id": 1, "po_id": 1, "item_seq": 1,
                    "item_code": "IC-AP-001", "item_name": "AP Processor",
                    "order_qty": 1000, "received_qty": 1000, "remaining_qty": 0,
                    "unit": "EA", "unit_price": 15000, "amount": 15000000,
                    "requested_date": "2024-01-27T00:00:00", "confirmed_date": "2024-01-25T00:00:00",
                    "remarks": None,
                    "created_at": "2024-01-20T09:00:00", "updated_at": "2024-01-22T14:00:00",
                }
            ],
            "created_at": "2024-01-20T09:00:00",
            "updated_at": "2024-01-22T14:00:00",
        },
        {
            "id": 2,
            "po_no": "PO-2024-0051",
            "po_date": "2024-01-21T10:00:00",
            "po_type": "urgent",
            "vendor_code": "V-003",
            "vendor_name": "Murata Manufacturing",
            "vendor_contact": "Tanaka",
            "vendor_phone": "+81-75-955-6500",
            "deliver_to_address": "경기도 화성시 제조로 100 A동",
            "deliver_to_contact": "김입고",
            "requested_date": "2024-01-28T00:00:00",
            "confirmed_date": None,
            "payment_terms": "45일",
            "currency": "JPY",
            "exchange_rate": 9.5,
            "subtotal": 50000000,
            "tax_amount": 0,
            "total_amount": 50000000,
            "status": "confirmed",
            "buyer": "김구매",
            "created_by": "김구매",
            "approved_by": "최상무",
            "approved_at": "2024-01-21T11:00:00",
            "mrp_order_id": None,
            "mrp_order_no": None,
            "remarks": "긴급 발주 - 생산라인 자재 부족",
            "items": [
                {
                    "id": 2, "po_id": 2, "item_seq": 1,
                    "item_code": "CAP-MLCC-100N", "item_name": "MLCC 100nF",
                    "order_qty": 500000, "received_qty": 0, "remaining_qty": 500000,
                    "unit": "EA", "unit_price": 100, "amount": 50000000,
                    "requested_date": "2024-01-28T00:00:00", "confirmed_date": None,
                    "remarks": "긴급",
                    "created_at": "2024-01-21T10:00:00", "updated_at": "2024-01-21T10:00:00",
                }
            ],
            "created_at": "2024-01-21T10:00:00",
            "updated_at": "2024-01-21T11:00:00",
        },
        {
            "id": 3,
            "po_no": "PO-2024-0052",
            "po_date": "2024-01-22T14:00:00",
            "po_type": "standard",
            "vendor_code": "V-004",
            "vendor_name": "Texas Instruments",
            "vendor_contact": "Michael Lee",
            "vendor_phone": "+1-972-995-2011",
            "deliver_to_address": "경기도 화성시 제조로 100 A동",
            "deliver_to_contact": "김입고",
            "requested_date": "2024-02-20T00:00:00",
            "confirmed_date": "2024-02-15T00:00:00",
            "payment_terms": "60일",
            "currency": "USD",
            "exchange_rate": 1350.0,
            "subtotal": 75000,
            "tax_amount": 0,
            "total_amount": 75000,
            "status": "sent",
            "buyer": "박구매",
            "created_by": "박구매",
            "approved_by": "박부장",
            "approved_at": "2024-01-22T15:00:00",
            "mrp_order_id": None,
            "mrp_order_no": None,
            "remarks": "수입 발주",
            "items": [
                {
                    "id": 3, "po_id": 3, "item_seq": 1,
                    "item_code": "IC-PWR-001", "item_name": "전원 IC",
                    "order_qty": 5000, "received_qty": 0, "remaining_qty": 5000,
                    "unit": "EA", "unit_price": 15, "amount": 75000,
                    "requested_date": "2024-02-20T00:00:00", "confirmed_date": "2024-02-15T00:00:00",
                    "remarks": None,
                    "created_at": "2024-01-22T14:00:00", "updated_at": "2024-01-22T15:00:00",
                }
            ],
            "created_at": "2024-01-22T14:00:00",
            "updated_at": "2024-01-22T15:00:00",
        },
        {
            "id": 4,
            "po_no": "PO-2024-0053",
            "po_date": "2024-01-23T09:00:00",
            "po_type": "standard",
            "vendor_code": "V-002",
            "vendor_name": "대덕전자",
            "vendor_contact": "이담당",
            "vendor_phone": "042-930-8114",
            "deliver_to_address": "경기도 화성시 제조로 100 A동",
            "deliver_to_contact": "김입고",
            "requested_date": "2024-02-10T00:00:00",
            "confirmed_date": None,
            "payment_terms": "30일",
            "currency": "KRW",
            "exchange_rate": 1.0,
            "subtotal": 25000000,
            "tax_amount": 2500000,
            "total_amount": 27500000,
            "status": "approved",
            "buyer": "이구매",
            "created_by": "이구매",
            "approved_by": "박부장",
            "approved_at": "2024-01-23T10:00:00",
            "mrp_order_id": 100,
            "mrp_order_no": "MRP-2024-001",
            "remarks": "MRP 기반 자동 발주",
            "items": [
                {
                    "id": 4, "po_id": 4, "item_seq": 1,
                    "item_code": "PCB-RAW-001", "item_name": "PCB 원판 8레이어",
                    "order_qty": 500, "received_qty": 0, "remaining_qty": 500,
                    "unit": "EA", "unit_price": 50000, "amount": 25000000,
                    "requested_date": "2024-02-10T00:00:00", "confirmed_date": None,
                    "remarks": None,
                    "created_at": "2024-01-23T09:00:00", "updated_at": "2024-01-23T10:00:00",
                }
            ],
            "created_at": "2024-01-23T09:00:00",
            "updated_at": "2024-01-23T10:00:00",
        },
    ]

    return {
        "items": orders,
        "total": len(orders),
        "page": page,
        "page_size": page_size,
    }


@router.get("/orders/{po_id}", response_model=POResponse)
async def get_purchase_order(po_id: int):
    """발주 상세 조회"""
    return {
        "id": po_id,
        "po_no": f"PO-2024-{po_id:04d}",
        "po_date": "2024-01-20T09:00:00",
        "po_type": "standard",
        "vendor_code": "V-001",
        "vendor_name": "삼성전기",
        "vendor_contact": "정담당",
        "vendor_phone": "031-300-7114",
        "deliver_to_address": "경기도 화성시 제조로 100 A동",
        "deliver_to_contact": "김입고",
        "requested_date": "2024-01-27T00:00:00",
        "confirmed_date": "2024-01-25T00:00:00",
        "payment_terms": "30일",
        "currency": "KRW",
        "exchange_rate": 1.0,
        "subtotal": 15000000,
        "tax_amount": 1500000,
        "total_amount": 16500000,
        "status": "completed",
        "buyer": "이구매",
        "created_by": "이구매",
        "approved_by": "박부장",
        "approved_at": "2024-01-20T10:00:00",
        "mrp_order_id": None,
        "mrp_order_no": None,
        "remarks": "정기 발주",
        "items": [
            {
                "id": 1, "po_id": po_id, "item_seq": 1,
                "item_code": "IC-AP-001", "item_name": "AP Processor",
                "order_qty": 1000, "received_qty": 1000, "remaining_qty": 0,
                "unit": "EA", "unit_price": 15000, "amount": 15000000,
                "requested_date": "2024-01-27T00:00:00", "confirmed_date": "2024-01-25T00:00:00",
                "remarks": None,
                "created_at": "2024-01-20T09:00:00", "updated_at": "2024-01-22T14:00:00",
            }
        ],
        "created_at": "2024-01-20T09:00:00",
        "updated_at": "2024-01-22T14:00:00",
    }


@router.post("/orders", response_model=POResponse)
async def create_purchase_order(po: POCreate):
    """발주 등록"""
    now = datetime.utcnow()
    return {
        "id": 100,
        "po_no": f"PO-{now.strftime('%Y')}-{random.randint(1000, 9999)}",
        "po_date": now.isoformat(),
        **po.model_dump(exclude={"items"}),
        "created_by": "시스템",
        "approved_by": None,
        "approved_at": None,
        "items": [
            {"id": i + 1, "po_id": 100, **item.model_dump(),
             "created_at": now.isoformat(), "updated_at": now.isoformat()}
            for i, item in enumerate(po.items)
        ],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }


@router.put("/orders/{po_id}", response_model=POResponse)
async def update_purchase_order(po_id: int, po: POUpdate):
    """발주 수정"""
    now = datetime.utcnow()
    return {
        "id": po_id,
        "po_no": f"PO-2024-{po_id:04d}",
        "po_date": "2024-01-20T09:00:00",
        "po_type": "standard",
        "vendor_code": "V-001",
        "vendor_name": po.vendor_name or "삼성전기",
        "vendor_contact": po.vendor_contact or "정담당",
        "vendor_phone": po.vendor_phone or "031-300-7114",
        "deliver_to_address": po.deliver_to_address or "경기도 화성시 제조로 100",
        "deliver_to_contact": po.deliver_to_contact or "김입고",
        "requested_date": po.requested_date or "2024-01-27T00:00:00",
        "confirmed_date": po.confirmed_date or "2024-01-25T00:00:00",
        "payment_terms": po.payment_terms or "30일",
        "currency": "KRW",
        "exchange_rate": 1.0,
        "subtotal": 15000000,
        "tax_amount": 1500000,
        "total_amount": 16500000,
        "status": po.status or "completed",
        "buyer": po.buyer or "이구매",
        "created_by": "이구매",
        "approved_by": "박부장",
        "approved_at": "2024-01-20T10:00:00",
        "mrp_order_id": None,
        "mrp_order_no": None,
        "remarks": po.remarks,
        "items": [],
        "created_at": "2024-01-20T09:00:00",
        "updated_at": now.isoformat(),
    }


@router.post("/orders/{po_id}/approve")
async def approve_purchase_order(po_id: int):
    """발주 승인"""
    return {"message": f"Purchase order {po_id} has been approved"}


@router.post("/orders/{po_id}/send")
async def send_purchase_order(po_id: int):
    """발주서 발송"""
    return {"message": f"Purchase order {po_id} has been sent to vendor"}


@router.post("/orders/{po_id}/cancel")
async def cancel_purchase_order(po_id: int):
    """발주 취소"""
    return {"message": f"Purchase order {po_id} has been cancelled"}


# ==================== Goods Receipts API ====================

@router.get("/receipts", response_model=ReceiptListResponse)
async def get_receipts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    vendor_code: Optional[str] = None,
    po_no: Optional[str] = None,
    status: Optional[ReceiptStatus] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
):
    """입고 목록 조회"""
    receipts = [
        {
            "id": 1,
            "receipt_no": "GR-2024-0001",
            "receipt_date": "2024-01-22T10:30:00",
            "po_id": 1,
            "po_no": "PO-2024-0050",
            "vendor_code": "V-001",
            "vendor_name": "삼성전기",
            "delivery_note_no": "DN-SAM-2024-0100",
            "invoice_no": "INV-SAM-2024-0100",
            "warehouse_code": "WH-RM-01",
            "location_code": "A-01-01",
            "status": "stored",
            "receiver": "김입고",
            "inspector": "이검수",
            "approved_by": "박부장",
            "approved_at": "2024-01-22T11:00:00",
            "remarks": None,
            "items": [
                {
                    "id": 1, "receipt_id": 1, "item_seq": 1,
                    "item_code": "IC-AP-001", "item_name": "AP Processor",
                    "receipt_qty": 1000, "accepted_qty": 1000, "rejected_qty": 0,
                    "unit": "EA",
                    "lot_no": "LOT-2024-0122-001", "batch_no": "BATCH-NEW",
                    "expiry_date": None, "manufacturing_date": "2024-01-15T00:00:00",
                    "unit_price": 15000, "amount": 15000000,
                    "inspection_result": "PASS", "inspection_remarks": None,
                    "warehouse_code": "WH-RM-01", "location_code": "A-01-01",
                    "remarks": None,
                    "created_at": "2024-01-22T10:30:00", "updated_at": "2024-01-22T11:00:00",
                }
            ],
            "created_at": "2024-01-22T10:30:00",
            "updated_at": "2024-01-22T11:00:00",
        },
        {
            "id": 2,
            "receipt_no": "GR-2024-0002",
            "receipt_date": "2024-01-23T09:00:00",
            "po_id": None,
            "po_no": None,
            "vendor_code": "V-005",
            "vendor_name": "한솔테크닉스",
            "delivery_note_no": "DN-HAN-2024-050",
            "invoice_no": None,
            "warehouse_code": "WH-RM-01",
            "location_code": "B-03-02",
            "status": "inspecting",
            "receiver": "박입고",
            "inspector": None,
            "approved_by": None,
            "approved_at": None,
            "remarks": "발주 없는 직접 입고",
            "items": [
                {
                    "id": 2, "receipt_id": 2, "item_seq": 1,
                    "item_code": "CON-USB-001", "item_name": "USB 커넥터",
                    "receipt_qty": 5000, "accepted_qty": 0, "rejected_qty": 0,
                    "unit": "EA",
                    "lot_no": "LOT-2024-0123-001", "batch_no": "BATCH-HAN",
                    "expiry_date": None, "manufacturing_date": "2024-01-20T00:00:00",
                    "unit_price": 500, "amount": 2500000,
                    "inspection_result": None, "inspection_remarks": None,
                    "warehouse_code": "WH-RM-01", "location_code": "B-03-02",
                    "remarks": None,
                    "created_at": "2024-01-23T09:00:00", "updated_at": "2024-01-23T09:00:00",
                }
            ],
            "created_at": "2024-01-23T09:00:00",
            "updated_at": "2024-01-23T09:00:00",
        },
    ]

    return {
        "items": receipts,
        "total": len(receipts),
        "page": page,
        "page_size": page_size,
    }


@router.get("/receipts/{receipt_id}", response_model=ReceiptResponse)
async def get_receipt(receipt_id: int):
    """입고 상세 조회"""
    return {
        "id": receipt_id,
        "receipt_no": f"GR-2024-{receipt_id:04d}",
        "receipt_date": "2024-01-22T10:30:00",
        "po_id": 1,
        "po_no": "PO-2024-0050",
        "vendor_code": "V-001",
        "vendor_name": "삼성전기",
        "delivery_note_no": "DN-SAM-2024-0100",
        "invoice_no": "INV-SAM-2024-0100",
        "warehouse_code": "WH-RM-01",
        "location_code": "A-01-01",
        "status": "stored",
        "receiver": "김입고",
        "inspector": "이검수",
        "approved_by": "박부장",
        "approved_at": "2024-01-22T11:00:00",
        "remarks": None,
        "items": [
            {
                "id": 1, "receipt_id": receipt_id, "item_seq": 1,
                "item_code": "IC-AP-001", "item_name": "AP Processor",
                "receipt_qty": 1000, "accepted_qty": 1000, "rejected_qty": 0,
                "unit": "EA",
                "lot_no": "LOT-2024-0122-001", "batch_no": "BATCH-NEW",
                "expiry_date": None, "manufacturing_date": "2024-01-15T00:00:00",
                "unit_price": 15000, "amount": 15000000,
                "inspection_result": "PASS", "inspection_remarks": None,
                "warehouse_code": "WH-RM-01", "location_code": "A-01-01",
                "remarks": None,
                "created_at": "2024-01-22T10:30:00", "updated_at": "2024-01-22T11:00:00",
            }
        ],
        "created_at": "2024-01-22T10:30:00",
        "updated_at": "2024-01-22T11:00:00",
    }


@router.post("/receipts", response_model=ReceiptResponse)
async def create_receipt(receipt: ReceiptCreate):
    """입고 등록"""
    now = datetime.utcnow()
    return {
        "id": 100,
        "receipt_no": f"GR-{now.strftime('%Y')}-{random.randint(1000, 9999)}",
        "receipt_date": now.isoformat(),
        **receipt.model_dump(exclude={"items"}),
        "receiver": None,
        "inspector": None,
        "approved_by": None,
        "approved_at": None,
        "items": [
            {"id": i + 1, "receipt_id": 100, **item.model_dump(),
             "created_at": now.isoformat(), "updated_at": now.isoformat()}
            for i, item in enumerate(receipt.items)
        ],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }


@router.patch("/receipts/{receipt_id}", response_model=ReceiptResponse)
async def update_receipt(receipt_id: int, receipt: ReceiptUpdate):
    """입고 상태 변경"""
    now = datetime.utcnow()
    return {
        "id": receipt_id,
        "receipt_no": f"GR-2024-{receipt_id:04d}",
        "receipt_date": "2024-01-22T10:30:00",
        "po_id": 1,
        "po_no": "PO-2024-0050",
        "vendor_code": "V-001",
        "vendor_name": "삼성전기",
        "delivery_note_no": receipt.delivery_note_no or "DN-SAM-2024-0100",
        "invoice_no": receipt.invoice_no or "INV-SAM-2024-0100",
        "warehouse_code": receipt.warehouse_code or "WH-RM-01",
        "location_code": receipt.location_code or "A-01-01",
        "status": receipt.status or "stored",
        "receiver": receipt.receiver or "김입고",
        "inspector": receipt.inspector or "이검수",
        "approved_by": "박부장",
        "approved_at": "2024-01-22T11:00:00",
        "remarks": receipt.remarks,
        "items": [],
        "created_at": "2024-01-22T10:30:00",
        "updated_at": now.isoformat(),
    }


@router.post("/receipts/{receipt_id}/inspect")
async def complete_inspection(
    receipt_id: int,
    result: str = Query(..., description="PASS, FAIL, CONDITIONAL"),
):
    """검수 완료"""
    return {"message": f"Inspection for receipt {receipt_id} completed with result: {result}"}


# ==================== Analysis API ====================

@router.get("/analysis", response_model=PurchaseAnalysis)
async def get_purchase_analysis(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
):
    """구매 분석"""
    return {
        "period": "2024-01",
        "total_orders": 85,
        "total_amount": 3500000000,
        "order_by_status": {
            "draft": 5,
            "approved": 15,
            "sent": 20,
            "confirmed": 10,
            "partial": 8,
            "completed": 25,
            "closed": 2,
        },
        "amount_by_vendor": [
            {"vendor_code": "V-001", "vendor_name": "삼성전기", "amount": 850000000, "ratio": 24.3},
            {"vendor_code": "V-003", "vendor_name": "Murata", "amount": 720000000, "ratio": 20.6},
            {"vendor_code": "V-004", "vendor_name": "Texas Instruments", "amount": 650000000, "ratio": 18.6},
            {"vendor_code": "V-002", "vendor_name": "대덕전자", "amount": 580000000, "ratio": 16.6},
            {"vendor_code": "V-005", "vendor_name": "한솔테크닉스", "amount": 350000000, "ratio": 10.0},
            {"vendor_code": "기타", "vendor_name": "기타", "amount": 350000000, "ratio": 10.0},
        ],
        "amount_by_category": [
            {"category": "IC/반도체", "amount": 1500000000, "ratio": 42.9},
            {"category": "수동부품", "amount": 800000000, "ratio": 22.9},
            {"category": "PCB", "amount": 600000000, "ratio": 17.1},
            {"category": "커넥터", "amount": 350000000, "ratio": 10.0},
            {"category": "기타", "amount": 250000000, "ratio": 7.1},
        ],
        "monthly_trend": [
            {"month": "2024-01", "orders": 85, "amount": 3500000000},
            {"month": "2023-12", "orders": 78, "amount": 3200000000},
            {"month": "2023-11", "orders": 72, "amount": 2900000000},
            {"month": "2023-10", "orders": 68, "amount": 2700000000},
        ]
    }


@router.get("/analysis/vendors")
async def get_vendor_performance():
    """공급업체별 실적"""
    return {
        "period": "2024-01",
        "performances": [
            {
                "vendor_code": "V-001",
                "vendor_name": "삼성전기",
                "total_orders": 25,
                "total_amount": 850000000,
                "on_time_rate": 95.0,
                "quality_rate": 99.5,
                "overall_score": 97.0,
            },
            {
                "vendor_code": "V-003",
                "vendor_name": "Murata",
                "total_orders": 18,
                "total_amount": 720000000,
                "on_time_rate": 92.0,
                "quality_rate": 99.8,
                "overall_score": 95.5,
            },
            {
                "vendor_code": "V-004",
                "vendor_name": "Texas Instruments",
                "total_orders": 15,
                "total_amount": 650000000,
                "on_time_rate": 88.0,
                "quality_rate": 99.0,
                "overall_score": 93.0,
            },
            {
                "vendor_code": "V-002",
                "vendor_name": "대덕전자",
                "total_orders": 12,
                "total_amount": 580000000,
                "on_time_rate": 90.0,
                "quality_rate": 98.0,
                "overall_score": 93.5,
            },
            {
                "vendor_code": "V-005",
                "vendor_name": "한솔테크닉스",
                "total_orders": 10,
                "total_amount": 350000000,
                "on_time_rate": 85.0,
                "quality_rate": 96.0,
                "overall_score": 89.5,
            },
        ]
    }


@router.get("/analysis/lead-time")
async def get_lead_time_analysis():
    """리드타임 분석"""
    return {
        "period": "2024-01",
        "avg_lead_time_days": 18.5,
        "by_vendor": [
            {"vendor_code": "V-001", "vendor_name": "삼성전기", "avg_days": 12, "min_days": 7, "max_days": 18},
            {"vendor_code": "V-002", "vendor_name": "대덕전자", "avg_days": 20, "min_days": 14, "max_days": 28},
            {"vendor_code": "V-003", "vendor_name": "Murata", "avg_days": 25, "min_days": 21, "max_days": 35},
            {"vendor_code": "V-004", "vendor_name": "TI", "avg_days": 32, "min_days": 28, "max_days": 42},
            {"vendor_code": "V-005", "vendor_name": "한솔테크닉스", "avg_days": 8, "min_days": 5, "max_days": 12},
        ],
        "by_category": [
            {"category": "IC/반도체", "avg_days": 28, "min_days": 14, "max_days": 42},
            {"category": "수동부품", "avg_days": 22, "min_days": 14, "max_days": 35},
            {"category": "PCB", "avg_days": 18, "min_days": 14, "max_days": 28},
            {"category": "커넥터", "avg_days": 8, "min_days": 5, "max_days": 14},
        ]
    }
