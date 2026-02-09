"""
Common Pydantic schemas
"""
from datetime import datetime, date
from enum import Enum
from typing import Generic, TypeVar, Optional, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


T = TypeVar("T")


class StatusEnum(str, Enum):
    """Common status values"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    COMPLETED = "completed"


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper"""
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int

    model_config = ConfigDict(from_attributes=True)


class DateRangeFilter(BaseModel):
    """Date range filter"""
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class DateTimeRangeFilter(BaseModel):
    """DateTime range filter"""
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None


class BaseResponse(BaseModel):
    """Base response model"""
    id: UUID
    tenant_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


class SuccessResponse(BaseModel):
    """Success response"""
    success: bool = True
    message: Optional[str] = None
