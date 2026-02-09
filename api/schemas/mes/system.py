"""
MES System Management Schemas
시스템관리 Pydantic 스키마
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field

from api.models.mes.system import UserStatus, MenuType, AuditAction


# ============== 역할 관리 ==============

class RoleBase(BaseModel):
    """역할 기본 스키마"""
    role_name: str = Field(..., description="역할명")
    role_name_en: Optional[str] = Field(None, description="역할명(영문)")
    description: Optional[str] = Field(None, description="설명")
    level: int = Field(0, description="역할 레벨")
    is_system: bool = Field(False, description="시스템 역할 여부")
    is_active: bool = Field(True, description="사용 여부")


class RoleCreate(RoleBase):
    """역할 생성 스키마"""
    role_id: str = Field(..., description="역할 ID")


class RoleResponse(RoleBase):
    """역할 응답 스키마"""
    role_id: str
    created_at: datetime
    updated_at: datetime
    user_count: Optional[int] = Field(None, description="사용자 수")

    class Config:
        from_attributes = True


class RoleListResponse(BaseModel):
    """역할 목록 응답"""
    items: List[RoleResponse]
    total: int
    page: int
    size: int


# ============== 사용자 관리 ==============

class UserBase(BaseModel):
    """사용자 기본 스키마"""
    user_name: str = Field(..., description="사용자명")
    email: Optional[str] = Field(None, description="이메일")
    phone: Optional[str] = Field(None, description="연락처")
    department: Optional[str] = Field(None, description="부서")
    position: Optional[str] = Field(None, description="직위")
    role_id: Optional[str] = Field(None, description="역할 ID")
    factory_code: Optional[str] = Field(None, description="소속 공장")
    line_code: Optional[str] = Field(None, description="담당 라인")
    status: UserStatus = Field(UserStatus.PENDING, description="상태")
    is_active: bool = Field(True, description="사용 여부")


class UserCreate(UserBase):
    """사용자 생성 스키마"""
    user_id: str = Field(..., description="사용자 ID")
    password: str = Field(..., description="비밀번호", min_length=8)


class UserUpdate(BaseModel):
    """사용자 수정 스키마"""
    user_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    role_id: Optional[str] = None
    factory_code: Optional[str] = None
    line_code: Optional[str] = None
    status: Optional[UserStatus] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """사용자 응답 스키마"""
    user_id: str
    last_login: Optional[datetime] = None
    login_fail_count: int = 0
    password_changed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    role_name: Optional[str] = Field(None, description="역할명")

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """사용자 목록 응답"""
    items: List[UserResponse]
    total: int
    page: int
    size: int


class PasswordChange(BaseModel):
    """비밀번호 변경"""
    current_password: str = Field(..., description="현재 비밀번호")
    new_password: str = Field(..., description="새 비밀번호", min_length=8)
    confirm_password: str = Field(..., description="비밀번호 확인")


# ============== 세션 관리 ==============

class UserSessionResponse(BaseModel):
    """세션 응답 스키마"""
    session_id: str
    user_id: str
    user_name: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    login_at: datetime
    last_activity: datetime
    logout_at: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True


class SessionListResponse(BaseModel):
    """세션 목록 응답"""
    items: List[UserSessionResponse]
    total: int


# ============== 메뉴 관리 ==============

class MenuBase(BaseModel):
    """메뉴 기본 스키마"""
    menu_name: str = Field(..., description="메뉴명")
    menu_name_en: Optional[str] = Field(None, description="메뉴명(영문)")
    parent_menu_id: Optional[str] = Field(None, description="상위 메뉴 ID")
    menu_type: MenuType = Field(MenuType.PAGE, description="메뉴 유형")
    menu_path: Optional[str] = Field(None, description="메뉴 경로")
    icon: Optional[str] = Field(None, description="아이콘")
    sort_order: int = Field(0, description="정렬 순서")
    level: int = Field(1, description="메뉴 레벨")
    is_visible: bool = Field(True, description="표시 여부")
    is_active: bool = Field(True, description="사용 여부")


class MenuCreate(MenuBase):
    """메뉴 생성 스키마"""
    menu_id: str = Field(..., description="메뉴 ID")


class MenuUpdate(BaseModel):
    """메뉴 수정 스키마"""
    menu_name: Optional[str] = None
    menu_name_en: Optional[str] = None
    parent_menu_id: Optional[str] = None
    menu_type: Optional[MenuType] = None
    menu_path: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None
    is_visible: Optional[bool] = None
    is_active: Optional[bool] = None


class MenuResponse(MenuBase):
    """메뉴 응답 스키마"""
    menu_id: str
    created_at: datetime
    updated_at: datetime
    children: Optional[List['MenuResponse']] = None

    class Config:
        from_attributes = True


class MenuTreeResponse(BaseModel):
    """메뉴 트리 응답"""
    items: List[MenuResponse]


# ============== 권한 관리 ==============

class PermissionBase(BaseModel):
    """권한 기본 스키마"""
    can_view: bool = Field(True, description="조회 권한")
    can_create: bool = Field(False, description="생성 권한")
    can_update: bool = Field(False, description="수정 권한")
    can_delete: bool = Field(False, description="삭제 권한")
    can_export: bool = Field(False, description="내보내기 권한")
    can_print: bool = Field(False, description="출력 권한")


class RolePermissionCreate(PermissionBase):
    """역할 권한 생성"""
    role_id: str = Field(..., description="역할 ID")
    menu_id: str = Field(..., description="메뉴 ID")


class RolePermissionUpdate(PermissionBase):
    """역할 권한 수정"""
    pass


class RolePermissionResponse(PermissionBase):
    """역할 권한 응답"""
    id: int
    role_id: str
    menu_id: str
    menu_name: Optional[str] = None
    role_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RolePermissionBulkUpdate(BaseModel):
    """역할 권한 일괄 업데이트"""
    role_id: str
    permissions: List[RolePermissionCreate]


# ============== 시스템 설정 ==============

class SystemConfigBase(BaseModel):
    """시스템 설정 기본 스키마"""
    config_value: Optional[str] = Field(None, description="설정 값")
    config_type: str = Field("STRING", description="데이터 타입")
    category: Optional[str] = Field(None, description="카테고리")
    description: Optional[str] = Field(None, description="설명")
    default_value: Optional[str] = Field(None, description="기본값")
    is_editable: bool = Field(True, description="편집 가능 여부")
    is_visible: bool = Field(True, description="표시 여부")


class SystemConfigCreate(SystemConfigBase):
    """시스템 설정 생성"""
    config_key: str = Field(..., description="설정 키")


class SystemConfigUpdate(BaseModel):
    """시스템 설정 수정"""
    config_value: Optional[str] = None
    description: Optional[str] = None


class SystemConfigResponse(SystemConfigBase):
    """시스템 설정 응답"""
    config_key: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SystemConfigListResponse(BaseModel):
    """시스템 설정 목록"""
    items: List[SystemConfigResponse]
    categories: List[str]


# ============== 감사 로그 ==============

class AuditLogResponse(BaseModel):
    """감사 로그 응답"""
    log_id: int
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    action: AuditAction
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    menu_id: Optional[str] = None
    ip_address: Optional[str] = None
    request_url: Optional[str] = None
    request_method: Optional[str] = None
    response_status: Optional[int] = None
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """감사 로그 목록"""
    items: List[AuditLogResponse]
    total: int
    page: int
    size: int


class AuditLogFilter(BaseModel):
    """감사 로그 필터"""
    user_id: Optional[str] = None
    action: Optional[AuditAction] = None
    target_type: Optional[str] = None
    menu_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


# ============== 알림 ==============

class NotificationCreate(BaseModel):
    """알림 생성"""
    user_id: Optional[str] = Field(None, description="대상 사용자 (NULL=전체)")
    title: str = Field(..., description="제목")
    message: str = Field(..., description="내용")
    notification_type: str = Field("INFO", description="알림 유형")
    link_url: Optional[str] = Field(None, description="연결 URL")
    expires_at: Optional[datetime] = Field(None, description="만료 시각")


class NotificationResponse(BaseModel):
    """알림 응답"""
    notification_id: int
    user_id: Optional[str] = None
    title: str
    message: str
    notification_type: str
    link_url: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """알림 목록"""
    items: List[NotificationResponse]
    total: int
    unread_count: int


# ============== 시스템 상태 ==============

class SystemStatusResponse(BaseModel):
    """시스템 상태 응답"""
    status: str = Field(..., description="시스템 상태")
    version: str = Field(..., description="시스템 버전")
    uptime: str = Field(..., description="가동 시간")
    database_status: str = Field(..., description="DB 연결 상태")
    active_users: int = Field(..., description="현재 접속자 수")
    today_logins: int = Field(..., description="금일 로그인 수")
    memory_usage: float = Field(..., description="메모리 사용률 (%)")
    cpu_usage: float = Field(..., description="CPU 사용률 (%)")
    disk_usage: float = Field(..., description="디스크 사용률 (%)")
    last_backup: Optional[datetime] = Field(None, description="최근 백업 시각")
    environment: str = Field(..., description="운영 환경")
