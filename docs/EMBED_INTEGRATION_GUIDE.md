# Universal Embed & Deployment Integration Guide

This guide explains how to integrate the AI Chatbot Widget across **Plain HTML**, **React**, **Next.js**, **Vue**, and **Shopify**.

---

## 1. Quick Start: Plain HTML / Static Websites

Add the script tag before the closing `</body>` tag on any HTML page:

```html
<!-- Place before closing </body> -->
<script
  src="https://your-domain.com/widget.js"
  data-agent-id="YOUR_AGENT_ID"
  data-api-url="https://api.your-domain.com"
  async>
</script>
```

### Supported Attributes:
| Attribute | Description | Default |
|---|---|---|
| `data-agent-id` / `data-public-key` | **Required**. The unique ID or public key of your AI Agent. | `""` |
| `data-api-url` | Base URL of the FastAPI backend. | `http://127.0.0.1:8000` |
| `data-position` | Widget floating location: `bottom-right` or `bottom-left`. | `bottom-right` |
| `data-primary-color` | Brand accent color hex code. | Loaded from Agent Config |
| `data-title` | Header title of the chatbot. | Loaded from Agent Config |
| `data-greeting` | First message displayed to visitors. | Loaded from Agent Config |

---

## 2. React (Vite / Create React App / Single Page App)

In React applications, create a reusable `<ChatWidget />` component:

```tsx
// components/ChatWidget.tsx
import { useEffect } from "react";

interface ChatWidgetProps {
  agentId: string;
  apiUrl?: string;
  position?: "bottom-right" | "bottom-left";
}

export function ChatWidget({
  agentId,
  apiUrl = "https://api.your-domain.com",
  position = "bottom-right"
}: ChatWidgetProps) {
  useEffect(() => {
    // Prevent duplicate injection
    const existingScript = document.getElementById("rag-widget-script");
    if (existingScript) return;

    const script = document.createElement("script");
    script.id = "rag-widget-script";
    script.src = `${apiUrl}/widget.js`;
    script.async = true;
    script.setAttribute("data-agent-id", agentId);
    script.setAttribute("data-api-url", apiUrl);
    script.setAttribute("data-position", position);

    document.body.appendChild(script);

    return () => {
      // Optional cleanup on unmount
      const host = document.getElementById("rag-widget-host");
      if (host) host.remove();
      if (script) script.remove();
    };
  }, [agentId, apiUrl, position]);

  return null; // Widget renders into Shadow DOM
}
```

### Usage in React:
```tsx
// App.tsx
import { ChatWidget } from "./components/ChatWidget";

export default function App() {
  return (
    <div>
      <main>{/* Your Application Content */}</main>
      <ChatWidget agentId="YOUR_AGENT_ID" apiUrl="https://api.your-domain.com" />
    </div>
  );
}
```

---

## 3. Next.js (App Router / Next.js 14+)

In Next.js, use `next/script` in your root `layout.tsx`:

```tsx
// app/layout.tsx
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* AI Chatbot Widget (Loaded Non-blocking After Interactive) */}
        <Script
          id="rag-chatbot-widget"
          src="https://your-domain.com/widget.js"
          strategy="afterInteractive"
          data-agent-id="YOUR_AGENT_ID"
          data-api-url="https://api.your-domain.com"
        />
      </body>
    </html>
  );
}
```

---

## 4. Shopify Theme Integration

To add the AI chatbot to a Shopify store without editing complex theme code:

### Step 1: Open Theme Code Editor
1. In your Shopify Admin, go to **Online Store > Themes**.
2. Click the **"..."** button on your active theme and select **"Edit code"**.
3. Under **Layout**, click **`theme.liquid`**.

### Step 2: Paste the Widget Snippet
Scroll to the bottom of `theme.liquid` and paste the snippet directly before the closing `</body>` tag:

```liquid
<!-- Liquid AI Chatbot Widget -->
<script
  src="https://your-domain.com/widget.js"
  data-agent-id="YOUR_AGENT_ID"
  data-api-url="https://api.your-domain.com"
  async>
</script>
<!-- End Liquid AI Chatbot Widget -->
```
4. Click **Save**. The widget will automatically appear on all storefront product and collection pages with full Shadow DOM style isolation.

---

## 5. JavaScript API Reference (`window.RagWidget`)

You can control the widget programmatically from anywhere in your host website's JavaScript:

```javascript
// Open the chat window
window.RagWidget.open();

// Close the chat window
window.RagWidget.close();

// Toggle chat window open/closed
window.RagWidget.toggle();

// Open chat and automatically send a custom question
window.RagWidget.sendMessage("How do I return my recent order?");

// Re-initialize with dynamic custom settings
window.RagWidget.init({
  agentId: "custom_agent_id",
  title: "VIP Concierge",
  primaryColor: "#4f46e5"
});
```

---

## 6. Style Isolation & Security Architecture

1. **Shadow DOM**: The entire widget renders inside an open Shadow Root (`#rag-widget-host`). Host page CSS rules (e.g. Tailwind typography, Bootstrap resets) **cannot** distort widget buttons, bubbles, or inputs.
2. **Zero Secret Leakage**: The widget only communicates with public endpoints (`GET /api/v1/agents/{agent_id}/public-config` and `POST /api/v1/widget/{agent_id}/chat`). Private LLM keys and system prompts remain strictly on the backend.
3. **Automatic Crawl Bootstrap**: When embedded on a new domain, the widget automatically requests the backend to verify and crawl the domain if authorized.
