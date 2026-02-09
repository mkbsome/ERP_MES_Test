"""
데이터 생성기 설정
"""
import os
import uuid
from datetime import date

# DB 연결 설정
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME', 'erp_mes_db'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'solutiontree8789')
}

# 테넌트 설정 (고정 UUID 사용)
TENANT_ID = os.getenv('TENANT_ID', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')

# 데이터 생성 기간
DATA_PERIOD = {
    'start': date(2024, 1, 1),
    'end': date.today()
}

# 시나리오 파일 경로
SCENARIO_PATH = os.path.join(os.path.dirname(__file__), 'scenarios')

# 한국어 데이터
KOREAN_DATA = {
    'company_suffixes': ['전자', '산업', '테크', '시스템', '솔루션', '엔지니어링', '정밀', '하이텍'],
    'first_names': ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'],
    'product_types': ['반도체', 'PCB', '커넥터', '센서', '모듈', '케이블', 'IC', '저항', '콘덴서'],
}
