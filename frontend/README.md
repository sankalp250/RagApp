# 💻 AI Knowledge Intelligence Platform — Frontend Dashboard

> Modern, high-performance enterprise admin dashboard and analytics portal built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

---

## 🚀 Key Dashboard Features

1. **Agent Control Center:** Create and customize AI support assistants, configure models, system prompts, branding colors, and suggested conversation starter chips.
2. **Knowledge Base Ingestion:** Drag-and-drop document upload (PDF, TXT, DOCX) with live vectorization progress bars and chunk audit logs.
3. **Autonomous Website Scraper:** Enter any target website URL to auto-scrape, parse, and vectorize pages directly into agent memory.
4. **Vector Search Sandbox:** Test retrieval relevance in real-time, inspect similarity scores, and review extracted context snippets before going live.
5. **Knowledge Gap Intelligence:** Automatically reviews customer conversation failures, clusters missing topics, and offers 1-click publishing of Gemini-synthesized documentation.
6. **Universal Widget Embed Generator:** Instant copy-paste code snippets for integrating the live chatbot onto any platform.

---

## 🌐 Universal Widget Integration (Works on ANY Web Application)

The chatbot widget (`widget.js`) uses **Shadow DOM Web Components**. It is 100% style-isolated and will **never conflict** with your website's CSS, Tailwind, Bootstrap, or JavaScript framework.

### 1. Plain HTML / Vanilla JavaScript
Paste this code right before the closing `</body>` tag on any HTML page:
```html
<script 
  src="https://api.yourdomain.com/widget.js" 
  data-agent-id="YOUR_AGENT_ID" 
  data-api-url="https://api.yourdomain.com" 
  async>
</script>
```

---

### 2. Next.js (App Router or Pages Router)
In your root layout (`app/layout.tsx` or `pages/_app.tsx`):
```tsx
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://api.yourdomain.com/widget.js"
          data-agent-id="YOUR_AGENT_ID"
          data-api-url="https://api.yourdomain.com"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

---

### 3. React.js (Vite, CRA, or Remix)
In your `App.jsx` or root component:
```jsx
import { useEffect } from "react";

function App() {
  useEffect(() => {
    // Avoid duplicate script injection
    if (document.getElementById("rag-widget-script")) return;

    const script = document.createElement("script");
    script.id = "rag-widget-script";
    script.src = "https://api.yourdomain.com/widget.js";
    script.setAttribute("data-agent-id", "YOUR_AGENT_ID");
    script.setAttribute("data-api-url", "https://api.yourdomain.com");
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Optional cleanup on unmount
      const existing = document.getElementById("rag-widget-script");
      if (existing) existing.remove();
    };
  }, []);

  return <YourMainApp />;
}

export default App;
```

---

### 4. Shopify / WordPress / Webflow / Squarespace
* **Shopify:** Go to `Online Store -> Themes -> Edit code -> theme.liquid`, and paste the `<script>` tag directly before `</body>`.
* **WordPress:** Go to `Appearance -> Theme File Editor -> footer.php`, or use the free *WPCode / Insert Headers and Footers* plugin.
* **Webflow:** Go to `Project Settings -> Custom Code -> Footer Code`, paste the snippet, and publish.

---

### 5. JavaScript Global Control API
The widget exposes a global `window.RagWidget` API for programmatic host interaction:
```javascript
// Open or close the drawer
window.RagWidget.open();
window.RagWidget.close();
window.RagWidget.toggle();

// Send a question programmatically (e.g. from an FAQ button)
window.RagWidget.sendMessage("What is your refund policy?");
```

---

## 📂 Frontend Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── dashboard/           # Authenticated Admin Dashboard
│   │   │   ├── knowledge-base/  # Document upload, web crawl & vector search
│   │   │   ├── intelligence/    # Knowledge gap intelligence & auto-synthesis
│   │   │   ├── analytics/       # Latency, token usage & quality graphs
│   │   │   └── page.tsx         # Agent overview & health metrics
│   │   ├── login/               # Authentication
│   │   ├── layout.tsx           # Global layout & fonts
│   │   └── page.tsx             # Public landing page & demo
│   ├── components/              # Shared UI components & navigation
│   └── lib/                     # API client & authentication state
├── public/                      # Static assets & widget fallback
├── Dockerfile                   # Multi-stage lightweight production container
├── .dockerignore
└── next.config.ts               # Next.js build configuration (output: standalone)
```

---

## ⚙️ Environment Variables (`.env.local`)

Create `.env.local` inside the `frontend/` directory:
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000
```
*(In production, set this to your deployed backend URL, e.g. `https://api.yourdomain.com`)*

---

## 🚀 Running Locally

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

## 🐳 Building & Running with Docker

```bash
# Build standalone image
docker build -t rag-frontend -f frontend/Dockerfile ./frontend

# Run container on port 3000
docker run -d -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com rag-frontend
```
The Docker image uses Next.js **standalone output**, resulting in an ultra-lean image ($\approx 120\text{MB}$ vs. $1\text{GB}+$ standard node images).
