"""
MES System Management API Router
시스템관리 - 사용자, 역할, 권한, 메뉴, 설정, 감사로그, 알림
"""
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException

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
from api.models.mes.system import UserStatus, MenuType, AuditAction

router = APIRouter(prefix="/system", tags=["MES System Management"])


# ============== 역할 관리 ==============

@router.get("/roles", response_model=RoleListResponse, summary="역할 목록 조회")
async def get_roles(
    role_id: Optional[str] = Query(None, description="역할 ID"),
    role_name: Optional[str] = Query(None, description="역할명"),
    is_active: Optional[bool] = Query(None, description="사용 여부"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기")
):
    """역할 목록을 조회합니다."""
    mock_roles = [
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

    # Filter
    filtered = mock_roles
    if role_id:
        filtered = [r for r in filtered if role_id.upper() in r["role_id"].upper()]
    if role_name:
        filtered = [r for r in filtered if role_name in r["role_name"]]
    if is_active is not None:
        filtered = [r for r in filtered if r["is_active"] == is_active]

    total = len(filtered)
    start = (page - 1) * size
    end = start + size

    return RoleListResponse(
        items=[RoleResponse(**r) for r in filtered[start:end]],
        total=total,
        page=page,
        size=size
    )


@router.get("/roles/{role_id}", response_model=RoleResponse, summary="역할 상세 조회")
async def get_role(role_id: str):
    """역할 상세 정보를 조회합니다."""
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
async def create_role(data: RoleCreate):
    """새로운 역할을 생성합니다."""
    return RoleResponse(
        **data.model_dump(),
        created_at=datetime.now(),
        updated_at=datetime.now(),
        user_count=0
    )


@router.put("/roles/{role_id}", response_model=RoleResponse, summary="역할 수정")
async def update_role(role_id: str, data: RoleCreate):
    """역할 정보를 수정합니다."""
    return RoleResponse(
        **data.model_dump(),
        role_id=role_id,
        created_at=datetime.now() - timedelta(days=100),
        updated_at=datetime.now(),
        user_count=5
    )


@router.delete("/roles/{role_id}", summary="역할 삭제")
async def delete_role(role_id: str):
    """역할을 삭제합니다."""
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
    size: int = Query(20, ge=1, le=100, description="페이지 크기")
):
    """사용자 목록을 조회합니다."""
    mock_users = [
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
async def get_user(user_id: str):
    """사용자 상세 정보를 조회합니다."""
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
async def create_user(data: UserCreate):
    """새로운 사용자를 생성합니다."""
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
async def update_user(user_id: str, data: UserUpdate):
    """사용자 정보를 수정합니다."""
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
async def delete_user(user_id: str):
    """사용자를 삭제합니다."""
    if user_id == "admin":
        raise HTTPException(status_code=400, detail="시스템 관리자는 삭제할 수 없습니다.")
    return {"message": f"사용자 {user_id}이(가) 삭제되었습니다."}


@router.post("/users/{user_id}/reset-password", summary="비밀번호 초기화")
async def reset_password(user_id: str):
    """사용자 비밀번호를 초기화합니다."""
    return {
        "message": f"사용자 {user_id}의 비밀번호가 초기화되었습니다.",
        "temporary_password": "Temp1234!",
        "expires_in": "24시간"
    }


@router.post("/users/{user_id}/change-password", summary="비밀번호 변경")
async def change_password(user_id: str, data: PasswordChange):
    """사용자 비밀번호를 변경합니다."""
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="새 비밀번호가 일치하지 않습니다.")
    return {"message": "비밀번호가 변경되었습니다."}


@router.post("/users/{user_id}/unlock", summary="사용자 잠금 해제")
async def unlock_user(user_id: str):
    """잠금된 사용자 계정을 해제합니다."""
    return {
        "message": f"사용자 {user_id}의 잠금이 해제되었습니다.",
        "status": UserStatus.ACTIVE
    }


# ============== 세션 관리 ==============

@router.get("/sessions", response_model=SessionListResponse, summary="활성 세션 목록")
async def get_active_sessions(
    user_id: Optional[str] = Query(None, description="사용자 ID")
):
    """현재 활성 세션 목록을 조회합니다."""
    mock_sessions = [
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

    if user_id:
        mock_sessions = [s for s in mock_sessions if s["user_id"] == user_id]

    return SessionListResponse(
        items=[UserSessionResponse(**s) for s in mock_sessions],
        total=len(mock_sessions)
    )


@router.delete("/sessions/{session_id}", summary="세션 강제 종료")
async def terminate_session(session_id: str):
    """특정 세션을 강제로 종료합니다."""
    return {"message": f"세션 {session_id}이(가) 종료되었습니다."}


@router.delete("/sessions/user/{user_id}", summary="사용자 전체 세션 종료")
async def terminate_user_sessions(user_id: str):
    """특정 사용자의 모든 세션을 종료합니다."""
    return {"message": f"사용자 {user_id}의 모든 세션이 종료되었습니다.", "terminated_count": 2}


# ============== 메뉴 관리 ==============

@router.get("/menus", response_model=MenuTreeResponse, summary="메뉴 트리 조회")
async def get_menu_tree(
    is_active: Optional[bool] = Query(None, description="사용 여부 필터")
):
    """메뉴 트리를 조회합니다."""
    mock_menus = [
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

    return MenuTreeResponse(items=[MenuResponse(**m) for m in mock_menus])


@router.get("/menus/{menu_id}", response_model=MenuResponse, summary="메뉴 상세 조회")
async def get_menu(menu_id: str):
    """메뉴 상세 정보를 조회합니다."""
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
async def create_menu(data: MenuCreate):
    """새로운 메뉴를 생성합니다."""
    return MenuResponse(
        **data.model_dump(),
        created_at=datetime.now(),
        updated_at=datetime.now(),
        children=None
    )


@router.put("/menus/{menu_id}", response_model=MenuResponse, summary="메뉴 수정")
async def update_menu(menu_id: str, data: MenuUpdate):
    """메뉴 정보를 수정합니다."""
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
async def delete_menu(menu_id: str):
    """메뉴를 삭제합니다."""
    return {"message": f"메뉴 {menu_id}이(가) 삭제되었습니다."}


# ============== 권한 관리 ==============

@router.get("/permissions/role/{role_id}", response_model=List[RolePermissionResponse], summary="역할별 권한 조회")
async def get_role_permissions(role_id: str):
    """역할별 메뉴 권한을 조회합니다."""
    mock_permissions = [
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

    return [RolePermissionResponse(**p) for p in mock_permissions]


@router.post("/permissions", response_model=RolePermissionResponse, summary="권한 설정")
async def create_permission(data: RolePermissionCreate):
    """역할에 메뉴 권한을 설정합니다."""
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
async def bulk_update_permissions(data: RolePermissionBulkUpdate):
    """역할의 메뉴 권한을 일괄 설정합니다."""
    return {
        "message": f"역할 {data.role_id}의 권한이 일괄 설정되었습니다.",
        "updated_count": len(data.permissions)
    }


# ============== 시스템 설정 ==============

@router.get("/configs", response_model=SystemConfigListResponse, summary="시스템 설정 목록")
async def get_system_configs(
    category: Optional[str] = Query(None, description="카테고리 필터")
):
    """시스템 설정 목록을 조회합니다."""
    mock_configs = [
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

    if category:
        mock_configs = [c for c in mock_configs if c["category"] == category]

    categories = list(set(c["category"] for c in mock_configs))

    return SystemConfigListResponse(
        items=[SystemConfigResponse(**c) for c in mock_configs],
        categories=categories
    )


@router.get("/configs/{config_key}", response_model=SystemConfigResponse, summary="시스템 설정 조회")
async def get_system_config(config_key: str):
    """특정 시스템 설정을 조회합니다."""
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
async def update_system_config(config_key: str, data: SystemConfigUpdate):
    """시스템 설정을 수정합니다."""
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
    size: int = Query(50, ge=1, le=200, description="페이지 크기")
):
    """감사 로그를 조회합니다."""
    mock_logs = [
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
    size: int = Query(20, ge=1, le=100, description="페이지 크기")
):
    """알림 목록을 조회합니다."""
    mock_notifications = [
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

    unread = [n for n in mock_notifications if not n["is_read"]]

    return NotificationListResponse(
        items=[NotificationResponse(**n) for n in mock_notifications],
        total=len(mock_notifications),
        unread_count=len(unread)
    )


@router.post("/notifications", response_model=NotificationResponse, summary="알림 생성")
async def create_notification(data: NotificationCreate):
    """새로운 알림을 생성합니다."""
    return NotificationResponse(
        notification_id=100,
        user_id=data.user_id,
        title=data.title,
        message=data.message,
        notification_type=data.notification_type,
        link_url=data.link_url,
        is_read=False,
        read_at=None,
        expires_at=data.expires_at,
        created_at=datetime.now()
    )


@router.put("/notifications/{notification_id}/read", summary="알림 읽음 처리")
async def mark_notification_read(notification_id: int):
    """알림을 읽음으로 표시합니다."""
    return {"message": f"알림 {notification_id}이(가) 읽음 처리되었습니다."}


@router.put("/notifications/read-all", summary="전체 알림 읽음 처리")
async def mark_all_notifications_read(user_id: str = Query(..., description="사용자 ID")):
    """해당 사용자의 모든 알림을 읽음으로 표시합니다."""
    return {"message": "모든 알림이 읽음 처리되었습니다.", "updated_count": 5}


@router.delete("/notifications/{notification_id}", summary="알림 삭제")
async def delete_notification(notification_id: int):
    """알림을 삭제합니다."""
    return {"message": f"알림 {notification_id}이(가) 삭제되었습니다."}


# ============== 시스템 상태 ==============

@router.get("/status", response_model=SystemStatusResponse, summary="시스템 상태 조회")
async def get_system_status():
    """현재 시스템 상태를 조회합니다."""
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
async def health_check():
    """시스템 헬스체크를 수행합니다."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "checks": {
            "database": {"status": "up", "latency_ms": 5},
            "redis": {"status": "up", "latency_ms": 1},
            "storage": {"status": "up", "available_gb": 523.7}
        }
    }
