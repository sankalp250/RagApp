from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from backend.app.db.session import get_db
from backend.app.db.models.user import User
from backend.app.db.models.organization import Organization
from backend.app.db.models.agent import Agent
from backend.app.schemas.agent import (
    AgentCreate, AgentUpdate, AgentResponse, WidgetSessionResponse, AgentPublicConfigResponse
)
from backend.app.domains.agents.service import AgentService
from backend.app.api.deps import get_current_user, get_current_organization
from backend.app.core.security import create_widget_session_token

router = APIRouter()


@router.get("", response_model=List[AgentResponse])
async def list_agents(
    org: Organization = Depends(get_current_organization),
    db: AsyncSession = Depends(get_db)
):
    """List all AI agents for the current organization."""
    agents = await AgentService.list_agents(db, org.id)
    return [
        AgentResponse(
            id=a.id,
            organization_id=a.organization_id,
            name=a.name,
            description=a.description,
            model=a.model,
            system_prompt=a.system_prompt,
            configuration=a.configuration or {},
            status=a.status,
            public_key=a.public_key,
            created_at=a.created_at.isoformat() if a.created_at else ""
        )
        for a in agents
    ]


@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    payload: AgentCreate,
    org: Organization = Depends(get_current_organization),
    db: AsyncSession = Depends(get_db)
):
    """Create a new AI agent inside the current organization."""
    agent = await AgentService.create_agent(db, org.id, payload)
    return AgentResponse(
        id=agent.id,
        organization_id=agent.organization_id,
        name=agent.name,
        description=agent.description,
        model=agent.model,
        system_prompt=agent.system_prompt,
        configuration=agent.configuration or {},
        status=agent.status,
        public_key=agent.public_key,
        created_at=agent.created_at.isoformat() if agent.created_at else ""
    )


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    org: Organization = Depends(get_current_organization),
    db: AsyncSession = Depends(get_db)
):
    """Get single agent details by ID (Tenant Isolated)."""
    agent = await AgentService.get_agent(db, org.id, agent_id)
    return AgentResponse(
        id=agent.id,
        organization_id=agent.organization_id,
        name=agent.name,
        description=agent.description,
        model=agent.model,
        system_prompt=agent.system_prompt,
        configuration=agent.configuration or {},
        status=agent.status,
        public_key=agent.public_key,
        created_at=agent.created_at.isoformat() if agent.created_at else ""
    )


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    payload: AgentUpdate,
    org: Organization = Depends(get_current_organization),
    db: AsyncSession = Depends(get_db)
):
    """Update agent instructions, personality, styling, or model."""
    agent = await AgentService.update_agent(db, org.id, agent_id, payload)
    return AgentResponse(
        id=agent.id,
        organization_id=agent.organization_id,
        name=agent.name,
        description=agent.description,
        model=agent.model,
        system_prompt=agent.system_prompt,
        configuration=agent.configuration or {},
        status=agent.status,
        public_key=agent.public_key,
        created_at=agent.created_at.isoformat() if agent.created_at else ""
    )


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    agent_id: str,
    org: Organization = Depends(get_current_organization),
    db: AsyncSession = Depends(get_db)
):
    """Delete an agent and all associated documents & conversations."""
    await AgentService.delete_agent(db, org.id, agent_id)
    return None


@router.get("/public/widget-init/{public_key}", response_model=WidgetSessionResponse)
async def init_widget_by_public_key(
    public_key: str,
    db: AsyncSession = Depends(get_db)
):
    """Public endpoint for embeddable JS widget initialization."""
    agent = await AgentService.get_agent_by_public_key(db, public_key)
    session_token = create_widget_session_token(agent_id=agent.id)
    return WidgetSessionResponse(
        session_token=session_token,
        agent_id=agent.id,
        agent_name=agent.name,
        configuration=agent.configuration or {}
    )


@router.get("/{agent_id}/public-config", response_model=AgentPublicConfigResponse)
async def get_agent_public_config(
    agent_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Public configuration endpoint consumed by embed widgets and host frameworks.
    Accepts either agent UUID or public_key.
    Validates that the agent is published and active (status == 'ACTIVE').
    Guarantees zero secret leakage (no API keys, prompts, or model parameters).
    """
    import asyncio
    from backend.app.ai.rag_engine import _get_or_build_index

    stmt = select(Agent).where(
        or_(Agent.id == agent_id, Agent.public_key == agent_id)
    )
    result = await db.execute(stmt)
    agent = result.scalars().first()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent '{agent_id}' not found."
        )

    if agent.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Agent '{agent_id}' is not published or active."
        )

    # Pre-warm in-memory vector/BM25 index in background
    async def _warmup():
        try:
            await _get_or_build_index(None, str(agent.id), str(agent.organization_id))
        except Exception:
            pass
    asyncio.create_task(_warmup())

    config = agent.configuration or {}
    return AgentPublicConfigResponse(
        agent_id=str(agent.id),
        public_key=str(agent.public_key),
        name=agent.name,
        bot_title=config.get("bot_title", agent.name or "AI Assistant"),
        greeting_message=config.get("greeting_message", "Hello! How can I help you today?"),
        primary_color=config.get("primary_color", "#6366f1"),
        placeholder_text=config.get("placeholder_text", "Ask a question..."),
        suggested_questions=config.get("suggested_questions", [
            "What is your return policy?",
            "How can I contact support?",
            "What services do you offer?"
        ]),
        allowed_domains=config.get("allowed_domains", []),
        position=config.get("position", "bottom-right"),
        status=agent.status,
        is_published=(agent.status == "ACTIVE")
    )

