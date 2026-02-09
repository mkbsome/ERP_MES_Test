"""
ERP Inventory API Router
- 창고 마스터 (Warehouses)
- 재고 현황 (Stock)
- 재고 이동 (Transactions)
- 재고 분석 (Analysis)
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime, timedelta
import random

from api.schemas.erp.inventory import (
    # Warehouse
    WarehouseCreate, WarehouseUpdate, WarehouseResponse, WarehouseListResponse,
    WarehouseType,
    # Stock
    StockResponse, StockListResponse, StockSummary,
    StockStatus,
    # Transaction
    TransactionCreate, TransactionResponse, TransactionListResponse,
    TransactionType, TransactionReason,
    # Analysis
    InventoryAnalysis, InventoryMovementSummary,
)

router = APIRouter(prefix="/inventory", tags=["ERP Inventory"])


# ==================== Warehouses API ====================

@router.get("/warehouses", response_model=WarehouseListResponse)
async def get_warehouses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    warehouse_type: Optional[WarehouseType] = None,
    is_active: Optional[bool] = None,
):
    """창고 목록 조회"""
    warehouses = [
        {
            "id": 1,
            "warehouse_code": "WH-RM-01",
            "warehouse_name": "원자재 창고 1",
            "warehouse_type": "raw_material",
            "location": "A동 1층",
            "address": "경기도 화성시 제조로 100",
            "manager_name": "김창고",
            "manager_phone": "031-123-4567",
            "max_capacity": 10000,
            "current_capacity": 7500,
            "capacity_unit": "m³",
            "is_active": True,
            "remarks": "주요 원자재 보관",
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-15T10:00:00",
        },
        {
            "id": 2,
            "warehouse_code": "WH-WIP-01",
            "warehouse_name": "재공품 창고",
            "warehouse_type": "wip",
            "location": "B동 1층",
            "address": "경기도 화성시 제조로 100",
            "manager_name": "이창고",
            "manager_phone": "031-123-4568",
            "max_capacity": 5000,
            "current_capacity": 3200,
            "capacity_unit": "m³",
            "is_active": True,
            "remarks": "생산 중 재공품 보관",
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-16T11:00:00",
        },
        {
            "id": 3,
            "warehouse_code": "WH-FG-01",
            "warehouse_name": "완제품 창고 1",
            "warehouse_type": "finished_goods",
            "location": "C동 1층",
            "address": "경기도 화성시 제조로 100",
            "manager_name": "박창고",
            "manager_phone": "031-123-4569",
            "max_capacity": 15000,
            "current_capacity": 12000,
            "capacity_unit": "m³",
            "is_active": True,
            "remarks": "주요 완제품 보관 및 출하",
            "created_at": "2024-01-02T00:00:00",
            "updated_at": "2024-01-17T09:00:00",
        },
        {
            "id": 4,
            "warehouse_code": "WH-DEF-01",
            "warehouse_name": "불량품 창고",
            "warehouse_type": "defective",
            "location": "D동 지하 1층",
            "address": "경기도 화성시 제조로 100",
            "manager_name": "최품질",
            "manager_phone": "031-123-4570",
            "max_capacity": 500,
            "current_capacity": 150,
            "capacity_unit": "m³",
            "is_active": True,
            "remarks": "불량품 격리 보관",
            "created_at": "2024-01-03T00:00:00",
            "updated_at": "2024-01-18T14:00:00",
        },
    ]

    return {
        "items": warehouses,
        "total": len(warehouses),
        "page": page,
        "page_size": page_size,
    }


@router.get("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
async def get_warehouse(warehouse_id: int):
    """창고 상세 조회"""
    return {
        "id": warehouse_id,
        "warehouse_code": "WH-RM-01",
        "warehouse_name": "원자재 창고 1",
        "warehouse_type": "raw_material",
        "location": "A동 1층",
        "address": "경기도 화성시 제조로 100",
        "manager_name": "김창고",
        "manager_phone": "031-123-4567",
        "max_capacity": 10000,
        "current_capacity": 7500,
        "capacity_unit": "m³",
        "is_active": True,
        "remarks": "주요 원자재 보관",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-15T10:00:00",
    }


@router.post("/warehouses", response_model=WarehouseResponse)
async def create_warehouse(warehouse: WarehouseCreate):
    """창고 등록"""
    return {
        "id": 100,
        **warehouse.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


# ==================== Stock API ====================

@router.get("/stock", response_model=StockListResponse)
async def get_stock(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    item_code: Optional[str] = None,
    warehouse_code: Optional[str] = None,
    status: Optional[StockStatus] = None,
    low_stock_only: Optional[bool] = None,
):
    """재고 현황 조회"""
    stocks = [
        {
            "id": 1,
            "item_code": "IC-AP-001",
            "item_name": "AP Processor",
            "warehouse_code": "WH-RM-01",
            "location_code": "A-01-01",
            "quantity": 5000,
            "reserved_qty": 500,
            "available_qty": 4500,
            "unit": "EA",
            "lot_no": "LOT-2024-0115-001",
            "batch_no": "BATCH-001",
            "expiry_date": None,
            "manufacturing_date": "2024-01-10T00:00:00",
            "unit_cost": 15000,
            "total_value": 75000000,
            "status": "available",
            "last_receipt_date": "2024-01-15T10:00:00",
            "last_issue_date": "2024-01-20T14:00:00",
            "created_at": "2024-01-15T00:00:00",
            "updated_at": "2024-01-20T14:00:00",
        },
        {
            "id": 2,
            "item_code": "IC-MEM-001",
            "item_name": "Memory IC",
            "warehouse_code": "WH-RM-01",
            "location_code": "A-01-02",
            "quantity": 10000,
            "reserved_qty": 2000,
            "available_qty": 8000,
            "unit": "EA",
            "lot_no": "LOT-2024-0112-002",
            "batch_no": "BATCH-002",
            "expiry_date": None,
            "manufacturing_date": "2024-01-08T00:00:00",
            "unit_cost": 8000,
            "total_value": 80000000,
            "status": "available",
            "last_receipt_date": "2024-01-12T09:00:00",
            "last_issue_date": "2024-01-21T11:00:00",
            "created_at": "2024-01-12T00:00:00",
            "updated_at": "2024-01-21T11:00:00",
        },
        {
            "id": 3,
            "item_code": "CAP-MLCC-100N",
            "item_name": "MLCC 100nF",
            "warehouse_code": "WH-RM-01",
            "location_code": "B-02-01",
            "quantity": 500000,
            "reserved_qty": 50000,
            "available_qty": 450000,
            "unit": "EA",
            "lot_no": "LOT-2024-0110-003",
            "batch_no": "BATCH-003",
            "expiry_date": None,
            "manufacturing_date": "2024-01-05T00:00:00",
            "unit_cost": 10,
            "total_value": 5000000,
            "status": "available",
            "last_receipt_date": "2024-01-10T08:00:00",
            "last_issue_date": "2024-01-22T09:00:00",
            "created_at": "2024-01-10T00:00:00",
            "updated_at": "2024-01-22T09:00:00",
        },
        {
            "id": 4,
            "item_code": "FG-MB-001",
            "item_name": "스마트폰 메인보드 A타입",
            "warehouse_code": "WH-FG-01",
            "location_code": "C-01-01",
            "quantity": 2500,
            "reserved_qty": 800,
            "available_qty": 1700,
            "unit": "EA",
            "lot_no": "LOT-2024-0120-001",
            "batch_no": "PROD-001",
            "expiry_date": None,
            "manufacturing_date": "2024-01-20T00:00:00",
            "unit_cost": 15000,
            "total_value": 37500000,
            "status": "available",
            "last_receipt_date": "2024-01-22T16:00:00",
            "last_issue_date": "2024-01-23T10:00:00",
            "created_at": "2024-01-20T00:00:00",
            "updated_at": "2024-01-23T10:00:00",
        },
        {
            "id": 5,
            "item_code": "FG-ECU-001",
            "item_name": "자동차 ECU 보드",
            "warehouse_code": "WH-FG-01",
            "location_code": "C-02-01",
            "quantity": 500,
            "reserved_qty": 200,
            "available_qty": 300,
            "unit": "EA",
            "lot_no": "LOT-2024-0118-002",
            "batch_no": "PROD-002",
            "expiry_date": None,
            "manufacturing_date": "2024-01-18T00:00:00",
            "unit_cost": 45000,
            "total_value": 22500000,
            "status": "available",
            "last_receipt_date": "2024-01-20T14:00:00",
            "last_issue_date": "2024-01-22T15:00:00",
            "created_at": "2024-01-18T00:00:00",
            "updated_at": "2024-01-22T15:00:00",
        },
    ]

    return {
        "items": stocks,
        "total": len(stocks),
        "page": page,
        "page_size": page_size,
    }


@router.get("/stock/{item_code}", response_model=StockSummary)
async def get_item_stock(item_code: str):
    """품목별 재고 요약"""
    return {
        "item_code": item_code,
        "item_name": "AP Processor",
        "total_qty": 5000,
        "available_qty": 4500,
        "reserved_qty": 500,
        "total_value": 75000000,
        "warehouse_distribution": {
            "WH-RM-01": {"quantity": 4000, "available": 3500},
            "WH-WIP-01": {"quantity": 800, "available": 800},
            "WH-FG-01": {"quantity": 200, "available": 200},
        }
    }


# ==================== Transactions API ====================

@router.get("/transactions", response_model=TransactionListResponse)
async def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    item_code: Optional[str] = None,
    warehouse_code: Optional[str] = None,
    transaction_type: Optional[TransactionType] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
):
    """재고 이동 이력 조회"""
    transactions = [
        {
            "id": 1,
            "transaction_no": "TXN-2024-0001",
            "transaction_date": "2024-01-22T10:30:00",
            "item_code": "IC-AP-001",
            "item_name": "AP Processor",
            "transaction_type": "receipt",
            "transaction_reason": "purchase",
            "from_warehouse": None,
            "from_location": None,
            "to_warehouse": "WH-RM-01",
            "to_location": "A-01-01",
            "quantity": 1000,
            "unit": "EA",
            "lot_no": "LOT-2024-0122-001",
            "batch_no": "BATCH-NEW",
            "unit_cost": 15000,
            "total_value": 15000000,
            "reference_type": "PO",
            "reference_no": "PO-2024-0050",
            "remarks": "정기 발주 입고",
            "created_by": "김입고",
            "approved_by": "이승인",
            "approved_at": "2024-01-22T10:35:00",
            "created_at": "2024-01-22T10:30:00",
            "updated_at": "2024-01-22T10:35:00",
        },
        {
            "id": 2,
            "transaction_no": "TXN-2024-0002",
            "transaction_date": "2024-01-22T14:00:00",
            "item_code": "IC-AP-001",
            "item_name": "AP Processor",
            "transaction_type": "issue",
            "transaction_reason": "production",
            "from_warehouse": "WH-RM-01",
            "from_location": "A-01-01",
            "to_warehouse": None,
            "to_location": None,
            "quantity": 200,
            "unit": "EA",
            "lot_no": "LOT-2024-0115-001",
            "batch_no": "BATCH-001",
            "unit_cost": 15000,
            "total_value": 3000000,
            "reference_type": "WO",
            "reference_no": "WO-2024-0100",
            "remarks": "생산 투입",
            "created_by": "박출고",
            "approved_by": None,
            "approved_at": None,
            "created_at": "2024-01-22T14:00:00",
            "updated_at": "2024-01-22T14:00:00",
        },
        {
            "id": 3,
            "transaction_no": "TXN-2024-0003",
            "transaction_date": "2024-01-22T16:00:00",
            "item_code": "FG-MB-001",
            "item_name": "스마트폰 메인보드 A타입",
            "transaction_type": "production_in",
            "transaction_reason": "production",
            "from_warehouse": None,
            "from_location": None,
            "to_warehouse": "WH-FG-01",
            "to_location": "C-01-01",
            "quantity": 500,
            "unit": "EA",
            "lot_no": "LOT-2024-0122-002",
            "batch_no": "PROD-NEW",
            "unit_cost": 15000,
            "total_value": 7500000,
            "reference_type": "WO",
            "reference_no": "WO-2024-0100",
            "remarks": "생산 완료 입고",
            "created_by": "김생산",
            "approved_by": "이승인",
            "approved_at": "2024-01-22T16:05:00",
            "created_at": "2024-01-22T16:00:00",
            "updated_at": "2024-01-22T16:05:00",
        },
        {
            "id": 4,
            "transaction_no": "TXN-2024-0004",
            "transaction_date": "2024-01-23T09:00:00",
            "item_code": "FG-MB-001",
            "item_name": "스마트폰 메인보드 A타입",
            "transaction_type": "issue",
            "transaction_reason": "sales",
            "from_warehouse": "WH-FG-01",
            "from_location": "C-01-01",
            "to_warehouse": None,
            "to_location": None,
            "quantity": 300,
            "unit": "EA",
            "lot_no": "LOT-2024-0120-001",
            "batch_no": "PROD-001",
            "unit_cost": 25000,
            "total_value": 7500000,
            "reference_type": "SO",
            "reference_no": "SO-2024-0030",
            "remarks": "삼성전자 출하",
            "created_by": "최출하",
            "approved_by": "박승인",
            "approved_at": "2024-01-23T09:10:00",
            "created_at": "2024-01-23T09:00:00",
            "updated_at": "2024-01-23T09:10:00",
        },
        {
            "id": 5,
            "transaction_no": "TXN-2024-0005",
            "transaction_date": "2024-01-23T11:00:00",
            "item_code": "CAP-MLCC-100N",
            "item_name": "MLCC 100nF",
            "transaction_type": "transfer",
            "transaction_reason": "production",
            "from_warehouse": "WH-RM-01",
            "from_location": "B-02-01",
            "to_warehouse": "WH-WIP-01",
            "to_location": "W-01-01",
            "quantity": 10000,
            "unit": "EA",
            "lot_no": "LOT-2024-0110-003",
            "batch_no": "BATCH-003",
            "unit_cost": 10,
            "total_value": 100000,
            "reference_type": "TR",
            "reference_no": "TR-2024-0010",
            "remarks": "생산라인 이동",
            "created_by": "정이동",
            "approved_by": None,
            "approved_at": None,
            "created_at": "2024-01-23T11:00:00",
            "updated_at": "2024-01-23T11:00:00",
        },
    ]

    return {
        "items": transactions,
        "total": len(transactions),
        "page": page,
        "page_size": page_size,
    }


@router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(transaction: TransactionCreate):
    """재고 이동 등록"""
    now = datetime.utcnow()
    return {
        "id": 100,
        "transaction_no": f"TXN-{now.strftime('%Y%m%d')}-{random.randint(1000, 9999)}",
        "transaction_date": now.isoformat(),
        **transaction.model_dump(),
        "created_by": "시스템",
        "approved_by": None,
        "approved_at": None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }


# ==================== Analysis API ====================

@router.get("/analysis", response_model=InventoryAnalysis)
async def get_inventory_analysis():
    """재고 분석"""
    return {
        "total_items": 3000,
        "total_value": 5850000000,
        "stock_by_warehouse": {
            "WH-RM-01": {"items": 1500, "value": 2500000000},
            "WH-WIP-01": {"items": 500, "value": 850000000},
            "WH-FG-01": {"items": 950, "value": 2450000000},
            "WH-DEF-01": {"items": 50, "value": 50000000},
        },
        "stock_by_status": {
            "available": {"items": 2700, "value": 5400000000},
            "reserved": {"items": 200, "value": 350000000},
            "quality_hold": {"items": 80, "value": 80000000},
            "blocked": {"items": 20, "value": 20000000},
        },
        "low_stock_items": [
            {"item_code": "IC-PWR-001", "item_name": "전원 IC", "current_qty": 100, "safety_stock": 500, "shortage": 400},
            {"item_code": "CON-USB-001", "item_name": "USB 커넥터", "current_qty": 200, "safety_stock": 1000, "shortage": 800},
            {"item_code": "RES-0402-1K", "item_name": "저항 1K", "current_qty": 5000, "safety_stock": 20000, "shortage": 15000},
        ],
        "excess_stock_items": [
            {"item_code": "CAP-ELEC-100", "item_name": "전해콘덴서 100uF", "current_qty": 50000, "max_stock": 20000, "excess": 30000},
            {"item_code": "LED-WHT-001", "item_name": "백색 LED", "current_qty": 100000, "max_stock": 50000, "excess": 50000},
        ],
        "aging_analysis": {
            "0-30_days": {"items": 2000, "value": 4000000000},
            "31-60_days": {"items": 600, "value": 1200000000},
            "61-90_days": {"items": 300, "value": 500000000},
            "over_90_days": {"items": 100, "value": 150000000},
        }
    }


@router.get("/analysis/movement", response_model=InventoryMovementSummary)
async def get_movement_summary(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
):
    """재고 이동 요약"""
    return {
        "period": "2024-01-01 ~ 2024-01-31",
        "total_receipts": 450,
        "total_issues": 380,
        "total_transfers": 120,
        "receipt_value": 2500000000,
        "issue_value": 2100000000,
        "movement_by_type": {
            "receipt": {"count": 300, "value": 2000000000},
            "production_in": {"count": 150, "value": 500000000},
            "issue": {"count": 250, "value": 1500000000},
            "production_out": {"count": 130, "value": 600000000},
            "transfer": {"count": 120, "value": 400000000},
            "adjustment": {"count": 20, "value": 50000000},
        },
        "top_moving_items": [
            {"item_code": "CAP-MLCC-100N", "item_name": "MLCC 100nF", "receipts": 500000, "issues": 480000},
            {"item_code": "RES-0402-10K", "item_name": "저항 10K", "receipts": 300000, "issues": 290000},
            {"item_code": "IC-AP-001", "item_name": "AP Processor", "receipts": 5000, "issues": 4500},
            {"item_code": "IC-MEM-001", "item_name": "Memory IC", "receipts": 10000, "issues": 9500},
            {"item_code": "FG-MB-001", "item_name": "메인보드 A타입", "receipts": 3000, "issues": 2800},
        ]
    }


@router.get("/valuation")
async def get_inventory_valuation(
    as_of_date: Optional[datetime] = None,
    warehouse_code: Optional[str] = None,
):
    """재고 평가"""
    return {
        "as_of_date": (as_of_date or datetime.utcnow()).isoformat(),
        "valuation_method": "이동평균법",
        "total_value": 5850000000,
        "by_category": {
            "원자재": {"items": 1500, "qty": 2000000, "value": 2500000000},
            "재공품": {"items": 500, "qty": 50000, "value": 850000000},
            "완제품": {"items": 950, "qty": 30000, "value": 2450000000},
            "불량품": {"items": 50, "qty": 1000, "value": 50000000},
        },
        "by_product_group": {
            "스마트폰": {"value": 1500000000, "ratio": 25.6},
            "자동차": {"value": 1200000000, "ratio": 20.5},
            "LED": {"value": 800000000, "ratio": 13.7},
            "IoT": {"value": 600000000, "ratio": 10.3},
            "전원부품": {"value": 500000000, "ratio": 8.5},
            "기타": {"value": 1250000000, "ratio": 21.4},
        }
    }
