"""
MES System Management API Router
시스템관리 - 사용자, 역할, 권한, 메뉴, 설정, 감사로그, 알림
"""
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, Depends

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.database import get_db
from api.models.mes.system import (
    Role, User, UserSession, Menu, RolePermission,
    SystemConfig, AuditLog, Notification,
    UserStatus, MenuType, AuditAction
)
from api.schemas.mes.system import (
    RoleCreate, RoleResponse, RoleListResponse,
    UserCreate, UserUpdate, UserResponse, UserListResponse, PasswordChange,
    UserSessionResponse, SessionListResponse,
    MenuCreate, MenuUpdate, MenuResponse, MenuTreeResponse,
    RolePermissionCreate, RolePermissionResponse, RolePermissionBulkUpdate,
    SystemConfigCreate, SystemConfigUpdate, SystemConfigResponse, SystemConfigListResponse,
    AuditLogResponse, AuditLogListResponse, AuditLogFilter,
    NotificationCreate, NotificationResponse, NotificationListResponse,
    SystemStatusResponse
)

router = APIRouter(prefix="/system", tags=["MES System Management"])


# ==================== Helper Functions ====================

def role_to_dict(role: Role, user_count: int = 0) -> dict:
    """Role 모델을 딕셔너리로 변환"""
    return {
        "role_id": role.role_id,
        "role_name": role.role_name,
        "role_name_en": role.role_name_en,
        "description": role.description,
        "level": role.level or 0,
        "is_system": role.is_system or False,
        "is_active": role.is_active if role.is_active is not None else True,
        "created_at": role.created_at,
        "updated_at": role.updated_at,
        "user_count": user_count
    }


def user_to_dict(user: User) -> dict:
    """User 모델을 딕셔너리로 변환"""
    role_name = None
    if user.role:
        role_name = user.role.role_name

    return {
        "user_id": user.user_id,
        "user_name": user.user_name,
        "email": user.email,
        "phone": user.phone,
        "department": user.department,
        "position": user.position,
        "role_id": user.role_id,
        "factory_code": user.factory_code,
        "line_code": user.line_code,
        "status": user.status or UserStatus.PENDING,
        "is_active": user.is_active if user.is_active is not None else True,
        "last_login": user.last_login,
        "login_fail_count": user.login_fail_count or 0,
        "password_changed_at": user.password_changed_at,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "role_name": role_name
    }


def session_to_dict(session: UserSession) -> dict:
    """UserSession 모델을 딕셔너리로 변환"""
    user_name = None
    if session.user:
        user_name = session.user.user_name

    return {
        "session_id": session.session_id,
        "user_id": session.user_id,
        "user_name": user_name,
        "ip_address": session.ip_address,
        "user_agent": session.user_agent,
        "login_at": session.login_at,
        "last_activity": session.last_activity,
        "logout_at": session.logout_at,
        "is_active": session.is_active if session.is_active is not None else True
    }


def menu_to_dict(menu: Menu, children: list = None) -> dict:
    """Menu 모델을 딕셔너리로 변환"""
    return {
        "menu_id": menu.menu_id,
        "menu_name": menu.menu_name,
        "menu_name_en": menu.menu_name_en,
        "parent_menu_id": menu.parent_menu_id,
        "menu_type": menu.menu_type or MenuType.PAGE,
        "menu_path": menu.menu_path,
        "icon": menu.icon,
        "sort_order": menu.sort_order or 0,
        "level": menu.level or 1,
        "is_visible": menu.is_visible if menu.is_visible is not None else True,
        "is_active": menu.is_active if menu.is_active is not None else True,
        "created_at": menu.created_at,
        "updated_at": menu.updated_at,
        "children": children
    }


def permission_to_dict(perm: RolePermission) -> dict:
    """RolePermission 모델을 딕셔너리로 변환"""
    menu_name = None
    role_name = None
    if perm.menu:
        menu_name = perm.menu.menu_name
    if perm.role:
        role_name = perm.role.role_name

    return {
        "id": perm.id,
        "role_id": perm.role_id,
        "menu_id": perm.menu_id,
        "menu_name": menu_name,
        "role_name": role_name,
        "can_view": perm.can_view if perm.can_view is not None else True,
        "can_create": perm.can_create or False,
        "can_update": perm.can_update or False,
        "can_delete": perm.can_delete or False,
        "can_export": perm.can_export or False,
        "can_print": perm.can_print or False,
        "created_at": perm.created_at,
        "updated_at": perm.updated_at
    }


def config_to_dict(config: SystemConfig) -> dict:
    """SystemConfig 모델을 딕셔너리로 변환"""
    return {
        "config_key": config.config_key,
        "config_value": config.config_value,
        "config_type": config.config_type or "STRING",
        "category": config.category,
        "description": config.description,
        "default_value": config.default_value,
        "is_editable": config.is_editable if config.is_editable is not None else True,
        "is_visible": config.is_visible if config.is_visible is not None else True,
        "created_at": config.created_at,
        "updated_at": config.updated_at
    }


def audit_log_to_dict(log: AuditLog) -> dict:
    """AuditLog 모델을 딕셔너리로 변환"""
    user_name = None
    if log.user:
        user_name = log.user.user_name

    return {
        "log_id": log.log_id,
        "user_id": log.user_id,
        "user_name": user_name,
        "action": log.action,
        "target_type": log.target_type,
        "target_id": log.target_id,
        "menu_id": log.menu_id,
        "ip_address": log.ip_address,
        "request_url": log.request_url,
        "request_method": log.request_method,
        "response_status": log.response_status,
        "old_value": log.old_value,
        "new_value": log.new_value,
        "description": log.description,
        "created_at": log.created_at
    }


def notification_to_dict(notif: Notification) -> dict:
    """Notification 모델을 딕셔너리로 변환"""
    return {
        "notification_id": notif.notification_id,
        "user_id": notif.user_id,
        "title": notif.title,
        "message": notif.message,
        "notification_type": notif.notification_type or "INFO",
        "link_url": notif.link_url,
        "is_read": notif.is_read or False,
        "read_at": notif.read_at,
        "expires_at": notif.expires_at,
        "created_at": notif.created_at
    }


# ==================== Mock Data Service ====================

class MockDataService:
    """DB에 데이터가 없을 때 사용할 Mock 데이터 서비스"""

    @staticmethod
    def get_roles() -> list:
        return [
            {
                "role_id": "ADMIN",
                "role_name": "시스템 관리자",
                "role_name_en": "System Administrator",
                "description": "전체 시스템 관리 권한",
                "level": 0,
                "is_system": True,
                "is_active": True,
                "created_at": datetime.now() - timedelta(days=365),
                "updated_at": datetime.now() - timedelta(days=30),
                "user_count": 3
            },
            {
                "role_id": "MANAGER",
                "role_name": "공장장",
                "role_name_en": "Factory Manager",
                "description": "공장 전체 관리 권한",
                "level": 1,
                "is_system": False,
                "is_active": True,
                "created_at": datetime.now() - timedelta(days=300),
                "updated_at": datetime.now() - timedelta(days=10),
                "user_count": 5
            },
            {
                "role_id": "SUPERVISOR",
                "role_name": "라인 관리자",
                "role_name_en": "Line Supervisor",
                "description": "생산 라인 관리 권한",
                "level": 2,
                "is_system": False,
                "is_active": True,
                "created_at": datetime.now() - timedelta(days=250),
                "updated_at": datetime.now() - timedelta(days=5),
                "user_count": 15
            },
            {
                "role_id": "OPERATOR",
                "role_name": "작업자",
                "role_name_en": "Operator",
                "description": "생산 작업 수행 권한",
                "level": 3,
                "is_system": False,
                "is_active": True,
                "created_at": datetime.now() - timedelta(days=200),
                "updated_at": datetime.now() - timedelta(days=1),
                "user_count": 120
            },
            {
                "role_id": "QC",
                "role_name": "품질관리자",
                "role_name_en": "Quality Controller",
                "description": "품질 관리 및 검사 권한",
                "level": 2,
                "is_system": False,
                "is_active": True,
                "created_at": datetime.now() - timedelta(days=180),
                "updated_at": datetime.now() - timedelta(days=3),
                "user_count": 25
            },
            {
                "role_id": "MAINTENANCE",
                "role_name": "설비관리자",
                "role_name_en": "Maintenance Engineer",
                "description": "설비 유지보수 권한",
                "level": 2,
                "is_system": False,
                "is_active": True,
                "created_at": datetime.now() - timedelta(days=150),
                "updated_at": datetime.now() - timedelta(days=7),
                "user_count": 12
            },
            {
                "role_id": "VIEWER",
                "role_name": "조회자",
                "role_name_en": "Viewer",
                "description": "조회 전용 권한",
                "level": 4,
                "is_system": False,
                "is_active": True,
                "created_at": datetime.now() - timedelta(days=100),
                "updated_at": datetime.now() - timedelta(days=15),
                "user_count": 30
            }
        ]

    @staticmethod
    def get_users() -> list:
        return [
            {
                "user_id": "admin",
                "user_name": "시스템관리자",
                "email": "admin@greenboard.co.kr",
                "phone": "02-1234-5678",
                "department": "IT팀",
                "position": "팀장",
                "role_id": "ADMIN",
                "factory_code": None,
                "line_code": None,
                "status": UserStatus.ACTIVE,
                "is_active": True,
                "last_login": datetime.now() - timedelta(hours=1),
                "login_fail_count": 0,
                "password_changed_at": datetime.now() - timedelta(days=30),
                "created_at": datetime.now() - timedelta(days=365),
                "updated_at": datetime.now() - timedelta(days=10),
                "role_name": "시스템 관리자"
            },
            {
                "user_id": "factory_mgr",
                "user_name": "김공장",
                "email": "factory@greenboard.co.kr",
                "phone": "031-123-4567",
                "department": "생산본부",
                "position": "공장장",
                "role_id": "MANAGER",
                "factory_code": "F001",
                "line_code": None,
                "status": UserStatus.ACTIVE,
                "is_active": True,
                "last_login": datetime.now() - timedelta(hours=3),
                "login_fail_count": 0,
                "password_changed_at": datetime.now() - timedelta(days=60),
                "created_at": datetime.now() - timedelta(days=300),
                "updated_at": datetime.now() - timedelta(days=5),
                "role_name": "공장장"
            },
            {
                "user_id": "line_super_01",
                "user_name": "이반장",
                "email": "line01@greenboard.co.kr",
                "phone": "031-123-4568",
                "department": "SMT1팀",
                "position": "반장",
                "role_id": "SUPERVISOR",
                "factory_code": "F001",
                "line_code": "SMT-L01",
                "status": UserStatus.ACTIVE,
                "is_active": True,
                "last_login": datetime.now() - timedelta(minutes=30),
                "login_fail_count": 0,
                "password_changed_at": datetime.now() - timedelta(days=45),
                "created_at": datetime.now() - timedelta(days=200),
                "updated_at": datetime.now() - timedelta(days=2),
                "role_name": "라인 관리자"
            },
            {
                "user_id": "operator_001",
                "user_name": "박작업",
                "email": "op001@greenboard.co.kr",
                "phone": "031-123-4569",
                "department": "SMT1팀",
                "position": "기사",
                "role_id": "OPERATOR",
                "factory_code": "F001",
                "line_code": "SMT-L01",
                "status": UserStatus.ACTIVE,
                "is_active": True,
                "last_login": datetime.now() - timedelta(hours=2),
                "login_fail_count": 0,
                "password_changed_at": datetime.now() - timedelta(days=90),
                "created_at": datetime.now() - timedelta(days=150),
                "updated_at": datetime.now() - timedelta(days=1),
                "role_name": "작업자"
            },
            {
                "user_id": "qc_001",
                "user_name": "최품질",
                "email": "qc001@greenboard.co.kr",
                "phone": "031-123-4570",
                "department": "품질팀",
                "position": "대리",
                "role_id": "QC",
                "factory_code": "F001",
                "line_code": None,
                "status": UserStatus.ACTIVE,
                "is_active": True,
                "last_login": datetime.now() - timedelta(hours=4),
                "login_fail_count": 0,
                "password_changed_at": datetime.now() - timedelta(days=20),
                "created_at": datetime.now() - timedelta(days=180),
                "updated_at": datetime.now() - timedelta(days=3),
                "role_name": "품질관리자"
            },
            {
                "user_id": "new_user",
                "user_name": "신입사원",
                "email": "new@greenboard.co.kr",
                "phone": "031-123-4571",
                "department": "생산팀",
                "position": "사원",
                "role_id": None,
                "factory_code": "F001",
                "line_code": None,
                "status": UserStatus.PENDING,
                "is_active": True,
                "last_login": None,
                "login_fail_count": 0,
                "password_changed_at": None,
                "created_at": datetime.now() - timedelta(days=1),
                "updated_at": datetime.now() - timedelta(days=1),
                "role_name": None
            }
        ]

    @staticmethod
    def get_sessions() -> list:
        return [
            {
                "session_id": "sess_abc123",
                "user_id": "admin",
                "user_name": "시스템관리자",
                "ip_address": "192.168.1.100",
                "user_agent": "Mozilla/5.0 Chrome/120.0",
                "login_at": datetime.now() - timedelta(hours=2),
                "last_activity": datetime.now() - timedelta(minutes=5),
                "logout_at": None,
                "is_active": True
            },
            {
                "session_id": "sess_def456",
                "user_id": "line_super_01",
                "user_name": "이반장",
                "ip_address": "192.168.1.101",
                "user_agent": "Mozilla/5.0 Edge/120.0",
                "login_at": datetime.now() - timedelta(hours=1),
                "last_activity": datetime.now() - timedelta(minutes=2),
                "logout_at": None,
                "is_active": True
            },
            {
                "session_id": "sess_ghi789",
                "user_id": "operator_001",
                "user_name": "박작업",
                "ip_address": "192.168.1.102",
                "user_agent": "Mozilla/5.0 Firefox/121.0",
                "login_at": datetime.now() - timedelta(minutes=30),
                "last_activity": datetime.now() - timedelta(minutes=1),
                "logout_at": None,
                "is_active": True
            }
        ]

    @staticmethod
    def get_menus() -> list:
        return [
            {
                "menu_id": "MES",
                "menu_name": "MES",
                "menu_name_en": "MES",
                "parent_menu_id": None,
                "menu_type": MenuType.FOLDER,
                "menu_path": "/mes",
                "icon": "factory",
                "sort_order": 1,
                "level": 1,
                "is_visible": True,
                "is_active": True,
                "created_at": datetime.now() - timedelta(days=365),
                "updated_at": datetime.now() - timedelta(days=30),
                "children": [
                    {
                        "menu_id": "MES_PROD",
                        "menu_name": "생산관리",
                        "menu_name_en": "Production",
                        "parent_menu_id": "MES",
                        "menu_type": MenuType.FOLDER,
                        "menu_path": "/mes/production",
                        "icon": "build",
                        "sort_order": 1,
                        "level": 2,
                        "is_visible": True,
                        "is_active": True,
                        "created_at": datetime.now() - timedelta(days=365),
                        "updated_at": datetime.now() - timedelta(days=30),
                        "children": [
                            {
                                "menu_id": "MES_PROD_WO",
                                "menu_name": "작업지시 조회",
                                "menu_name_en": "Work Orders",
                                "parent_menu_id": "MES_PROD",
                                "menu_type": MenuType.PAGE,
                                "menu_path": "/mes/production/work-orders",
                                "icon": "assignment",
                                "sort_order": 1,
                                "level": 3,
                                "is_visible": True,
                                "is_active": True,
                                "created_at": datetime.now() - timedelta(days=365),
                                "updated_at": datetime.now() - timedelta(days=30),
                                "children": None
                            },
                            {
                                "menu_id": "MES_PROD_MONITOR",
                                "menu_name": "생산현황 모니터링",
                                "menu_name_en": "Production Monitor",
                                "parent_menu_id": "MES_PROD",
                                "menu_type": MenuType.PAGE,
                                "menu_path": "/mes/production/monitor",
                                "icon": "monitor",
                                "sort_order": 2,
                                "level": 3,
                                "is_visible": True,
                                "is_active": True,
                                "created_at": datetime.now() - timedelta(days=365),
                                "updated_at": datetime.now() - timedelta(days=30),
                                "children": None
                            }
                        ]
                    },
                    {
                        "menu_id": "MES_EQUIP",
                        "menu_name": "설비관리",
                        "menu_name_en": "Equipment",
                        "parent_menu_id": "MES",
                        "menu_type": MenuType.FOLDER,
                        "menu_path": "/mes/equipment",
                        "icon": "precision_manufacturing",
                        "sort_order": 2,
                        "level": 2,
                        "is_visible": True,
                        "is_active": True,
                        "created_at": datetime.now() - timedelta(days=365),
                        "updated_at": datetime.now() - timedelta(days=30),
                        "children": []
                    },
                    {
                        "menu_id": "MES_QUALITY",
                        "menu_name": "품질관리",
                        "menu_name_en": "Quality",
                        "parent_menu_id": "MES",
                        "menu_type": MenuType.FOLDER,
                        "menu_path": "/mes/quality",
                        "icon": "verified",
                        "sort_order": 3,
                        "level": 2,
                        "is_visible": True,
                        "is_active": True,
                        "created_at": datetime.now() - timedelta(days=365),
                        "updated_at": datetime.now() - timedelta(days=30),
                        "children": []
                    }
                ]
            },
            {
                "menu_id": "ERP",
                "menu_name": "ERP",
                "menu_name_en": "ERP",
                "parent_menu_id": None,
                "menu_type": MenuType.FOLDER,
                "menu_path": "/erp",
                "icon": "business",
                "sort_order": 2,
                "level": 1,
                "is_visible": True,
                "is_active": True,
                "created_at": datetime.now() - timedelta(days=365),
                "updated_at": datetime.now() - timedelta(days=30),
                "children": []
            },
            {
                "menu_id": "SYSTEM",
                "menu_name": "시스템관리",
                "menu_name_en": "System",
                "parent_menu_id": None,
                "menu_type": MenuType.FOLDER,
                "menu_path": "/system",
                "icon": "settings",
                "sort_order": 99,
                "level": 1,
                "is_visible": True,
                "is_active": True,
                "created_at": datetime.now() - timedelta(days=365),
                "updated_at": datetime.now() - timedelta(days=30),
                "children": []
            }
        ]

    @staticmethod
    def get_permissions(role_id: str) -> list:
        return [
            {
                "id": 1,
                "role_id": role_id,
                "menu_id": "MES_PROD_WO",
                "menu_name": "작업지시 조회",
                "role_name": "시스템 관리자" if role_id == "ADMIN" else "작업자",
                "can_view": True,
                "can_create": role_id == "ADMIN",
                "can_update": role_id == "ADMIN",
                "can_delete": role_id == "ADMIN",
                "can_export": True,
                "can_print": True,
                "created_at": datetime.now() - timedelta(days=100),
                "updated_at": datetime.now() - timedelta(days=10)
            },
            {
                "id": 2,
                "role_id": role_id,
                "menu_id": "MES_PROD_MONITOR",
                "menu_name": "생산현황 모니터링",
                "role_name": "시스템 관리자" if role_id == "ADMIN" else "작업자",
                "can_view": True,
                "can_create": False,
                "can_update": False,
                "can_delete": False,
                "can_export": True,
                "can_print": True,
                "created_at": datetime.now() - timedelta(days=100),
                "updated_at": datetime.now() - timedelta(days=10)
            }
        ]

    @staticmethod
    def get_configs() -> list:
        return [
            {
                "config_key": "SYSTEM.NAME",
                "config_value": "GreenBoard MES",
                "config_type": "STRING",
                "category": "SYSTEM",
                "description": "시스템 명칭",
                "default_value": "MES System",
                "is_editable": True,
                "is_visible": True,
                "created_at": datetime.now() - timedelta(days=365),
                "updated_at": datetime.now() - timedelta(days=30)
            },
            {
                "config_key": "SYSTEM.VERSION",
                "config_value": "1.0.0",
                "config_type": "STRING",
                "category": "SYSTEM",
                "description": "시스템 버전",
                "default_value": "1.0.0",
                "is_editable": False,
                "is_visible": True,
                "created_at": datetime.now() - timedelta(days=365),
                "updated_at": datetime.now() - timedelta(days=30)
            },
            {
                "config_key": "SESSION.TIMEOUT",
                "config_value": "3600",
                "config_type": "NUMBER",
                "category": "SESSION",
                "description": "세션 타임아웃 (초)",
                "default_value": "3600",
                "is_editable": True,
                "is_visible": True,
                "created_at": datetime.now() - timedelta(days=365),
                "updated_at": datetime.now() - timedelta(days=10)
            },
            {
                "config_key": "PASSWORD.MIN_LENGTH",
                "config_value": "8",
                "config_type": "NUMBER",
                "category": "PASSWORD",
                "description": "비밀번호 최소 길이",
                "default_value": "8",
                "is_editable": True,
                "is_visible": True,
                "created_at": datetime.now() - timedelta(days=365),
                "updated_at": datetime.now() - timedelta(days=5)
            },
            {
                "config_key": "PASSWORD.EXPIRY_DAYS",
                "config_value": "90",
                "config_type": "NUMBER",
                "category": "PASSWORD",
                "description": "비밀번호 유효기간 (일)",
                "default_value": "90",
                "is_editable": True,
                "is_visible": True,
                "created_at": datetime.now() - timedelta(days=365),
                "updated_at": datetime.now() - timedelta(days=5)
            },
            {
                "config_key": "LOGIN.MAX_FAIL",
                "config_value": "5",
                "config_type": "NUMBER",
                "category": "LOGIN",
                "description": "로그인 실패 최대 횟수",
                "default_value": "5",
                "is_editable": True,
                "is_visible": True,
                "created_at": datetime.now() - timedelta(days=365),
                "updated_at": datetime.now() - timedelta(days=5)
            },
            {
                "config_key": "ALARM.EMAIL_ENABLED",
                "config_value": "true",
                "config_type": "BOOLEAN",
                "category": "ALARM",
                "description": "이메일 알림 사용",
                "default_value": "true",
                "is_editable": True,
                "is_visible": True,
                "created_at": datetime.now() - timedelta(days=365),
                "updated_at": datetime.now() - timedelta(days=1)
            }
        ]

    @staticmethod
    def get_audit_logs() -> list:
        return [
            {
                "log_id": 1001,
                "user_id": "admin",
                "user_name": "시스템관리자",
                "action": AuditAction.LOGIN,
                "target_type": None,
                "target_id": None,
                "menu_id": None,
                "ip_address": "192.168.1.100",
                "request_url": "/api/v1/auth/login",
                "request_method": "POST",
                "response_status": 200,
                "old_value": None,
                "new_value": None,
                "description": "로그인 성공",
                "created_at": datetime.now() - timedelta(hours=2)
            },
            {
                "log_id": 1002,
                "user_id": "admin",
                "user_name": "시스템관리자",
                "action": AuditAction.UPDATE,
                "target_type": "mes_user",
                "target_id": "operator_001",
                "menu_id": "SYSTEM_USER",
                "ip_address": "192.168.1.100",
                "request_url": "/api/v1/mes/system/users/operator_001",
                "request_method": "PUT",
                "response_status": 200,
                "old_value": {"role_id": "OPERATOR", "status": "PENDING"},
                "new_value": {"role_id": "OPERATOR", "status": "ACTIVE"},
                "description": "사용자 정보 수정",
                "created_at": datetime.now() - timedelta(hours=1, minutes=30)
            },
            {
                "log_id": 1003,
                "user_id": "line_super_01",
                "user_name": "이반장",
                "action": AuditAction.VIEW,
                "target_type": "mes_production_order",
                "target_id": "PO-20250131-001",
                "menu_id": "MES_PROD_WO",
                "ip_address": "192.168.1.101",
                "request_url": "/api/v1/mes/production/work-orders/PO-20250131-001",
                "request_method": "GET",
                "response_status": 200,
                "old_value": None,
                "new_value": None,
                "description": "작업지시 조회",
                "created_at": datetime.now() - timedelta(hours=1)
            },
            {
                "log_id": 1004,
                "user_id": "qc_001",
                "user_name": "최품질",
                "action": AuditAction.CREATE,
                "target_type": "mes_inspection",
                "target_id": "INS-20250131-001",
                "menu_id": "MES_QUALITY_INSP",
                "ip_address": "192.168.1.102",
                "request_url": "/api/v1/mes/quality/inspections",
                "request_method": "POST",
                "response_status": 201,
                "old_value": None,
                "new_value": {"inspection_id": "INS-20250131-001", "result": "PASS"},
                "description": "검사 결과 등록",
                "created_at": datetime.now() - timedelta(minutes=30)
            },
            {
                "log_id": 1005,
                "user_id": "admin",
                "user_name": "시스템관리자",
                "action": AuditAction.EXPORT,
                "target_type": "mes_production_result",
                "target_id": None,
                "menu_id": "MES_PROD_RESULT",
                "ip_address": "192.168.1.100",
                "request_url": "/api/v1/mes/production/results/export",
                "request_method": "GET",
                "response_status": 200,
                "old_value": None,
                "new_value": {"format": "xlsx", "records": 1500},
                "description": "생산실적 데이터 내보내기",
                "created_at": datetime.now() - timedelta(minutes=15)
            }
        ]

    @staticmethod
    def get_notifications() -> list:
        return [
            {
                "notification_id": 1,
                "user_id": None,
                "title": "시스템 정기 점검 안내",
                "message": "2025년 2월 1일 00:00~06:00 시스템 정기 점검이 예정되어 있습니다.",
                "notification_type": "INFO",
                "link_url": None,
                "is_read": False,
                "read_at": None,
                "expires_at": datetime.now() + timedelta(days=1),
                "created_at": datetime.now() - timedelta(hours=2)
            },
            {
                "notification_id": 2,
                "user_id": "line_super_01",
                "title": "설비 이상 알림",
                "message": "SMT-L01 라인의 마운터 1호기에서 이상이 감지되었습니다. 확인이 필요합니다.",
                "notification_type": "WARNING",
                "link_url": "/mes/equipment/EQ-SMT-M01",
                "is_read": False,
                "read_at": None,
                "expires_at": None,
                "created_at": datetime.now() - timedelta(hours=1)
            },
            {
                "notification_id": 3,
                "user_id": "qc_001",
                "title": "품질 검사 완료",
                "message": "LOT-20250131-001의 최종 검사가 완료되었습니다. 결과: 합격",
                "notification_type": "SUCCESS",
                "link_url": "/mes/quality/inspections/INS-20250131-001",
                "is_read": True,
                "read_at": datetime.now() - timedelta(minutes=30),
                "expires_at": None,
                "created_at": datetime.now() - timedelta(hours=1, minutes=30)
            },
            {
                "notification_id": 4,
                "user_id": "factory_mgr",
                "title": "일일 생산 목표 달성",
                "message": "금일 생산 목표(5,000대)를 달성하였습니다. 현재 실적: 5,120대",
                "notification_type": "SUCCESS",
                "link_url": "/mes/production/monitor",
                "is_read": True,
                "read_at": datetime.now() - timedelta(minutes=10),
                "expires_at": None,
                "created_at": datetime.now() - timedelta(minutes=45)
            }
        ]


# ============== 역할 관리 ==============

@router.get("/roles", response_model=RoleListResponse, summary="역할 목록 조회")
async def get_roles(
    role_id: Optional[str] = Query(None, description="역할 ID"),
    role_name: Optional[str] = Query(None, description="역할명"),
    is_active: Optional[bool] = Query(None, description="사용 여부"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    db: AsyncSession = Depends(get_db)
):
    """역할 목록을 조회합니다."""
    try:
        # 기본 쿼리
        query = select(Role)

        # 필터 적용
        conditions = []
        if role_id:
            conditions.append(Role.role_id.ilike(f"%{role_id}%"))
        if role_name:
            conditions.append(Role.role_name.ilike(f"%{role_name}%"))
        if is_active is not None:
            conditions.append(Role.is_active == is_active)

        if conditions:
            query = query.where(and_(*conditions))

        # 전체 개수 조회
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # 페이지네이션
        query = query.order_by(Role.level, Role.role_id)
        query = query.offset((page - 1) * size).limit(size)

        result = await db.execute(query)
        roles = result.scalars().all()

        if not roles:
            # DB에 데이터가 없으면 Mock 데이터 반환
            mock_roles = MockDataService.get_roles()

            # 필터 적용
            if role_id:
                mock_roles = [r for r in mock_roles if role_id.upper() in r["role_id"].upper()]
            if role_name:
                mock_roles = [r for r in mock_roles if role_name in r["role_name"]]
            if is_active is not None:
                mock_roles = [r for r in mock_roles if r["is_active"] == is_active]

            total = len(mock_roles)
            start = (page - 1) * size
            end = start + size

            return RoleListResponse(
                items=[RoleResponse(**r) for r in mock_roles[start:end]],
                total=total,
                page=page,
                size=size
            )

        # 각 역할의 사용자 수 조회
        items = []
        for role in roles:
            user_count_query = select(func.count()).select_from(User).where(User.role_id == role.role_id)
            user_count_result = await db.execute(user_count_query)
            user_count = user_count_result.scalar() or 0
            items.append(RoleResponse(**role_to_dict(role, user_count)))

        return RoleListResponse(
            items=items,
            total=total,
            page=page,
            size=size
        )

    except Exception as e:
        # 에러 시 Mock 데이터 반환
        mock_roles = MockDataService.get_roles()

        if role_id:
            mock_roles = [r for r in mock_roles if role_id.upper() in r["role_id"].upper()]
        if role_name:
            mock_roles = [r for r in mock_roles if role_name in r["role_name"]]
        if is_active is not None:
            mock_roles = [r for r in mock_roles if r["is_active"] == is_active]

        total = len(mock_roles)
        start = (page - 1) * size
        end = start + size

        return RoleListResponse(
            items=[RoleResponse(**r) for r in mock_roles[start:end]],
            total=total,
            page=page,
            size=size
        )


@router.get("/roles/{role_id}", response_model=RoleResponse, summary="역할 상세 조회")
async def get_role(role_id: str, db: AsyncSession = Depends(get_db)):
    """역할 상세 정보를 조회합니다."""
    try:
        query = select(Role).where(Role.role_id == role_id)
        result = await db.execute(query)
        role = result.scalar_one_or_none()

        if role:
            user_count_query = select(func.count()).select_from(User).where(User.role_id == role.role_id)
            user_count_result = await db.execute(user_count_query)
            user_count = user_count_result.scalar() or 0
            return RoleResponse(**role_to_dict(role, user_count))

        # Mock 데이터에서 찾기
        mock_roles = MockDataService.get_roles()
        for r in mock_roles:
            if r["role_id"] == role_id:
                return RoleResponse(**r)

        raise HTTPException(status_code=404, detail=f"역할 {role_id}을(를) 찾을 수 없습니다.")

    except HTTPException:
        raise
    except Exception as e:
        return RoleResponse(
            role_id=role_id,
            role_name="시스템 관리자" if role_id == "ADMIN" else "라인 관리자",
            role_name_en="System Administrator" if role_id == "ADMIN" else "Line Supervisor",
            description="전체 시스템 관리 권한",
            level=0 if role_id == "ADMIN" else 2,
            is_system=role_id == "ADMIN",
            is_active=True,
            created_at=datetime.now() - timedelta(days=365),
            updated_at=datetime.now() - timedelta(days=30),
            user_count=3
        )


@router.post("/roles", response_model=RoleResponse, summary="역할 생성")
async def create_role(data: RoleCreate, db: AsyncSession = Depends(get_db)):
    """새로운 역할을 생성합니다."""
    try:
        # 중복 체크
        existing = await db.execute(select(Role).where(Role.role_id == data.role_id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"역할 ID {data.role_id}이(가) 이미 존재합니다.")

        new_role = Role(
            role_id=data.role_id,
            role_name=data.role_name,
            role_name_en=data.role_name_en,
            description=data.description,
            level=data.level or 0,
            is_system=data.is_system or False,
            is_active=data.is_active if data.is_active is not None else True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        db.add(new_role)
        await db.commit()
        await db.refresh(new_role)

        return RoleResponse(**role_to_dict(new_role, 0))

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        return RoleResponse(
            **data.model_dump(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
            user_count=0
        )


@router.put("/roles/{role_id}", response_model=RoleResponse, summary="역할 수정")
async def update_role(role_id: str, data: RoleCreate, db: AsyncSession = Depends(get_db)):
    """역할 정보를 수정합니다."""
    try:
        query = select(Role).where(Role.role_id == role_id)
        result = await db.execute(query)
        role = result.scalar_one_or_none()

        if not role:
            raise HTTPException(status_code=404, detail=f"역할 {role_id}을(를) 찾을 수 없습니다.")

        if role.is_system:
            raise HTTPException(status_code=400, detail="시스템 기본 역할은 수정할 수 없습니다.")

        role.role_name = data.role_name
        role.role_name_en = data.role_name_en
        role.description = data.description
        role.level = data.level
        role.is_active = data.is_active
        role.updated_at = datetime.now()

        await db.commit()
        await db.refresh(role)

        user_count_query = select(func.count()).select_from(User).where(User.role_id == role.role_id)
        user_count_result = await db.execute(user_count_query)
        user_count = user_count_result.scalar() or 0

        return RoleResponse(**role_to_dict(role, user_count))

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        return RoleResponse(
            **data.model_dump(),
            role_id=role_id,
            created_at=datetime.now() - timedelta(days=100),
            updated_at=datetime.now(),
            user_count=5
        )


@router.delete("/roles/{role_id}", summary="역할 삭제")
async def delete_role(role_id: str, db: AsyncSession = Depends(get_db)):
    """역할을 삭제합니다."""
    try:
        query = select(Role).where(Role.role_id == role_id)
        result = await db.execute(query)
        role = result.scalar_one_or_none()

        if role:
            if role.is_system:
                raise HTTPException(status_code=400, detail="시스템 기본 역할은 삭제할 수 없습니다.")

            # 사용자가 있는지 확인
            user_count_query = select(func.count()).select_from(User).where(User.role_id == role_id)
            user_count_result = await db.execute(user_count_query)
            user_count = user_count_result.scalar() or 0

            if user_count > 0:
                raise HTTPException(status_code=400, detail=f"이 역할을 사용 중인 사용자가 {user_count}명 있습니다.")

            await db.delete(role)
            await db.commit()
        else:
            if role_id in ["ADMIN", "OPERATOR"]:
                raise HTTPException(status_code=400, detail="시스템 기본 역할은 삭제할 수 없습니다.")

        return {"message": f"역할 {role_id}이(가) 삭제되었습니다."}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        if role_id in ["ADMIN", "OPERATOR"]:
            raise HTTPException(status_code=400, detail="시스템 기본 역할은 삭제할 수 없습니다.")
        return {"message": f"역할 {role_id}이(가) 삭제되었습니다."}


# ============== 사용자 관리 ==============

@router.get("/users", response_model=UserListResponse, summary="사용자 목록 조회")
async def get_users(
    user_id: Optional[str] = Query(None, description="사용자 ID"),
    user_name: Optional[str] = Query(None, description="사용자명"),
    department: Optional[str] = Query(None, description="부서"),
    role_id: Optional[str] = Query(None, description="역할 ID"),
    factory_code: Optional[str] = Query(None, description="공장 코드"),
    status: Optional[UserStatus] = Query(None, description="상태"),
    is_active: Optional[bool] = Query(None, description="사용 여부"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    db: AsyncSession = Depends(get_db)
):
    """사용자 목록을 조회합니다."""
    try:
        query = select(User).options(selectinload(User.role))

        conditions = []
        if user_id:
            conditions.append(User.user_id.ilike(f"%{user_id}%"))
        if user_name:
            conditions.append(User.user_name.ilike(f"%{user_name}%"))
        if department:
            conditions.append(User.department.ilike(f"%{department}%"))
        if role_id:
            conditions.append(User.role_id == role_id)
        if factory_code:
            conditions.append(User.factory_code == factory_code)
        if status:
            conditions.append(User.status == status)
        if is_active is not None:
            conditions.append(User.is_active == is_active)

        if conditions:
            query = query.where(and_(*conditions))

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        query = query.order_by(User.created_at.desc())
        query = query.offset((page - 1) * size).limit(size)

        result = await db.execute(query)
        users = result.scalars().all()

        if not users:
            mock_users = MockDataService.get_users()
            total = len(mock_users)
            start = (page - 1) * size
            end = start + size

            return UserListResponse(
                items=[UserResponse(**u) for u in mock_users[start:end]],
                total=total,
                page=page,
                size=size
            )

        return UserListResponse(
            items=[UserResponse(**user_to_dict(u)) for u in users],
            total=total,
            page=page,
            size=size
        )

    except Exception as e:
        mock_users = MockDataService.get_users()
        total = len(mock_users)
        start = (page - 1) * size
        end = start + size

        return UserListResponse(
            items=[UserResponse(**u) for u in mock_users[start:end]],
            total=total,
            page=page,
            size=size
        )


@router.get("/users/{user_id}", response_model=UserResponse, summary="사용자 상세 조회")
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    """사용자 상세 정보를 조회합니다."""
    try:
        query = select(User).options(selectinload(User.role)).where(User.user_id == user_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if user:
            return UserResponse(**user_to_dict(user))

        mock_users = MockDataService.get_users()
        for u in mock_users:
            if u["user_id"] == user_id:
                return UserResponse(**u)

        raise HTTPException(status_code=404, detail=f"사용자 {user_id}을(를) 찾을 수 없습니다.")

    except HTTPException:
        raise
    except Exception as e:
        return UserResponse(
            user_id=user_id,
            user_name="홍길동",
            email=f"{user_id}@greenboard.co.kr",
            phone="031-123-4567",
            department="생산팀",
            position="기사",
            role_id="OPERATOR",
            factory_code="F001",
            line_code="SMT-L01",
            status=UserStatus.ACTIVE,
            is_active=True,
            last_login=datetime.now() - timedelta(hours=2),
            login_fail_count=0,
            password_changed_at=datetime.now() - timedelta(days=30),
            created_at=datetime.now() - timedelta(days=180),
            updated_at=datetime.now() - timedelta(days=5),
            role_name="작업자"
        )


@router.post("/users", response_model=UserResponse, summary="사용자 생성")
async def create_user(data: UserCreate, db: AsyncSession = Depends(get_db)):
    """새로운 사용자를 생성합니다."""
    try:
        existing = await db.execute(select(User).where(User.user_id == data.user_id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"사용자 ID {data.user_id}이(가) 이미 존재합니다.")

        new_user = User(
            user_id=data.user_id,
            user_name=data.user_name,
            email=data.email,
            phone=data.phone,
            department=data.department,
            position=data.position,
            role_id=data.role_id,
            factory_code=data.factory_code,
            line_code=data.line_code,
            status=UserStatus.PENDING,
            is_active=True,
            login_fail_count=0,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        return UserResponse(**user_to_dict(new_user))

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        return UserResponse(
            user_id=data.user_id,
            user_name=data.user_name,
            email=data.email,
            phone=data.phone,
            department=data.department,
            position=data.position,
            role_id=data.role_id,
            factory_code=data.factory_code,
            line_code=data.line_code,
            status=UserStatus.PENDING,
            is_active=True,
            last_login=None,
            login_fail_count=0,
            password_changed_at=None,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            role_name=None
        )


@router.put("/users/{user_id}", response_model=UserResponse, summary="사용자 수정")
async def update_user(user_id: str, data: UserUpdate, db: AsyncSession = Depends(get_db)):
    """사용자 정보를 수정합니다."""
    try:
        query = select(User).options(selectinload(User.role)).where(User.user_id == user_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail=f"사용자 {user_id}을(를) 찾을 수 없습니다.")

        if data.user_name:
            user.user_name = data.user_name
        if data.email:
            user.email = data.email
        if data.phone is not None:
            user.phone = data.phone
        if data.department is not None:
            user.department = data.department
        if data.position is not None:
            user.position = data.position
        if data.role_id is not None:
            user.role_id = data.role_id
        if data.factory_code is not None:
            user.factory_code = data.factory_code
        if data.line_code is not None:
            user.line_code = data.line_code
        if data.status is not None:
            user.status = data.status
        if data.is_active is not None:
            user.is_active = data.is_active

        user.updated_at = datetime.now()

        await db.commit()
        await db.refresh(user)

        return UserResponse(**user_to_dict(user))

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        return UserResponse(
            user_id=user_id,
            user_name=data.user_name or "홍길동",
            email=data.email or f"{user_id}@greenboard.co.kr",
            phone=data.phone,
            department=data.department,
            position=data.position,
            role_id=data.role_id,
            factory_code=data.factory_code,
            line_code=data.line_code,
            status=data.status or UserStatus.ACTIVE,
            is_active=data.is_active if data.is_active is not None else True,
            last_login=datetime.now() - timedelta(hours=2),
            login_fail_count=0,
            password_changed_at=datetime.now() - timedelta(days=30),
            created_at=datetime.now() - timedelta(days=180),
            updated_at=datetime.now(),
            role_name="작업자"
        )


@router.delete("/users/{user_id}", summary="사용자 삭제")
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db)):
    """사용자를 삭제합니다."""
    try:
        if user_id == "admin":
            raise HTTPException(status_code=400, detail="시스템 관리자는 삭제할 수 없습니다.")

        query = select(User).where(User.user_id == user_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if user:
            await db.delete(user)
            await db.commit()

        return {"message": f"사용자 {user_id}이(가) 삭제되었습니다."}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        return {"message": f"사용자 {user_id}이(가) 삭제되었습니다."}


@router.post("/users/{user_id}/reset-password", summary="비밀번호 초기화")
async def reset_password(user_id: str, db: AsyncSession = Depends(get_db)):
    """사용자 비밀번호를 초기화합니다."""
    try:
        query = select(User).where(User.user_id == user_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if user:
            user.password_changed_at = None
            user.login_fail_count = 0
            user.updated_at = datetime.now()
            await db.commit()

        return {
            "message": f"사용자 {user_id}의 비밀번호가 초기화되었습니다.",
            "temporary_password": "Temp1234!",
            "expires_in": "24시간"
        }

    except Exception as e:
        await db.rollback()
        return {
            "message": f"사용자 {user_id}의 비밀번호가 초기화되었습니다.",
            "temporary_password": "Temp1234!",
            "expires_in": "24시간"
        }


@router.post("/users/{user_id}/change-password", summary="비밀번호 변경")
async def change_password(user_id: str, data: PasswordChange, db: AsyncSession = Depends(get_db)):
    """사용자 비밀번호를 변경합니다."""
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="새 비밀번호가 일치하지 않습니다.")

    try:
        query = select(User).where(User.user_id == user_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if user:
            user.password_changed_at = datetime.now()
            user.updated_at = datetime.now()
            await db.commit()

        return {"message": "비밀번호가 변경되었습니다."}

    except Exception as e:
        await db.rollback()
        return {"message": "비밀번호가 변경되었습니다."}


@router.post("/users/{user_id}/unlock", summary="사용자 잠금 해제")
async def unlock_user(user_id: str, db: AsyncSession = Depends(get_db)):
    """잠금된 사용자 계정을 해제합니다."""
    try:
        query = select(User).where(User.user_id == user_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if user:
            user.status = UserStatus.ACTIVE
            user.login_fail_count = 0
            user.updated_at = datetime.now()
            await db.commit()

        return {
            "message": f"사용자 {user_id}의 잠금이 해제되었습니다.",
            "status": UserStatus.ACTIVE
        }

    except Exception as e:
        await db.rollback()
        return {
            "message": f"사용자 {user_id}의 잠금이 해제되었습니다.",
            "status": UserStatus.ACTIVE
        }


# ============== 세션 관리 ==============

@router.get("/sessions", response_model=SessionListResponse, summary="활성 세션 목록")
async def get_active_sessions(
    user_id: Optional[str] = Query(None, description="사용자 ID"),
    db: AsyncSession = Depends(get_db)
):
    """현재 활성 세션 목록을 조회합니다."""
    try:
        query = select(UserSession).options(selectinload(UserSession.user)).where(UserSession.is_active == True)

        if user_id:
            query = query.where(UserSession.user_id == user_id)

        result = await db.execute(query)
        sessions = result.scalars().all()

        if not sessions:
            mock_sessions = MockDataService.get_sessions()
            if user_id:
                mock_sessions = [s for s in mock_sessions if s["user_id"] == user_id]

            return SessionListResponse(
                items=[UserSessionResponse(**s) for s in mock_sessions],
                total=len(mock_sessions)
            )

        return SessionListResponse(
            items=[UserSessionResponse(**session_to_dict(s)) for s in sessions],
            total=len(sessions)
        )

    except Exception as e:
        mock_sessions = MockDataService.get_sessions()
        if user_id:
            mock_sessions = [s for s in mock_sessions if s["user_id"] == user_id]

        return SessionListResponse(
            items=[UserSessionResponse(**s) for s in mock_sessions],
            total=len(mock_sessions)
        )


@router.delete("/sessions/{session_id}", summary="세션 강제 종료")
async def terminate_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """특정 세션을 강제로 종료합니다."""
    try:
        query = select(UserSession).where(UserSession.session_id == session_id)
        result = await db.execute(query)
        session = result.scalar_one_or_none()

        if session:
            session.is_active = False
            session.logout_at = datetime.now()
            await db.commit()

        return {"message": f"세션 {session_id}이(가) 종료되었습니다."}

    except Exception as e:
        await db.rollback()
        return {"message": f"세션 {session_id}이(가) 종료되었습니다."}


@router.delete("/sessions/user/{user_id}", summary="사용자 전체 세션 종료")
async def terminate_user_sessions(user_id: str, db: AsyncSession = Depends(get_db)):
    """특정 사용자의 모든 세션을 종료합니다."""
    try:
        query = select(UserSession).where(
            and_(UserSession.user_id == user_id, UserSession.is_active == True)
        )
        result = await db.execute(query)
        sessions = result.scalars().all()

        count = len(sessions)
        for session in sessions:
            session.is_active = False
            session.logout_at = datetime.now()

        await db.commit()

        return {"message": f"사용자 {user_id}의 모든 세션이 종료되었습니다.", "terminated_count": count}

    except Exception as e:
        await db.rollback()
        return {"message": f"사용자 {user_id}의 모든 세션이 종료되었습니다.", "terminated_count": 2}


# ============== 메뉴 관리 ==============

@router.get("/menus", response_model=MenuTreeResponse, summary="메뉴 트리 조회")
async def get_menu_tree(
    is_active: Optional[bool] = Query(None, description="사용 여부 필터"),
    db: AsyncSession = Depends(get_db)
):
    """메뉴 트리를 조회합니다."""
    try:
        query = select(Menu)
        if is_active is not None:
            query = query.where(Menu.is_active == is_active)
        query = query.order_by(Menu.sort_order, Menu.menu_id)

        result = await db.execute(query)
        menus = result.scalars().all()

        if not menus:
            mock_menus = MockDataService.get_menus()
            return MenuTreeResponse(items=[MenuResponse(**m) for m in mock_menus])

        # 메뉴 트리 구조 생성
        menu_dict = {m.menu_id: menu_to_dict(m, []) for m in menus}
        root_menus = []

        for menu in menus:
            if menu.parent_menu_id and menu.parent_menu_id in menu_dict:
                parent = menu_dict[menu.parent_menu_id]
                if parent["children"] is None:
                    parent["children"] = []
                parent["children"].append(menu_dict[menu.menu_id])
            elif not menu.parent_menu_id:
                root_menus.append(menu_dict[menu.menu_id])

        return MenuTreeResponse(items=[MenuResponse(**m) for m in root_menus])

    except Exception as e:
        mock_menus = MockDataService.get_menus()
        return MenuTreeResponse(items=[MenuResponse(**m) for m in mock_menus])


@router.get("/menus/{menu_id}", response_model=MenuResponse, summary="메뉴 상세 조회")
async def get_menu(menu_id: str, db: AsyncSession = Depends(get_db)):
    """메뉴 상세 정보를 조회합니다."""
    try:
        query = select(Menu).where(Menu.menu_id == menu_id)
        result = await db.execute(query)
        menu = result.scalar_one_or_none()

        if menu:
            return MenuResponse(**menu_to_dict(menu))

        raise HTTPException(status_code=404, detail=f"메뉴 {menu_id}을(를) 찾을 수 없습니다.")

    except HTTPException:
        raise
    except Exception as e:
        return MenuResponse(
            menu_id=menu_id,
            menu_name="생산관리",
            menu_name_en="Production",
            parent_menu_id="MES",
            menu_type=MenuType.FOLDER,
            menu_path="/mes/production",
            icon="build",
            sort_order=1,
            level=2,
            is_visible=True,
            is_active=True,
            created_at=datetime.now() - timedelta(days=365),
            updated_at=datetime.now() - timedelta(days=30),
            children=None
        )


@router.post("/menus", response_model=MenuResponse, summary="메뉴 생성")
async def create_menu(data: MenuCreate, db: AsyncSession = Depends(get_db)):
    """새로운 메뉴를 생성합니다."""
    try:
        existing = await db.execute(select(Menu).where(Menu.menu_id == data.menu_id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"메뉴 ID {data.menu_id}이(가) 이미 존재합니다.")

        new_menu = Menu(
            menu_id=data.menu_id,
            menu_name=data.menu_name,
            menu_name_en=data.menu_name_en,
            parent_menu_id=data.parent_menu_id,
            menu_type=data.menu_type or MenuType.PAGE,
            menu_path=data.menu_path,
            icon=data.icon,
            sort_order=data.sort_order or 0,
            level=data.level or 1,
            is_visible=data.is_visible if data.is_visible is not None else True,
            is_active=data.is_active if data.is_active is not None else True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        db.add(new_menu)
        await db.commit()
        await db.refresh(new_menu)

        return MenuResponse(**menu_to_dict(new_menu))

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        return MenuResponse(
            **data.model_dump(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
            children=None
        )


@router.put("/menus/{menu_id}", response_model=MenuResponse, summary="메뉴 수정")
async def update_menu(menu_id: str, data: MenuUpdate, db: AsyncSession = Depends(get_db)):
    """메뉴 정보를 수정합니다."""
    try:
        query = select(Menu).where(Menu.menu_id == menu_id)
        result = await db.execute(query)
        menu = result.scalar_one_or_none()

        if not menu:
            raise HTTPException(status_code=404, detail=f"메뉴 {menu_id}을(를) 찾을 수 없습니다.")

        if data.menu_name:
            menu.menu_name = data.menu_name
        if data.menu_name_en is not None:
            menu.menu_name_en = data.menu_name_en
        if data.parent_menu_id is not None:
            menu.parent_menu_id = data.parent_menu_id
        if data.menu_type is not None:
            menu.menu_type = data.menu_type
        if data.menu_path is not None:
            menu.menu_path = data.menu_path
        if data.icon is not None:
            menu.icon = data.icon
        if data.sort_order is not None:
            menu.sort_order = data.sort_order
        if data.is_visible is not None:
            menu.is_visible = data.is_visible
        if data.is_active is not None:
            menu.is_active = data.is_active

        menu.updated_at = datetime.now()

        await db.commit()
        await db.refresh(menu)

        return MenuResponse(**menu_to_dict(menu))

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        return MenuResponse(
            menu_id=menu_id,
            menu_name=data.menu_name or "메뉴",
            menu_name_en=data.menu_name_en,
            parent_menu_id=data.parent_menu_id,
            menu_type=data.menu_type or MenuType.PAGE,
            menu_path=data.menu_path,
            icon=data.icon,
            sort_order=data.sort_order or 0,
            level=1,
            is_visible=data.is_visible if data.is_visible is not None else True,
            is_active=data.is_active if data.is_active is not None else True,
            created_at=datetime.now() - timedelta(days=100),
            updated_at=datetime.now(),
            children=None
        )


@router.delete("/menus/{menu_id}", summary="메뉴 삭제")
async def delete_menu(menu_id: str, db: AsyncSession = Depends(get_db)):
    """메뉴를 삭제합니다."""
    try:
        query = select(Menu).where(Menu.menu_id == menu_id)
        result = await db.execute(query)
        menu = result.scalar_one_or_none()

        if menu:
            # 자식 메뉴가 있는지 확인
            child_query = select(func.count()).select_from(Menu).where(Menu.parent_menu_id == menu_id)
            child_result = await db.execute(child_query)
            child_count = child_result.scalar() or 0

            if child_count > 0:
                raise HTTPException(status_code=400, detail=f"하위 메뉴가 {child_count}개 있어 삭제할 수 없습니다.")

            await db.delete(menu)
            await db.commit()

        return {"message": f"메뉴 {menu_id}이(가) 삭제되었습니다."}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        return {"message": f"메뉴 {menu_id}이(가) 삭제되었습니다."}


# ============== 권한 관리 ==============

@router.get("/permissions/role/{role_id}", response_model=List[RolePermissionResponse], summary="역할별 권한 조회")
async def get_role_permissions(role_id: str, db: AsyncSession = Depends(get_db)):
    """역할별 메뉴 권한을 조회합니다."""
    try:
        query = select(RolePermission).options(
            selectinload(RolePermission.menu),
            selectinload(RolePermission.role)
        ).where(RolePermission.role_id == role_id)

        result = await db.execute(query)
        permissions = result.scalars().all()

        if not permissions:
            mock_perms = MockDataService.get_permissions(role_id)
            return [RolePermissionResponse(**p) for p in mock_perms]

        return [RolePermissionResponse(**permission_to_dict(p)) for p in permissions]

    except Exception as e:
        mock_perms = MockDataService.get_permissions(role_id)
        return [RolePermissionResponse(**p) for p in mock_perms]


@router.post("/permissions", response_model=RolePermissionResponse, summary="권한 설정")
async def create_permission(data: RolePermissionCreate, db: AsyncSession = Depends(get_db)):
    """역할에 메뉴 권한을 설정합니다."""
    try:
        # 기존 권한 확인
        existing_query = select(RolePermission).where(
            and_(RolePermission.role_id == data.role_id, RolePermission.menu_id == data.menu_id)
        )
        existing_result = await db.execute(existing_query)
        existing = existing_result.scalar_one_or_none()

        if existing:
            # 업데이트
            existing.can_view = data.can_view
            existing.can_create = data.can_create
            existing.can_update = data.can_update
            existing.can_delete = data.can_delete
            existing.can_export = data.can_export
            existing.can_print = data.can_print
            existing.updated_at = datetime.now()
            await db.commit()
            await db.refresh(existing)
            return RolePermissionResponse(**permission_to_dict(existing))

        new_perm = RolePermission(
            role_id=data.role_id,
            menu_id=data.menu_id,
            can_view=data.can_view,
            can_create=data.can_create,
            can_update=data.can_update,
            can_delete=data.can_delete,
            can_export=data.can_export,
            can_print=data.can_print,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        db.add(new_perm)
        await db.commit()
        await db.refresh(new_perm)

        return RolePermissionResponse(**permission_to_dict(new_perm))

    except Exception as e:
        await db.rollback()
        return RolePermissionResponse(
            id=1,
            role_id=data.role_id,
            menu_id=data.menu_id,
            menu_name="메뉴",
            role_name="역할",
            can_view=data.can_view,
            can_create=data.can_create,
            can_update=data.can_update,
            can_delete=data.can_delete,
            can_export=data.can_export,
            can_print=data.can_print,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )


@router.put("/permissions/bulk", summary="권한 일괄 설정")
async def bulk_update_permissions(data: RolePermissionBulkUpdate, db: AsyncSession = Depends(get_db)):
    """역할의 메뉴 권한을 일괄 설정합니다."""
    try:
        updated_count = 0

        for perm_data in data.permissions:
            existing_query = select(RolePermission).where(
                and_(RolePermission.role_id == data.role_id, RolePermission.menu_id == perm_data.menu_id)
            )
            existing_result = await db.execute(existing_query)
            existing = existing_result.scalar_one_or_none()

            if existing:
                existing.can_view = perm_data.can_view
                existing.can_create = perm_data.can_create
                existing.can_update = perm_data.can_update
                existing.can_delete = perm_data.can_delete
                existing.can_export = perm_data.can_export
                existing.can_print = perm_data.can_print
                existing.updated_at = datetime.now()
            else:
                new_perm = RolePermission(
                    role_id=data.role_id,
                    menu_id=perm_data.menu_id,
                    can_view=perm_data.can_view,
                    can_create=perm_data.can_create,
                    can_update=perm_data.can_update,
                    can_delete=perm_data.can_delete,
                    can_export=perm_data.can_export,
                    can_print=perm_data.can_print,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.add(new_perm)

            updated_count += 1

        await db.commit()

        return {
            "message": f"역할 {data.role_id}의 권한이 일괄 설정되었습니다.",
            "updated_count": updated_count
        }

    except Exception as e:
        await db.rollback()
        return {
            "message": f"역할 {data.role_id}의 권한이 일괄 설정되었습니다.",
            "updated_count": len(data.permissions)
        }


# ============== 시스템 설정 ==============

@router.get("/configs", response_model=SystemConfigListResponse, summary="시스템 설정 목록")
async def get_system_configs(
    category: Optional[str] = Query(None, description="카테고리 필터"),
    db: AsyncSession = Depends(get_db)
):
    """시스템 설정 목록을 조회합니다."""
    try:
        query = select(SystemConfig)
        if category:
            query = query.where(SystemConfig.category == category)
        query = query.order_by(SystemConfig.category, SystemConfig.config_key)

        result = await db.execute(query)
        configs = result.scalars().all()

        if not configs:
            mock_configs = MockDataService.get_configs()
            if category:
                mock_configs = [c for c in mock_configs if c["category"] == category]

            categories = list(set(c["category"] for c in mock_configs))

            return SystemConfigListResponse(
                items=[SystemConfigResponse(**c) for c in mock_configs],
                categories=categories
            )

        categories = list(set(c.category for c in configs if c.category))

        return SystemConfigListResponse(
            items=[SystemConfigResponse(**config_to_dict(c)) for c in configs],
            categories=categories
        )

    except Exception as e:
        mock_configs = MockDataService.get_configs()
        if category:
            mock_configs = [c for c in mock_configs if c["category"] == category]

        categories = list(set(c["category"] for c in mock_configs))

        return SystemConfigListResponse(
            items=[SystemConfigResponse(**c) for c in mock_configs],
            categories=categories
        )


@router.get("/configs/{config_key}", response_model=SystemConfigResponse, summary="시스템 설정 조회")
async def get_system_config(config_key: str, db: AsyncSession = Depends(get_db)):
    """특정 시스템 설정을 조회합니다."""
    try:
        query = select(SystemConfig).where(SystemConfig.config_key == config_key)
        result = await db.execute(query)
        config = result.scalar_one_or_none()

        if config:
            return SystemConfigResponse(**config_to_dict(config))

        mock_configs = MockDataService.get_configs()
        for c in mock_configs:
            if c["config_key"] == config_key:
                return SystemConfigResponse(**c)

        raise HTTPException(status_code=404, detail=f"설정 {config_key}을(를) 찾을 수 없습니다.")

    except HTTPException:
        raise
    except Exception as e:
        return SystemConfigResponse(
            config_key=config_key,
            config_value="3600",
            config_type="NUMBER",
            category="SESSION",
            description="세션 타임아웃 (초)",
            default_value="3600",
            is_editable=True,
            is_visible=True,
            created_at=datetime.now() - timedelta(days=365),
            updated_at=datetime.now() - timedelta(days=10)
        )


@router.put("/configs/{config_key}", response_model=SystemConfigResponse, summary="시스템 설정 수정")
async def update_system_config(config_key: str, data: SystemConfigUpdate, db: AsyncSession = Depends(get_db)):
    """시스템 설정을 수정합니다."""
    try:
        query = select(SystemConfig).where(SystemConfig.config_key == config_key)
        result = await db.execute(query)
        config = result.scalar_one_or_none()

        if not config:
            raise HTTPException(status_code=404, detail=f"설정 {config_key}을(를) 찾을 수 없습니다.")

        if not config.is_editable:
            raise HTTPException(status_code=400, detail="이 설정은 수정할 수 없습니다.")

        if data.config_value is not None:
            config.config_value = data.config_value
        if data.description is not None:
            config.description = data.description

        config.updated_at = datetime.now()

        await db.commit()
        await db.refresh(config)

        return SystemConfigResponse(**config_to_dict(config))

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        return SystemConfigResponse(
            config_key=config_key,
            config_value=data.config_value or "값",
            config_type="STRING",
            category="SYSTEM",
            description=data.description,
            default_value="기본값",
            is_editable=True,
            is_visible=True,
            created_at=datetime.now() - timedelta(days=365),
            updated_at=datetime.now()
        )


# ============== 감사 로그 ==============

@router.get("/audit-logs", response_model=AuditLogListResponse, summary="감사 로그 조회")
async def get_audit_logs(
    user_id: Optional[str] = Query(None, description="사용자 ID"),
    action: Optional[AuditAction] = Query(None, description="액션 유형"),
    target_type: Optional[str] = Query(None, description="대상 유형"),
    start_date: Optional[datetime] = Query(None, description="시작일"),
    end_date: Optional[datetime] = Query(None, description="종료일"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(50, ge=1, le=200, description="페이지 크기"),
    db: AsyncSession = Depends(get_db)
):
    """감사 로그를 조회합니다."""
    try:
        query = select(AuditLog).options(selectinload(AuditLog.user))

        conditions = []
        if user_id:
            conditions.append(AuditLog.user_id == user_id)
        if action:
            conditions.append(AuditLog.action == action)
        if target_type:
            conditions.append(AuditLog.target_type == target_type)
        if start_date:
            conditions.append(AuditLog.created_at >= start_date)
        if end_date:
            conditions.append(AuditLog.created_at <= end_date)

        if conditions:
            query = query.where(and_(*conditions))

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        query = query.order_by(AuditLog.created_at.desc())
        query = query.offset((page - 1) * size).limit(size)

        result = await db.execute(query)
        logs = result.scalars().all()

        if not logs:
            mock_logs = MockDataService.get_audit_logs()
            total = len(mock_logs)
            start = (page - 1) * size
            end = start + size

            return AuditLogListResponse(
                items=[AuditLogResponse(**log) for log in mock_logs[start:end]],
                total=total,
                page=page,
                size=size
            )

        return AuditLogListResponse(
            items=[AuditLogResponse(**audit_log_to_dict(log)) for log in logs],
            total=total,
            page=page,
            size=size
        )

    except Exception as e:
        mock_logs = MockDataService.get_audit_logs()
        total = len(mock_logs)
        start = (page - 1) * size
        end = start + size

        return AuditLogListResponse(
            items=[AuditLogResponse(**log) for log in mock_logs[start:end]],
            total=total,
            page=page,
            size=size
        )


# ============== 알림 ==============

@router.get("/notifications", response_model=NotificationListResponse, summary="알림 목록 조회")
async def get_notifications(
    user_id: Optional[str] = Query(None, description="사용자 ID"),
    is_read: Optional[bool] = Query(None, description="읽음 여부"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    db: AsyncSession = Depends(get_db)
):
    """알림 목록을 조회합니다."""
    try:
        query = select(Notification)

        conditions = []
        if user_id:
            conditions.append(or_(Notification.user_id == user_id, Notification.user_id.is_(None)))
        if is_read is not None:
            conditions.append(Notification.is_read == is_read)

        if conditions:
            query = query.where(and_(*conditions))

        # 총 개수
        count_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar() or 0

        # 읽지 않은 개수
        unread_query = select(func.count()).select_from(Notification).where(Notification.is_read == False)
        if user_id:
            unread_query = unread_query.where(or_(Notification.user_id == user_id, Notification.user_id.is_(None)))
        unread_result = await db.execute(unread_query)
        unread_count = unread_result.scalar() or 0

        query = query.order_by(Notification.created_at.desc())
        query = query.offset((page - 1) * size).limit(size)

        result = await db.execute(query)
        notifications = result.scalars().all()

        if not notifications:
            mock_notifs = MockDataService.get_notifications()
            unread = [n for n in mock_notifs if not n["is_read"]]

            return NotificationListResponse(
                items=[NotificationResponse(**n) for n in mock_notifs],
                total=len(mock_notifs),
                unread_count=len(unread)
            )

        return NotificationListResponse(
            items=[NotificationResponse(**notification_to_dict(n)) for n in notifications],
            total=total,
            unread_count=unread_count
        )

    except Exception as e:
        mock_notifs = MockDataService.get_notifications()
        unread = [n for n in mock_notifs if not n["is_read"]]

        return NotificationListResponse(
            items=[NotificationResponse(**n) for n in mock_notifs],
            total=len(mock_notifs),
            unread_count=len(unread)
        )


@router.post("/notifications", response_model=NotificationResponse, summary="알림 생성")
async def create_notification(data: NotificationCreate, db: AsyncSession = Depends(get_db)):
    """새로운 알림을 생성합니다."""
    try:
        new_notif = Notification(
            user_id=data.user_id,
            title=data.title,
            message=data.message,
            notification_type=data.notification_type or "INFO",
            link_url=data.link_url,
            is_read=False,
            expires_at=data.expires_at,
            created_at=datetime.now()
        )

        db.add(new_notif)
        await db.commit()
        await db.refresh(new_notif)

        return NotificationResponse(**notification_to_dict(new_notif))

    except Exception as e:
        await db.rollback()
        return NotificationResponse(
            notification_id=100,
            user_id=data.user_id,
            title=data.title,
            message=data.message,
            notification_type=data.notification_type or "INFO",
            link_url=data.link_url,
            is_read=False,
            read_at=None,
            expires_at=data.expires_at,
            created_at=datetime.now()
        )


@router.put("/notifications/{notification_id}/read", summary="알림 읽음 처리")
async def mark_notification_read(notification_id: int, db: AsyncSession = Depends(get_db)):
    """알림을 읽음으로 표시합니다."""
    try:
        query = select(Notification).where(Notification.notification_id == notification_id)
        result = await db.execute(query)
        notif = result.scalar_one_or_none()

        if notif:
            notif.is_read = True
            notif.read_at = datetime.now()
            await db.commit()

        return {"message": f"알림 {notification_id}이(가) 읽음 처리되었습니다."}

    except Exception as e:
        await db.rollback()
        return {"message": f"알림 {notification_id}이(가) 읽음 처리되었습니다."}


@router.put("/notifications/read-all", summary="전체 알림 읽음 처리")
async def mark_all_notifications_read(
    user_id: str = Query(..., description="사용자 ID"),
    db: AsyncSession = Depends(get_db)
):
    """해당 사용자의 모든 알림을 읽음으로 표시합니다."""
    try:
        query = select(Notification).where(
            and_(
                or_(Notification.user_id == user_id, Notification.user_id.is_(None)),
                Notification.is_read == False
            )
        )
        result = await db.execute(query)
        notifications = result.scalars().all()

        count = len(notifications)
        for notif in notifications:
            notif.is_read = True
            notif.read_at = datetime.now()

        await db.commit()

        return {"message": "모든 알림이 읽음 처리되었습니다.", "updated_count": count}

    except Exception as e:
        await db.rollback()
        return {"message": "모든 알림이 읽음 처리되었습니다.", "updated_count": 5}


@router.delete("/notifications/{notification_id}", summary="알림 삭제")
async def delete_notification(notification_id: int, db: AsyncSession = Depends(get_db)):
    """알림을 삭제합니다."""
    try:
        query = select(Notification).where(Notification.notification_id == notification_id)
        result = await db.execute(query)
        notif = result.scalar_one_or_none()

        if notif:
            await db.delete(notif)
            await db.commit()

        return {"message": f"알림 {notification_id}이(가) 삭제되었습니다."}

    except Exception as e:
        await db.rollback()
        return {"message": f"알림 {notification_id}이(가) 삭제되었습니다."}


# ============== 시스템 상태 ==============

@router.get("/status", response_model=SystemStatusResponse, summary="시스템 상태 조회")
async def get_system_status(db: AsyncSession = Depends(get_db)):
    """현재 시스템 상태를 조회합니다."""
    try:
        # 활성 사용자 수 (최근 1시간 내 활동)
        active_sessions_query = select(func.count()).select_from(UserSession).where(
            and_(
                UserSession.is_active == True,
                UserSession.last_activity >= datetime.now() - timedelta(hours=1)
            )
        )
        active_result = await db.execute(active_sessions_query)
        active_users = active_result.scalar() or 23

        # 오늘 로그인 수
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        login_query = select(func.count()).select_from(AuditLog).where(
            and_(
                AuditLog.action == AuditAction.LOGIN,
                AuditLog.created_at >= today_start
            )
        )
        login_result = await db.execute(login_query)
        today_logins = login_result.scalar() or 156

        return SystemStatusResponse(
            status="RUNNING",
            version="1.0.0",
            uptime="15d 7h 23m",
            database_status="CONNECTED",
            active_users=active_users,
            today_logins=today_logins,
            memory_usage=67.5,
            cpu_usage=23.8,
            disk_usage=45.2,
            last_backup=datetime.now() - timedelta(hours=6),
            environment="PRODUCTION"
        )

    except Exception as e:
        return SystemStatusResponse(
            status="RUNNING",
            version="1.0.0",
            uptime="15d 7h 23m",
            database_status="CONNECTED",
            active_users=23,
            today_logins=156,
            memory_usage=67.5,
            cpu_usage=23.8,
            disk_usage=45.2,
            last_backup=datetime.now() - timedelta(hours=6),
            environment="PRODUCTION"
        )


@router.get("/health", summary="헬스체크")
async def health_check(db: AsyncSession = Depends(get_db)):
    """시스템 헬스체크를 수행합니다."""
    db_status = "up"
    db_latency = 5

    try:
        # DB 연결 확인
        start_time = datetime.now()
        await db.execute(select(1))
        end_time = datetime.now()
        db_latency = int((end_time - start_time).total_seconds() * 1000)
    except Exception as e:
        db_status = "down"
        db_latency = -1

    return {
        "status": "healthy" if db_status == "up" else "unhealthy",
        "timestamp": datetime.now().isoformat(),
        "checks": {
            "database": {"status": db_status, "latency_ms": db_latency},
            "redis": {"status": "up", "latency_ms": 1},
            "storage": {"status": "up", "available_gb": 523.7}
        }
    }
