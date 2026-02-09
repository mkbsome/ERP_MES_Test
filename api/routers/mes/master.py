"""
MES Master Data API Router (기준정보관리)
- 코드그룹/공통코드
- 공장/라인/공정
- 품목별공정, 작업자, 검사항목, 불량유형
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime

from api.schemas.mes.master import (
    # Code
    CodeGroupCreate, CodeGroupResponse, CodeGroupWithCodes, CodeGroupListResponse,
    CommonCodeCreate, CommonCodeResponse,
    # Factory/Line
    FactoryCreate, FactoryResponse, FactoryListResponse,
    ProductionLineCreate, ProductionLineResponse, ProductionLineListResponse,
    LineType, LineStatus,
    # Process
    ProcessCreate, ProcessResponse, ProcessListResponse, ProcessType,
    LineProcessCreate, LineProcessResponse,
    ProductRoutingCreate, ProductRoutingResponse,
    # Worker
    WorkerCreate, WorkerResponse, WorkerListResponse, SkillLevel,
    # Inspection
    InspectionItemCreate, InspectionItemResponse, InspectionItemListResponse,
    # Defect
    DefectTypeCreate, DefectTypeResponse, DefectTypeListResponse, DefectCategory,
    ProductDefectMappingCreate, ProductDefectMappingResponse,
)

router = APIRouter(prefix="/master", tags=["MES Master Data"])


# ==================== Code Group API ====================

@router.get("/code-groups", response_model=CodeGroupListResponse)
async def get_code_groups(
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
):
    """코드그룹 목록 조회"""
    groups = [
        {
            "id": 1,
            "group_code": "LINE_TYPE",
            "group_name": "라인 유형",
            "description": "생산 라인 유형 코드",
            "is_system": True,
            "is_active": True,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00",
            "codes": [
                {"id": 1, "group_id": 1, "code": "SMT", "code_name": "SMT 라인", "code_name_en": "SMT Line", "sort_order": 1, "extra_value1": None, "extra_value2": None, "description": None, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
                {"id": 2, "group_id": 1, "code": "THT", "code_name": "THT 라인", "code_name_en": "THT Line", "sort_order": 2, "extra_value1": None, "extra_value2": None, "description": None, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
                {"id": 3, "group_id": 1, "code": "ASSY", "code_name": "조립 라인", "code_name_en": "Assembly Line", "sort_order": 3, "extra_value1": None, "extra_value2": None, "description": None, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            ]
        },
        {
            "id": 2,
            "group_code": "DEFECT_CAT",
            "group_name": "불량 카테고리",
            "description": "불량 유형 분류 코드",
            "is_system": True,
            "is_active": True,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00",
            "codes": [
                {"id": 4, "group_id": 2, "code": "SOLDER", "code_name": "솔더 불량", "code_name_en": "Solder Defect", "sort_order": 1, "extra_value1": None, "extra_value2": None, "description": None, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
                {"id": 5, "group_id": 2, "code": "COMPONENT", "code_name": "부품 불량", "code_name_en": "Component Defect", "sort_order": 2, "extra_value1": None, "extra_value2": None, "description": None, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
                {"id": 6, "group_id": 2, "code": "PCB", "code_name": "PCB 불량", "code_name_en": "PCB Defect", "sort_order": 3, "extra_value1": None, "extra_value2": None, "description": None, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            ]
        },
        {
            "id": 3,
            "group_code": "SKILL_LEVEL",
            "group_name": "작업자 스킬 레벨",
            "description": "작업자 숙련도 등급",
            "is_system": True,
            "is_active": True,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00",
            "codes": [
                {"id": 7, "group_id": 3, "code": "L1", "code_name": "초급", "code_name_en": "Beginner", "sort_order": 1, "extra_value1": "0-6개월", "extra_value2": None, "description": None, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
                {"id": 8, "group_id": 3, "code": "L2", "code_name": "중급", "code_name_en": "Intermediate", "sort_order": 2, "extra_value1": "6개월-2년", "extra_value2": None, "description": None, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
                {"id": 9, "group_id": 3, "code": "L3", "code_name": "고급", "code_name_en": "Advanced", "sort_order": 3, "extra_value1": "2-5년", "extra_value2": None, "description": None, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
                {"id": 10, "group_id": 3, "code": "L4", "code_name": "전문가", "code_name_en": "Expert", "sort_order": 4, "extra_value1": "5년 이상", "extra_value2": None, "description": None, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            ]
        },
    ]
    return {"items": groups, "total": len(groups)}


@router.post("/code-groups", response_model=CodeGroupResponse)
async def create_code_group(group: CodeGroupCreate):
    """코드그룹 등록"""
    return {
        "id": 100,
        **group.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.post("/common-codes", response_model=CommonCodeResponse)
async def create_common_code(code: CommonCodeCreate):
    """공통코드 등록"""
    return {
        "id": 100,
        **code.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


# ==================== Factory API ====================

@router.get("/factories", response_model=FactoryListResponse)
async def get_factories(is_active: Optional[bool] = None):
    """공장 목록 조회"""
    factories = [
        {
            "id": 1,
            "factory_code": "PT",
            "factory_name": "평택 공장",
            "address": "경기도 평택시 진위면 산단로 100",
            "contact_person": "김공장",
            "contact_phone": "031-111-2222",
            "is_active": True,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00",
        },
        {
            "id": 2,
            "factory_code": "AS",
            "factory_name": "안성 공장",
            "address": "경기도 안성시 공도읍 산업단지로 200",
            "contact_person": "이공장",
            "contact_phone": "031-333-4444",
            "is_active": True,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00",
        },
    ]
    return {"items": factories, "total": len(factories)}


@router.post("/factories", response_model=FactoryResponse)
async def create_factory(factory: FactoryCreate):
    """공장 등록"""
    return {
        "id": 100,
        **factory.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


# ==================== Production Line API ====================

@router.get("/lines", response_model=ProductionLineListResponse)
async def get_production_lines(
    factory_code: Optional[str] = None,
    line_type: Optional[LineType] = None,
    status: Optional[LineStatus] = None,
    is_active: Optional[bool] = None,
):
    """생산라인 목록 조회"""
    lines = [
        {"id": 1, "line_code": "SMT-L01", "line_name": "SMT 1라인", "factory_id": 1, "line_type": "SMT", "status": "running", "capacity_per_hour": 120, "tact_time": 30.0, "manager_name": "박라인", "manager_phone": "010-1111-1111", "is_active": True, "description": "고속 SMT 라인", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 2, "line_code": "SMT-L02", "line_name": "SMT 2라인", "factory_id": 1, "line_type": "SMT", "status": "running", "capacity_per_hour": 100, "tact_time": 36.0, "manager_name": "김라인", "manager_phone": "010-2222-2222", "is_active": True, "description": "다품종 SMT 라인", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 3, "line_code": "SMT-L03", "line_name": "SMT 3라인", "factory_id": 1, "line_type": "SMT", "status": "idle", "capacity_per_hour": 80, "tact_time": 45.0, "manager_name": "이라인", "manager_phone": "010-3333-3333", "is_active": True, "description": "소량 SMT 라인", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 4, "line_code": "THT-L01", "line_name": "THT 1라인", "factory_id": 1, "line_type": "THT", "status": "running", "capacity_per_hour": 60, "tact_time": 60.0, "manager_name": "최라인", "manager_phone": "010-4444-4444", "is_active": True, "description": "수삽입 라인", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 5, "line_code": "ASSY-L01", "line_name": "조립 1라인", "factory_id": 2, "line_type": "assembly", "status": "running", "capacity_per_hour": 50, "tact_time": 72.0, "manager_name": "정라인", "manager_phone": "010-5555-5555", "is_active": True, "description": "완제품 조립 라인", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
    ]
    return {"items": lines, "total": len(lines)}


@router.get("/lines/{line_code}", response_model=ProductionLineResponse)
async def get_production_line(line_code: str):
    """생산라인 상세 조회"""
    return {
        "id": 1,
        "line_code": line_code,
        "line_name": "SMT 1라인",
        "factory_id": 1,
        "line_type": "SMT",
        "status": "running",
        "capacity_per_hour": 120,
        "tact_time": 30.0,
        "manager_name": "박라인",
        "manager_phone": "010-1111-1111",
        "is_active": True,
        "description": "고속 SMT 라인",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
    }


@router.post("/lines", response_model=ProductionLineResponse)
async def create_production_line(line: ProductionLineCreate):
    """생산라인 등록"""
    return {
        "id": 100,
        **line.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


# ==================== Process API ====================

@router.get("/processes", response_model=ProcessListResponse)
async def get_processes(
    process_type: Optional[ProcessType] = None,
    is_active: Optional[bool] = None,
):
    """공정 목록 조회"""
    processes = [
        {"id": 1, "process_code": "SMT-PRINT", "process_name": "솔더 프린팅", "process_type": "smt_print", "standard_time": 0.5, "setup_time": 30.0, "inspection_required": False, "inspection_type": None, "is_active": True, "description": "스텐실 솔더 프린팅", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 2, "process_code": "SMT-SPI", "process_name": "SPI 검사", "process_type": "smt_spi", "standard_time": 0.3, "setup_time": 15.0, "inspection_required": True, "inspection_type": "SPI", "is_active": True, "description": "솔더 페이스트 검사", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 3, "process_code": "SMT-CHIP", "process_name": "칩마운트", "process_type": "smt_mount", "standard_time": 1.0, "setup_time": 60.0, "inspection_required": False, "inspection_type": None, "is_active": True, "description": "소형 부품 실장", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 4, "process_code": "SMT-MULTI", "process_name": "이형마운트", "process_type": "smt_mount", "standard_time": 1.5, "setup_time": 45.0, "inspection_required": False, "inspection_type": None, "is_active": True, "description": "이형 부품 실장", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 5, "process_code": "SMT-REFLOW", "process_name": "리플로우", "process_type": "smt_reflow", "standard_time": 5.0, "setup_time": 15.0, "inspection_required": False, "inspection_type": None, "is_active": True, "description": "리플로우 솔더링", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 6, "process_code": "SMT-AOI", "process_name": "AOI 검사", "process_type": "smt_aoi", "standard_time": 0.5, "setup_time": 20.0, "inspection_required": True, "inspection_type": "AOI", "is_active": True, "description": "자동 광학 검사", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 7, "process_code": "FINAL-INSP", "process_name": "최종검사", "process_type": "test", "standard_time": 2.0, "setup_time": 10.0, "inspection_required": True, "inspection_type": "최종검사", "is_active": True, "description": "출하 전 최종 검사", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
    ]
    return {"items": processes, "total": len(processes)}


@router.post("/processes", response_model=ProcessResponse)
async def create_process(process: ProcessCreate):
    """공정 등록"""
    return {
        "id": 100,
        **process.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.get("/lines/{line_code}/processes")
async def get_line_processes(line_code: str):
    """라인별 공정 조회"""
    processes = [
        {"id": 1, "line_id": 1, "process_code": "SMT-PRINT", "process_name": "솔더 프린팅", "sequence": 1, "equipment_code": "SMT-PRNT-01", "equipment_name": "Screen Printer #1", "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 2, "line_id": 1, "process_code": "SMT-SPI", "process_name": "SPI 검사", "sequence": 2, "equipment_code": "SMT-SPI-01", "equipment_name": "SPI #1", "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 3, "line_id": 1, "process_code": "SMT-CHIP", "process_name": "칩마운트", "sequence": 3, "equipment_code": "SMT-CHIP-01", "equipment_name": "Chip Mounter #1", "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 4, "line_id": 1, "process_code": "SMT-MULTI", "process_name": "이형마운트", "sequence": 4, "equipment_code": "SMT-MULT-01", "equipment_name": "Multi Mounter #1", "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 5, "line_id": 1, "process_code": "SMT-REFLOW", "process_name": "리플로우", "sequence": 5, "equipment_code": "SMT-REFL-01", "equipment_name": "Reflow Oven #1", "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 6, "line_id": 1, "process_code": "SMT-AOI", "process_name": "AOI 검사", "sequence": 6, "equipment_code": "SMT-AOI-01", "equipment_name": "AOI #1", "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
    ]
    return {"line_code": line_code, "processes": processes}


@router.get("/products/{product_code}/routing")
async def get_product_routing(product_code: str):
    """품목별 공정 조회"""
    routing = [
        {"id": 1, "product_code": product_code, "product_name": "스마트폰 메인보드", "process_code": "SMT-PRINT", "process_name": "솔더 프린팅", "sequence": 1, "standard_time": 0.5, "setup_time": 30.0, "inspection_required": False, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 2, "product_code": product_code, "product_name": "스마트폰 메인보드", "process_code": "SMT-SPI", "process_name": "SPI 검사", "sequence": 2, "standard_time": 0.3, "setup_time": 15.0, "inspection_required": True, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 3, "product_code": product_code, "product_name": "스마트폰 메인보드", "process_code": "SMT-CHIP", "process_name": "칩마운트", "sequence": 3, "standard_time": 1.0, "setup_time": 60.0, "inspection_required": False, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 4, "product_code": product_code, "product_name": "스마트폰 메인보드", "process_code": "SMT-REFLOW", "process_name": "리플로우", "sequence": 4, "standard_time": 5.0, "setup_time": 15.0, "inspection_required": False, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 5, "product_code": product_code, "product_name": "스마트폰 메인보드", "process_code": "SMT-AOI", "process_name": "AOI 검사", "sequence": 5, "standard_time": 0.5, "setup_time": 20.0, "inspection_required": True, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 6, "product_code": product_code, "product_name": "스마트폰 메인보드", "process_code": "FINAL-INSP", "process_name": "최종검사", "sequence": 6, "standard_time": 2.0, "setup_time": 10.0, "inspection_required": True, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
    ]
    return {"product_code": product_code, "routing": routing}


# ==================== Worker API ====================

@router.get("/workers", response_model=WorkerListResponse)
async def get_workers(
    factory_code: Optional[str] = None,
    line_code: Optional[str] = None,
    skill_level: Optional[SkillLevel] = None,
    is_active: Optional[bool] = None,
):
    """작업자 목록 조회"""
    workers = [
        {"id": 1, "worker_code": "W001", "worker_name": "김작업", "department": "생산1팀", "position": "반장", "factory_code": "PT", "line_code": "SMT-L01", "skill_level": "expert", "certified_processes": '["SMT-PRINT","SMT-CHIP","SMT-REFLOW"]', "phone": "010-1111-0001", "email": "kim@greenboard.com", "is_active": True, "hire_date": "2015-03-01T00:00:00", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 2, "worker_code": "W002", "worker_name": "이작업", "department": "생산1팀", "position": "조장", "factory_code": "PT", "line_code": "SMT-L01", "skill_level": "advanced", "certified_processes": '["SMT-PRINT","SMT-CHIP"]', "phone": "010-1111-0002", "email": "lee@greenboard.com", "is_active": True, "hire_date": "2018-06-15T00:00:00", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 3, "worker_code": "W003", "worker_name": "박작업", "department": "생산1팀", "position": "작업자", "factory_code": "PT", "line_code": "SMT-L02", "skill_level": "intermediate", "certified_processes": '["SMT-CHIP"]', "phone": "010-1111-0003", "email": "park@greenboard.com", "is_active": True, "hire_date": "2021-01-10T00:00:00", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 4, "worker_code": "W004", "worker_name": "최작업", "department": "생산2팀", "position": "작업자", "factory_code": "PT", "line_code": "THT-L01", "skill_level": "advanced", "certified_processes": '["THT_INSERT","THT_WAVE"]', "phone": "010-1111-0004", "email": "choi@greenboard.com", "is_active": True, "hire_date": "2019-09-01T00:00:00", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 5, "worker_code": "W005", "worker_name": "정작업", "department": "품질팀", "position": "검사원", "factory_code": "PT", "line_code": None, "skill_level": "expert", "certified_processes": '["SMT-AOI","FINAL-INSP"]', "phone": "010-1111-0005", "email": "jung@greenboard.com", "is_active": True, "hire_date": "2016-04-01T00:00:00", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
    ]
    return {"items": workers, "total": len(workers)}


@router.post("/workers", response_model=WorkerResponse)
async def create_worker(worker: WorkerCreate):
    """작업자 등록"""
    return {
        "id": 100,
        **worker.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


# ==================== Inspection Item API ====================

@router.get("/inspection-items", response_model=InspectionItemListResponse)
async def get_inspection_items(
    inspection_type: Optional[str] = None,
    process_code: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    """검사항목 목록 조회"""
    items = [
        {"id": 1, "item_code": "SPI-VOL", "item_name": "솔더 볼륨", "inspection_type": "SPI", "process_code": "SMT-SPI", "target_value": 100.0, "upper_limit": 120.0, "lower_limit": 80.0, "unit": "%", "measurement_method": "3D 측정", "equipment_required": "SPI", "is_mandatory": True, "is_active": True, "description": "솔더 페이스트 볼륨 측정", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 2, "item_code": "SPI-HGT", "item_name": "솔더 높이", "inspection_type": "SPI", "process_code": "SMT-SPI", "target_value": 150.0, "upper_limit": 180.0, "lower_limit": 120.0, "unit": "um", "measurement_method": "3D 측정", "equipment_required": "SPI", "is_mandatory": True, "is_active": True, "description": "솔더 페이스트 높이 측정", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 3, "item_code": "AOI-BRIDGE", "item_name": "브릿지 검사", "inspection_type": "AOI", "process_code": "SMT-AOI", "target_value": None, "upper_limit": None, "lower_limit": None, "unit": None, "measurement_method": "영상 분석", "equipment_required": "AOI", "is_mandatory": True, "is_active": True, "description": "솔더 브릿지 검출", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 4, "item_code": "AOI-MISS", "item_name": "부품 누락 검사", "inspection_type": "AOI", "process_code": "SMT-AOI", "target_value": None, "upper_limit": None, "lower_limit": None, "unit": None, "measurement_method": "영상 분석", "equipment_required": "AOI", "is_mandatory": True, "is_active": True, "description": "부품 누락 검출", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 5, "item_code": "FINAL-FUNC", "item_name": "기능 검사", "inspection_type": "최종검사", "process_code": "FINAL-INSP", "target_value": None, "upper_limit": None, "lower_limit": None, "unit": None, "measurement_method": "기능 테스트", "equipment_required": "테스트 지그", "is_mandatory": True, "is_active": True, "description": "제품 기능 동작 검사", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
    ]
    return {"items": items, "total": len(items)}


@router.post("/inspection-items", response_model=InspectionItemResponse)
async def create_inspection_item(item: InspectionItemCreate):
    """검사항목 등록"""
    return {
        "id": 100,
        **item.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


# ==================== Defect Type API ====================

@router.get("/defect-types", response_model=DefectTypeListResponse)
async def get_defect_types(
    category: Optional[DefectCategory] = None,
    is_active: Optional[bool] = None,
):
    """불량유형 목록 조회"""
    defects = [
        {"id": 1, "defect_code": "DF01", "defect_name": "솔더 브릿지", "defect_name_en": "Bridge", "category": "solder", "cause_equipment": "Printer, Reflow", "cause_process": "SMT-PRINT, SMT-REFLOW", "typical_cause": "솔더 과다, 온도 이상", "severity": 3, "is_active": True, "description": "인접 패드 간 솔더 연결", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 2, "defect_code": "DF02", "defect_name": "미납", "defect_name_en": "Open", "category": "solder", "cause_equipment": "Printer", "cause_process": "SMT-PRINT", "typical_cause": "솔더 부족, 스텐실 막힘", "severity": 3, "is_active": True, "description": "솔더 접합 불량", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 3, "defect_code": "DF03", "defect_name": "직립", "defect_name_en": "Tombstone", "category": "solder", "cause_equipment": "Reflow", "cause_process": "SMT-REFLOW", "typical_cause": "열 불균형, 패드 불균형", "severity": 3, "is_active": True, "description": "부품 한쪽 들림", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 4, "defect_code": "DF04", "defect_name": "부품 누락", "defect_name_en": "Missing", "category": "component", "cause_equipment": "Mounter", "cause_process": "SMT-CHIP, SMT-MULTI", "typical_cause": "흡착 실패, 노즐 문제", "severity": 3, "is_active": True, "description": "부품 미실장", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 5, "defect_code": "DF05", "defect_name": "위치 이탈", "defect_name_en": "Shift", "category": "component", "cause_equipment": "Mounter", "cause_process": "SMT-CHIP, SMT-MULTI", "typical_cause": "실장 오차, 비전 오류", "severity": 2, "is_active": True, "description": "부품 위치 벗어남", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 6, "defect_code": "DF06", "defect_name": "오삽", "defect_name_en": "Wrong Part", "category": "component", "cause_equipment": "Mounter", "cause_process": "SMT-CHIP", "typical_cause": "피더 오류, 부품 혼입", "severity": 3, "is_active": True, "description": "잘못된 부품 실장", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 7, "defect_code": "DF07", "defect_name": "극성 반대", "defect_name_en": "Polarity", "category": "component", "cause_equipment": "Mounter", "cause_process": "SMT-CHIP", "typical_cause": "인식 오류, 부품 방향", "severity": 3, "is_active": True, "description": "부품 극성 오류", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 8, "defect_code": "DF08", "defect_name": "냉납", "defect_name_en": "Cold Solder", "category": "solder", "cause_equipment": "Reflow", "cause_process": "SMT-REFLOW", "typical_cause": "온도 부족, 시간 부족", "severity": 2, "is_active": True, "description": "솔더 용융 불량", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 9, "defect_code": "DF09", "defect_name": "크랙", "defect_name_en": "Crack", "category": "solder", "cause_equipment": "Reflow", "cause_process": "SMT-REFLOW", "typical_cause": "열 스트레스, 냉각 속도", "severity": 2, "is_active": True, "description": "솔더 균열", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 10, "defect_code": "DF10", "defect_name": "보이드", "defect_name_en": "Void", "category": "solder", "cause_equipment": "Reflow", "cause_process": "SMT-REFLOW", "typical_cause": "가스 발생, 플럭스 문제", "severity": 1, "is_active": True, "description": "솔더 내부 기포", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
    ]
    return {"items": defects, "total": len(defects)}


@router.post("/defect-types", response_model=DefectTypeResponse)
async def create_defect_type(defect: DefectTypeCreate):
    """불량유형 등록"""
    return {
        "id": 100,
        **defect.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.get("/products/{product_code}/defects")
async def get_product_defect_mapping(product_code: str):
    """품목별 불량유형 매핑 조회"""
    mappings = [
        {"id": 1, "product_code": product_code, "defect_code": "DF01", "defect_name": "솔더 브릿지", "target_rate": 0.1, "alert_rate": 0.5, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 2, "product_code": product_code, "defect_code": "DF02", "defect_name": "미납", "target_rate": 0.1, "alert_rate": 0.5, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 3, "product_code": product_code, "defect_code": "DF04", "defect_name": "부품 누락", "target_rate": 0.05, "alert_rate": 0.3, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        {"id": 4, "product_code": product_code, "defect_code": "DF05", "defect_name": "위치 이탈", "target_rate": 0.2, "alert_rate": 0.8, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
    ]
    return {"product_code": product_code, "defect_mappings": mappings}
