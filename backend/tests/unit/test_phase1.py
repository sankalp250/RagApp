import pytest
from httpx import AsyncClient
from backend.app.core.security import get_password_hash, verify_password, create_access_token, decode_token
from backend.app.core.config import settings


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test health endpoint returns 200 and healthy status."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "services" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_readiness_check(client: AsyncClient):
    """Test readiness check verifying database connectivity."""
    response = await client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"


@pytest.mark.asyncio
async def test_password_hashing_and_verification():
    """Test password hashing with bcrypt and verification."""
    password = "SuperSecurePassword123!"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


@pytest.mark.asyncio
async def test_jwt_token_generation_and_decoding():
    """Test creating and decoding JWT access tokens."""
    user_id = "test-user-12345"
    org_id = "test-org-67890"
    role = "OWNER"

    token = create_access_token(subject=user_id, organization_id=org_id, role=role)
    assert isinstance(token, str)

    payload = decode_token(token)
    assert payload["sub"] == user_id
    assert payload["org_id"] == org_id
    assert payload["role"] == role
    assert "exp" in payload


@pytest.mark.asyncio
async def test_user_registration_and_login_flow(client: AsyncClient):
    """Test full user registration and login flow via API v1."""
    # 1. Register a new user
    register_payload = {
        "email": "sarah.connor@acmefurniture.com",
        "password": "Password123!",
        "full_name": "Sarah Connor",
        "organization_name": "Acme Furniture"
    }
    reg_response = await client.post("/api/v1/auth/register", json=register_payload)
    assert reg_response.status_code == 201
    reg_data = reg_response.json()
    assert "access_token" in reg_data
    assert reg_data["email"] == "sarah.connor@acmefurniture.com"
    assert reg_data["organization_id"] is not None

    token = reg_data["access_token"]

    # 2. Get /me with the bearer token
    me_response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == "sarah.connor@acmefurniture.com"
    assert me_data["full_name"] == "Sarah Connor"

    # 3. Login with correct credentials
    login_payload = {
        "email": "sarah.connor@acmefurniture.com",
        "password": "Password123!"
    }
    login_response = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "access_token" in login_data

    # 4. Login with incorrect password fails
    bad_login = await client.post("/api/v1/auth/login", json={
        "email": "sarah.connor@acmefurniture.com",
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401
