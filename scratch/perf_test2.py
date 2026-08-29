import asyncio, httpx, json, time

async def quick_test():
    # Non-streaming test to get server-side reported latency
    t0 = time.monotonic()
    body = {"message": "what products do you sell", "visitor_id": "perf-v3", "stream": False}
    async with httpx.AsyncClient(timeout=120) as c:
        r = await c.post(
            "http://127.0.0.1:8000/api/v1/widget/e8826362-9dcb-4177-b830-dd8ebdd09ca5/chat",
            json=body
        )
        wall_ms = (time.monotonic()-t0)*1000
        print(f"Status: {r.status_code}, Wall time: {wall_ms:.0f}ms")
        if r.status_code == 200:
            data = r.json()
            print(f"Server-reported latency_ms: {data.get('latency_ms')}")
            print(f"Answer: {data.get('answer', '')[:120]}...")

asyncio.run(quick_test())
