"""
Ticker - 주기적 데이터 생성 스케줄러

각 Generator별 독립적인 주기로 데이터 생성을 트리거
"""

import asyncio
from datetime import datetime
from typing import Callable, Optional, Awaitable
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class TickerConfig:
    """Ticker 설정"""
    name: str
    interval_seconds: int
    max_retries: int = 3
    retry_delay_seconds: float = 1.0


class Ticker:
    """
    주기적 데이터 생성 스케줄러

    - 설정된 간격으로 콜백 실행
    - 일시정지/재개 지원
    - 에러 핸들링 및 재시도
    """

    def __init__(
        self,
        config: TickerConfig,
        callback: Callable[[], Awaitable[None]],
        on_error: Optional[Callable[[str, Exception], Awaitable[None]]] = None
    ):
        self._config = config
        self._callback = callback
        self._on_error = on_error

        self._is_running = False
        self._is_paused = False
        self._task: Optional[asyncio.Task] = None

        self._last_run: Optional[datetime] = None
        self._run_count = 0
        self._error_count = 0
        self._consecutive_errors = 0

    @property
    def config(self) -> TickerConfig:
        return self._config

    @property
    def is_running(self) -> bool:
        return self._is_running and not self._is_paused

    @property
    def is_paused(self) -> bool:
        return self._is_paused

    @property
    def last_run(self) -> Optional[datetime]:
        return self._last_run

    @property
    def run_count(self) -> int:
        return self._run_count

    @property
    def error_count(self) -> int:
        return self._error_count

    async def start(self):
        """Ticker 시작"""
        if self._is_running:
            logger.warning(f"Ticker [{self._config.name}] is already running")
            return

        self._is_running = True
        self._is_paused = False
        self._task = asyncio.create_task(self._run_loop())
        logger.info(f"Ticker [{self._config.name}] started (interval: {self._config.interval_seconds}s)")

    async def stop(self):
        """Ticker 정지"""
        self._is_running = False
        self._is_paused = False

        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

        logger.info(f"Ticker [{self._config.name}] stopped")

    def pause(self):
        """Ticker 일시정지"""
        if self._is_running and not self._is_paused:
            self._is_paused = True
            logger.info(f"Ticker [{self._config.name}] paused")

    def resume(self):
        """Ticker 재개"""
        if self._is_running and self._is_paused:
            self._is_paused = False
            logger.info(f"Ticker [{self._config.name}] resumed")

    async def _run_loop(self):
        """메인 루프"""
        while self._is_running:
            try:
                # 일시정지 상태면 대기
                while self._is_paused and self._is_running:
                    await asyncio.sleep(0.5)

                if not self._is_running:
                    break

                # 콜백 실행 (재시도 로직 포함)
                await self._execute_with_retry()

                # 다음 실행까지 대기
                await asyncio.sleep(self._config.interval_seconds)

            except asyncio.CancelledError:
                logger.info(f"Ticker [{self._config.name}] loop cancelled")
                break
            except Exception as e:
                logger.error(f"Unexpected error in ticker [{self._config.name}]: {e}")
                await asyncio.sleep(self._config.retry_delay_seconds)

    async def _execute_with_retry(self):
        """재시도 로직을 포함한 콜백 실행"""
        for attempt in range(self._config.max_retries):
            try:
                await self._callback()

                self._last_run = datetime.now()
                self._run_count += 1
                self._consecutive_errors = 0

                logger.debug(f"Ticker [{self._config.name}] executed successfully (run #{self._run_count})")
                return

            except Exception as e:
                self._error_count += 1
                self._consecutive_errors += 1

                if attempt < self._config.max_retries - 1:
                    logger.warning(
                        f"Ticker [{self._config.name}] failed (attempt {attempt + 1}/{self._config.max_retries}): {e}"
                    )
                    await asyncio.sleep(self._config.retry_delay_seconds * (attempt + 1))
                else:
                    logger.error(
                        f"Ticker [{self._config.name}] failed after {self._config.max_retries} attempts: {e}"
                    )
                    if self._on_error:
                        await self._on_error(self._config.name, e)


class TickerManager:
    """
    여러 Ticker를 관리하는 매니저

    - Ticker들의 일괄 시작/정지/일시정지/재개
    - 상태 모니터링
    """

    def __init__(self):
        self._tickers: dict[str, Ticker] = {}

    def add_ticker(self, ticker: Ticker):
        """Ticker 추가"""
        self._tickers[ticker.config.name] = ticker

    def remove_ticker(self, name: str):
        """Ticker 제거"""
        if name in self._tickers:
            del self._tickers[name]

    def get_ticker(self, name: str) -> Optional[Ticker]:
        """Ticker 조회"""
        return self._tickers.get(name)

    async def start_all(self):
        """모든 Ticker 시작"""
        for ticker in self._tickers.values():
            await ticker.start()

    async def stop_all(self):
        """모든 Ticker 정지"""
        for ticker in self._tickers.values():
            await ticker.stop()

    def pause_all(self):
        """모든 Ticker 일시정지"""
        for ticker in self._tickers.values():
            ticker.pause()

    def resume_all(self):
        """모든 Ticker 재개"""
        for ticker in self._tickers.values():
            ticker.resume()

    def get_status(self) -> dict:
        """전체 상태 조회"""
        return {
            name: {
                "interval": ticker.config.interval_seconds,
                "is_running": ticker.is_running,
                "is_paused": ticker.is_paused,
                "last_run": ticker.last_run.isoformat() if ticker.last_run else None,
                "run_count": ticker.run_count,
                "error_count": ticker.error_count
            }
            for name, ticker in self._tickers.items()
        }
