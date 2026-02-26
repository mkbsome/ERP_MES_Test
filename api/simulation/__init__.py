"""
Realtime Factory Simulator

실시간 공장 데이터 시뮬레이터 - 실제 시간과 동일한 속도로 데이터 생성
각 데이터 타입별 독립적인 생성 주기를 가짐

Architecture:
- SimulationEngine: 시뮬레이션 상태 관리 (STOPPED/RUNNING/PAUSED)
- Ticker: 주기적 데이터 생성 스케줄러
- Generators: 각 데이터 타입별 생성기
- ScenarioInjector: 시나리오 기반 이상 패턴 주입
"""

from .engine import SimulationEngine, SimulationState
from .ticker import Ticker, TickerConfig

__all__ = [
    'SimulationEngine',
    'SimulationState',
    'Ticker',
    'TickerConfig',
]
