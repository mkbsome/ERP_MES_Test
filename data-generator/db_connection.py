"""
DB 연결 유틸리티
"""
import psycopg2
from psycopg2.extras import execute_values, RealDictCursor
from config import DB_CONFIG

def get_connection():
    """DB 연결 반환"""
    return psycopg2.connect(**DB_CONFIG)

def execute(query, params=None):
    """단일 쿼리 실행"""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, params)
        conn.commit()
    finally:
        conn.close()

def execute_batch(query, data_list):
    """배치 INSERT"""
    if not data_list:
        return
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            execute_values(cur, query, data_list)
        conn.commit()
    finally:
        conn.close()

def fetch_one(query, params=None):
    """단일 행 조회"""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            return cur.fetchone()
    finally:
        conn.close()

def fetch_all(query, params=None):
    """전체 행 조회 (dict 형태)"""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            return cur.fetchall()
    finally:
        conn.close()

def insert_returning(query, params=None):
    """INSERT 후 ID 반환"""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, params)
            result = cur.fetchone()
        conn.commit()
        return result[0] if result else None
    finally:
        conn.close()

def truncate_tables(tables):
    """테이블 초기화"""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            for table in tables:
                cur.execute(f"TRUNCATE TABLE {table} CASCADE")
        conn.commit()
        print(f"Truncated {len(tables)} tables")
    finally:
        conn.close()
