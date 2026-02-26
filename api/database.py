"""
Database connection and session management
"""
from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import asyncpg

from api.config import settings

# asyncpg pool for raw SQL operations
_asyncpg_pool: Optional[asyncpg.Pool] = None


# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
)

# Session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """SQLAlchemy declarative base"""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session"""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database (create tables)"""
    async with engine.begin() as conn:
        # Import all models to register them
        from api.models import mes  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections"""
    global _asyncpg_pool
    await engine.dispose()
    if _asyncpg_pool:
        await _asyncpg_pool.close()
        _asyncpg_pool = None


async def get_db_pool() -> asyncpg.Pool:
    """Get asyncpg connection pool for raw SQL operations"""
    global _asyncpg_pool
    if _asyncpg_pool is None:
        # Convert SQLAlchemy URL to asyncpg format
        # postgresql+asyncpg://user:pass@host:port/db -> postgresql://user:pass@host:port/db
        db_url = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
        _asyncpg_pool = await asyncpg.create_pool(
            db_url,
            min_size=2,
            max_size=10,
        )
    return _asyncpg_pool
