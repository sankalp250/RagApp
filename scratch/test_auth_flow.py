import urllib.request
import urllib.error
import json
import time

base = 'http://127.0.0.1:8000/api/v1'

def post(url, data, headers=None):
    if headers is None:
        headers = {}
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json', **headers}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def get(url, headers=None):
    if headers is None:
        headers = {}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def run_tests():
    ts = int(time.time())
    test_email = f"authtest_{ts}@example.com"
    test_pwd = "SecurePassword123!"

    print("1. Testing Signup...")
    s_code, s_res = post(
        f"{base}/auth/register",
        {"email": test_email, "password": test_pwd, "full_name": "Auth Test User", "organization_name": "Test Org"}
    )
    print(f"   Signup Status: {s_code}, user_id: {s_res.get('user_id')}, has_token: {'access_token' in s_res}")
    assert s_code == 201
    token = s_res['access_token']
    org_id = s_res['organization_id']

    print("2. Testing Duplicate Signup...")
    d_code, d_res = post(
        f"{base}/auth/register",
        {"email": test_email, "password": test_pwd, "full_name": "Duplicate User"}
    )
    print(f"   Duplicate Signup Status: {d_code} (Expected 400), detail: {d_res.get('detail')}")
    assert d_code == 400

    print("3. Testing Login with correct credentials...")
    l_code, l_res = post(f"{base}/auth/login", {"email": test_email, "password": test_pwd})
    print(f"   Login Status: {l_code}, has_token: {'access_token' in l_res}")
    assert l_code == 200

    print("4. Testing Login with INVALID credentials...")
    bad_code, bad_res = post(f"{base}/auth/login", {"email": test_email, "password": "wrong_password"})
    print(f"   Invalid Login Status: {bad_code} (Expected 401), detail: {bad_res.get('detail')}")
    assert bad_code == 401

    print("5. Testing /auth/me with valid token...")
    me_code, me_res = get(f"{base}/auth/me", headers={"Authorization": f"Bearer {token}"})
    print(f"   /auth/me Status: {me_code}, email: {me_res.get('email')}")
    assert me_code == 200
    assert me_res.get("email") == test_email

    print("6. Testing /auth/me with INVALID token...")
    inv_code, inv_res = get(f"{base}/auth/me", headers={"Authorization": "Bearer invalid_token_xyz"})
    print(f"   Invalid Token /auth/me Status: {inv_code} (Expected 401), detail: {inv_res.get('detail')}")
    assert inv_code == 401

    print("7. Testing Protected route /api/v1/agents with and without token...")
    unauth_code, unauth_res = get(f"{base}/agents")
    print(f"   Unauthenticated /agents Status: {unauth_code} (Expected 401)")
    assert unauth_code == 401

    auth_code, auth_res = get(
        f"{base}/agents",
        headers={"Authorization": f"Bearer {token}", "X-Organization-ID": org_id}
    )
    print(f"   Authenticated /agents Status: {auth_code} (Expected 200), agents count: {len(auth_res)}")
    assert auth_code == 200

    print("\n[SUCCESS] ALL BACKEND AUTH API TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    run_tests()
