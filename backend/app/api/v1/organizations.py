from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.session import get_db
from backend.app.db.models.user import User
from backend.app.db.models.organization import Organization
from backend.app.schemas.organization import OrganizationCreate, OrganizationResponse, MemberResponse
from backend.app.domains.organizations.service import OrganizationService
from backend.app.api.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[OrganizationResponse])
async def list_user_organizations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all organizations where the current user is a member."""
    orgs = await OrganizationService.get_user_organizations(db, current_user.id)
    return [
        OrganizationResponse(
            id=org.id,
            name=org.name,
            slug=org.slug,
            created_at=org.created_at.isoformat() if org.created_at else ""
        )
        for org in orgs
    ]


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    payload: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new organization and assign current user as OWNER."""
    org = await OrganizationService.create_organization(
        db=db,
        user_id=current_user.id,
        name=payload.name,
        slug=payload.slug
    )
    return OrganizationResponse(
        id=org.id,
        name=org.name,
        slug=org.slug,
        created_at=org.created_at.isoformat() if org.created_at else ""
    )


@router.get("/{organization_id}", response_model=OrganizationResponse)
async def get_organization(
    organization_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get organization details for a verified member."""
    org = await OrganizationService.get_organization_by_id(db, organization_id, current_user.id)
    return OrganizationResponse(
        id=org.id,
        name=org.name,
        slug=org.slug,
        created_at=org.created_at.isoformat() if org.created_at else ""
    )


@router.get("/{organization_id}/members", response_model=List[MemberResponse])
async def get_organization_members(
    organization_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List members of an organization."""
    # Ensure current user has access
    await OrganizationService.get_organization_by_id(db, organization_id, current_user.id)
    members = await OrganizationService.get_organization_members(db, organization_id)
    return [MemberResponse(**m) for m in members]
