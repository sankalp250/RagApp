from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import re

from backend.app.db.models.organization import Organization, OrganizationMember, OrgRole
from backend.app.db.models.user import User
from backend.app.core.exceptions import DomainException, TenantNotFoundException, TenantAccessDeniedException


def slugify(text: str) -> str:
    return re.sub(r'[\W_]+', '-', text.lower()).strip('-')


class OrganizationService:
    @staticmethod
    async def get_user_organizations(db: AsyncSession, user_id: str) -> List[Organization]:
        stmt = (
            select(Organization)
            .join(OrganizationMember, Organization.id == OrganizationMember.organization_id)
            .where(OrganizationMember.user_id == user_id)
            .order_by(Organization.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def create_organization(db: AsyncSession, user_id: str, name: str, slug: Optional[str] = None) -> Organization:
        base_slug = slugify(slug or name)
        # Check uniqueness or append user_id snippet
        final_slug = f"{base_slug}-{user_id[:6]}"
        
        org = Organization(name=name, slug=final_slug)
        db.add(org)
        await db.flush()

        member = OrganizationMember(
            organization_id=org.id,
            user_id=user_id,
            role=OrgRole.OWNER.value
        )
        db.add(member)
        await db.commit()
        await db.refresh(org)
        return org

    @staticmethod
    async def get_organization_by_id(db: AsyncSession, org_id: str, user_id: str) -> Organization:
        stmt = (
            select(Organization)
            .join(OrganizationMember, Organization.id == OrganizationMember.organization_id)
            .where(
                Organization.id == org_id,
                OrganizationMember.user_id == user_id
            )
        )
        result = await db.execute(stmt)
        org = result.scalars().first()
        if not org:
            raise TenantAccessDeniedException("Organization not found or access denied")
        return org

    @staticmethod
    async def get_organization_members(db: AsyncSession, org_id: str) -> List[dict]:
        stmt = (
            select(OrganizationMember, User)
            .join(User, OrganizationMember.user_id == User.id)
            .where(OrganizationMember.organization_id == org_id)
        )
        result = await db.execute(stmt)
        rows = result.all()
        return [
            {
                "user_id": member.user_id,
                "email": user.email,
                "full_name": user.full_name,
                "role": member.role
            }
            for member, user in rows
        ]
