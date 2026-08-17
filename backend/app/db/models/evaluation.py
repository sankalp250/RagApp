from sqlalchemy import Column, String, Integer, Float, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.db.base import UUIDPrimaryKeyMixin, TimestampMixin


class Evaluation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "evaluations"

    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    retrieval_score = Column(Float, default=1.0, nullable=False)
    grounding_score = Column(Float, default=1.0, nullable=False)
    answer_quality_score = Column(Float, default=1.0, nullable=False)
    potential_gap = Column(Boolean, default=False, nullable=False, index=True)
    signals = Column(JSON, default=dict, nullable=False)

    message = relationship("Message", back_populates="evaluation")


class Feedback(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "feedback"

    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1 (thumbs up) or -1 (thumbs down)
    reason = Column(Text, nullable=True)
    feedback_metadata = Column(JSON, default=dict, nullable=False)

    message = relationship("Message", back_populates="feedback")
