"""
MES System Management Models
시스템관리 - 사용자관리, 권한관리, 메뉴관리, 시스템설정
"""
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import (
    Column, String, Integer, DateTime, Boolean, Text,
    ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship

from api.models.base import Base


class UserStatus(str, PyEnum):
    """사용자 상태"""
    ACTIVE = "ACTIVE"           # 사용중
    INACTIVE = "INACTIVE"       # 비활성
    LOCKED = "LOCKED"           # 잠금
    PENDING = "PENDING"         # 승인대기


class MenuType(str, PyEnum):
    """메뉴 유형"""
    FOLDER = "FOLDER"           # 폴더
    PAGE = "PAGE"               # 페이지
    LINK = "LINK"               # 외부링크


class AuditAction(str, PyEnum):
    """감사 액션 유형"""
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    VIEW = "VIEW"
    EXPORT = "EXPORT"
    PRINT = "PRINT"


# ============== 사용자 관리 ==============

class Role(Base):
    """역할 마스터"""
    __tablename__ = "mes_role"

    role_id = Column(String(20), primary_key=True, comment="역할 ID")
    role_name = Column(String(100), nullable=False, comment="역할명")
    role_name_en = Column(String(100), comment="역할명(영문)")
    description = Column(Text, comment="설명")
    level = Column(Integer, default=0, comment="역할 레벨 (0=최고권한)")
    is_system = Column(Boolean, default=False, comment="시스템 역할 여부")
    is_active = Column(Boolean, default=True, comment="사용 여부")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")

    # Relationships
    users = relationship("User", back_populates="role")
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")


class User(Base):
    """사용자 마스터"""
    __tablename__ = "mes_user"

    user_id = Column(String(50), primary_key=True, comment="사용자 ID")
    user_name = Column(String(100), nullable=False, comment="사용자명")
    email = Column(String(200), comment="이메일")
    phone = Column(String(20), comment="연락처")
    department = Column(String(100), comment="부서")
    position = Column(String(50), comment="직위")
    role_id = Column(String(20), ForeignKey("mes_role.role_id"), comment="역할 ID")
    factory_code = Column(String(20), comment="소속 공장")
    line_code = Column(String(20), comment="담당 라인")
    status = Column(Enum(UserStatus), default=UserStatus.PENDING, comment="상태")
    password_hash = Column(String(255), comment="비밀번호 해시")
    last_login = Column(DateTime, comment="최종 로그인")
    login_fail_count = Column(Integer, default=0, comment="로그인 실패 횟수")
    password_changed_at = Column(DateTime, comment="비밀번호 변경일시")
    is_active = Column(Boolean, default=True, comment="사용 여부")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")

    # Relationships
    role = relationship("Role", back_populates="users")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


class UserSession(Base):
    """사용자 세션"""
    __tablename__ = "mes_user_session"

    session_id = Column(String(100), primary_key=True, comment="세션 ID")
    user_id = Column(String(50), ForeignKey("mes_user.user_id"), nullable=False, comment="사용자 ID")
    ip_address = Column(String(50), comment="IP 주소")
    user_agent = Column(String(500), comment="User Agent")
    login_at = Column(DateTime, default=datetime.now, comment="로그인 시각")
    last_activity = Column(DateTime, default=datetime.now, comment="최종 활동 시각")
    logout_at = Column(DateTime, comment="로그아웃 시각")
    is_active = Column(Boolean, default=True, comment="활성 여부")

    # Relationships
    user = relationship("User", back_populates="sessions")


# ============== 권한 관리 ==============

class Menu(Base):
    """메뉴 마스터"""
    __tablename__ = "mes_menu"

    menu_id = Column(String(20), primary_key=True, comment="메뉴 ID")
    menu_name = Column(String(100), nullable=False, comment="메뉴명")
    menu_name_en = Column(String(100), comment="메뉴명(영문)")
    parent_menu_id = Column(String(20), ForeignKey("mes_menu.menu_id"), comment="상위 메뉴 ID")
    menu_type = Column(Enum(MenuType), default=MenuType.PAGE, comment="메뉴 유형")
    menu_path = Column(String(200), comment="메뉴 경로")
    icon = Column(String(50), comment="아이콘")
    sort_order = Column(Integer, default=0, comment="정렬 순서")
    level = Column(Integer, default=1, comment="메뉴 레벨")
    is_visible = Column(Boolean, default=True, comment="표시 여부")
    is_active = Column(Boolean, default=True, comment="사용 여부")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")

    # Relationships
    children = relationship("Menu", backref="parent", remote_side=[menu_id])
    permissions = relationship("RolePermission", back_populates="menu", cascade="all, delete-orphan")


class RolePermission(Base):
    """역할별 메뉴 권한"""
    __tablename__ = "mes_role_permission"

    id = Column(Integer, primary_key=True, autoincrement=True)
    role_id = Column(String(20), ForeignKey("mes_role.role_id"), nullable=False, comment="역할 ID")
    menu_id = Column(String(20), ForeignKey("mes_menu.menu_id"), nullable=False, comment="메뉴 ID")
    can_view = Column(Boolean, default=True, comment="조회 권한")
    can_create = Column(Boolean, default=False, comment="생성 권한")
    can_update = Column(Boolean, default=False, comment="수정 권한")
    can_delete = Column(Boolean, default=False, comment="삭제 권한")
    can_export = Column(Boolean, default=False, comment="내보내기 권한")
    can_print = Column(Boolean, default=False, comment="출력 권한")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")

    # Relationships
    role = relationship("Role", back_populates="permissions")
    menu = relationship("Menu", back_populates="permissions")


# ============== 시스템 설정 ==============

class SystemConfig(Base):
    """시스템 설정"""
    __tablename__ = "mes_system_config"

    config_key = Column(String(100), primary_key=True, comment="설정 키")
    config_value = Column(Text, comment="설정 값")
    config_type = Column(String(20), comment="데이터 타입 (STRING, NUMBER, BOOLEAN, JSON)")
    category = Column(String(50), comment="카테고리")
    description = Column(Text, comment="설명")
    default_value = Column(Text, comment="기본값")
    is_editable = Column(Boolean, default=True, comment="편집 가능 여부")
    is_visible = Column(Boolean, default=True, comment="표시 여부")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="수정일시")


class AuditLog(Base):
    """감사 로그"""
    __tablename__ = "mes_audit_log"

    log_id = Column(Integer, primary_key=True, autoincrement=True, comment="로그 ID")
    user_id = Column(String(50), ForeignKey("mes_user.user_id"), comment="사용자 ID")
    action = Column(Enum(AuditAction), nullable=False, comment="액션 유형")
    target_type = Column(String(50), comment="대상 유형 (테이블명 등)")
    target_id = Column(String(100), comment="대상 ID")
    menu_id = Column(String(20), comment="메뉴 ID")
    ip_address = Column(String(50), comment="IP 주소")
    user_agent = Column(String(500), comment="User Agent")
    request_url = Column(String(500), comment="요청 URL")
    request_method = Column(String(10), comment="요청 메소드")
    request_body = Column(JSON, comment="요청 본문")
    response_status = Column(Integer, comment="응답 상태코드")
    old_value = Column(JSON, comment="변경 전 값")
    new_value = Column(JSON, comment="변경 후 값")
    description = Column(Text, comment="설명")
    created_at = Column(DateTime, default=datetime.now, comment="발생일시")

    # Relationships
    user = relationship("User", back_populates="audit_logs")


class Notification(Base):
    """알림"""
    __tablename__ = "mes_notification"

    notification_id = Column(Integer, primary_key=True, autoincrement=True, comment="알림 ID")
    user_id = Column(String(50), ForeignKey("mes_user.user_id"), comment="대상 사용자 ID (NULL=전체)")
    title = Column(String(200), nullable=False, comment="제목")
    message = Column(Text, nullable=False, comment="내용")
    notification_type = Column(String(20), comment="알림 유형 (INFO, WARNING, ERROR, SUCCESS)")
    link_url = Column(String(500), comment="연결 URL")
    is_read = Column(Boolean, default=False, comment="읽음 여부")
    read_at = Column(DateTime, comment="읽은 시각")
    expires_at = Column(DateTime, comment="만료 시각")
    created_at = Column(DateTime, default=datetime.now, comment="생성일시")
