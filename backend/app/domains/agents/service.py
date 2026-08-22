from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
import uuid

from backend.app.db.models.agent import Agent
from backend.app.db.models.organization import Organization
from backend.app.schemas.agent import AgentCreate, AgentUpdate
from backend.app.core.exceptions import AgentNotFoundException, TenantAccessDeniedException
from backend.app.core.cache import invalidate_agent_cache, invalidate_widget_config
from backend.app.ai.rag_engine import invalidate_agent_chunks_cache


class AgentService:
    @staticmethod
    async def list_agents(db: AsyncSession, organization_id: str) -> List[Agent]:
        """Lists all agents belonging to the specific organization (Tenant Isolation)."""
        stmt = (
            select(Agent)
            .where(Agent.organization_id == organization_id)
            .order_by(Agent.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def create_agent(db: AsyncSession, organization_id: str, payload: AgentCreate) -> Agent:
        """Creates a new agent for the organization with customizable config."""
        if payload.configuration:
            if hasattr(payload.configuration, "model_dump"):
                config_dict = payload.configuration.model_dump()
            elif isinstance(payload.configuration, dict):
                config_dict = payload.configuration
            else:
                config_dict = dict(payload.configuration)
        else:
            config_dict = {
                "temperature": 0.3,
                "max_tokens": 800,
                "greeting_message": "Hello! How can I help you today?",
                "primary_color": "#2563eb",
                "bot_title": payload.name,
                "placeholder_text": "Ask a question...",
                "suggested_questions": ["What are your business hours?", "How do returns work?"]
            }

        agent = Agent(
            organization_id=organization_id,
            name=payload.name,
            description=payload.description,
            model=payload.model,
            system_prompt=payload.system_prompt or "You are a helpful and polite customer support AI agent. Answer questions using the provided knowledge documents. If you do not have sufficient information in the context to answer accurately, politely state that you do not know and suggest reaching out to human support.",
            configuration=config_dict,
            status="ACTIVE",
            public_key=str(uuid.uuid4())
        )
        db.add(agent)
        await db.commit()
        await db.refresh(agent)
        return agent

    @staticmethod
    async def get_agent(db: AsyncSession, organization_id: str, agent_id: str) -> Agent:
        """Fetches agent by ID ensuring tenant boundary."""
        stmt = select(Agent).where(Agent.id == agent_id, Agent.organization_id == organization_id)
        result = await db.execute(stmt)
        agent = result.scalars().first()
        if not agent:
            raise AgentNotFoundException(f"Agent '{agent_id}' not found in this organization")
        return agent

    @staticmethod
    async def get_agent_by_public_key(db: AsyncSession, public_key: str) -> Agent:
        """Fetches agent by public key for widget embed sessions (publicly accessible)."""
        stmt = select(Agent).where(Agent.public_key == public_key, Agent.status == "ACTIVE")
        result = await db.execute(stmt)
        agent = result.scalars().first()
        if not agent:
            raise AgentNotFoundException("No active agent found for this public key")
        return agent

    @staticmethod
    async def update_agent(db: AsyncSession, organization_id: str, agent_id: str, payload: AgentUpdate) -> Agent:
        """Updates agent configuration, prompt, or model safely within tenant."""
        agent = await AgentService.get_agent(db, organization_id, agent_id)

        if payload.name is not None:
            agent.name = payload.name
        if payload.description is not None:
            agent.description = payload.description
        if payload.model is not None:
            agent.model = payload.model
        if payload.system_prompt is not None:
            agent.system_prompt = payload.system_prompt
        if payload.status is not None:
            agent.status = payload.status
        if payload.configuration is not None:
            # Merge updated configuration keys
            current_config = dict(agent.configuration or {})
            current_config.update(payload.configuration)
            agent.configuration = current_config

        await db.commit()
        await db.refresh(agent)

        # Invalidate multi-tier caches immediately
        await invalidate_agent_cache(organization_id, agent_id)
        if agent.public_key:
            await invalidate_widget_config(agent.public_key)
        invalidate_agent_chunks_cache(agent_id)

        return agent

    @staticmethod
    async def delete_agent(db: AsyncSession, organization_id: str, agent_id: str) -> bool:
        """Deletes an agent and cascades all associated documents/conversations."""
        agent = await AgentService.get_agent(db, organization_id, agent_id)
        public_key = agent.public_key

        await db.delete(agent)
        await db.commit()

        # Invalidate multi-tier caches
        await invalidate_agent_cache(organization_id, agent_id)
        if public_key:
            await invalidate_widget_config(public_key)
        invalidate_agent_chunks_cache(agent_id)

        return True

