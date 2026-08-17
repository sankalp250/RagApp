from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.db.base import UUIDPrimaryKeyMixin, TimestampMixin


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    # Cached primary organization_id (set on first org creation/join for quick access)
    primary_organization_id = Column(String(36), nullable=True, index=True)

    memberships = relationship("OrganizationMember", back_populates="user", cascade="all, delete-orphan")

    @property
    def organization_id(self) -> str | None:
        """Quick accessor for the user's primary organization."""
        return self.primary_organization_id
