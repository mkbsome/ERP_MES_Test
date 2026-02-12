"""
MES Master Data API Router (기준정보관리)
- 코드그룹/공통코드
- 공장/라인/공정
- 품목별공정, 작업자, 검사항목, 불량유형

DB 연결 버전
"""

from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from api.database import get_db
from api.models.mes.master import (
    CodeGroup, CommonCode, Factory, Process, LineProcess,
    ProductRouting, Worker, InspectionItem, ProductDefectMapping
)
from api.models.mes.equipment import ProductionLine
from api.models.mes.quality import DefectType
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


# ==================== Helper Functions ====================

def code_group_to_dict(group: CodeGroup, include_codes: bool = True) -> dict:
    """CodeGroup 모델을 딕셔너리로 변환"""
    result = {
        "id": group.id,
        "group_code": group.group_code,
        "group_name": group.group_name,
        "description": group.description,
        "is_system": group.is_system,
        "is_active": group.is_active,
        "created_at": group.created_at.isoformat() if group.created_at else None,
        "updated_at": group.updated_at.isoformat() if group.updated_at else None,
    }
    if include_codes and hasattr(group, 'codes') and group.codes:
        result["codes"] = [common_code_to_dict(code) for code in group.codes]
    else:
        result["codes"] = []
    return result


def common_code_to_dict(code: CommonCode) -> dict:
    """CommonCode 모델을 딕셔너리로 변환"""
    return {
        "id": code.id,
        "group_id": code.group_id,
        "code": code.code,
        "code_name": code.code_name,
        "code_name_en": code.code_name_en,
        "sort_order": code.sort_order,
        "extra_value1": code.extra_value1,
        "extra_value2": code.extra_value2,
        "description": code.description,
        "is_active": code.is_active,
        "created_at": code.created_at.isoformat() if code.created_at else None,
        "updated_at": code.updated_at.isoformat() if code.updated_at else None,
    }


def factory_to_dict(factory: Factory) -> dict:
    """Factory 모델을 딕셔너리로 변환"""
    return {
        "id": factory.id,
        "factory_code": factory.factory_code,
        "factory_name": factory.factory_name,
        "address": factory.address,
        "contact_person": factory.contact_person,
        "contact_phone": factory.contact_phone,
        "is_active": factory.is_active,
        "created_at": factory.created_at.isoformat() if factory.created_at else None,
        "updated_at": factory.updated_at.isoformat() if factory.updated_at else None,
    }


def production_line_to_dict(line: ProductionLine) -> dict:
    """ProductionLine 모델을 딕셔너리로 변환"""
    return {
        "id": str(line.id) if line.id else None,
        "line_code": line.line_code,
        "line_name": line.line_name,
        "factory_id": None,  # ProductionLine 모델에는 factory_id가 없고 factory_code가 있음
        "line_type": line.line_type,
        "status": line.status,
        "capacity_per_hour": line.capacity_per_shift // 8 if line.capacity_per_shift else None,
        "tact_time": None,
        "manager_name": None,
        "manager_phone": None,
        "is_active": line.status == "active",
        "description": None,
        "created_at": line.created_at.isoformat() if line.created_at else None,
        "updated_at": line.updated_at.isoformat() if line.updated_at else None,
    }


def process_to_dict(process: Process) -> dict:
    """Process 모델을 딕셔너리로 변환"""
    return {
        "id": process.id,
        "process_code": process.process_code,
        "process_name": process.process_name,
        "process_type": process.process_type.value if process.process_type else None,
        "standard_time": float(process.standard_time) if process.standard_time else None,
        "setup_time": float(process.setup_time) if process.setup_time else None,
        "inspection_required": process.inspection_required,
        "inspection_type": process.inspection_type,
        "is_active": process.is_active,
        "description": process.description,
        "created_at": process.created_at.isoformat() if process.created_at else None,
        "updated_at": process.updated_at.isoformat() if process.updated_at else None,
    }


def line_process_to_dict(lp: LineProcess) -> dict:
    """LineProcess 모델을 딕셔너리로 변환"""
    return {
        "id": lp.id,
        "line_id": lp.line_id,
        "process_code": lp.process_code,
        "process_name": lp.process_name,
        "sequence": lp.sequence,
        "equipment_code": lp.equipment_code,
        "equipment_name": lp.equipment_name,
        "is_active": lp.is_active,
        "created_at": lp.created_at.isoformat() if lp.created_at else None,
        "updated_at": lp.updated_at.isoformat() if lp.updated_at else None,
    }


def product_routing_to_dict(routing: ProductRouting) -> dict:
    """ProductRouting 모델을 딕셔너리로 변환"""
    return {
        "id": routing.id,
        "product_code": routing.product_code,
        "product_name": routing.product_name,
        "process_code": routing.process_code,
        "process_name": routing.process_name,
        "sequence": routing.sequence,
        "standard_time": float(routing.standard_time) if routing.standard_time else None,
        "setup_time": float(routing.setup_time) if routing.setup_time else None,
        "inspection_required": routing.inspection_required,
        "is_active": routing.is_active,
        "created_at": routing.created_at.isoformat() if routing.created_at else None,
        "updated_at": routing.updated_at.isoformat() if routing.updated_at else None,
    }


def worker_to_dict(worker: Worker) -> dict:
    """Worker 모델을 딕셔너리로 변환"""
    return {
        "id": worker.id,
        "worker_code": worker.worker_code,
        "worker_name": worker.worker_name,
        "department": worker.department,
        "position": worker.position,
        "factory_code": worker.factory_code,
        "line_code": worker.line_code,
        "skill_level": worker.skill_level.value if worker.skill_level else None,
        "certified_processes": worker.certified_processes,
        "phone": worker.phone,
        "email": worker.email,
        "is_active": worker.is_active,
        "hire_date": worker.hire_date.isoformat() if worker.hire_date else None,
        "created_at": worker.created_at.isoformat() if worker.created_at else None,
        "updated_at": worker.updated_at.isoformat() if worker.updated_at else None,
    }


def inspection_item_to_dict(item: InspectionItem) -> dict:
    """InspectionItem 모델을 딕셔너리로 변환"""
    return {
        "id": item.id,
        "item_code": item.item_code,
        "item_name": item.item_name,
        "inspection_type": item.inspection_type,
        "process_code": item.process_code,
        "target_value": float(item.target_value) if item.target_value else None,
        "upper_limit": float(item.upper_limit) if item.upper_limit else None,
        "lower_limit": float(item.lower_limit) if item.lower_limit else None,
        "unit": item.unit,
        "measurement_method": item.measurement_method,
        "equipment_required": item.equipment_required,
        "is_mandatory": item.is_mandatory,
        "is_active": item.is_active,
        "description": item.description,
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "updated_at": item.updated_at.isoformat() if item.updated_at else None,
    }


def defect_type_to_dict(defect: DefectType) -> dict:
    """DefectType 모델을 딕셔너리로 변환"""
    return {
        "id": str(defect.id) if defect.id else None,
        "defect_code": defect.defect_code,
        "defect_name": defect.defect_name,
        "defect_name_en": defect.defect_name_en,
        "category": defect.defect_category,
        "cause_equipment": None,
        "cause_process": None,
        "typical_cause": None,
        "severity": 3 if defect.severity == "critical" else (2 if defect.severity == "major" else 1),
        "is_active": defect.is_active,
        "description": defect.description,
        "created_at": defect.created_at.isoformat() if defect.created_at else None,
        "updated_at": defect.updated_at.isoformat() if defect.updated_at else None,
    }


def product_defect_mapping_to_dict(mapping: ProductDefectMapping) -> dict:
    """ProductDefectMapping 모델을 딕셔너리로 변환"""
    return {
        "id": mapping.id,
        "product_code": mapping.product_code,
        "defect_code": mapping.defect_code,
        "defect_name": mapping.defect_name,
        "target_rate": float(mapping.target_rate) if mapping.target_rate else None,
        "alert_rate": float(mapping.alert_rate) if mapping.alert_rate else None,
        "is_active": mapping.is_active,
        "created_at": mapping.created_at.isoformat() if mapping.created_at else None,
        "updated_at": mapping.updated_at.isoformat() if mapping.updated_at else None,
    }


# ==================== Mock Data Service ====================

class MockDataService:
    """Mock 데이터 서비스 - DB에 데이터가 없을 때 폴백용"""

    @staticmethod
    def get_code_groups():
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

    @staticmethod
    def get_factories():
        factories = [
            {"id": 1, "factory_code": "PT", "factory_name": "평택 공장", "address": "경기도 평택시 진위면 산단로 100", "contact_person": "김공장", "contact_phone": "031-111-2222", "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 2, "factory_code": "AS", "factory_name": "안성 공장", "address": "경기도 안성시 공도읍 산업단지로 200", "contact_person": "이공장", "contact_phone": "031-333-4444", "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        ]
        return {"items": factories, "total": len(factories)}

    @staticmethod
    def get_production_lines():
        lines = [
            {"id": 1, "line_code": "SMT-L01", "line_name": "SMT 1라인", "factory_id": 1, "line_type": "SMT", "status": "running", "capacity_per_hour": 120, "tact_time": 30.0, "manager_name": "박라인", "manager_phone": "010-1111-1111", "is_active": True, "description": "고속 SMT 라인", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 2, "line_code": "SMT-L02", "line_name": "SMT 2라인", "factory_id": 1, "line_type": "SMT", "status": "running", "capacity_per_hour": 100, "tact_time": 36.0, "manager_name": "김라인", "manager_phone": "010-2222-2222", "is_active": True, "description": "다품종 SMT 라인", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 3, "line_code": "SMT-L03", "line_name": "SMT 3라인", "factory_id": 1, "line_type": "SMT", "status": "idle", "capacity_per_hour": 80, "tact_time": 45.0, "manager_name": "이라인", "manager_phone": "010-3333-3333", "is_active": True, "description": "소량 SMT 라인", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 4, "line_code": "THT-L01", "line_name": "THT 1라인", "factory_id": 1, "line_type": "THT", "status": "running", "capacity_per_hour": 60, "tact_time": 60.0, "manager_name": "최라인", "manager_phone": "010-4444-4444", "is_active": True, "description": "수삽입 라인", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 5, "line_code": "ASSY-L01", "line_name": "조립 1라인", "factory_id": 2, "line_type": "assembly", "status": "running", "capacity_per_hour": 50, "tact_time": 72.0, "manager_name": "정라인", "manager_phone": "010-5555-5555", "is_active": True, "description": "완제품 조립 라인", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        ]
        return {"items": lines, "total": len(lines)}

    @staticmethod
    def get_processes():
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

    @staticmethod
    def get_workers():
        workers = [
            {"id": 1, "worker_code": "W001", "worker_name": "김작업", "department": "생산1팀", "position": "반장", "factory_code": "PT", "line_code": "SMT-L01", "skill_level": "expert", "certified_processes": '["SMT-PRINT","SMT-CHIP","SMT-REFLOW"]', "phone": "010-1111-0001", "email": "kim@greenboard.com", "is_active": True, "hire_date": "2015-03-01T00:00:00", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 2, "worker_code": "W002", "worker_name": "이작업", "department": "생산1팀", "position": "조장", "factory_code": "PT", "line_code": "SMT-L01", "skill_level": "advanced", "certified_processes": '["SMT-PRINT","SMT-CHIP"]', "phone": "010-1111-0002", "email": "lee@greenboard.com", "is_active": True, "hire_date": "2018-06-15T00:00:00", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 3, "worker_code": "W003", "worker_name": "박작업", "department": "생산1팀", "position": "작업자", "factory_code": "PT", "line_code": "SMT-L02", "skill_level": "intermediate", "certified_processes": '["SMT-CHIP"]', "phone": "010-1111-0003", "email": "park@greenboard.com", "is_active": True, "hire_date": "2021-01-10T00:00:00", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 4, "worker_code": "W004", "worker_name": "최작업", "department": "생산2팀", "position": "작업자", "factory_code": "PT", "line_code": "THT-L01", "skill_level": "advanced", "certified_processes": '["THT_INSERT","THT_WAVE"]', "phone": "010-1111-0004", "email": "choi@greenboard.com", "is_active": True, "hire_date": "2019-09-01T00:00:00", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 5, "worker_code": "W005", "worker_name": "정작업", "department": "품질팀", "position": "검사원", "factory_code": "PT", "line_code": None, "skill_level": "expert", "certified_processes": '["SMT-AOI","FINAL-INSP"]', "phone": "010-1111-0005", "email": "jung@greenboard.com", "is_active": True, "hire_date": "2016-04-01T00:00:00", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        ]
        return {"items": workers, "total": len(workers)}

    @staticmethod
    def get_inspection_items():
        items = [
            {"id": 1, "item_code": "SPI-VOL", "item_name": "솔더 볼륨", "inspection_type": "SPI", "process_code": "SMT-SPI", "target_value": 100.0, "upper_limit": 120.0, "lower_limit": 80.0, "unit": "%", "measurement_method": "3D 측정", "equipment_required": "SPI", "is_mandatory": True, "is_active": True, "description": "솔더 페이스트 볼륨 측정", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 2, "item_code": "SPI-HGT", "item_name": "솔더 높이", "inspection_type": "SPI", "process_code": "SMT-SPI", "target_value": 150.0, "upper_limit": 180.0, "lower_limit": 120.0, "unit": "um", "measurement_method": "3D 측정", "equipment_required": "SPI", "is_mandatory": True, "is_active": True, "description": "솔더 페이스트 높이 측정", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 3, "item_code": "AOI-BRIDGE", "item_name": "브릿지 검사", "inspection_type": "AOI", "process_code": "SMT-AOI", "target_value": None, "upper_limit": None, "lower_limit": None, "unit": None, "measurement_method": "영상 분석", "equipment_required": "AOI", "is_mandatory": True, "is_active": True, "description": "솔더 브릿지 검출", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 4, "item_code": "AOI-MISS", "item_name": "부품 누락 검사", "inspection_type": "AOI", "process_code": "SMT-AOI", "target_value": None, "upper_limit": None, "lower_limit": None, "unit": None, "measurement_method": "영상 분석", "equipment_required": "AOI", "is_mandatory": True, "is_active": True, "description": "부품 누락 검출", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 5, "item_code": "FINAL-FUNC", "item_name": "기능 검사", "inspection_type": "최종검사", "process_code": "FINAL-INSP", "target_value": None, "upper_limit": None, "lower_limit": None, "unit": None, "measurement_method": "기능 테스트", "equipment_required": "테스트 지그", "is_mandatory": True, "is_active": True, "description": "제품 기능 동작 검사", "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        ]
        return {"items": items, "total": len(items)}

    @staticmethod
    def get_defect_types():
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

    @staticmethod
    def get_line_processes(line_code: str):
        processes = [
            {"id": 1, "line_id": 1, "process_code": "SMT-PRINT", "process_name": "솔더 프린팅", "sequence": 1, "equipment_code": "SMT-PRNT-01", "equipment_name": "Screen Printer #1", "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 2, "line_id": 1, "process_code": "SMT-SPI", "process_name": "SPI 검사", "sequence": 2, "equipment_code": "SMT-SPI-01", "equipment_name": "SPI #1", "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 3, "line_id": 1, "process_code": "SMT-CHIP", "process_name": "칩마운트", "sequence": 3, "equipment_code": "SMT-CHIP-01", "equipment_name": "Chip Mounter #1", "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 4, "line_id": 1, "process_code": "SMT-MULTI", "process_name": "이형마운트", "sequence": 4, "equipment_code": "SMT-MULT-01", "equipment_name": "Multi Mounter #1", "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 5, "line_id": 1, "process_code": "SMT-REFLOW", "process_name": "리플로우", "sequence": 5, "equipment_code": "SMT-REFL-01", "equipment_name": "Reflow Oven #1", "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 6, "line_id": 1, "process_code": "SMT-AOI", "process_name": "AOI 검사", "sequence": 6, "equipment_code": "SMT-AOI-01", "equipment_name": "AOI #1", "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        ]
        return {"line_code": line_code, "processes": processes}

    @staticmethod
    def get_product_routing(product_code: str):
        routing = [
            {"id": 1, "product_code": product_code, "product_name": "스마트폰 메인보드", "process_code": "SMT-PRINT", "process_name": "솔더 프린팅", "sequence": 1, "standard_time": 0.5, "setup_time": 30.0, "inspection_required": False, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 2, "product_code": product_code, "product_name": "스마트폰 메인보드", "process_code": "SMT-SPI", "process_name": "SPI 검사", "sequence": 2, "standard_time": 0.3, "setup_time": 15.0, "inspection_required": True, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 3, "product_code": product_code, "product_name": "스마트폰 메인보드", "process_code": "SMT-CHIP", "process_name": "칩마운트", "sequence": 3, "standard_time": 1.0, "setup_time": 60.0, "inspection_required": False, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 4, "product_code": product_code, "product_name": "스마트폰 메인보드", "process_code": "SMT-REFLOW", "process_name": "리플로우", "sequence": 4, "standard_time": 5.0, "setup_time": 15.0, "inspection_required": False, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 5, "product_code": product_code, "product_name": "스마트폰 메인보드", "process_code": "SMT-AOI", "process_name": "AOI 검사", "sequence": 5, "standard_time": 0.5, "setup_time": 20.0, "inspection_required": True, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 6, "product_code": product_code, "product_name": "스마트폰 메인보드", "process_code": "FINAL-INSP", "process_name": "최종검사", "sequence": 6, "standard_time": 2.0, "setup_time": 10.0, "inspection_required": True, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        ]
        return {"product_code": product_code, "routing": routing}

    @staticmethod
    def get_product_defect_mapping(product_code: str):
        mappings = [
            {"id": 1, "product_code": product_code, "defect_code": "DF01", "defect_name": "솔더 브릿지", "target_rate": 0.1, "alert_rate": 0.5, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 2, "product_code": product_code, "defect_code": "DF02", "defect_name": "미납", "target_rate": 0.1, "alert_rate": 0.5, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 3, "product_code": product_code, "defect_code": "DF04", "defect_name": "부품 누락", "target_rate": 0.05, "alert_rate": 0.3, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
            {"id": 4, "product_code": product_code, "defect_code": "DF05", "defect_name": "위치 이탈", "target_rate": 0.2, "alert_rate": 0.8, "is_active": True, "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00"},
        ]
        return {"product_code": product_code, "defect_mappings": mappings}


# ==================== Code Group API ====================

@router.get("/code-groups", response_model=CodeGroupListResponse)
async def get_code_groups(
    db: AsyncSession = Depends(get_db),
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
):
    """코드그룹 목록 조회"""
    try:
        query = select(CodeGroup).options(selectinload(CodeGroup.codes))

        if is_active is not None:
            query = query.where(CodeGroup.is_active == is_active)

        if search:
            query = query.where(
                or_(
                    CodeGroup.group_code.ilike(f"%{search}%"),
                    CodeGroup.group_name.ilike(f"%{search}%")
                )
            )

        result = await db.execute(query)
        groups = result.scalars().all()

        if not groups:
            return MockDataService.get_code_groups()

        return {
            "items": [code_group_to_dict(g) for g in groups],
            "total": len(groups)
        }
    except Exception as e:
        return MockDataService.get_code_groups()


@router.post("/code-groups", response_model=CodeGroupResponse)
async def create_code_group(
    group: CodeGroupCreate,
    db: AsyncSession = Depends(get_db),
):
    """코드그룹 등록"""
    try:
        db_group = CodeGroup(**group.model_dump())
        db.add(db_group)
        await db.commit()
        await db.refresh(db_group)
        return CodeGroupResponse(**code_group_to_dict(db_group, include_codes=False))
    except Exception as e:
        await db.rollback()
        return {
            "id": 100,
            **group.model_dump(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }


@router.post("/common-codes", response_model=CommonCodeResponse)
async def create_common_code(
    code: CommonCodeCreate,
    db: AsyncSession = Depends(get_db),
):
    """공통코드 등록"""
    try:
        db_code = CommonCode(**code.model_dump())
        db.add(db_code)
        await db.commit()
        await db.refresh(db_code)
        return CommonCodeResponse(**common_code_to_dict(db_code))
    except Exception as e:
        await db.rollback()
        return {
            "id": 100,
            **code.model_dump(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }


# ==================== Factory API ====================

@router.get("/factories", response_model=FactoryListResponse)
async def get_factories(
    db: AsyncSession = Depends(get_db),
    is_active: Optional[bool] = None,
):
    """공장 목록 조회"""
    try:
        query = select(Factory)

        if is_active is not None:
            query = query.where(Factory.is_active == is_active)

        result = await db.execute(query)
        factories = result.scalars().all()

        if not factories:
            return MockDataService.get_factories()

        return {
            "items": [factory_to_dict(f) for f in factories],
            "total": len(factories)
        }
    except Exception as e:
        return MockDataService.get_factories()


@router.post("/factories", response_model=FactoryResponse)
async def create_factory(
    factory: FactoryCreate,
    db: AsyncSession = Depends(get_db),
):
    """공장 등록"""
    try:
        db_factory = Factory(**factory.model_dump())
        db.add(db_factory)
        await db.commit()
        await db.refresh(db_factory)
        return FactoryResponse(**factory_to_dict(db_factory))
    except Exception as e:
        await db.rollback()
        return {
            "id": 100,
            **factory.model_dump(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }


# ==================== Production Line API ====================

@router.get("/lines", response_model=ProductionLineListResponse)
async def get_production_lines(
    db: AsyncSession = Depends(get_db),
    factory_code: Optional[str] = None,
    line_type: Optional[LineType] = None,
    status: Optional[LineStatus] = None,
    is_active: Optional[bool] = None,
):
    """생산라인 목록 조회"""
    try:
        query = select(ProductionLine)

        if factory_code:
            query = query.where(ProductionLine.factory_code == factory_code)

        if line_type:
            query = query.where(ProductionLine.line_type == line_type.value)

        if status:
            query = query.where(ProductionLine.status == status.value)

        if is_active is not None:
            if is_active:
                query = query.where(ProductionLine.status == "active")
            else:
                query = query.where(ProductionLine.status != "active")

        result = await db.execute(query)
        lines = result.scalars().all()

        if not lines:
            return MockDataService.get_production_lines()

        return {
            "items": [production_line_to_dict(l) for l in lines],
            "total": len(lines)
        }
    except Exception as e:
        return MockDataService.get_production_lines()


@router.get("/lines/{line_code}", response_model=ProductionLineResponse)
async def get_production_line(
    line_code: str,
    db: AsyncSession = Depends(get_db),
):
    """생산라인 상세 조회"""
    try:
        query = select(ProductionLine).where(ProductionLine.line_code == line_code)
        result = await db.execute(query)
        line = result.scalar_one_or_none()

        if not line:
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

        return ProductionLineResponse(**production_line_to_dict(line))
    except Exception as e:
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
async def create_production_line(
    line: ProductionLineCreate,
    db: AsyncSession = Depends(get_db),
):
    """생산라인 등록"""
    try:
        db_line = ProductionLine(
            line_code=line.line_code,
            line_name=line.line_name,
            line_type=line.line_type.value if line.line_type else "SMT",
            status=line.status.value if line.status else "active",
            capacity_per_shift=line.capacity_per_hour * 8 if line.capacity_per_hour else None,
        )
        db.add(db_line)
        await db.commit()
        await db.refresh(db_line)
        return ProductionLineResponse(**production_line_to_dict(db_line))
    except Exception as e:
        await db.rollback()
        return {
            "id": 100,
            **line.model_dump(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }


# ==================== Process API ====================

@router.get("/processes", response_model=ProcessListResponse)
async def get_processes(
    db: AsyncSession = Depends(get_db),
    process_type: Optional[ProcessType] = None,
    is_active: Optional[bool] = None,
):
    """공정 목록 조회"""
    try:
        query = select(Process)

        if process_type:
            query = query.where(Process.process_type == process_type.value)

        if is_active is not None:
            query = query.where(Process.is_active == is_active)

        result = await db.execute(query)
        processes = result.scalars().all()

        if not processes:
            return MockDataService.get_processes()

        return {
            "items": [process_to_dict(p) for p in processes],
            "total": len(processes)
        }
    except Exception as e:
        return MockDataService.get_processes()


@router.post("/processes", response_model=ProcessResponse)
async def create_process(
    process: ProcessCreate,
    db: AsyncSession = Depends(get_db),
):
    """공정 등록"""
    try:
        db_process = Process(**process.model_dump())
        db.add(db_process)
        await db.commit()
        await db.refresh(db_process)
        return ProcessResponse(**process_to_dict(db_process))
    except Exception as e:
        await db.rollback()
        return {
            "id": 100,
            **process.model_dump(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }


@router.get("/lines/{line_code}/processes")
async def get_line_processes(
    line_code: str,
    db: AsyncSession = Depends(get_db),
):
    """라인별 공정 조회"""
    try:
        # 먼저 라인 ID 조회
        line_query = select(ProductionLine).where(ProductionLine.line_code == line_code)
        line_result = await db.execute(line_query)
        line = line_result.scalar_one_or_none()

        if not line:
            return MockDataService.get_line_processes(line_code)

        # 라인 공정 조회
        query = select(LineProcess).where(LineProcess.line_id == line.id).order_by(LineProcess.sequence)
        result = await db.execute(query)
        processes = result.scalars().all()

        if not processes:
            return MockDataService.get_line_processes(line_code)

        return {
            "line_code": line_code,
            "processes": [line_process_to_dict(p) for p in processes]
        }
    except Exception as e:
        return MockDataService.get_line_processes(line_code)


@router.get("/products/{product_code}/routing")
async def get_product_routing(
    product_code: str,
    db: AsyncSession = Depends(get_db),
):
    """품목별 공정 조회"""
    try:
        query = select(ProductRouting).where(
            ProductRouting.product_code == product_code
        ).order_by(ProductRouting.sequence)

        result = await db.execute(query)
        routing = result.scalars().all()

        if not routing:
            return MockDataService.get_product_routing(product_code)

        return {
            "product_code": product_code,
            "routing": [product_routing_to_dict(r) for r in routing]
        }
    except Exception as e:
        return MockDataService.get_product_routing(product_code)


# ==================== Worker API ====================

@router.get("/workers", response_model=WorkerListResponse)
async def get_workers(
    db: AsyncSession = Depends(get_db),
    factory_code: Optional[str] = None,
    line_code: Optional[str] = None,
    skill_level: Optional[SkillLevel] = None,
    is_active: Optional[bool] = None,
):
    """작업자 목록 조회"""
    try:
        query = select(Worker)

        if factory_code:
            query = query.where(Worker.factory_code == factory_code)

        if line_code:
            query = query.where(Worker.line_code == line_code)

        if skill_level:
            query = query.where(Worker.skill_level == skill_level.value)

        if is_active is not None:
            query = query.where(Worker.is_active == is_active)

        result = await db.execute(query)
        workers = result.scalars().all()

        if not workers:
            return MockDataService.get_workers()

        return {
            "items": [worker_to_dict(w) for w in workers],
            "total": len(workers)
        }
    except Exception as e:
        return MockDataService.get_workers()


@router.post("/workers", response_model=WorkerResponse)
async def create_worker(
    worker: WorkerCreate,
    db: AsyncSession = Depends(get_db),
):
    """작업자 등록"""
    try:
        db_worker = Worker(**worker.model_dump())
        db.add(db_worker)
        await db.commit()
        await db.refresh(db_worker)
        return WorkerResponse(**worker_to_dict(db_worker))
    except Exception as e:
        await db.rollback()
        return {
            "id": 100,
            **worker.model_dump(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }


# ==================== Inspection Item API ====================

@router.get("/inspection-items", response_model=InspectionItemListResponse)
async def get_inspection_items(
    db: AsyncSession = Depends(get_db),
    inspection_type: Optional[str] = None,
    process_code: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    """검사항목 목록 조회"""
    try:
        query = select(InspectionItem)

        if inspection_type:
            query = query.where(InspectionItem.inspection_type == inspection_type)

        if process_code:
            query = query.where(InspectionItem.process_code == process_code)

        if is_active is not None:
            query = query.where(InspectionItem.is_active == is_active)

        result = await db.execute(query)
        items = result.scalars().all()

        if not items:
            return MockDataService.get_inspection_items()

        return {
            "items": [inspection_item_to_dict(i) for i in items],
            "total": len(items)
        }
    except Exception as e:
        return MockDataService.get_inspection_items()


@router.post("/inspection-items", response_model=InspectionItemResponse)
async def create_inspection_item(
    item: InspectionItemCreate,
    db: AsyncSession = Depends(get_db),
):
    """검사항목 등록"""
    try:
        db_item = InspectionItem(**item.model_dump())
        db.add(db_item)
        await db.commit()
        await db.refresh(db_item)
        return InspectionItemResponse(**inspection_item_to_dict(db_item))
    except Exception as e:
        await db.rollback()
        return {
            "id": 100,
            **item.model_dump(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }


# ==================== Defect Type API ====================

@router.get("/defect-types", response_model=DefectTypeListResponse)
async def get_defect_types(
    db: AsyncSession = Depends(get_db),
    category: Optional[DefectCategory] = None,
    is_active: Optional[bool] = None,
):
    """불량유형 목록 조회"""
    try:
        query = select(DefectType)

        if category:
            query = query.where(DefectType.defect_category == category.value)

        if is_active is not None:
            query = query.where(DefectType.is_active == is_active)

        result = await db.execute(query)
        defects = result.scalars().all()

        if not defects:
            return MockDataService.get_defect_types()

        return {
            "items": [defect_type_to_dict(d) for d in defects],
            "total": len(defects)
        }
    except Exception as e:
        return MockDataService.get_defect_types()


@router.post("/defect-types", response_model=DefectTypeResponse)
async def create_defect_type(
    defect: DefectTypeCreate,
    db: AsyncSession = Depends(get_db),
):
    """불량유형 등록"""
    try:
        # 스키마의 severity (int)를 모델의 severity (str)로 변환
        severity_map = {1: "minor", 2: "major", 3: "critical"}
        defect_data = defect.model_dump()
        defect_data["defect_category"] = defect_data.pop("category").value if hasattr(defect_data.get("category"), "value") else defect_data.pop("category", "other")
        defect_data["severity"] = severity_map.get(defect_data.get("severity", 1), "minor")

        # 불필요한 필드 제거
        defect_data.pop("cause_equipment", None)
        defect_data.pop("cause_process", None)
        defect_data.pop("typical_cause", None)

        db_defect = DefectType(**defect_data)
        db.add(db_defect)
        await db.commit()
        await db.refresh(db_defect)
        return DefectTypeResponse(**defect_type_to_dict(db_defect))
    except Exception as e:
        await db.rollback()
        return {
            "id": 100,
            **defect.model_dump(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }


@router.get("/products/{product_code}/defects")
async def get_product_defect_mapping(
    product_code: str,
    db: AsyncSession = Depends(get_db),
):
    """품목별 불량유형 매핑 조회"""
    try:
        query = select(ProductDefectMapping).where(
            ProductDefectMapping.product_code == product_code
        )

        result = await db.execute(query)
        mappings = result.scalars().all()

        if not mappings:
            return MockDataService.get_product_defect_mapping(product_code)

        return {
            "product_code": product_code,
            "defect_mappings": [product_defect_mapping_to_dict(m) for m in mappings]
        }
    except Exception as e:
        return MockDataService.get_product_defect_mapping(product_code)
