"""
Base Data Generator API
Generates realistic normal business flow data:
  Order → Production Planning → Procurement → Receiving → Production → Shipping

This creates the "baseline" normal data that scenarios can then MODIFY to create anomalies.
"""
import uuid
import random
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from decimal import Decimal
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from api.database import get_db

router = APIRouter(prefix="/base-data", tags=["Base Data Generator"])

# Tenant ID for all generated data
TENANT_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"


# ============ Pydantic Models ============

class BaseDataConfig(BaseModel):
    """Configuration for base data generation"""
    start_date: date = Field(description="Start date for data generation")
    end_date: date = Field(description="End date for data generation")
    daily_order_count: int = Field(default=5, ge=1, le=20, description="Average daily orders")
    include_erp: bool = Field(default=True, description="Generate ERP data")
    include_mes: bool = Field(default=True, description="Generate MES data")
    realistic_delays: bool = Field(default=True, description="Add realistic processing delays between stages")


class BaseDataStatus(BaseModel):
    """Status of base data generation job"""
    job_id: str
    status: str  # pending, running, completed, failed
    progress: float  # 0.0 to 100.0
    current_date: Optional[date] = None
    total_days: int = 0
    processed_days: int = 0
    records_generated: Dict[str, int] = Field(default_factory=dict)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class BaseDataSummary(BaseModel):
    """Summary of generated base data"""
    date_range: Dict[str, Any]  # Can contain strings and integers
    erp_records: Dict[str, int]
    mes_records: Dict[str, int]
    business_flow_stats: Dict[str, Any]


# ============ In-Memory Job Storage ============

_generation_jobs: Dict[str, BaseDataStatus] = {}


# ============ Helper Functions ============

def get_random_product(products: List[Dict]) -> Dict:
    """Select a random product with weighted probability"""
    return random.choice(products)


def get_random_customer(customers: List[Dict]) -> Dict:
    """Select a random customer"""
    return random.choice(customers)


def get_random_vendor(vendors: List[Dict]) -> Dict:
    """Select a random vendor"""
    return random.choice(vendors)


def get_random_line() -> str:
    """Get random production line"""
    return random.choice(["LINE-A", "LINE-B", "LINE-C", "LINE-D", "LINE-E"])


def generate_order_no(prefix: str, date_val: date, seq: int) -> str:
    """Generate order number with date and sequence"""
    return f"{prefix}-{date_val.strftime('%Y%m%d')}-{seq:04d}"


async def get_master_data(db: AsyncSession) -> Dict[str, List[Dict]]:
    """Fetch all master data needed for generation"""

    # Products
    result = await db.execute(text("""
        SELECT product_code, product_name, unit_price, product_type, uom
        FROM erp_product_master WHERE is_active = true
    """))
    products = [dict(zip(['code', 'name', 'price', 'type', 'uom'], row)) for row in result.fetchall()]

    # Customers
    result = await db.execute(text("""
        SELECT id, customer_code, customer_name, payment_terms
        FROM erp_customer_master WHERE is_active = true
    """))
    customers = [dict(zip(['id', 'code', 'name', 'payment_terms'], row)) for row in result.fetchall()]

    # Vendors
    result = await db.execute(text("""
        SELECT id, vendor_code, vendor_name, payment_terms
        FROM erp_vendor_master WHERE is_active = true
    """))
    vendors = [dict(zip(['id', 'code', 'name', 'payment_terms'], row)) for row in result.fetchall()]

    # Warehouses
    result = await db.execute(text("""
        SELECT warehouse_code FROM erp_warehouse
    """))
    warehouses = [row[0] for row in result.fetchall()]

    # Production Lines
    result = await db.execute(text("""
        SELECT line_code FROM mes_production_line
    """))
    lines = [row[0] for row in result.fetchall()]

    return {
        'products': products if products else [{'code': 'PROD-001', 'name': 'Sample Product', 'price': 1000, 'type': 'FINISHED', 'uom': 'EA'}],
        'customers': customers if customers else [{'id': 1, 'code': 'CUST-001', 'name': 'Sample Customer', 'payment_terms': 'NET30'}],
        'vendors': vendors if vendors else [{'id': 1, 'code': 'VEND-001', 'name': 'Sample Vendor', 'payment_terms': 'NET30'}],
        'warehouses': warehouses if warehouses else ['WH-001'],
        'lines': lines if lines else ['LINE-A', 'LINE-B']
    }


# ============ Business Flow Generator ============

async def generate_day_data(
    db: AsyncSession,
    current_date: date,
    config: BaseDataConfig,
    master_data: Dict,
    day_seq: int
) -> Dict[str, int]:
    """
    Generate one day's worth of business flow data.

    Flow: Sales Order → Work Order → Production Order → Production Result → Shipment
    """
    records = {
        'sales_orders': 0,
        'sales_order_items': 0,
        'work_orders': 0,
        'production_orders': 0,
        'production_results': 0,
        'purchase_orders': 0,
        'purchase_order_items': 0,
        'goods_receipts': 0,
        'shipments': 0
    }

    # Determine order count for this day (with some variance)
    order_count = max(1, config.daily_order_count + random.randint(-2, 2))

    for order_seq in range(order_count):
        try:
            # ============ Stage 1: Sales Order ============
            customer = random.choice(master_data['customers'])
            product = random.choice(master_data['products'])
            qty = random.randint(100, 1000)
            unit_price = float(product.get('price', 1000))

            # Delivery date: 3-14 days from order date
            delivery_days = random.randint(3, 14)
            delivery_date = current_date + timedelta(days=delivery_days)

            sales_order_no = generate_order_no("SO", current_date, day_seq * 100 + order_seq + 1)

            # Insert Sales Order
            so_result = await db.execute(text("""
                INSERT INTO erp_sales_order (
                    tenant_id, order_no, order_date, customer_id, customer_code, customer_name,
                    delivery_date, status, total_amount, tax_amount, currency, created_at
                ) VALUES (
                    CAST(:tenant_id AS uuid), :order_no, :order_date, :customer_id, :customer_code, :customer_name,
                    :delivery_date, 'confirmed', :total, :tax, 'KRW', NOW()
                ) RETURNING id
            """), {
                'tenant_id': TENANT_ID,
                'order_no': sales_order_no,
                'order_date': current_date,
                'customer_id': customer['id'],
                'customer_code': customer['code'],
                'customer_name': customer['name'],
                'delivery_date': delivery_date,
                'total': qty * unit_price,
                'tax': qty * unit_price * 0.1
            })
            so_id = so_result.scalar()
            records['sales_orders'] += 1

            # Insert Sales Order Item
            await db.execute(text("""
                INSERT INTO erp_sales_order_item (
                    tenant_id, order_id, order_no, line_no, product_code, product_name,
                    order_qty, unit_price, amount, uom, delivery_date, status, created_at
                ) VALUES (
                    CAST(:tenant_id AS uuid), :order_id, :order_no, 1, :product_code, :product_name,
                    :qty, :unit_price, :amount, :uom, :delivery_date, 'confirmed', NOW()
                )
            """), {
                'tenant_id': TENANT_ID,
                'order_id': so_id,
                'order_no': sales_order_no,
                'product_code': product['code'],
                'product_name': product['name'],
                'qty': qty,
                'unit_price': unit_price,
                'amount': qty * unit_price,
                'uom': product.get('uom', 'EA'),
                'delivery_date': delivery_date
            })
            records['sales_order_items'] += 1

            # ============ Stage 2: Work Order (ERP) ============
            # Create with slight delay (typically same day or next day)
            work_order_date = current_date if random.random() > 0.3 else current_date + timedelta(days=1)
            work_order_no = generate_order_no("WO", current_date, day_seq * 100 + order_seq + 1)

            # Planned production dates
            planned_start = work_order_date + timedelta(days=random.randint(1, 3))
            planned_end = planned_start + timedelta(days=random.randint(1, 5))

            wo_result = await db.execute(text("""
                INSERT INTO erp_work_order (
                    tenant_id, work_order_no, order_date, product_code, product_name,
                    order_qty, completed_qty, scrap_qty, sales_order_id,
                    planned_start, planned_end, status, priority, created_at
                ) VALUES (
                    CAST(:tenant_id AS uuid), :work_order_no, :order_date, :product_code, :product_name,
                    :qty, 0, 0, :sales_order_id,
                    :planned_start, :planned_end, 'released', :priority, NOW()
                ) RETURNING id
            """), {
                'tenant_id': TENANT_ID,
                'work_order_no': work_order_no,
                'order_date': work_order_date,
                'product_code': product['code'],
                'product_name': product['name'],
                'qty': qty,
                'sales_order_id': so_id,
                'planned_start': planned_start,
                'planned_end': planned_end,
                'priority': random.choice([1, 2, 3])  # 1=high, 3=low
            })
            wo_id = wo_result.scalar()
            records['work_orders'] += 1

            # ============ Stage 3: Production Order (MES) ============
            line_code = random.choice(master_data['lines']) if master_data['lines'] else 'LINE-A'
            prod_order_no = generate_order_no("PO", current_date, day_seq * 100 + order_seq + 1)

            prod_order_id = str(uuid.uuid4())
            await db.execute(text("""
                INSERT INTO mes_production_order (
                    id, tenant_id, production_order_no, erp_work_order_no, order_date,
                    product_code, product_name, line_code, target_qty, produced_qty,
                    good_qty, defect_qty, scrap_qty, planned_start, planned_end,
                    status, priority, completion_rate, created_at
                ) VALUES (
                    CAST(:id AS uuid), CAST(:tenant_id AS uuid), :prod_order_no, :work_order_no, :order_date,
                    :product_code, :product_name, :line_code, :target_qty, 0,
                    0, 0, 0, :planned_start, :planned_end,
                    'planned', :priority, 0, NOW()
                )
            """), {
                'id': prod_order_id,
                'tenant_id': TENANT_ID,
                'prod_order_no': prod_order_no,
                'work_order_no': work_order_no,
                'order_date': work_order_date,
                'product_code': product['code'],
                'product_name': product['name'],
                'line_code': line_code,
                'target_qty': qty,
                'planned_start': datetime.combine(planned_start, datetime.min.time()),
                'planned_end': datetime.combine(planned_end, datetime.min.time()),
                'priority': random.choice([1, 2, 3])
            })
            records['production_orders'] += 1

            # ============ Stage 4: Purchase Order (for materials) ============
            # Not all orders need new purchases (30% chance)
            if random.random() < 0.3:
                vendor = random.choice(master_data['vendors'])
                po_no = generate_order_no("PO", current_date, day_seq * 100 + order_seq + 1)
                expected_date = current_date + timedelta(days=random.randint(5, 10))

                po_result = await db.execute(text("""
                    INSERT INTO erp_purchase_order (
                        tenant_id, po_no, po_date, vendor_id, vendor_code, vendor_name,
                        expected_date, status, total_amount, tax_amount, currency, created_at
                    ) VALUES (
                        CAST(:tenant_id AS uuid), :po_no, :po_date, :vendor_id, :vendor_code, :vendor_name,
                        :expected_date, 'confirmed', :total, :tax, 'KRW', NOW()
                    ) RETURNING id
                """), {
                    'tenant_id': TENANT_ID,
                    'po_no': po_no,
                    'po_date': current_date,
                    'vendor_id': vendor['id'],
                    'vendor_code': vendor['code'],
                    'vendor_name': vendor['name'],
                    'expected_date': expected_date,
                    'total': qty * unit_price * 0.6,  # Material cost ~60% of product
                    'tax': qty * unit_price * 0.06
                })
                po_id = po_result.scalar()
                records['purchase_orders'] += 1

                # Purchase Order Item
                await db.execute(text("""
                    INSERT INTO erp_purchase_order_item (
                        tenant_id, po_id, po_no, line_no, material_code, material_name,
                        order_qty, unit_price, amount, uom, expected_date, status, created_at
                    ) VALUES (
                        CAST(:tenant_id AS uuid), :po_id, :po_no, 1, :material_code, :material_name,
                        :qty, :unit_price, :amount, 'EA', :expected_date, 'ordered', NOW()
                    )
                """), {
                    'tenant_id': TENANT_ID,
                    'po_id': po_id,
                    'po_no': po_no,
                    'material_code': f"MAT-{product['code']}",
                    'material_name': f"Material for {product['name']}",
                    'qty': qty,
                    'unit_price': unit_price * 0.6,
                    'amount': qty * unit_price * 0.6,
                    'expected_date': expected_date
                })
                records['purchase_order_items'] += 1

        except Exception as e:
            print(f"Error generating order {order_seq} for {current_date}: {e}")
            continue

    # ============ Process Previous Orders (Complete productions, shipments, receipts) ============

    # Complete production orders that are due
    try:
        result = await db.execute(text("""
            SELECT id, production_order_no, target_qty, product_code, line_code
            FROM mes_production_order
            WHERE tenant_id = CAST(:tenant_id AS uuid)
            AND status = 'planned'
            AND planned_start <= :current_date
            LIMIT 10
        """), {'tenant_id': TENANT_ID, 'current_date': current_date})

        orders_to_produce = result.fetchall()

        for po_row in orders_to_produce:
            po_id, po_no, target_qty, product_code, line_code = po_row

            # Generate production result
            produced = int(target_qty)
            good_qty = int(produced * random.uniform(0.95, 0.99))  # 95-99% yield
            defect_qty = produced - good_qty

            result_id = str(uuid.uuid4())
            await db.execute(text("""
                INSERT INTO mes_production_result (
                    id, tenant_id, production_order_id, production_order_no,
                    result_timestamp, operation_seq, line_code, product_code,
                    input_qty, output_qty, good_qty, defect_qty, scrap_qty,
                    cycle_time_sec, yield_rate, defect_rate, lot_no, shift, created_at
                ) VALUES (
                    CAST(:id AS uuid), CAST(:tenant_id AS uuid), CAST(:po_id AS uuid), :po_no,
                    :timestamp, 10, :line_code, :product_code,
                    :input, :output, :good, :defect, 0,
                    :cycle_time, :yield_rate, :defect_rate, :lot_no, :shift, NOW()
                )
            """), {
                'id': result_id,
                'tenant_id': TENANT_ID,
                'po_id': po_id,
                'po_no': po_no,
                'timestamp': datetime.combine(current_date, datetime.min.time()) + timedelta(hours=random.randint(6, 18)),
                'line_code': line_code,
                'product_code': product_code,
                'input': target_qty,
                'output': produced,
                'good': good_qty,
                'defect': defect_qty,
                'cycle_time': random.uniform(30, 120),
                'yield_rate': good_qty / produced * 100,
                'defect_rate': defect_qty / produced * 100,
                'lot_no': f"LOT-{current_date.strftime('%Y%m%d')}-{random.randint(1000, 9999)}",
                'shift': random.choice(['A', 'B', 'C'])
            })
            records['production_results'] += 1

            # Update production order status
            await db.execute(text("""
                UPDATE mes_production_order
                SET status = 'completed', produced_qty = :produced, good_qty = :good,
                    defect_qty = :defect, completion_rate = 100,
                    actual_start = :start, actual_end = :end, updated_at = NOW()
                WHERE id = CAST(:id AS uuid)
            """), {
                'id': po_id,
                'produced': produced,
                'good': good_qty,
                'defect': defect_qty,
                'start': datetime.combine(current_date - timedelta(days=1), datetime.min.time()),
                'end': datetime.combine(current_date, datetime.min.time())
            })

    except Exception as e:
        print(f"Error processing production: {e}")

    # Create shipments for completed orders (sales orders that are ready)
    try:
        result = await db.execute(text("""
            SELECT id, order_no, customer_code, customer_name
            FROM erp_sales_order
            WHERE tenant_id = CAST(:tenant_id AS uuid)
            AND status = 'confirmed'
            AND delivery_date <= :current_date
            LIMIT 5
        """), {'tenant_id': TENANT_ID, 'current_date': current_date})

        orders_to_ship = result.fetchall()

        for so_row in orders_to_ship:
            so_id, so_no, customer_code, customer_name = so_row

            ship_no = generate_order_no("SH", current_date, random.randint(1, 999))

            await db.execute(text("""
                INSERT INTO erp_shipment (
                    tenant_id, shipment_no, shipment_date, order_id, order_no,
                    customer_code, customer_name, status, carrier, created_at
                ) VALUES (
                    CAST(:tenant_id AS uuid), :ship_no, :ship_date, :order_id, :order_no,
                    :customer_code, :customer_name, 'shipped', :carrier, NOW()
                )
            """), {
                'tenant_id': TENANT_ID,
                'ship_no': ship_no,
                'ship_date': current_date,
                'order_id': so_id,
                'order_no': so_no,
                'customer_code': customer_code,
                'customer_name': customer_name,
                'carrier': random.choice(['DHL', 'FedEx', 'UPS', 'KOREX'])
            })
            records['shipments'] += 1

            # Update sales order status
            await db.execute(text("""
                UPDATE erp_sales_order SET status = 'shipped', updated_at = NOW()
                WHERE id = :id
            """), {'id': so_id})

    except Exception as e:
        print(f"Error processing shipments: {e}")

    # Process goods receipts for purchase orders
    try:
        result = await db.execute(text("""
            SELECT id, po_no, vendor_code, vendor_name
            FROM erp_purchase_order
            WHERE tenant_id = CAST(:tenant_id AS uuid)
            AND status = 'confirmed'
            AND expected_date <= :current_date
            LIMIT 5
        """), {'tenant_id': TENANT_ID, 'current_date': current_date})

        orders_to_receive = result.fetchall()

        for po_row in orders_to_receive:
            po_id, po_no, vendor_code, vendor_name = po_row

            receipt_no = generate_order_no("GR", current_date, random.randint(1, 999))
            warehouse = random.choice(master_data['warehouses']) if master_data['warehouses'] else 'WH-001'

            await db.execute(text("""
                INSERT INTO erp_goods_receipt (
                    tenant_id, receipt_no, receipt_date, po_id, po_no,
                    vendor_code, vendor_name, warehouse_code, status, created_at
                ) VALUES (
                    CAST(:tenant_id AS uuid), :receipt_no, :receipt_date, :po_id, :po_no,
                    :vendor_code, :vendor_name, :warehouse_code, 'received', NOW()
                )
            """), {
                'tenant_id': TENANT_ID,
                'receipt_no': receipt_no,
                'receipt_date': current_date,
                'po_id': po_id,
                'po_no': po_no,
                'vendor_code': vendor_code,
                'vendor_name': vendor_name,
                'warehouse_code': warehouse
            })
            records['goods_receipts'] += 1

            # Update PO status
            await db.execute(text("""
                UPDATE erp_purchase_order SET status = 'received', updated_at = NOW()
                WHERE id = :id
            """), {'id': po_id})

    except Exception as e:
        print(f"Error processing goods receipts: {e}")

    return records


async def run_base_data_generation(job_id: str, config: BaseDataConfig, db: AsyncSession):
    """Background task to generate base data"""
    global _generation_jobs

    try:
        _generation_jobs[job_id].status = 'running'
        _generation_jobs[job_id].started_at = datetime.now()

        # Get master data
        master_data = await get_master_data(db)

        # Calculate total days
        total_days = (config.end_date - config.start_date).days + 1
        _generation_jobs[job_id].total_days = total_days

        current_date = config.start_date
        day_seq = 0

        while current_date <= config.end_date:
            _generation_jobs[job_id].current_date = current_date
            _generation_jobs[job_id].processed_days = day_seq
            _generation_jobs[job_id].progress = (day_seq / total_days) * 100

            # Generate data for this day
            day_records = await generate_day_data(db, current_date, config, master_data, day_seq)

            # Accumulate records
            for key, count in day_records.items():
                current = _generation_jobs[job_id].records_generated.get(key, 0)
                _generation_jobs[job_id].records_generated[key] = current + count

            # Commit after each day
            await db.commit()

            current_date += timedelta(days=1)
            day_seq += 1

        _generation_jobs[job_id].status = 'completed'
        _generation_jobs[job_id].progress = 100.0
        _generation_jobs[job_id].completed_at = datetime.now()

    except Exception as e:
        _generation_jobs[job_id].status = 'failed'
        _generation_jobs[job_id].error_message = str(e)
        await db.rollback()


# ============ API Endpoints ============

@router.post("/generate", response_model=BaseDataStatus)
async def start_base_data_generation(
    config: BaseDataConfig,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Start base data generation job.

    This creates realistic normal business flow data:
    - Sales Orders with customers
    - Work Orders for production planning
    - Production Orders in MES
    - Purchase Orders for materials
    - Goods Receipts for incoming materials
    - Production Results with yield data
    - Shipments for completed orders
    """
    job_id = str(uuid.uuid4())

    total_days = (config.end_date - config.start_date).days + 1

    _generation_jobs[job_id] = BaseDataStatus(
        job_id=job_id,
        status='pending',
        progress=0.0,
        total_days=total_days,
        processed_days=0,
        records_generated={}
    )

    background_tasks.add_task(run_base_data_generation, job_id, config, db)

    return _generation_jobs[job_id]


@router.get("/status/{job_id}", response_model=BaseDataStatus)
async def get_generation_status(job_id: str):
    """Get status of a base data generation job"""
    if job_id not in _generation_jobs:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return _generation_jobs[job_id]


@router.get("/summary", response_model=BaseDataSummary)
async def get_data_summary(db: AsyncSession = Depends(get_db)):
    """Get summary of existing base data in the database"""

    # Get date ranges (use cast() instead of ::UUID to avoid parameter binding conflict)
    result = await db.execute(text("""
        SELECT
            MIN(order_date) as min_date,
            MAX(order_date) as max_date,
            COUNT(*) as count
        FROM erp_sales_order
        WHERE tenant_id = CAST(:tenant_id AS uuid)
    """), {'tenant_id': TENANT_ID})
    so_stats = result.fetchone()

    # ERP Records
    erp_counts = {}
    for table in ['erp_sales_order', 'erp_work_order', 'erp_purchase_order',
                  'erp_goods_receipt', 'erp_shipment']:
        result = await db.execute(text(f"SELECT COUNT(*) FROM {table} WHERE tenant_id = CAST(:tenant_id AS uuid)"),
                                  {'tenant_id': TENANT_ID})
        erp_counts[table] = result.scalar() or 0

    # MES Records
    mes_counts = {}
    for table in ['mes_production_order', 'mes_production_result',
                  'mes_defect_detail', 'mes_downtime_event']:
        result = await db.execute(text(f"SELECT COUNT(*) FROM {table} WHERE tenant_id = CAST(:tenant_id AS uuid)"),
                                  {'tenant_id': TENANT_ID})
        mes_counts[table] = result.scalar() or 0

    # Business flow stats
    result = await db.execute(text("""
        SELECT status, COUNT(*)
        FROM erp_sales_order
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        GROUP BY status
    """), {'tenant_id': TENANT_ID})
    order_by_status = {row[0]: row[1] for row in result.fetchall()}

    return BaseDataSummary(
        date_range={
            'start': str(so_stats[0]) if so_stats[0] else 'N/A',
            'end': str(so_stats[1]) if so_stats[1] else 'N/A',
            'total_orders': so_stats[2] if so_stats[2] else 0
        },
        erp_records=erp_counts,
        mes_records=mes_counts,
        business_flow_stats={
            'order_by_status': order_by_status
        }
    )


@router.delete("/clear")
async def clear_generated_data(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Clear generated data within a date range.
    If no dates provided, clears ALL generated data.

    WARNING: This is destructive!
    """
    try:
        if start_date and end_date:
            # Delete within date range
            await db.execute(text("""
                DELETE FROM erp_shipment
                WHERE tenant_id = CAST(:tenant_id AS uuid)
                AND shipment_date BETWEEN :start AND :end
            """), {'tenant_id': TENANT_ID, 'start': start_date, 'end': end_date})

            await db.execute(text("""
                DELETE FROM erp_goods_receipt
                WHERE tenant_id = CAST(:tenant_id AS uuid)
                AND receipt_date BETWEEN :start AND :end
            """), {'tenant_id': TENANT_ID, 'start': start_date, 'end': end_date})

            await db.execute(text("""
                DELETE FROM mes_production_result
                WHERE tenant_id = CAST(:tenant_id AS uuid)
                AND result_timestamp::date BETWEEN :start AND :end
            """), {'tenant_id': TENANT_ID, 'start': start_date, 'end': end_date})

            await db.execute(text("""
                DELETE FROM mes_production_order
                WHERE tenant_id = CAST(:tenant_id AS uuid)
                AND order_date BETWEEN :start AND :end
            """), {'tenant_id': TENANT_ID, 'start': start_date, 'end': end_date})

            await db.execute(text("""
                DELETE FROM erp_work_order
                WHERE tenant_id = CAST(:tenant_id AS uuid)
                AND order_date BETWEEN :start AND :end
            """), {'tenant_id': TENANT_ID, 'start': start_date, 'end': end_date})

            # Delete order items first due to FK
            await db.execute(text("""
                DELETE FROM erp_sales_order_item
                WHERE tenant_id = CAST(:tenant_id AS uuid)
                AND order_id IN (
                    SELECT id FROM erp_sales_order
                    WHERE tenant_id = CAST(:tenant_id AS uuid)
                    AND order_date BETWEEN :start AND :end
                )
            """), {'tenant_id': TENANT_ID, 'start': start_date, 'end': end_date})

            await db.execute(text("""
                DELETE FROM erp_sales_order
                WHERE tenant_id = CAST(:tenant_id AS uuid)
                AND order_date BETWEEN :start AND :end
            """), {'tenant_id': TENANT_ID, 'start': start_date, 'end': end_date})

        await db.commit()
        return {"message": "Data cleared successfully", "date_range": f"{start_date} to {end_date}" if start_date else "all"}

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear data: {str(e)}")
