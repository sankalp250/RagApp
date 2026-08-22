from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class AgentConfigurationSchema(BaseModel):
    temperature: float = 0.3
    max_tokens: int = 800
    greeting_message: str = "Hello! How can I help you today?"
    primary_color: str = "#2563eb"
    bot_title: str = "AI Assistant"
    placeholder_text: str = "Ask a question..."
    suggested_questions: List[str] = ["What are your business hours?", "How do returns work?"]


class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    model: str = "gemini-2.5-flash"
    system_prompt: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    status: Optional[str] = None


class AgentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    name: str
    description: Optional[str] = None
    model: str
    system_prompt: str
    configuration: Dict[str, Any]
    status: str
    public_key: str
    created_at: Optional[Union[datetime, str]] = None


class WidgetSessionResponse(BaseModel):
    session_token: str
    agent_id: str
    agent_name: str
    configuration: Dict[str, Any]
