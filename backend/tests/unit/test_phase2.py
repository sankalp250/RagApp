import pytest
from httpx import AsyncClient
from backend.app.core.security import decode_token


@pytest.mark.asyncio
async def test_agent_crud_and_tenant_isolation(client: AsyncClient):
    # 1. Register User 1 (Acme Furniture)
    user1_res = await client.post("/api/v1/auth/register", json={
        "email": "owner@acme.com",
        "password": "Password123!",
        "full_name": "Acme Owner",
        "organization_name": "Acme Corp"
    })
    assert user1_res.status_code == 201
    user1_token = user1_res.json()["access_token"]
    user1_org_id = user1_res.json()["organization_id"]

    # 2. Register User 2 (Beta Tech)
    user2_res = await client.post("/api/v1/auth/register", json={
        "email": "owner@beta.com",
        "password": "Password123!",
        "full_name": "Beta Owner",
        "organization_name": "Beta Corp"
    })
    assert user2_res.status_code == 201
    user2_token = user2_res.json()["access_token"]
    user2_org_id = user2_res.json()["organization_id"]

    # 3. User 1 creates an Agent for Acme Corp
    create_agent_res = await client.post(
        "/api/v1/agents",
        json={
            "name": "Acme Support Bot",
            "description": "Customer support assistant for Acme",
            "model": "gemini-2.5-flash",
            "system_prompt": "You are Acme Support.",
            "configuration": {
                "greeting_message": "Welcome to Acme Support!",
                "primary_color": "#ff0000"
            }
        },
        headers={
            "Authorization": f"Bearer {user1_token}",
            "X-Organization-ID": user1_org_id
        }
    )
    assert create_agent_res.status_code == 201
    agent_a = create_agent_res.json()
    assert agent_a["name"] == "Acme Support Bot"
    assert agent_a["organization_id"] == user1_org_id
    assert "public_key" in agent_a
    agent_a_id = agent_a["id"]
    agent_a_public_key = agent_a["public_key"]

    # 4. User 2 creates an Agent for Beta Corp
    create_agent_b_res = await client.post(
        "/api/v1/agents",
        json={
            "name": "Beta Tech Bot",
            "description": "Beta assistant",
            "model": "gpt-4o-mini"
        },
        headers={
            "Authorization": f"Bearer {user2_token}",
            "X-Organization-ID": user2_org_id
        }
    )
    assert create_agent_b_res.status_code == 201
    agent_b = create_agent_b_res.json()
    agent_b_id = agent_b["id"]

    # 5. Verify Tenant Isolation in List:
    # User 1 listing agents should only see Agent A
    list_res_1 = await client.get(
        "/api/v1/agents",
        headers={
            "Authorization": f"Bearer {user1_token}",
            "X-Organization-ID": user1_org_id
        }
    )
    assert list_res_1.status_code == 200
    agents_1 = list_res_1.json()
    assert len(agents_1) == 1
    assert agents_1[0]["id"] == agent_a_id

    # User 2 listing agents should only see Agent B
    list_res_2 = await client.get(
        "/api/v1/agents",
        headers={
            "Authorization": f"Bearer {user2_token}",
            "X-Organization-ID": user2_org_id
        }
    )
    assert list_res_2.status_code == 200
    agents_2 = list_res_2.json()
    assert len(agents_2) == 1
    assert agents_2[0]["id"] == agent_b_id

    # 6. Verify Tenant Isolation on Direct ID Access:
    # User 2 attempts to fetch User 1's agent -> Should return 404
    cross_get = await client.get(
        f"/api/v1/agents/{agent_a_id}",
        headers={
            "Authorization": f"Bearer {user2_token}",
            "X-Organization-ID": user2_org_id
        }
    )
    assert cross_get.status_code == 404

    # User 2 attempts to update User 1's agent -> Should return 404
    cross_patch = await client.patch(
        f"/api/v1/agents/{agent_a_id}",
        json={"name": "Hacked Bot Name"},
        headers={
            "Authorization": f"Bearer {user2_token}",
            "X-Organization-ID": user2_org_id
        }
    )
    assert cross_patch.status_code == 404

    # 7. Test Agent Update by Owner
    patch_res = await client.patch(
        f"/api/v1/agents/{agent_a_id}",
        json={
            "name": "Acme Super Bot",
            "configuration": {"primary_color": "#00ff00"}
        },
        headers={
            "Authorization": f"Bearer {user1_token}",
            "X-Organization-ID": user1_org_id
        }
    )
    assert patch_res.status_code == 200
    updated_a = patch_res.json()
    assert updated_a["name"] == "Acme Super Bot"
    assert updated_a["configuration"]["primary_color"] == "#00ff00"

    # 8. Test Public Widget Init endpoint
    public_init_res = await client.get(f"/api/v1/agents/public/widget-init/{agent_a_public_key}")
    assert public_init_res.status_code == 200
    widget_data = public_init_res.json()
    assert widget_data["agent_id"] == agent_a_id
    assert widget_data["agent_name"] == "Acme Super Bot"
    assert "session_token" in widget_data

    decoded_widget_token = decode_token(widget_data["session_token"])
    assert decoded_widget_token["agent_id"] == agent_a_id
    assert decoded_widget_token["type"] == "widget_session"

    # 9. Test Agent Deletion
    del_res = await client.delete(
        f"/api/v1/agents/{agent_a_id}",
        headers={
            "Authorization": f"Bearer {user1_token}",
            "X-Organization-ID": user1_org_id
        }
    )
    assert del_res.status_code == 204

    # Verify agent is gone
    get_after_del = await client.get(
        f"/api/v1/agents/{agent_a_id}",
        headers={
            "Authorization": f"Bearer {user1_token}",
            "X-Organization-ID": user1_org_id
        }
    )
    assert get_after_del.status_code == 404
