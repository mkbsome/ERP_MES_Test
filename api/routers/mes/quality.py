"""
Quality Management API Router
"""
from datetime import datetime, date
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.config import settings
from api.models.mes.quality import (
    DefectDetail,
    DefectType,
    InspectionResult,
    SPCData,
    Traceability,
)
from api.schemas.mes.quality import (
    DefectDetailCreate,
    DefectDetailUpdate,
    DefectDetailResponse,
    DefectAnalysisResponse,
    DefectTrend,
    DefectTypeResponse,
    InspectionResultCreate,
    InspectionResultResponse,
    SPCDataCreate,
    SPCDataResponse,
    SPCChartData,
    QualitySummary,
)
from api.services.mock_data import MockDataService


router = APIRouter(prefix="/quality", tags=["MES - Quality"])


# ==================== Inspections ====================

@router.get("/inspections", response_model=List[InspectionResultResponse])
async def get_inspections(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    inspection_type: Optional[str] = None,
    lot_no: Optional[str] = None,
    product_code: Optional[str] = None,
    result: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Get inspection results"""
    tenant_id = UUID(settings.default_tenant_id)

    query = select(InspectionResult).where(InspectionResult.tenant_id == tenant_id)

    if inspection_type:
        query = query.where(InspectionResult.inspection_type == inspection_type)
    if lot_no:
        query = query.where(InspectionResult.lot_no == lot_no)
    if product_code:
        query = query.where(InspectionResult.product_code == product_code)
    if result:
        query = query.where(InspectionResult.result == result)
    if start_date:
        query = query.where(InspectionResult.inspection_datetime >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.where(InspectionResult.inspection_datetime <= datetime.combine(end_date, datetime.max.time()))

    query = query.order_by(InspectionResult.inspection_datetime.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result_db = await db.execute(query)
    inspections = result_db.scalars().all()

    responses = []
    for insp in inspections:
        resp = InspectionResultResponse.model_validate(insp)
        if insp.total_inspected and insp.total_inspected > 0:
            resp.pass_rate = (insp.pass_qty / insp.total_inspected) * 100
        responses.append(resp)

    return responses


@router.post("/inspections", response_model=InspectionResultResponse)
async def create_inspection(
    data: InspectionResultCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create inspection result"""
    tenant_id = UUID(settings.default_tenant_id)

    # Generate inspection number
    inspection_no = f"INS-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{str(uuid4())[:4].upper()}"

    inspection = InspectionResult(
        tenant_id=tenant_id,
        inspection_no=inspection_no,
        inspection_datetime=datetime.utcnow(),
        **data.model_dump()
    )
    db.add(inspection)
    await db.commit()
    await db.refresh(inspection)

    return InspectionResultResponse.model_validate(inspection)


@router.get("/inspections/{inspection_id}", response_model=InspectionResultResponse)
async def get_inspection(
    inspection_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get inspection by ID"""
    tenant_id = UUID(settings.default_tenant_id)

    query = select(InspectionResult).where(
        and_(
            InspectionResult.id == inspection_id,
            InspectionResult.tenant_id == tenant_id,
        )
    )
    result = await db.execute(query)
    inspection = result.scalar_one_or_none()

    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    return InspectionResultResponse.model_validate(inspection)


# ==================== Defects ====================

@router.get("/defects", response_model=List[DefectDetailResponse])
async def get_defects(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    line_code: Optional[str] = None,
    product_code: Optional[str] = None,
    defect_category: Optional[str] = None,
    defect_code: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Get defect details"""
    tenant_id = UUID(settings.default_tenant_id)

    query = select(DefectDetail).where(DefectDetail.tenant_id == tenant_id)

    if line_code:
        query = query.where(DefectDetail.line_code == line_code)
    if product_code:
        query = query.where(DefectDetail.product_code == product_code)
    if defect_category:
        query = query.where(DefectDetail.defect_category == defect_category)
    if defect_code:
        query = query.where(DefectDetail.defect_code == defect_code)
    if start_date:
        query = query.where(DefectDetail.defect_timestamp >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.where(DefectDetail.defect_timestamp <= datetime.combine(end_date, datetime.max.time()))

    query = query.order_by(DefectDetail.defect_timestamp.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    defects = result.scalars().all()

    return [DefectDetailResponse.model_validate(d) for d in defects]


@router.post("/defects", response_model=DefectDetailResponse)
async def create_defect(
    data: DefectDetailCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create defect record"""
    tenant_id = UUID(settings.default_tenant_id)

    defect = DefectDetail(
        tenant_id=tenant_id,
        defect_timestamp=datetime.utcnow(),
        **data.model_dump()
    )
    db.add(defect)
    await db.commit()
    await db.refresh(defect)

    return DefectDetailResponse.model_validate(defect)


@router.get("/defects/analysis")
async def get_defect_analysis(
    db: AsyncSession = Depends(get_db),
    line_code: Optional[str] = None,
    product_code: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(10, ge=1, le=50),
):
    """Get defect analysis with counts and percentages (with mock data fallback)

    Returns data structure expected by Dashboard:
    {
        "trend": [...],
        "by_type": [...],
        "summary": {...}
    }
    """
    try:
        tenant_id = UUID(settings.default_tenant_id)

        # Build aggregation query
        query = select(
            DefectDetail.defect_code,
            DefectDetail.defect_category,
            func.count().label('count'),
        ).where(DefectDetail.tenant_id == tenant_id)

        if line_code:
            query = query.where(DefectDetail.line_code == line_code)
        if product_code:
            query = query.where(DefectDetail.product_code == product_code)
        if start_date:
            query = query.where(DefectDetail.defect_timestamp >= datetime.combine(start_date, datetime.min.time()))
        if end_date:
            query = query.where(DefectDetail.defect_timestamp <= datetime.combine(end_date, datetime.max.time()))

        query = query.group_by(
            DefectDetail.defect_code,
            DefectDetail.defect_category,
        ).order_by(desc('count')).limit(limit)

        result = await db.execute(query)
        rows = result.all()

        if not rows:
            raise Exception("No defect analysis data found, using mock data")

        # Calculate totals and percentages
        total_count = sum(row.count for row in rows)

        analyses = []
        cumulative = 0.0
        for row in rows:
            percentage = (row.count / total_count * 100) if total_count > 0 else 0
            cumulative += percentage

            # Get defect name from defect type table
            type_query = select(DefectType).where(
                and_(
                    DefectType.tenant_id == tenant_id,
                    DefectType.defect_code == row.defect_code,
                )
            )
            type_result = await db.execute(type_query)
            defect_type = type_result.scalar_one_or_none()

            analyses.append(DefectAnalysisResponse(
                defect_code=row.defect_code,
                defect_name=defect_type.defect_name if defect_type else None,
                defect_category=row.defect_category,
                count=row.count,
                percentage=percentage,
                cumulative_percentage=cumulative,
            ))

        return analyses
    except Exception:
        # Return mock data formatted for Dashboard
        return MockDataService.get_defect_analysis_formatted(line_code)


@router.get("/defects/pareto")
async def get_defect_pareto(
    db: AsyncSession = Depends(get_db),
    line_code: Optional[str] = None,
    product_code: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Get defect pareto analysis (top defects accounting for 80%) with mock data fallback

    Returns data structure expected by Dashboard:
    {
        "items": [...],
        "summary": {...}
    }
    """
    try:
        analyses = await get_defect_analysis(
            db=db,
            line_code=line_code,
            product_code=product_code,
            start_date=start_date,
            end_date=end_date,
            limit=20,
        )

        if not analyses or isinstance(analyses, dict):
            raise Exception("No pareto data found, using mock data")

        # Return items until cumulative reaches ~80%
        pareto_items = []
        for item in analyses:
            pareto_items.append(item)
            if hasattr(item, 'cumulative_percentage') and item.cumulative_percentage >= 80:
                break
            elif isinstance(item, dict) and item.get('cumulative_ratio', 0) >= 80:
                break

        return pareto_items
    except Exception:
        # Return mock data formatted for Dashboard
        return MockDataService.get_defect_pareto_formatted()


# ==================== SPC ====================

@router.get("/spc/data", response_model=List[SPCDataResponse])
async def get_spc_data(
    db: AsyncSession = Depends(get_db),
    line_code: Optional[str] = None,
    product_code: Optional[str] = None,
    measurement_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
):
    """Get SPC data"""
    tenant_id = UUID(settings.default_tenant_id)

    query = select(SPCData).where(SPCData.tenant_id == tenant_id)

    if line_code:
        query = query.where(SPCData.line_code == line_code)
    if product_code:
        query = query.where(SPCData.product_code == product_code)
    if measurement_type:
        query = query.where(SPCData.measurement_type == measurement_type)
    if start_date:
        query = query.where(SPCData.measurement_datetime >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.where(SPCData.measurement_datetime <= datetime.combine(end_date, datetime.max.time()))

    query = query.order_by(SPCData.measurement_datetime.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    data = result.scalars().all()

    return [SPCDataResponse.model_validate(d) for d in data]


@router.get("/spc/chart/{measurement_type}", response_model=SPCChartData)
async def get_spc_chart_data(
    measurement_type: str,
    db: AsyncSession = Depends(get_db),
    line_code: Optional[str] = None,
    product_code: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
):
    """Get SPC chart data with control limits"""
    tenant_id = UUID(settings.default_tenant_id)

    query = select(SPCData).where(
        and_(
            SPCData.tenant_id == tenant_id,
            SPCData.measurement_type == measurement_type,
        )
    )

    if line_code:
        query = query.where(SPCData.line_code == line_code)
    if product_code:
        query = query.where(SPCData.product_code == product_code)

    query = query.order_by(SPCData.measurement_datetime.desc()).limit(limit)

    result = await db.execute(query)
    data = result.scalars().all()

    if not data:
        raise HTTPException(status_code=404, detail="No SPC data found")

    # Calculate statistics
    values = [float(d.measured_value) for d in data]
    mean = sum(values) / len(values)
    variance = sum((x - mean) ** 2 for x in values) / len(values)
    std_dev = variance ** 0.5

    # Control limits (3 sigma)
    ucl = mean + 3 * std_dev
    lcl = mean - 3 * std_dev

    # Get spec limits from first record
    usl = float(data[0].spec_upper) if data[0].spec_upper else None
    lsl = float(data[0].spec_lower) if data[0].spec_lower else None

    # Calculate Cpk
    cpk = None
    if usl is not None and lsl is not None and std_dev > 0:
        cpu = (usl - mean) / (3 * std_dev)
        cpl = (mean - lsl) / (3 * std_dev)
        cpk = min(cpu, cpl)

    return SPCChartData(
        measurement_type=measurement_type,
        measurements=[SPCDataResponse.model_validate(d) for d in data],
        mean=mean,
        std_dev=std_dev,
        ucl=ucl,
        lcl=lcl,
        usl=usl,
        lsl=lsl,
        cpk=cpk,
    )


# ==================== Traceability ====================

@router.get("/traceability/{lot_no}")
async def get_traceability(
    lot_no: str,
    db: AsyncSession = Depends(get_db),
):
    """Get traceability information for a lot"""
    tenant_id = UUID(settings.default_tenant_id)

    query = select(Traceability).where(
        and_(
            Traceability.tenant_id == tenant_id,
            Traceability.traced_id == lot_no,
        )
    ).order_by(Traceability.operation_no)

    result = await db.execute(query)
    traces = result.scalars().all()

    if not traces:
        raise HTTPException(status_code=404, detail="Lot not found")

    # Build traceability response
    return {
        "lot_no": lot_no,
        "product_code": traces[0].product_code if traces else None,
        "production_order_no": traces[0].production_order_no if traces else None,
        "status": traces[-1].status if traces else None,
        "operations": [
            {
                "operation_no": t.operation_no,
                "operation_name": t.operation_name,
                "equipment_code": t.equipment_code,
                "line_code": t.line_code,
                "timestamp": t.trace_timestamp,
                "operator_code": t.operator_code,
                "material_lots": t.material_lots,
                "process_parameters": t.process_parameters,
                "quality_results": t.quality_results,
            }
            for t in traces
        ],
        "material_traceability": traces[0].material_lots if traces else None,
    }
