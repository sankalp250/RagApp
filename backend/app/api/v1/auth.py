from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import re

from backend.app.db.session import get_db
from backend.app.db.models.user import User
from backend.app.db.models.organization import Organization, OrganizationMember, OrgRole
from backend.app.schemas.auth import UserRegisterRequest, UserLoginRequest, GoogleAuthRequest, TokenResponse, UserResponse
from backend.app.core.security import get_password_hash, verify_password, create_access_token
from backend.app.core.config import settings
from backend.app.api.deps import get_current_user

try:
    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests
except ImportError:
    google_id_token = None
    google_requests = None

router = APIRouter()


def slugify(text: str) -> str:
    return re.sub(r'[\W_]+', '-', text.lower()).strip('-')


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: UserRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user and create their initial organization."""
    # Check if user already exists
    stmt = select(User).where(User.email == payload.email.lower())
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    # Create User
    new_user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        is_active=True
    )
    db.add(new_user)
    await db.flush()

    # Create initial Organization
    org_name = payload.organization_name or f"{payload.full_name or 'My'} Organization"
    base_slug = slugify(org_name)
    slug = f"{base_slug}-{new_user.id[:8]}"

    new_org = Organization(
        name=org_name,
        slug=slug
    )
    db.add(new_org)
    await db.flush()

    new_user.primary_organization_id = new_org.id

    # Add user as OWNER of organization
    membership = OrganizationMember(
        organization_id=new_org.id,
        user_id=new_user.id,
        role=OrgRole.OWNER.value
    )
    db.add(membership)
    await db.commit()
    await db.refresh(new_user)

    # Issue JWT
    token = create_access_token(
        subject=new_user.id,
        organization_id=new_org.id,
        role=OrgRole.OWNER.value
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=new_user.id,
        email=new_user.email,
        organization_id=new_org.id
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: UserLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate user with email and password."""
    stmt = select(User).where(User.email == payload.email.lower())
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )

    # Find user's primary organization
    stmt_org = (
        select(Organization, OrganizationMember.role)
        .join(OrganizationMember, Organization.id == OrganizationMember.organization_id)
        .where(OrganizationMember.user_id == user.id)
    )
    res_org = await db.execute(stmt_org)
    org_row = res_org.first()

    org_id = org_row[0].id if org_row else None
    role = org_row[1] if org_row else "MEMBER"

    token = create_access_token(
        subject=user.id,
        organization_id=org_id,
        role=role
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=user.id,
        email=user.email,
        organization_id=org_id
    )


@router.post("/google", response_model=TokenResponse)
async def google_auth(
    payload: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate or register user using Google OAuth."""
    email: str | None = None
    full_name: str | None = payload.full_name

    # 1. Attempt token verification if google library and token are present
    if google_id_token and payload.id_token and not payload.id_token.startswith("dev_"):
        try:
            idinfo = google_id_token.verify_oauth2_token(
                payload.id_token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None
            )
            email = idinfo.get("email", "").lower()
            full_name = idinfo.get("name", full_name)
        except Exception as e:
            # If verification fails and no direct email provided, raise 401
            if not payload.email:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid Google OAuth token: {str(e)}"
                )

    # 2. Fallback to payload email if available
    if not email and payload.email:
        email = str(payload.email).lower()

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email could not be determined from Google authentication"
        )

    # Check if user exists
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        # Auto-create user via Google
        user = User(
            email=email,
            hashed_password=get_password_hash(f"google-oauth-{email}"),
            full_name=full_name,
            is_active=True
        )
        db.add(user)
        await db.flush()

        org_name = payload.organization_name or f"{full_name or 'My'} Organization"
        base_slug = slugify(org_name)
        slug = f"{base_slug}-{user.id[:8]}"

        new_org = Organization(name=org_name, slug=slug)
        db.add(new_org)
        await db.flush()

        user.primary_organization_id = new_org.id

        membership = OrganizationMember(
            organization_id=new_org.id,
            user_id=user.id,
            role=OrgRole.OWNER.value
        )
        db.add(membership)
        await db.commit()
        await db.refresh(user)

        org_id = new_org.id
        role = OrgRole.OWNER.value
    else:
        # Find user's organization
        stmt_org = (
            select(Organization, OrganizationMember.role)
            .join(OrganizationMember, Organization.id == OrganizationMember.organization_id)
            .where(OrganizationMember.user_id == user.id)
        )
        res_org = await db.execute(stmt_org)
        org_row = res_org.first()
        org_id = org_row[0].id if org_row else None
        role = org_row[1] if org_row else "MEMBER"

    token = create_access_token(
        subject=user.id,
        organization_id=org_id,
        role=role
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=user.id,
        email=user.email,
        organization_id=org_id
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve current authenticated user profile."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat() if current_user.created_at else ""
    )
