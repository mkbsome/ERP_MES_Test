"""
생성기 기본 클래스
"""
import yaml
import random
from datetime import datetime, timedelta
from faker import Faker
from db_connection import execute_batch, fetch_all, fetch_one
from config import TENANT_ID, SCENARIO_PATH, DATA_PERIOD

fake = Faker('ko_KR')

class BaseGenerator:
    """생성기 기본 클래스"""

    def __init__(self, scenario_file):
        self.tenant_id = TENANT_ID
        self.period_start = DATA_PERIOD['start']
        self.period_end = DATA_PERIOD['end']
        self.scenario = self._load_scenario(scenario_file)

    def _load_scenario(self, filename):
        """YAML 시나리오 로드"""
        filepath = f"{SCENARIO_PATH}/{filename}"
        with open(filepath, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)

    def random_date(self, start=None, end=None):
        """기간 내 랜덤 날짜 생성"""
        start = start or self.period_start
        end = end or self.period_end
        delta = (end - start).days
        return start + timedelta(days=random.randint(0, delta))

    def random_datetime(self, base_date):
        """날짜에 랜덤 시간 추가"""
        hour = random.randint(8, 17)
        minute = random.randint(0, 59)
        return datetime.combine(base_date, datetime.min.time()) + timedelta(hours=hour, minutes=minute)

    def weighted_choice(self, choices_dict):
        """가중치 기반 랜덤 선택"""
        items = list(choices_dict.keys())
        weights = [float(str(v).replace('%', '')) for v in choices_dict.values()]
        return random.choices(items, weights=weights, k=1)[0]

    def get_months_in_period(self):
        """기간 내 월 목록"""
        months = []
        current = self.period_start.replace(day=1)
        while current <= self.period_end:
            months.append(current)
            if current.month == 12:
                current = current.replace(year=current.year + 1, month=1)
            else:
                current = current.replace(month=current.month + 1)
        return months

    def generate(self):
        """생성 실행 (하위 클래스에서 구현)"""
        raise NotImplementedError
