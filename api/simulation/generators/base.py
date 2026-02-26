"""
BaseRealtimeGenerator - 실시간 데이터 생성기 기본 클래스

각 Generator는 이 클래스를 상속받아 구현
"""

import random
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


# 불량 코드 정의 (SMT/PCB 전용)
DEFECT_CODES = {
    'BRIDGE': {'category': 'solder', 'desc': '솔더 브릿지'},
    'INSUF': {'category': 'solder', 'desc': '솔더 부족'},
    'COLD': {'category': 'solder', 'desc': '냉납'},
    'CRACK': {'category': 'solder', 'desc': '솔더 크랙'},
    'VOID': {'category': 'solder', 'desc': '보이드'},
    'MISSING': {'category': 'component', 'desc': '부품 누락'},
    'TOMBSTONE': {'category': 'component', 'desc': '톰스톤'},
    'SHIFT': {'category': 'placement', 'desc': '위치 틀어짐'},
    'POLARITY': {'category': 'component', 'desc': '극성 오류'},
    'ROTATE': {'category': 'placement', 'desc': '회전 오류'},
    'SHORT': {'category': 'short', 'desc': '단락'},
    'OPEN': {'category': 'open', 'desc': '단선'},
    'CONTAM': {'category': 'contamination', 'desc': '오염'},
    'SCRATCH': {'category': 'mechanical', 'desc': '스크래치'},
    'BENT': {'category': 'mechanical', 'desc': '휨'},
}

# 레거시 포맷 호환
DEFECT_CODES_LEGACY = [
    ('DEF_SCRATCH', 'SURFACE', '스크래치'),
    ('DEF_DENT', 'SURFACE', '찍힘'),
    ('DEF_DIMENSION', 'DIMENSION', '치수불량'),
    ('DEF_COMPONENT', 'COMPONENT', '부품불량'),
    ('DEF_ASSEMBLY', 'ASSEMBLY', '조립불량'),
    ('DEF_PAINT', 'SURFACE', '도장불량'),
    ('DEF_FUNCTION', 'FUNCTION', '기능불량'),
    ('DEF_LEAK', 'FUNCTION', '누출'),
]

# 비가동 코드 정의
DOWNTIME_CODES = [
    ('DT_BREAKDOWN', 'breakdown', '설비고장'),
    ('DT_CHANGEOVER', 'setup', '품종교체'),
    ('DT_MAINTENANCE', 'planned', '정기점검'),
    ('DT_MATERIAL', 'material', '자재대기'),
    ('DT_QUALITY', 'quality', '품질이슈'),
    ('DT_MEETING', 'planned', '회의'),
    ('DT_CLEANING', 'planned', '청소'),
    ('DT_POWER', 'other', '전력문제'),
]

# 설비 상태 코드
EQUIPMENT_STATUS_CODES = [
    ('RUNNING', '가동중'),
    ('IDLE', '대기'),
    ('SETUP', '셋업'),
    ('MAINTENANCE', '정비'),
    ('BREAKDOWN', '고장'),
    ('CLEANING', '청소'),
]


class BaseRealtimeGenerator(ABC):
    """
    실시간 데이터 생성기 기본 클래스

    두 가지 패턴 지원:
    1. Phase 1: __init__(name), generate(db_pool, config) - 직접 저장
    2. Phase 2: __init__(tenant_id), generate(), save(records, pool) - 분리 저장

    각 하위 클래스에서 generate() 메서드 구현 필요
    """

    def __init__(self, name_or_tenant_id: str, is_phase2: bool = False):
        """
        Args:
            name_or_tenant_id: Phase 1에서는 name, Phase 2에서는 tenant_id
            is_phase2: Phase 2 패턴 여부
        """
        if is_phase2:
            self.tenant_id = name_or_tenant_id
            self.name = self.__class__.__name__
        else:
            self.name = name_or_tenant_id
            self.tenant_id = None

        self._master_data: Dict[str, Any] = {}
        self._last_generated = None
        self._master_loaded = False

        # Phase 2 속성
        self.lines: List[Dict] = []
        self.equipments: List[Dict] = []
        self.products: List[Dict] = []
        self.interval: int = 60  # 기본 주기 (초)

    @abstractmethod
    async def generate(self, db_pool, config) -> List[Dict[str, Any]]:
        """
        데이터 생성 및 DB 저장

        Returns:
            생성된 레코드 리스트
        """
        pass

    async def load_master_data(self, db_pool, tenant_id: str):
        """마스터 데이터 로드"""
        if not db_pool:
            logger.warning(f"[{self.name}] No database pool available")
            return

        async with db_pool.acquire() as conn:
            # 생산라인
            self._master_data['lines'] = await conn.fetch(
                "SELECT line_code, line_name FROM mes_production_line WHERE tenant_id = $1",
                tenant_id
            )

            # 설비
            self._master_data['equipments'] = await conn.fetch(
                """SELECT id, equipment_code, equipment_name, line_code, equipment_type
                   FROM mes_equipment WHERE tenant_id = $1""",
                tenant_id
            )

            # 제품
            self._master_data['products'] = await conn.fetch(
                "SELECT product_code, product_name FROM erp_product_master WHERE tenant_id = $1",
                tenant_id
            )

            # 진행 중인 생산지시
            self._master_data['active_orders'] = await conn.fetch(
                """SELECT id, production_order_no, product_code, line_code, target_qty, produced_qty
                   FROM mes_production_order
                   WHERE tenant_id = $1 AND status IN ('started', 'in_progress')""",
                tenant_id
            )

        logger.info(f"[{self.name}] Loaded master data: "
                   f"{len(self._master_data.get('lines', []))} lines, "
                   f"{len(self._master_data.get('equipments', []))} equipments, "
                   f"{len(self._master_data.get('products', []))} products")

    @staticmethod
    def weighted_choice(choices) -> Any:
        """
        가중치 기반 랜덤 선택

        두 가지 형식 지원:
        1. Dict[str, float]: {'RUNNING': 0.7, 'IDLE': 0.3}
        2. List[Tuple[Any, float]]: [('RUNNING', 0.7), ('IDLE', 0.3)]
        """
        if isinstance(choices, dict):
            items = list(choices.keys())
            weights = list(choices.values())
        else:
            # List[Tuple] 형식
            items = [c[0] for c in choices]
            weights = [c[1] for c in choices]
        return random.choices(items, weights=weights, k=1)[0]

    @staticmethod
    def random_in_range(min_val: float, max_val: float, precision: int = 2) -> float:
        """범위 내 랜덤 값 (소수점 정밀도 지정)"""
        return round(random.uniform(min_val, max_val), precision)

    @staticmethod
    def apply_variance(base_value: float, variance_percent: float) -> float:
        """편차 적용"""
        variance = base_value * (variance_percent / 100)
        return base_value + random.uniform(-variance, variance)

    def get_random_equipment(self, line_code: Optional[str] = None) -> Optional[Dict]:
        """랜덤 설비 선택 (라인 필터 가능)"""
        equipments = self._master_data.get('equipments', [])
        if not equipments:
            return None

        if line_code:
            equipments = [e for e in equipments if e['line_code'] == line_code]

        return dict(random.choice(equipments)) if equipments else None

    def get_random_line(self) -> Optional[Dict]:
        """랜덤 라인 선택"""
        lines = self._master_data.get('lines', [])
        return dict(random.choice(lines)) if lines else None

    def get_random_product(self) -> Optional[Dict]:
        """랜덤 제품 선택"""
        products = self._master_data.get('products', [])
        return dict(random.choice(products)) if products else None

    def get_active_orders(self) -> List[Dict]:
        """진행 중인 생산지시 목록"""
        return [dict(o) for o in self._master_data.get('active_orders', [])]

    # ============ Phase 2 패턴 지원 메서드들 ============

    async def _ensure_master_data(self):
        """Phase 2: 마스터 데이터가 로드되었는지 확인하고 필요시 로드"""
        if self._master_loaded:
            return

        from ...database import get_db_pool

        try:
            pool = await get_db_pool()
            async with pool.acquire() as conn:
                # 생산라인
                rows = await conn.fetch(
                    "SELECT line_code, line_name FROM mes_production_line WHERE tenant_id = $1",
                    self.tenant_id
                )
                self.lines = [dict(r) for r in rows]

                # 설비 (mes_equipment 테이블 사용 - load_master_data와 동일)
                rows = await conn.fetch(
                    """SELECT id, equipment_code, equipment_name, line_code, equipment_type
                       FROM mes_equipment WHERE tenant_id = $1""",
                    self.tenant_id
                )
                self.equipments = [dict(r) for r in rows]

                # 제품
                rows = await conn.fetch(
                    "SELECT product_code, product_name FROM erp_product_master WHERE tenant_id = $1",
                    self.tenant_id
                )
                self.products = [dict(r) for r in rows]

                # _master_data에도 복사 (호환성)
                self._master_data['lines'] = self.lines
                self._master_data['equipments'] = self.equipments
                self._master_data['products'] = self.products

            self._master_loaded = True
            logger.info(f"[{self.name}] Master data loaded: "
                       f"{len(self.lines)} lines, "
                       f"{len(self.equipments)} equipments, "
                       f"{len(self.products)} products")
        except Exception as e:
            logger.error(f"[{self.name}] Failed to load master data: {e}")
