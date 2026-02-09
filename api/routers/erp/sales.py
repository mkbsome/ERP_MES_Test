"""
ERP Sales API Router
- 수주 (Sales Orders)
- 출하 (Shipments)
- 영업 분석 (Sales Analysis)
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime, timedelta
import random

from api.schemas.erp.sales import (
    # Order
    SalesOrderCreate, SalesOrderUpdate, SalesOrderResponse, SalesOrderListResponse,
    OrderStatus, PaymentTerms, DeliveryTerms,
    # Shipment
    ShipmentCreate, ShipmentUpdate, ShipmentResponse, ShipmentListResponse,
    ShipmentStatus,
    # Analysis
    SalesAnalysis, SalesPerformance,
)

router = APIRouter(prefix="/sales", tags=["ERP Sales"])


# ==================== Sales Orders API ====================

@router.get("/orders", response_model=SalesOrderListResponse)
async def get_sales_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    customer_code: Optional[str] = None,
    status: Optional[OrderStatus] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
):
    """수주 목록 조회"""
    orders = [
        {
            "id": 1,
            "order_no": "SO-2024-0001",
            "order_date": "2024-01-15T09:00:00",
            "customer_code": "C-001",
            "customer_name": "삼성전자",
            "customer_po_no": "SAM-PO-2024-001",
            "ship_to_address": "경기도 화성시 삼성전자로 1",
            "ship_to_contact": "김담당",
            "ship_to_phone": "031-1234-5678",
            "requested_date": "2024-01-30T00:00:00",
            "promised_date": "2024-01-28T00:00:00",
            "payment_terms": "net_30",
            "delivery_terms": "EXW",
            "currency": "KRW",
            "exchange_rate": 1.0,
            "subtotal": 250000000,
            "tax_amount": 25000000,
            "total_amount": 275000000,
            "status": "confirmed",
            "sales_rep": "이영업",
            "created_by": "이영업",
            "approved_by": "박부장",
            "approved_at": "2024-01-15T10:00:00",
            "remarks": "긴급 납품 요청",
            "items": [
                {
                    "id": 1, "order_id": 1, "item_seq": 1,
                    "product_code": "FG-MB-001", "product_name": "스마트폰 메인보드 A타입",
                    "order_qty": 10000, "shipped_qty": 0, "remaining_qty": 10000,
                    "unit": "EA", "unit_price": 25000, "discount_rate": 0, "amount": 250000000,
                    "requested_date": "2024-01-30T00:00:00", "promised_date": "2024-01-28T00:00:00",
                    "remarks": None,
                    "created_at": "2024-01-15T09:00:00", "updated_at": "2024-01-15T09:00:00",
                }
            ],
            "created_at": "2024-01-15T09:00:00",
            "updated_at": "2024-01-15T10:00:00",
        },
        {
            "id": 2,
            "order_no": "SO-2024-0002",
            "order_date": "2024-01-16T10:30:00",
            "customer_code": "C-003",
            "customer_name": "현대모비스",
            "customer_po_no": "HMB-PO-2024-050",
            "ship_to_address": "서울시 강남구 테헤란로 203",
            "ship_to_contact": "이담당",
            "ship_to_phone": "02-2018-5000",
            "requested_date": "2024-02-15T00:00:00",
            "promised_date": "2024-02-10T00:00:00",
            "payment_terms": "net_45",
            "delivery_terms": "EXW",
            "currency": "KRW",
            "exchange_rate": 1.0,
            "subtotal": 175000000,
            "tax_amount": 17500000,
            "total_amount": 192500000,
            "status": "in_production",
            "sales_rep": "김영업",
            "created_by": "김영업",
            "approved_by": "박부장",
            "approved_at": "2024-01-16T11:00:00",
            "remarks": None,
            "items": [
                {
                    "id": 2, "order_id": 2, "item_seq": 1,
                    "product_code": "FG-ECU-001", "product_name": "자동차 ECU 보드",
                    "order_qty": 2500, "shipped_qty": 500, "remaining_qty": 2000,
                    "unit": "EA", "unit_price": 70000, "discount_rate": 0, "amount": 175000000,
                    "requested_date": "2024-02-15T00:00:00", "promised_date": "2024-02-10T00:00:00",
                    "remarks": None,
                    "created_at": "2024-01-16T10:30:00", "updated_at": "2024-01-20T14:00:00",
                }
            ],
            "created_at": "2024-01-16T10:30:00",
            "updated_at": "2024-01-20T14:00:00",
        },
        {
            "id": 3,
            "order_no": "SO-2024-0003",
            "order_date": "2024-01-17T14:00:00",
            "customer_code": "C-004",
            "customer_name": "Apple Inc.",
            "customer_po_no": "AAPL-2024-KR-001",
            "ship_to_address": "One Apple Park Way, Cupertino, CA",
            "ship_to_contact": "John Smith",
            "ship_to_phone": "+1-408-996-1010",
            "requested_date": "2024-03-01T00:00:00",
            "promised_date": "2024-02-25T00:00:00",
            "payment_terms": "net_60",
            "delivery_terms": "FOB",
            "currency": "USD",
            "exchange_rate": 1350.0,
            "subtotal": 500000,
            "tax_amount": 0,
            "total_amount": 500000,
            "status": "confirmed",
            "sales_rep": "박영업",
            "created_by": "박영업",
            "approved_by": "최상무",
            "approved_at": "2024-01-17T15:00:00",
            "remarks": "수출 주문",
            "items": [
                {
                    "id": 3, "order_id": 3, "item_seq": 1,
                    "product_code": "FG-MB-001", "product_name": "스마트폰 메인보드 A타입",
                    "order_qty": 20000, "shipped_qty": 0, "remaining_qty": 20000,
                    "unit": "EA", "unit_price": 25, "discount_rate": 0, "amount": 500000,
                    "requested_date": "2024-03-01T00:00:00", "promised_date": "2024-02-25T00:00:00",
                    "remarks": None,
                    "created_at": "2024-01-17T14:00:00", "updated_at": "2024-01-17T15:00:00",
                }
            ],
            "created_at": "2024-01-17T14:00:00",
            "updated_at": "2024-01-17T15:00:00",
        },
        {
            "id": 4,
            "order_no": "SO-2024-0004",
            "order_date": "2024-01-18T09:30:00",
            "customer_code": "C-002",
            "customer_name": "LG전자",
            "customer_po_no": "LGE-PO-2024-100",
            "ship_to_address": "서울시 영등포구 여의대로 128",
            "ship_to_contact": "박담당",
            "ship_to_phone": "02-3777-1114",
            "requested_date": "2024-02-05T00:00:00",
            "promised_date": "2024-02-01T00:00:00",
            "payment_terms": "net_30",
            "delivery_terms": "EXW",
            "currency": "KRW",
            "exchange_rate": 1.0,
            "subtotal": 80000000,
            "tax_amount": 8000000,
            "total_amount": 88000000,
            "status": "shipped",
            "sales_rep": "이영업",
            "created_by": "이영업",
            "approved_by": "박부장",
            "approved_at": "2024-01-18T10:00:00",
            "remarks": None,
            "items": [
                {
                    "id": 4, "order_id": 4, "item_seq": 1,
                    "product_code": "FG-LED-001", "product_name": "LED 드라이버 보드",
                    "order_qty": 16000, "shipped_qty": 16000, "remaining_qty": 0,
                    "unit": "EA", "unit_price": 5000, "discount_rate": 0, "amount": 80000000,
                    "requested_date": "2024-02-05T00:00:00", "promised_date": "2024-02-01T00:00:00",
                    "remarks": None,
                    "created_at": "2024-01-18T09:30:00", "updated_at": "2024-01-25T16:00:00",
                }
            ],
            "created_at": "2024-01-18T09:30:00",
            "updated_at": "2024-01-25T16:00:00",
        },
    ]

    return {
        "items": orders,
        "total": len(orders),
        "page": page,
        "page_size": page_size,
    }


@router.get("/orders/{order_id}", response_model=SalesOrderResponse)
async def get_sales_order(order_id: int):
    """수주 상세 조회"""
    return {
        "id": order_id,
        "order_no": f"SO-2024-{order_id:04d}",
        "order_date": "2024-01-15T09:00:00",
        "customer_code": "C-001",
        "customer_name": "삼성전자",
        "customer_po_no": "SAM-PO-2024-001",
        "ship_to_address": "경기도 화성시 삼성전자로 1",
        "ship_to_contact": "김담당",
        "ship_to_phone": "031-1234-5678",
        "requested_date": "2024-01-30T00:00:00",
        "promised_date": "2024-01-28T00:00:00",
        "payment_terms": "net_30",
        "delivery_terms": "EXW",
        "currency": "KRW",
        "exchange_rate": 1.0,
        "subtotal": 250000000,
        "tax_amount": 25000000,
        "total_amount": 275000000,
        "status": "confirmed",
        "sales_rep": "이영업",
        "created_by": "이영업",
        "approved_by": "박부장",
        "approved_at": "2024-01-15T10:00:00",
        "remarks": "긴급 납품 요청",
        "items": [
            {
                "id": 1, "order_id": order_id, "item_seq": 1,
                "product_code": "FG-MB-001", "product_name": "스마트폰 메인보드 A타입",
                "order_qty": 10000, "shipped_qty": 0, "remaining_qty": 10000,
                "unit": "EA", "unit_price": 25000, "discount_rate": 0, "amount": 250000000,
                "requested_date": "2024-01-30T00:00:00", "promised_date": "2024-01-28T00:00:00",
                "remarks": None,
                "created_at": "2024-01-15T09:00:00", "updated_at": "2024-01-15T09:00:00",
            }
        ],
        "created_at": "2024-01-15T09:00:00",
        "updated_at": "2024-01-15T10:00:00",
    }


@router.post("/orders", response_model=SalesOrderResponse)
async def create_sales_order(order: SalesOrderCreate):
    """수주 등록"""
    now = datetime.utcnow()
    return {
        "id": 100,
        "order_no": f"SO-{now.strftime('%Y')}-{random.randint(1000, 9999)}",
        "order_date": now.isoformat(),
        **order.model_dump(exclude={"items"}),
        "created_by": "시스템",
        "approved_by": None,
        "approved_at": None,
        "items": [
            {"id": i + 1, "order_id": 100, **item.model_dump(),
             "created_at": now.isoformat(), "updated_at": now.isoformat()}
            for i, item in enumerate(order.items)
        ],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }


@router.put("/orders/{order_id}", response_model=SalesOrderResponse)
async def update_sales_order(order_id: int, order: SalesOrderUpdate):
    """수주 수정"""
    now = datetime.utcnow()
    return {
        "id": order_id,
        "order_no": f"SO-2024-{order_id:04d}",
        "order_date": "2024-01-15T09:00:00",
        "customer_code": "C-001",
        "customer_name": order.customer_name or "삼성전자",
        "customer_po_no": order.customer_po_no or "SAM-PO-2024-001",
        "ship_to_address": order.ship_to_address or "경기도 화성시 삼성전자로 1",
        "ship_to_contact": order.ship_to_contact or "김담당",
        "ship_to_phone": order.ship_to_phone or "031-1234-5678",
        "requested_date": order.requested_date or "2024-01-30T00:00:00",
        "promised_date": order.promised_date or "2024-01-28T00:00:00",
        "payment_terms": order.payment_terms or "net_30",
        "delivery_terms": order.delivery_terms or "EXW",
        "currency": "KRW",
        "exchange_rate": 1.0,
        "subtotal": 250000000,
        "tax_amount": 25000000,
        "total_amount": 275000000,
        "status": order.status or "confirmed",
        "sales_rep": order.sales_rep or "이영업",
        "created_by": "이영업",
        "approved_by": "박부장",
        "approved_at": "2024-01-15T10:00:00",
        "remarks": order.remarks,
        "items": [],
        "created_at": "2024-01-15T09:00:00",
        "updated_at": now.isoformat(),
    }


@router.post("/orders/{order_id}/confirm")
async def confirm_sales_order(order_id: int):
    """수주 확정"""
    return {"message": f"Sales order {order_id} has been confirmed"}


@router.post("/orders/{order_id}/cancel")
async def cancel_sales_order(order_id: int):
    """수주 취소"""
    return {"message": f"Sales order {order_id} has been cancelled"}


# ==================== Shipments API ====================

@router.get("/shipments", response_model=ShipmentListResponse)
async def get_shipments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    customer_code: Optional[str] = None,
    order_no: Optional[str] = None,
    status: Optional[ShipmentStatus] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
):
    """출하 목록 조회"""
    shipments = [
        {
            "id": 1,
            "shipment_no": "SH-2024-0001",
            "shipment_date": "2024-01-25T14:00:00",
            "order_id": 4,
            "order_no": "SO-2024-0004",
            "customer_code": "C-002",
            "customer_name": "LG전자",
            "ship_to_address": "서울시 영등포구 여의대로 128",
            "ship_to_contact": "박담당",
            "ship_to_phone": "02-3777-1114",
            "carrier": "CJ대한통운",
            "tracking_no": "123456789012",
            "status": "delivered",
            "picker": "정피커",
            "packer": "김포장",
            "shipper": "이출하",
            "remarks": None,
            "items": [
                {
                    "id": 1, "shipment_id": 1, "item_seq": 1,
                    "product_code": "FG-LED-001", "product_name": "LED 드라이버 보드",
                    "ship_qty": 16000, "unit": "EA",
                    "lot_no": "LOT-2024-0122-002", "batch_no": "PROD-NEW",
                    "warehouse_code": "WH-FG-01", "location_code": "C-03-01",
                    "remarks": None,
                    "created_at": "2024-01-25T14:00:00", "updated_at": "2024-01-25T14:00:00",
                }
            ],
            "created_at": "2024-01-25T14:00:00",
            "updated_at": "2024-01-26T10:00:00",
        },
        {
            "id": 2,
            "shipment_no": "SH-2024-0002",
            "shipment_date": "2024-01-20T10:00:00",
            "order_id": 2,
            "order_no": "SO-2024-0002",
            "customer_code": "C-003",
            "customer_name": "현대모비스",
            "ship_to_address": "서울시 강남구 테헤란로 203",
            "ship_to_contact": "이담당",
            "ship_to_phone": "02-2018-5000",
            "carrier": "한진택배",
            "tracking_no": "987654321098",
            "status": "shipped",
            "picker": "박피커",
            "packer": "최포장",
            "shipper": "정출하",
            "remarks": "1차 부분출하",
            "items": [
                {
                    "id": 2, "shipment_id": 2, "item_seq": 1,
                    "product_code": "FG-ECU-001", "product_name": "자동차 ECU 보드",
                    "ship_qty": 500, "unit": "EA",
                    "lot_no": "LOT-2024-0118-002", "batch_no": "PROD-002",
                    "warehouse_code": "WH-FG-01", "location_code": "C-02-01",
                    "remarks": None,
                    "created_at": "2024-01-20T10:00:00", "updated_at": "2024-01-20T10:00:00",
                }
            ],
            "created_at": "2024-01-20T10:00:00",
            "updated_at": "2024-01-20T14:00:00",
        },
    ]

    return {
        "items": shipments,
        "total": len(shipments),
        "page": page,
        "page_size": page_size,
    }


@router.get("/shipments/{shipment_id}", response_model=ShipmentResponse)
async def get_shipment(shipment_id: int):
    """출하 상세 조회"""
    return {
        "id": shipment_id,
        "shipment_no": f"SH-2024-{shipment_id:04d}",
        "shipment_date": "2024-01-25T14:00:00",
        "order_id": 4,
        "order_no": "SO-2024-0004",
        "customer_code": "C-002",
        "customer_name": "LG전자",
        "ship_to_address": "서울시 영등포구 여의대로 128",
        "ship_to_contact": "박담당",
        "ship_to_phone": "02-3777-1114",
        "carrier": "CJ대한통운",
        "tracking_no": "123456789012",
        "status": "delivered",
        "picker": "정피커",
        "packer": "김포장",
        "shipper": "이출하",
        "remarks": None,
        "items": [
            {
                "id": 1, "shipment_id": shipment_id, "item_seq": 1,
                "product_code": "FG-LED-001", "product_name": "LED 드라이버 보드",
                "ship_qty": 16000, "unit": "EA",
                "lot_no": "LOT-2024-0122-002", "batch_no": "PROD-NEW",
                "warehouse_code": "WH-FG-01", "location_code": "C-03-01",
                "remarks": None,
                "created_at": "2024-01-25T14:00:00", "updated_at": "2024-01-25T14:00:00",
            }
        ],
        "created_at": "2024-01-25T14:00:00",
        "updated_at": "2024-01-26T10:00:00",
    }


@router.post("/shipments", response_model=ShipmentResponse)
async def create_shipment(shipment: ShipmentCreate):
    """출하 등록"""
    now = datetime.utcnow()
    return {
        "id": 100,
        "shipment_no": f"SH-{now.strftime('%Y')}-{random.randint(1000, 9999)}",
        "shipment_date": now.isoformat(),
        **shipment.model_dump(exclude={"items"}),
        "picker": None,
        "packer": None,
        "shipper": None,
        "items": [
            {"id": i + 1, "shipment_id": 100, **item.model_dump(),
             "created_at": now.isoformat(), "updated_at": now.isoformat()}
            for i, item in enumerate(shipment.items)
        ],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }


@router.patch("/shipments/{shipment_id}", response_model=ShipmentResponse)
async def update_shipment(shipment_id: int, shipment: ShipmentUpdate):
    """출하 상태 변경"""
    now = datetime.utcnow()
    return {
        "id": shipment_id,
        "shipment_no": f"SH-2024-{shipment_id:04d}",
        "shipment_date": "2024-01-25T14:00:00",
        "order_id": 4,
        "order_no": "SO-2024-0004",
        "customer_code": "C-002",
        "customer_name": "LG전자",
        "ship_to_address": "서울시 영등포구 여의대로 128",
        "ship_to_contact": "박담당",
        "ship_to_phone": "02-3777-1114",
        "carrier": shipment.carrier or "CJ대한통운",
        "tracking_no": shipment.tracking_no or "123456789012",
        "status": shipment.status or "shipped",
        "picker": shipment.picker or "정피커",
        "packer": shipment.packer or "김포장",
        "shipper": shipment.shipper or "이출하",
        "remarks": shipment.remarks,
        "items": [],
        "created_at": "2024-01-25T14:00:00",
        "updated_at": now.isoformat(),
    }


# ==================== Analysis API ====================

@router.get("/analysis", response_model=SalesAnalysis)
async def get_sales_analysis(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
):
    """영업 분석"""
    return {
        "period": "2024-01",
        "total_orders": 150,
        "total_revenue": 18500000000,
        "order_by_status": {
            "confirmed": 45,
            "in_production": 35,
            "ready": 20,
            "shipped": 40,
            "closed": 10,
        },
        "revenue_by_customer": [
            {"customer_code": "C-001", "customer_name": "삼성전자", "revenue": 5500000000, "ratio": 29.7},
            {"customer_code": "C-004", "customer_name": "Apple Inc.", "revenue": 4500000000, "ratio": 24.3},
            {"customer_code": "C-003", "customer_name": "현대모비스", "revenue": 3200000000, "ratio": 17.3},
            {"customer_code": "C-002", "customer_name": "LG전자", "revenue": 2800000000, "ratio": 15.1},
            {"customer_code": "C-005", "customer_name": "SK하이닉스", "revenue": 2500000000, "ratio": 13.5},
        ],
        "revenue_by_product": [
            {"product_code": "FG-MB-001", "product_name": "스마트폰 메인보드 A타입", "revenue": 7500000000, "ratio": 40.5},
            {"product_code": "FG-ECU-001", "product_name": "자동차 ECU 보드", "revenue": 4500000000, "ratio": 24.3},
            {"product_code": "FG-IOT-001", "product_name": "IoT 통신 모듈", "revenue": 3000000000, "ratio": 16.2},
            {"product_code": "FG-LED-001", "product_name": "LED 드라이버 보드", "revenue": 2000000000, "ratio": 10.8},
            {"product_code": "FG-PB-001", "product_name": "전원보드 Standard", "revenue": 1500000000, "ratio": 8.1},
        ],
        "monthly_trend": [
            {"month": "2024-01", "orders": 150, "revenue": 18500000000},
            {"month": "2023-12", "orders": 140, "revenue": 17200000000},
            {"month": "2023-11", "orders": 135, "revenue": 16800000000},
            {"month": "2023-10", "orders": 128, "revenue": 15500000000},
        ]
    }


@router.get("/analysis/performance")
async def get_sales_performance():
    """영업 담당자별 실적"""
    return {
        "period": "2024-01",
        "performances": [
            {
                "sales_rep": "이영업",
                "total_orders": 45,
                "total_revenue": 6500000000,
                "avg_order_value": 144444444,
                "achievement_rate": 115.0,
            },
            {
                "sales_rep": "박영업",
                "total_orders": 38,
                "total_revenue": 5800000000,
                "avg_order_value": 152631579,
                "achievement_rate": 108.0,
            },
            {
                "sales_rep": "김영업",
                "total_orders": 42,
                "total_revenue": 4200000000,
                "avg_order_value": 100000000,
                "achievement_rate": 95.0,
            },
            {
                "sales_rep": "최영업",
                "total_orders": 25,
                "total_revenue": 2000000000,
                "avg_order_value": 80000000,
                "achievement_rate": 82.0,
            },
        ]
    }


@router.get("/analysis/delivery")
async def get_delivery_performance():
    """납기 준수율 분석"""
    return {
        "period": "2024-01",
        "total_shipments": 120,
        "on_time_shipments": 108,
        "on_time_rate": 90.0,
        "avg_delay_days": 1.5,
        "by_customer": [
            {"customer_code": "C-001", "customer_name": "삼성전자", "on_time_rate": 95.0},
            {"customer_code": "C-004", "customer_name": "Apple Inc.", "on_time_rate": 92.0},
            {"customer_code": "C-002", "customer_name": "LG전자", "on_time_rate": 88.0},
            {"customer_code": "C-003", "customer_name": "현대모비스", "on_time_rate": 85.0},
        ],
        "delay_reasons": [
            {"reason": "생산 지연", "count": 5, "ratio": 41.7},
            {"reason": "자재 부족", "count": 4, "ratio": 33.3},
            {"reason": "운송 지연", "count": 2, "ratio": 16.7},
            {"reason": "품질 이상", "count": 1, "ratio": 8.3},
        ]
    }
