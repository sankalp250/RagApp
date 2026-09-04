/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  Universal Production AI Chatbot Widget (Shadow DOM Encapsulated)        ║
 * ║  Multi-Platform: HTML, React, Next.js, Vue, Shopify                      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
(function () {
  'use strict';

  // Prevent duplicate initialization
  if (window.__RAG_WIDGET_INITIALIZED__) return;
  window.__RAG_WIDGET_INITIALIZED__ = true;

  // 1. Resolve Script Attributes & Configuration
  const currentScript =
    document.currentScript ||
    document.querySelector('script[data-agent-id], script[data-public-key], script[src*="widget.js"]');

  const rawAgentId = currentScript?.getAttribute('data-agent-id') || currentScript?.getAttribute('data-public-key') || '';
  const rawApiUrl = (currentScript?.getAttribute('data-api-url') || 'http://127.0.0.1:8000').replace(/\/+$/, '');

  const state = {
    agentId: rawAgentId,
    publicKey: rawAgentId,
    apiUrl: rawApiUrl,
    title: currentScript?.getAttribute('data-title') || 'AI Assistant',
    greeting: currentScript?.getAttribute('data-greeting') || 'Hello! 👋 How can I help you today?',
    primaryColor: currentScript?.getAttribute('data-primary-color') || '#6366f1',
    position: currentScript?.getAttribute('data-position') || 'bottom-right',
    placeholder: currentScript?.getAttribute('data-placeholder') || 'Ask a question...',
    suggestedQuestions: [],
    isOpen: false,
    isStreaming: false,
    messages: [],
    visitorId: '',
    conversationId: null,
  };

  // 2. Multi-Turn Session Management
  const STORAGE_KEY_VISITOR = 'rag_widget_visitor_id';
  const STORAGE_KEY_CONV = `rag_widget_conv_${state.agentId}`;

  try {
    let storedVisitor = localStorage.getItem(STORAGE_KEY_VISITOR);
    if (!storedVisitor) {
      storedVisitor = 'vis_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEY_VISITOR, storedVisitor);
    }
    state.visitorId = storedVisitor;
    state.conversationId = localStorage.getItem(STORAGE_KEY_CONV) || null;
  } catch (e) {
    state.visitorId = 'vis_fallback_' + Date.now();
  }

  // 3. Create Host Element and Attach Open Shadow DOM
  const host = document.createElement('div');
  host.id = 'rag-widget-host';
  host.style.position = 'fixed';
  host.style.zIndex = '2147483647'; // Max z-index
  host.style.bottom = '0';
  host.style.right = state.position.includes('left') ? 'auto' : '0';
  host.style.left = state.position.includes('left') ? '0' : 'auto';
  host.style.pointerEvents = 'none';

  const shadow = host.attachShadow({ mode: 'open' });

  // 4. Encapsulated Shadow DOM Styles
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    :host {
      --primary: ${state.primaryColor};
      --primary-gradient: linear-gradient(135deg, ${state.primaryColor} 0%, #8b5cf6 50%, #06b6d4 100%);
      --surface: #ffffff;
      --surface-subtle: #f8fafc;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --shadow-lg: 0 20px 40px -15px rgba(0, 0, 0, 0.2), 0 0 1px 1px rgba(0,0,0,0.05);
      --radius: 20px;
    }

    .widget-container {
      position: fixed;
      bottom: 24px;
      ${state.position.includes('left') ? 'left: 24px;' : 'right: 24px;'}
      display: flex;
      flex-direction: column;
      align-items: ${state.position.includes('left') ? 'flex-start' : 'flex-end'};
      gap: 12px;
      pointer-events: auto;
    }

    /* Floating Launcher Button */
    .launcher-btn {
      position: relative;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--primary-gradient);
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.6);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      outline: none;
    }

    .launcher-btn:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 14px 32px rgba(99, 102, 241, 0.55);
    }

    .launcher-btn:active {
      transform: scale(0.95);
    }

    .launcher-icon, .close-icon {
      width: 28px;
      height: 28px;
      transition: all 0.25s ease;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .close-icon {
      display: none;
    }

    .is-open .launcher-icon {
      display: none;
    }

    .is-open .close-icon {
      display: block;
    }

    /* Notification Dot */
    .unread-badge {
      position: absolute;
      top: 0;
      right: 0;
      width: 14px;
      height: 14px;
      background: #10b981;
      border: 2px solid #ffffff;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
    }

    /* Chat Drawer / Card */
    .chat-drawer {
      display: none;
      position: relative;
      width: 400px;
      max-width: calc(100vw - 32px);
      height: 600px;
      max-height: calc(100vh - 110px);
      background: var(--surface);
      border-radius: var(--radius);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-lg);
      flex-direction: column;
      overflow: hidden;
      transform-origin: bottom right;
      animation: slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .chat-drawer.open {
      display: flex;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Chat Header */
    .chat-header {
      padding: 16px 20px;
      background: var(--primary-gradient);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .title-group h3 {
      font-size: 15px;
      font-weight: 700;
      line-height: 1.2;
    }

    .status-tag {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      opacity: 0.9;
      margin-top: 2px;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #34d399;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .icon-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.85);
      cursor: pointer;
      padding: 6px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }

    /* Messages Container */
    .messages-pane {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: var(--surface-subtle);
      scroll-behavior: smooth;
    }

    .message {
      display: flex;
      flex-direction: column;
      max-width: 86%;
      gap: 4px;
    }

    .message.user {
      align-self: flex-end;
    }

    .message.assistant {
      align-self: flex-start;
    }

    .bubble {
      padding: 12px 16px;
      font-size: 13.5px;
      line-height: 1.5;
      border-radius: 16px;
      word-break: break-word;
    }

    .message.user .bubble {
      background: var(--primary-gradient);
      color: #ffffff;
      border-bottom-right-radius: 4px;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
    }

    .message.assistant .bubble {
      background: #ffffff;
      color: var(--text-main);
      border: 1px solid var(--border);
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    /* Source Citations */
    .citations-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }

    .citation-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 11px;
      color: #334155;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s;
    }

    .citation-badge:hover {
      background: #e2e8f0;
      color: #0f172a;
      border-color: #94a3b8;
    }

    /* Suggested Questions */
    .suggestions-pane {
      padding: 8px 16px 4px 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      background: var(--surface-subtle);
    }

    .suggestion-chip {
      padding: 6px 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      font-size: 12px;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;
    }

    .suggestion-chip:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #0f172a;
      transform: translateY(-1px);
    }

    /* Input Footer */
    .input-footer {
      padding: 12px 16px;
      background: #ffffff;
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .chat-input {
      flex: 1;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 13.5px;
      outline: none;
      transition: border-color 0.2s;
      background: #f8fafc;
      color: var(--text-main);
    }

    .chat-input:focus {
      border-color: #6366f1;
      background: #ffffff;
    }

    .send-btn {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: var(--primary-gradient);
      border: none;
      color: #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, opacity 0.2s;
    }

    .send-btn:hover:not(:disabled) {
      transform: scale(1.05);
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Typing Animation */
    .typing-dots {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 8px;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #94a3b8;
      animation: blink 1.4s infinite both;
    }

    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes blink {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    /* Mobile Responsiveness */
    @media (max-width: 640px) {
      .widget-container {
        bottom: 16px;
        right: 16px;
        left: 16px;
        align-items: flex-end;
      }
      .chat-drawer {
        width: 100%;
        height: calc(100vh - 90px);
        max-height: none;
        border-radius: 16px;
      }
    }
  `;

  // 5. Build Widget DOM Tree
  const container = document.createElement('div');
  container.className = 'widget-container';

  container.innerHTML = `
    <div class="chat-drawer" id="chatDrawer">
      <div class="chat-header">
        <div class="header-info">
          <div class="avatar">✨</div>
          <div class="title-group">
            <h3 id="botTitle">${state.title}</h3>
            <div class="status-tag">
              <span class="status-dot"></span>
              <span>AI Support • Online</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="icon-btn" id="clearBtn" title="Restart Conversation">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          </button>
          <button class="icon-btn" id="closeDrawerBtn" title="Close">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div class="messages-pane" id="messagesPane">
        <div class="message assistant">
          <div class="bubble" id="greetingBubble">${state.greeting}</div>
        </div>
      </div>

      <div class="suggestions-pane" id="suggestionsPane"></div>

      <div class="input-footer">
        <input type="text" class="chat-input" id="chatInput" placeholder="${state.placeholder}" autocomplete="off" />
        <button class="send-btn" id="sendBtn" title="Send Message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>

    <button class="launcher-btn" id="launcherBtn" aria-label="Open AI Chat">
      <div class="unread-badge" id="unreadBadge"></div>
      <svg class="launcher-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <svg class="close-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;

  shadow.appendChild(style);
  shadow.appendChild(container);

  // 6. Append to document body when ready
  function mount() {
    if (!document.body) {
      window.addEventListener('DOMContentLoaded', mount);
      return;
    }
    document.body.appendChild(host);
  }
  mount();

  // 7. Elements & State Binding
  const launcherBtn = shadow.getElementById('launcherBtn');
  const chatDrawer = shadow.getElementById('chatDrawer');
  const closeDrawerBtn = shadow.getElementById('closeDrawerBtn');
  const clearBtn = shadow.getElementById('clearBtn');
  const messagesPane = shadow.getElementById('messagesPane');
  const chatInput = shadow.getElementById('chatInput');
  const sendBtn = shadow.getElementById('sendBtn');
  const suggestionsPane = shadow.getElementById('suggestionsPane');
  const unreadBadge = shadow.getElementById('unreadBadge');
  const botTitle = shadow.getElementById('botTitle');
  const greetingBubble = shadow.getElementById('greetingBubble');

  function toggleWidget(force) {
    state.isOpen = force !== undefined ? force : !state.isOpen;
    if (state.isOpen) {
      chatDrawer.classList.add('open');
      launcherBtn.classList.add('is-open');
      if (unreadBadge) unreadBadge.style.display = 'none';
      setTimeout(() => chatInput.focus(), 150);
    } else {
      chatDrawer.classList.remove('open');
      launcherBtn.classList.remove('is-open');
    }
  }

  launcherBtn.addEventListener('click', () => toggleWidget());
  closeDrawerBtn.addEventListener('click', () => toggleWidget(false));

  clearBtn.addEventListener('click', () => {
    state.conversationId = null;
    try { localStorage.removeItem(STORAGE_KEY_CONV); } catch (e) {}
    messagesPane.innerHTML = `
      <div class="message assistant">
        <div class="bubble">${state.greeting}</div>
      </div>
    `;
    renderSuggestions();
  });

  // 8. Fetch Public Agent Configuration & Bootstrap Crawl
  async function loadPublicConfig() {
    if (!state.agentId) return;

    try {
      // Step A: Load public configuration
      const configRes = await fetch(`${state.apiUrl}/api/v1/agents/${state.agentId}/public-config`);
      if (configRes.ok) {
        const data = await configRes.json();
        state.title = data.bot_title || data.name || state.title;
        state.greeting = data.greeting_message || state.greeting;
        state.primaryColor = data.primary_color || state.primaryColor;
        state.placeholder = data.placeholder_text || state.placeholder;
        state.suggestedQuestions = data.suggested_questions || [];

        botTitle.textContent = state.title;
        greetingBubble.textContent = state.greeting;
        chatInput.placeholder = state.placeholder;
        renderSuggestions();
      }

      // Step B: Automatic initial crawl trigger
      fetch(`${state.apiUrl}/api/v1/widget/bootstrap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: state.agentId,
          public_key: state.publicKey,
          current_site_origin: window.location.origin
        })
      }).catch(() => {});
    } catch (e) {
      console.warn('[RAG Widget] Config loaded with offline defaults:', e);
      renderSuggestions();
    }
  }

  function renderSuggestions() {
    const list = state.suggestedQuestions.length ? state.suggestedQuestions : [
      'What is your return policy?',
      'How do I contact support?',
      'Tell me about your services'
    ];
    suggestionsPane.innerHTML = '';
    list.forEach(q => {
      const chip = document.createElement('button');
      chip.className = 'suggestion-chip';
      chip.textContent = q;
      chip.addEventListener('click', () => {
        chatInput.value = q;
        sendMessage();
      });
      suggestionsPane.appendChild(chip);
    });
  }

  // 9. Markdown Formatter & Source Badge Generator
  function formatMessageText(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.06);padding:2px 4px;border-radius:4px;font-size:12px;">$1</code>')
      .replace(/\n/g, '<br/>');
  }

  function appendMessage(role, text, sources = []) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = formatMessageText(text);
    msgDiv.appendChild(bubble);

    if (sources && sources.length > 0) {
      const citationsDiv = document.createElement('div');
      citationsDiv.className = 'citations-container';
      sources.forEach((src, idx) => {
        const label = src.title || `Source ${idx + 1}`;
        const url = src.source_url || '#';
        const badge = document.createElement('a');
        badge.className = 'citation-badge';
        badge.href = url;
        badge.target = '_blank';
        badge.rel = 'noopener noreferrer';
        badge.innerHTML = `📄 <span>${label}</span>`;
        citationsDiv.appendChild(badge);
      });
      msgDiv.appendChild(citationsDiv);
    }

    messagesPane.appendChild(msgDiv);
    messagesPane.scrollTop = messagesPane.scrollHeight;
    return bubble;
  }

  // 10. Send Message with SSE Streaming Support
  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || state.isStreaming) return;

    chatInput.value = '';
    suggestionsPane.style.display = 'none';
    appendMessage('user', text);

    state.isStreaming = true;
    sendBtn.disabled = true;

    // Append assistant typing container
    const assistantBubble = appendMessage('assistant', '');
    assistantBubble.innerHTML = `
      <div class="typing-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    `;

    try {
      const chatUrl = `${state.apiUrl}/api/v1/widget/${state.agentId}/chat`;
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          visitor_id: state.visitorId,
          conversation_id: state.conversationId,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Check if response is Server-Sent Events stream
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';
        let accumulatedSources = [];
        assistantBubble.innerHTML = '';

        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace(/^data:\s*/, '').trim();
              if (!dataStr) continue;
              try {
                const event = JSON.parse(dataStr);
                if (event.event === 'token' && event.token) {
                  accumulatedText += event.token;
                  assistantBubble.innerHTML = formatMessageText(accumulatedText);
                  messagesPane.scrollTop = messagesPane.scrollHeight;
                } else if (event.event === 'done') {
                  if (event.conversation_id) {
                    state.conversationId = event.conversation_id;
                    try { localStorage.setItem(STORAGE_KEY_CONV, event.conversation_id); } catch(e) {}
                  }
                  if (event.sources) {
                    accumulatedSources = event.sources;
                  }
                }
              } catch (parseErr) {}
            }
          }
        }

        if (accumulatedSources.length > 0) {
          const citationsDiv = document.createElement('div');
          citationsDiv.className = 'citations-container';
          accumulatedSources.forEach((src, idx) => {
            const label = src.title || `Source ${idx + 1}`;
            const url = src.source_url || '#';
            const badge = document.createElement('a');
            badge.className = 'citation-badge';
            badge.href = url;
            badge.target = '_blank';
            badge.rel = 'noopener noreferrer';
            badge.innerHTML = `📄 <span>${label}</span>`;
            citationsDiv.appendChild(badge);
          });
          assistantBubble.parentElement.appendChild(citationsDiv);
        }
      } else {
        // Non-streaming fallback
        const result = await response.json();
        assistantBubble.innerHTML = formatMessageText(result.answer);
        if (result.conversation_id) {
          state.conversationId = result.conversation_id;
          try { localStorage.setItem(STORAGE_KEY_CONV, result.conversation_id); } catch(e) {}
        }
        if (result.sources && result.sources.length > 0) {
          const citationsDiv = document.createElement('div');
          citationsDiv.className = 'citations-container';
          result.sources.forEach((src, idx) => {
            const label = src.title || `Source ${idx + 1}`;
            const url = src.source_url || '#';
            const badge = document.createElement('a');
            badge.className = 'citation-badge';
            badge.href = url;
            badge.target = '_blank';
            badge.rel = 'noopener noreferrer';
            badge.innerHTML = `📄 <span>${label}</span>`;
            citationsDiv.appendChild(badge);
          });
          assistantBubble.parentElement.appendChild(citationsDiv);
        }
      }
    } catch (err) {
      console.error('[RAG Widget] Chat request failed:', err);
      assistantBubble.innerHTML = `<span style="color:#ef4444;">Sorry, I encountered an error. Please try again.</span>`;
    } finally {
      state.isStreaming = false;
      sendBtn.disabled = false;
      messagesPane.scrollTop = messagesPane.scrollHeight;
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // 11. Global JavaScript API for Host Applications
  window.RagWidget = {
    open: () => toggleWidget(true),
    close: () => toggleWidget(false),
    toggle: () => toggleWidget(),
    sendMessage: (text) => {
      toggleWidget(true);
      chatInput.value = text;
      sendMessage();
    },
    init: (customConfig) => {
      Object.assign(state, customConfig);
      loadPublicConfig();
    }
  };

  // Trigger public config fetch
  loadPublicConfig();
})();
