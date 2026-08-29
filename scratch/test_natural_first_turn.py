import asyncio
import time
import json
import httpx

async def run():
    base_url = 'http://127.0.0.1:8000'
    public_key = 'e8826362-9dcb-4177-b830-dd8ebdd09ca5'
    
    async with httpx.AsyncClient(timeout=30) as client:
        # 1. Widget config load (simulating webpage landing)
        t_cfg_0 = time.monotonic()
        await client.get(f'{base_url}/api/v1/widget/{public_key}/config')
        print(f"Widget config fetched in {(time.monotonic()-t_cfg_0)*1000:.1f}ms")
        
        # 2. First question sent by visitor
        t0 = time.monotonic()
        url = f'{base_url}/api/v1/widget/{public_key}/chat'
        body = {
            'message': 'What is your product warranty and replacement policy?',
            'visitor_id': f'vis-first-natural-{int(time.time())}',
            'stream': True
        }
        
        first_token = None
        full_text = ''
        async with client.stream('POST', url, json=body, headers={'Accept': 'text/event-stream'}) as resp:
            buffer = ''
            async for chunk in resp.aiter_bytes():
                buffer += chunk.decode('utf-8', errors='replace')
                while '\n\n' in buffer:
                    event, buffer = buffer.split('\n\n', 1)
                    for line in event.strip().split('\n'):
                        if line.startswith('data: '):
                            try:
                                d = json.loads(line[6:])
                                elapsed = (time.monotonic() - t0) * 1000
                                if d.get('event') == 'meta':
                                    srcs = d.get('sources', [])
                                    print(f'[{elapsed:.0f}ms] META (Sources: {len(srcs)})')
                                elif d.get('event') == 'token':
                                    if first_token is None:
                                        first_token = elapsed
                                        print(f'[{elapsed:.0f}ms] FIRST TOKEN: {repr(d["token"][:40])}')
                                    full_text += d.get('token', '')
                                elif d.get('event') == 'done':
                                    print(f'[{elapsed:.0f}ms] DONE')
                            except Exception:
                                pass
        print(f'\nTotal wall time: {(time.monotonic()-t0)*1000:.0f}ms')
        print(f'Answer:\n{full_text}')

if __name__ == '__main__':
    asyncio.run(run())
