import asyncio
import time
import json
import httpx

async def benchmark_uncached_first_question():
    base_url = "http://127.0.0.1:8000"
    public_key = "e8826362-9dcb-4177-b830-dd8ebdd09ca5"
    
    async with httpx.AsyncClient(timeout=30) as client:
        # Step 1: Widget loads config on website visitor landing
        t_cfg_start = time.monotonic()
        cfg_resp = await client.get(f"{base_url}/api/v1/widget/{public_key}/config")
        t_cfg = (time.monotonic() - t_cfg_start) * 1000
        print(f"Widget Config Loaded: {cfg_resp.status_code} in {t_cfg:.1f}ms")
        
        # Step 2: Visitor types & sends completely unique UNCACHED first question
        unique_id = int(time.time())
        visitor_id = f"visitor-unique-{unique_id}"
        question = f"how long does the battery last on a single charge {unique_id}?"
        print(f"\n--- Sending UNCACHED FIRST Question: '{question}' (Visitor: {visitor_id}) ---")
        
        t0 = time.monotonic()
        url = f"{base_url}/api/v1/widget/{public_key}/chat"
        body = {"message": question, "visitor_id": visitor_id, "stream": True}
        
        meta_time = None
        first_token_time = None
        token_count = 0
        
        async with client.stream("POST", url, json=body, headers={"Accept": "text/event-stream"}) as resp:
            print(f"HTTP Status: {resp.status_code} (in {(time.monotonic() - t0)*1000:.1f}ms)")
            buffer = ""
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
                                    meta_time = elapsed
                                    src_count = len(data.get("sources", []))
                                    print(f"  [{elapsed:.0f}ms] >>> META EVENT (Sources: {src_count}, Cached: {data.get('cached', False)})")
                                elif ev == "token":
                                    token_count += 1
                                    if first_token_time is None:
                                        first_token_time = elapsed
                                        print(f"  [{elapsed:.0f}ms] >>> FIRST TOKEN RECEIVED: {repr(data['token'][:40])}")
                                elif ev == "done":
                                    total_wall = (time.monotonic() - t0) * 1000
                                    print(f"  [{elapsed:.0f}ms] >>> STREAM DONE (Tokens: {token_count}, Total Wall: {total_wall:.0f}ms)")
                            except json.JSONDecodeError:
                                pass

        print("\n=== UNCACHED FIRST QUESTION SUMMARY ===")
        print(f"Time to META Event: {meta_time:.0f}ms")
        print(f"Time to First Token (TTFT): {first_token_time:.0f}ms")
        print(f"Total Response Duration: {(time.monotonic() - t0)*1000:.0f}ms")

if __name__ == "__main__":
    asyncio.run(benchmark_uncached_first_question())
