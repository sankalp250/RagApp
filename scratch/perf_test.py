import asyncio, time, json, httpx

async def test(msg, vid, label):
    t0 = time.monotonic()
    url = "http://127.0.0.1:8000/api/v1/widget/e8826362-9dcb-4177-b830-dd8ebdd09ca5/chat"
    body = {"message": msg, "visitor_id": vid, "stream": True}
    
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", url, json=body, headers={"Accept": "text/event-stream"}) as resp:
            first_token = None
            buffer = ""
            token_count = 0
            async for chunk in resp.aiter_bytes():
                buffer += chunk.decode("utf-8", errors="replace")
                while "\n\n" in buffer:
                    event, buffer = buffer.split("\n\n", 1)
                    for line in event.strip().split("\n"):
                        if line.startswith("data: "):
                            try:
                                data = json.loads(line[6:])
                                elapsed = (time.monotonic() - t0) * 1000
                                ev = data.get("event", "?")
                                if ev == "meta":
                                    src = len(data.get("sources", []))
                                    cached = data.get("cached", False)
                                    print(f"  [{elapsed:.0f}ms] META (sources={src}, cached={cached})")
                                elif ev == "token":
                                    token_count += 1
                                    if first_token is None:
                                        first_token = elapsed
                                        print(f"  [{elapsed:.0f}ms] FIRST TOKEN")
                                elif ev == "done":
                                    print(f"  [{elapsed:.0f}ms] DONE (tokens={token_count})")
                            except json.JSONDecodeError:
                                pass
    wall = (time.monotonic() - t0) * 1000
    print(f"  Total: {wall:.0f}ms\n")

async def main():
    # Test 1: Cold start (warms all caches)
    print("=== TEST 1: COLD START (warms all caches) ===")
    await test("what headphones do you sell", "perf-gemini-1", "cold")
    
    # Test 2: Warm, same question (should be fastest - L1 chat cache hit)
    print("=== TEST 2: WARM, same question (L1 chat cache) ===")
    await test("what headphones do you sell", "perf-gemini-1", "warm-same")
    
    # Test 3: Warm, different question (all L1 hot except embedding)
    print("=== TEST 3: WARM, different question ===")
    await test("do you offer warranty on products", "perf-gemini-1", "warm-diff")
    
    # Test 4: Warm, another new question
    print("=== TEST 4: WARM, another new question ===")
    await test("what is the battery life of your headphones", "perf-gemini-1", "warm-diff2")

asyncio.run(main())
