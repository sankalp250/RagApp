from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status, Header, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import jwt

from backend.app.core.config import settings
from backend.app.core.security import decode_token
from backend.app.db.session import get_db
from backend.app.db.models.user import User
from backend.app.db.models.organization import Organization, OrganizationMember, OrgRole
from backend.app.db.models.agent import Agent

security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Extracts and verifies the current authenticated user from JWT Bearer token."""
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(auth.credentials)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token payload",
            )
    except (jwt.PyJWTError, ValueError, Exception):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )
    return user


async def get_optional_user(
    auth: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Like get_current_user but returns None instead of raising 401 (for public endpoints)."""
    if not auth or not auth.credentials:
        return None
    try:
        payload = decode_token(auth.credentials)
        user_id: str = payload.get("sub")
        if not user_id:
            return None
        stmt = select(User).where(User.id == user_id, User.is_active.is_(True))
        result = await db.execute(stmt)
        return result.scalars().first()
    except Exception:
        return None


async def get_current_organization(
    organization_id: Optional[str] = Header(None, alias="X-Organization-ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Organization:
    """Resolves and enforces multi-tenant organization context for the current user."""
    if not organization_id:
        # Fallback to user's first organization membership
        stmt = (
            select(Organization)
            .join(OrganizationMember)
            .where(OrganizationMember.user_id == current_user.id)
        )
        result = await db.execute(stmt)
        org = result.scalars().first()
        if not org:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not belong to any organization",
            )
        return org

    # Verify user belongs to the requested organization
    stmt = (
        select(Organization)
        .join(OrganizationMember)
        .where(
            OrganizationMember.user_id == current_user.id,
            Organization.id == organization_id
        )
    )
    result = await db.execute(stmt)
    org = result.scalars().first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to requested organization",
        )
    return org


async def get_agent_for_tenant(
    agent_id: str,
    org: Organization = Depends(get_current_organization),
    db: AsyncSession = Depends(get_db)
) -> Agent:
    """Ensures the agent exists and belongs exclusively to the requesting tenant."""
    stmt = select(Agent).where(Agent.id == agent_id, Agent.organization_id == org.id)
    result = await db.execute(stmt)
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found in this organization",
        )
    return agent
