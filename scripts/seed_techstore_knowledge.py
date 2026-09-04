"""
scripts/seed_techstore_knowledge.py — Seed Knowledge Base for TechStore AI (index.html)
========================================================================================
Seeds comprehensive store policies, products, warranties, and support info into
pgvector/SQLite for Agent 'e8826362-9dcb-4177-b830-dd8ebdd09ca5' (Aria).
Generates real Google Gemini vector embeddings for semantic retrieval.
"""
import sys
import os
sys.path.insert(0, os.path.abspath("."))

import asyncio
from datetime import datetime, timezone
from sqlalchemy import select, delete

from backend.app.db.session import AsyncSessionLocal, init_db
from backend.app.db.models.agent import Agent
from backend.app.db.models.document import Document, DocumentChunk
from backend.app.ai.embeddings.service import EmbeddingService
from backend.app.ai.rag_engine import invalidate_agent_chunks_cache
from backend.app.core.logging import logger

TECHSTORE_DOSSIER = [
    {
        "title": "Return, Refund and Exchange Policies",
        "url": "https://techstore.ai/policies/returns",
        "content": (
            "TechStore Return & Refund Policy: We offer a 30-day hassle-free return window for all "
            "eligible hardware and accessories starting from the date of delivery. "
            "To qualify for a full refund, items must be in original condition with all packaging, "
            "cables, and accessories included. Once your return is received and inspected at our warehouse, "
            "refunds are automatically processed to the original payment method within 3 to 5 business days. "
            "Return shipping is completely free for damaged, defective, or incorrect items. "
            "For elective exchanges or remorse returns, customers can generate a prepaid return shipping label "
            "directly in their account portal for a flat $5 deduction."
        )
    },
    {
        "title": "Shipping Rates, Speeds & International Delivery",
        "url": "https://techstore.ai/policies/shipping",
        "content": (
            "TechStore Shipping Rates and Delivery Options: "
            "1. Standard Ground Shipping: FREE on all orders over $50. Arrives in 3 to 5 business days. "
            "Orders under $50 ship for a flat $4.99 rate. "
            "2. Express 2-Day Shipping: $15 flat rate per order, guaranteed delivery in 2 business days. "
            "3. Priority Overnight Delivery: $25 flat rate per order, delivers next business day by 10:30 AM. "
            "4. International Shipping: We currently ship internationally to Canada, the United Kingdom, "
            "and Australia via DHL Express (5 to 8 business days). All customs duties, tariffs, and local VAT "
            "are calculated and collected at checkout so there are no surprise fees upon delivery."
        )
    },
    {
        "title": "Order Modifications and Delivery Address Changes",
        "url": "https://techstore.ai/policies/order-changes",
        "content": (
            "Order Modifications and Address Changes: Customers can modify their delivery address, update contact "
            "details, or cancel items within 60 minutes of placing their order directly from their order confirmation page. "
            "After 60 minutes, the order moves to our automated warehouse fulfillment pipeline and cannot be canceled or modified internally. "
            "Once shipped, customers can use the carrier tracking number to request a package reroute or hold for pickup "
            "directly with UPS or FedEx."
        )
    },
    {
        "title": "Manufacturer Warranty and TechStore Care+ Protection",
        "url": "https://techstore.ai/policies/warranty",
        "content": (
            "TechStore Manufacturer Warranty & Protection Plans: "
            "All new products sold by TechStore include a 2-Year Comprehensive Manufacturer Warranty at no extra charge. "
            "The warranty covers all manufacturer defects, hardware failures, mechanical malfunctions, battery degradation below 80%, "
            "and electrical issues under normal usage. "
            "Wear and tear, water damage (unless rated waterproof), and unauthorized modifications are excluded. "
            "Customers can also upgrade to TechStore Care+ within 60 days of purchase for full accidental drop protection, "
            "liquid spill coverage, and zero-deductible priority device replacement."
        )
    },
    {
        "title": "Customer Support Contact Information and Business Hours",
        "url": "https://techstore.ai/contact",
        "content": (
            "Customer Support Contact Information & Operational Hours: "
            "Our customer intelligence team is available Monday through Friday from 9:00 AM to 6:00 PM EST. "
            "You can contact us via email at support@techstore.ai or call our toll-free hotline at 1-800-TECHSTORE (1-800-832-4786). "
            "Live chat assistance with Aria AI and human escalation is available 24/7 on techstore.ai."
        )
    },
    {
        "title": "NovaPro Spatial ANC Headphones Specs and Features",
        "url": "https://techstore.ai/products/novapro-spatial-headphones",
        "content": (
            "NovaPro Spatial Headphones Specifications & Pricing: "
            "Priced at $299. Features ultra-low latency Active Noise Cancellation (ANC), 48-hour continuous battery life, "
            "custom 40mm titanium acoustic drivers, and spatial dynamic head tracking. "
            "Includes Bluetooth 5.4 multi-point pairing and a braided USB-C lossless audio cable. "
            "Protected by the standard TechStore 2-Year Manufacturer Warranty and eligible for 30-day free returns."
        )
    },
    {
        "title": "ApexBook Pro M3 Max Specs and Pricing",
        "url": "https://techstore.ai/products/apexbook-pro-m3-max",
        "content": (
            "ApexBook Pro M3 Max Specifications & Deals: "
            "Priced at $1,899. Built with a 16-inch Liquid Retina XDR display (1600 nits peak brightness, 120Hz ProMotion), "
            "36GB unified memory, 1TB high-speed PCIe Gen4 SSD, and up to 22 hours of battery efficiency. "
            "Eligible for free express shipping, 0% APR financing, and our 30-day money-back guarantee."
        )
    },
    {
        "title": "Pulse Ultra Smartwatch Titanium Specs and Care+",
        "url": "https://techstore.ai/products/pulse-ultra-smartwatch",
        "content": (
            "Pulse Ultra Smartwatch Specifications & Durability: "
            "Priced at $449. Crafted with an aerospace-grade titanium case and sapphire crystal display. "
            "Features advanced ECG monitoring, dual-frequency optical heart rate tracking, sleep apnea detection, "
            "and water resistance rated to 100 meters (ISO 22810 standard). "
            "Can be paired with TechStore Care+ for $49 to provide comprehensive accidental damage and drop replacement."
        )
    }
]


async def seed_knowledge():
    print("=" * 70)
    print("  SEEDING TECHSTORE KNOWLEDGE BASE (index.html Aria Agent)")
    print("=" * 70)

    await init_db()
    agent_id = "e8826362-9dcb-4177-b830-dd8ebdd09ca5"

    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Agent).where(Agent.id == agent_id))
        agent = res.scalars().first()
        if not agent:
            print(f"[ERROR] Agent {agent_id} not found.")
            return

        print(f"Target Agent: {agent.name} (id={agent.id})")
        org_id = agent.organization_id

        # Update allowed_domains to include wildcard and localhost
        cfg = dict(agent.configuration or {})
        cfg["allowed_domains"] = ["*", "localhost", "127.0.0.1"]
        cfg["auto_crawl_enabled"] = True
        agent.configuration = cfg

        # Purge any old documents/chunks for clean state
        res_old_docs = await db.execute(select(Document).where(Document.agent_id == agent_id))
        old_docs = res_old_docs.scalars().all()
        for doc in old_docs:
            await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == doc.id))
            await db.delete(doc)

        await db.commit()

        # Create master knowledge document
        doc = Document(
            organization_id=org_id,
            agent_id=agent_id,
            filename="TechStore_Official_Knowledge_Transfer.txt",
            storage_path="in-memory/TechStore_Official_Knowledge_Transfer.txt",
            mime_type="text/plain",
            status="READY",
            is_active=True,
            content="\n\n".join(item["content"] for item in TECHSTORE_DOSSIER),
            chunk_count=len(TECHSTORE_DOSSIER)
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)
        print(f"Created Document: {doc.id} ('{doc.filename}')")

        # Generate Gemini embeddings
        provider = EmbeddingService.get_provider()
        texts = [item["content"] for item in TECHSTORE_DOSSIER]
        print(f"Generating embeddings for {len(texts)} chunks via {provider.__class__.__name__}...")
        embeddings = await provider.embed_texts(texts)

        for i, (item, emb) in enumerate(zip(TECHSTORE_DOSSIER, embeddings)):
            chunk = DocumentChunk(
                organization_id=org_id,
                agent_id=agent_id,
                document_id=doc.id,
                chunk_index=i,
                content=item["content"],
                embedding=emb,
                chunk_metadata={
                    "organization_id": org_id,
                    "agent_id": agent_id,
                    "document_id": doc.id,
                    "source_url": item["url"],
                    "title": item["title"],
                    "source_type": "document",
                    "filename": doc.filename,
                    "chunk_index": i,
                    "char_count": len(item["content"])
                }
            )
            db.add(chunk)

        await db.commit()
        print(f"[SUCCESS] Ingested {len(TECHSTORE_DOSSIER)} chunks with 768-dim embeddings!")

        # Invalidate chunk cache
        invalidate_agent_chunks_cache(agent_id)
        print(f"[CACHE] Invalidated in-memory cache for agent {agent_id}.")


if __name__ == "__main__":
    asyncio.run(seed_knowledge())
