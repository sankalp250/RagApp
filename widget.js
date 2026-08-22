/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  Liquid Glass AI Chatbot Widget                                         ║
 * ║  Production-grade embeddable chat widget with RAG knowledge intelligence ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
(function () {
  'use strict';

  // Read configuration from script tag attributes
  const currentScript =
    document.currentScript ||
    document.querySelector('script[data-public-key], script[data-agent-id], script[src*="widget.js"]');

  const config = {
    publicKey: currentScript?.getAttribute('data-public-key') || 'e8826362-9dcb-4177-b830-dd8ebdd09ca5',
    agentId: currentScript?.getAttribute('data-agent-id') || '',
    apiUrl: (currentScript?.getAttribute('data-api-url') || 'http://127.0.0.1:8000').replace(/\/+$/, ''),
    title: currentScript?.getAttribute('data-title') || 'Aria AI Assistant',
    greeting: currentScript?.getAttribute('data-greeting') || 'Hi there! 👋 How can I help you today?',
    primaryColor: currentScript?.getAttribute('data-primary-color') || '#6366f1',
    position: currentScript?.getAttribute('data-position') || 'bottom-right',
    theme: currentScript?.getAttribute('data-theme') || 'liquid-glass',
  };

  // Unique visitor ID for multi-turn session continuity
  const STORAGE_KEY_VISITOR = 'rag_chat_visitor_id';
  const STORAGE_KEY_CONV = `rag_chat_conv_${config.publicKey}`;
  let visitorId = localStorage.getItem(STORAGE_KEY_VISITOR);
  if (!visitorId) {
    visitorId = 'vis_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY_VISITOR, visitorId);
  }

  let conversationId = localStorage.getItem(STORAGE_KEY_CONV) || null;
  let isOpen = false;
  let isTyping = false;

  // Preset suggested questions
  const defaultSuggestions = [
    'What is your return policy?',
    'How much is express shipping?',
    'Can I change my delivery address?',
    'Do you ship internationally?'
  ];

  // Inject Styles
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

    #rag-liquid-widget-root {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
      pointer-events: none;
    }

    #rag-liquid-widget-root * {
      box-sizing: border-box;
      pointer-events: auto;
    }

    /* Floating Launcher Button */
    .rag-launcher-btn {
      position: relative;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 12px 32px rgba(99, 102, 241, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.6);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      outline: none;
    }

    .rag-launcher-btn:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 16px 40px rgba(99, 102, 241, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.8);
    }

    .rag-launcher-btn:active {
      transform: scale(0.95);
    }

    .rag-launcher-pulse {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: inherit;
      opacity: 0.35;
      animation: rag-pulse-ring 2.8s cubic-bezier(0.24, 0, 0.38, 1) infinite;
      z-index: -1;
    }

    @keyframes rag-pulse-ring {
      0% { transform: scale(0.95); opacity: 0.5; }
      50% { transform: scale(1.35); opacity: 0; }
      100% { transform: scale(0.95); opacity: 0; }
    }

    .rag-launcher-tooltip {
      position: absolute;
      right: 70px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #ffffff;
      padding: 7px 14px;
      border-radius: 14px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      transition: all 0.25s ease;
      opacity: 1;
      transform: translateY(0);
    }

    /* Liquid Glass Chat Panel */
    .rag-chat-panel {
      width: 380px;
      height: 580px;
      max-height: calc(100vh - 110px);
      border-radius: 24px;
      background: rgba(18, 20, 38, 0.72);
      backdrop-filter: blur(28px) saturate(190%) contrast(105%);
      -webkit-backdrop-filter: blur(28px) saturate(190%) contrast(105%);
      border: 1px solid rgba(255, 255, 255, 0.22);
      box-shadow: 
        0 24px 70px rgba(0, 0, 0, 0.5),
        inset 0 1px 1px 0 rgba(255, 255, 255, 0.4),
        0 0 30px rgba(99, 102, 241, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      transform-origin: bottom right;
      opacity: 0;
      transform: scale(0.9) translateY(20px);
      pointer-events: none;
      visibility: hidden;
    }

    .rag-chat-panel.rag-open {
      opacity: 1;
      transform: scale(1) translateY(0);
      pointer-events: auto;
      visibility: visible;
    }

    /* Header */
    .rag-chat-header {
      padding: 16px 18px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.9) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #ffffff;
      flex-shrink: 0;
    }

    .rag-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .rag-header-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.25);
      border: 1.5px solid rgba(255, 255, 255, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .rag-header-info h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .rag-header-status {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      opacity: 0.85;
      margin-top: 2px;
    }

    .rag-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: rag-blink 2s infinite;
    }

    @keyframes rag-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .rag-close-btn {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      width: 30px;
      height: 30px;
      border-radius: 10px;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .rag-close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    /* Messages Scroll Area */
    .rag-chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }

    .rag-chat-messages::-webkit-scrollbar {
      width: 4px;
    }

    .rag-chat-messages::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }

    /* Message Bubbles */
    .rag-msg {
      display: flex;
      flex-direction: column;
      max-width: 84%;
      animation: rag-fade-in 0.3s ease;
    }

    @keyframes rag-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .rag-msg.rag-bot {
      align-self: flex-start;
    }

    .rag-msg.rag-user {
      align-self: flex-end;
    }

    .rag-bubble {
      padding: 12px 15px;
      border-radius: 18px;
      font-size: 13px;
      line-height: 1.5;
      word-break: break-word;
    }

    .rag-msg.rag-bot .rag-bubble {
      background: rgba(255, 255, 255, 0.12);
      color: #f1f5f9;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-bottom-left-radius: 4px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .rag-msg.rag-user .rag-bubble {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #ffffff;
      border-bottom-right-radius: 4px;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
    }

    .rag-msg-time {
      font-size: 10px;
      opacity: 0.45;
      margin-top: 4px;
      padding: 0 4px;
    }

    .rag-msg.rag-user .rag-msg-time {
      text-align: right;
      color: #cbd5e1;
    }

    .rag-msg.rag-bot .rag-msg-time {
      color: #94a3b8;
    }

    /* Source Citation Badges */
    .rag-source-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 6px;
      padding: 3px 8px;
      border-radius: 8px;
      background: rgba(99, 102, 241, 0.25);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
      font-size: 11px;
      font-weight: 500;
    }

    /* Suggestions / Quick Prompts */
    .rag-suggestions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 8px;
    }

    .rag-suggestion-btn {
      text-align: left;
      padding: 9px 13px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #e2e8f0;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .rag-suggestion-btn:hover {
      background: rgba(99, 102, 241, 0.25);
      border-color: rgba(99, 102, 241, 0.5);
      color: #ffffff;
      transform: translateX(3px);
    }

    /* Typing Dots */
    .rag-typing-bubble {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 12px 16px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.15);
      width: fit-content;
    }

    .rag-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #a5b4fc;
      animation: rag-dot-bounce 1.4s infinite ease-in-out both;
    }

    .rag-dot:nth-child(1) { animation-delay: -0.32s; }
    .rag-dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes rag-dot-bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1.1); opacity: 1; }
    }

    /* Input Footer */
    .rag-chat-footer {
      padding: 12px 14px;
      background: rgba(10, 12, 26, 0.4);
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .rag-input-box {
      flex: 1;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 14px;
      padding: 10px 14px;
      color: #ffffff;
      font-size: 13px;
      font-family: inherit;
      outline: none;
      transition: all 0.2s ease;
    }

    .rag-input-box::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    .rag-input-box:focus {
      background: rgba(255, 255, 255, 0.12);
      border-color: #818cf8;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
    }

    .rag-send-btn {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
    }

    .rag-send-btn:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.5);
    }

    .rag-send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    @media (max-width: 480px) {
      .rag-chat-panel {
        width: calc(100vw - 32px);
        right: 16px;
        bottom: 84px;
        height: calc(100vh - 120px);
      }
      #rag-liquid-widget-root {
        right: 16px;
        bottom: 16px;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // Render Widget DOM
  const rootEl = document.createElement('div');
  rootEl.id = 'rag-liquid-widget-root';
  rootEl.innerHTML = `
    <div class="rag-chat-panel" id="ragChatPanel">
      <div class="rag-chat-header">
        <div class="rag-header-left">
          <div class="rag-header-avatar">✦</div>
          <div class="rag-header-info">
            <h4 id="ragBotTitle">${config.title}</h4>
            <div class="rag-header-status">
              <span class="rag-status-dot"></span>
              <span>Grounded on Knowledge Base</span>
            </div>
          </div>
        </div>
        <button class="rag-close-btn" id="ragCloseBtn" title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="rag-chat-messages" id="ragMessages">
        <div class="rag-msg rag-bot">
          <div class="rag-bubble">${config.greeting}</div>
          <span class="rag-msg-time">Just now</span>
        </div>

        <div class="rag-suggestions" id="ragSuggestions">
          ${defaultSuggestions.map(s => `
            <button class="rag-suggestion-btn" onclick="window.__ragSendSuggestion('${s.replace(/'/g, "\\'")}')">
              <span>${s}</span>
              <span style="opacity:0.5;">→</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="rag-chat-footer">
        <input type="text" class="rag-input-box" id="ragInput" placeholder="Ask about policies, shipping, returns..." autocomplete="off" />
        <button class="rag-send-btn" id="ragSendBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>

    <div style="position:relative; display:flex; align-items:center;">
      <div class="rag-launcher-tooltip" id="ragTooltip">Ask Aria ✨</div>
      <button class="rag-launcher-btn" id="ragLauncherBtn" aria-label="Open Chat">
        <div class="rag-launcher-pulse"></div>
        <svg id="ragIconOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      </button>
    </div>
  `;
  document.body.appendChild(rootEl);

  // DOM Elements
  const panel = document.getElementById('ragChatPanel');
  const launcherBtn = document.getElementById('ragLauncherBtn');
  const closeBtn = document.getElementById('ragCloseBtn');
  const tooltip = document.getElementById('ragTooltip');
  const messagesContainer = document.getElementById('ragMessages');
  const inputEl = document.getElementById('ragInput');
  const sendBtn = document.getElementById('ragSendBtn');
  const suggestionsBox = document.getElementById('ragSuggestions');

  function toggleChat(openState) {
    isOpen = typeof openState === 'boolean' ? openState : !isOpen;
    if (isOpen) {
      panel.classList.add('rag-open');
      tooltip.style.opacity = '0';
      setTimeout(() => inputEl.focus(), 250);
    } else {
      panel.classList.remove('rag-open');
      tooltip.style.opacity = '1';
    }
  }

  launcherBtn.addEventListener('click', () => toggleChat());
  closeBtn.addEventListener('click', () => toggleChat(false));

  function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `rag-msg rag-${sender}`;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    msgDiv.innerHTML = `
      <div class="rag-bubble">${escapeHtml(text)}</div>
      <span class="rag-msg-time">${timeStr}</span>
    `;

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'rag-msg rag-bot';
    typingDiv.id = 'ragTyping';
    typingDiv.innerHTML = `
      <div class="rag-typing-bubble">
        <span class="rag-dot"></span>
        <span class="rag-dot"></span>
        <span class="rag-dot"></span>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTypingIndicator() {
    const typingEl = document.getElementById('ragTyping');
    if (typingEl) typingEl.remove();
  }

  async function handleSend(text) {
    if (!text || !text.trim() || isTyping) return;
    const query = text.trim();
    inputEl.value = '';

    // Hide initial suggestion chips
    if (suggestionsBox) suggestionsBox.style.display = 'none';

    // Append user message
    appendMessage(query, 'user');

    isTyping = true;
    showTypingIndicator();

    try {
      const endpoint = `${config.apiUrl}/api/v1/widget/${config.publicKey}/chat`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          visitor_id: visitorId,
          conversation_id: conversationId,
          stream: true
        })
      });

      removeTypingIndicator();

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      // Check if SSE stream is returned
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && response.body) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'rag-msg rag-bot';
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'rag-bubble';
        const timeSpan = document.createElement('span');
        timeSpan.className = 'rag-msg-time';
        timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        msgDiv.appendChild(bubbleDiv);
        msgDiv.appendChild(timeSpan);
        messagesContainer.appendChild(msgDiv);

        let fullText = '';
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmed.slice(6));
                if (data.event === 'meta' && data.conversation_id) {
                  conversationId = data.conversation_id;
                  localStorage.setItem(STORAGE_KEY_CONV, conversationId);
                } else if (data.event === 'token' && data.token) {
                  fullText += data.token;
                  bubbleDiv.innerHTML = escapeHtml(fullText);
                  messagesContainer.scrollTop = messagesContainer.scrollHeight;
                } else if (data.event === 'done') {
                  messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
              } catch (e) {}
            }
          }
        }
      } else {
        const data = await response.json();
        if (data.conversation_id) {
          conversationId = data.conversation_id;
          localStorage.setItem(STORAGE_KEY_CONV, conversationId);
        }
        appendMessage(data.answer || "I'm sorry, I couldn't process that query.", 'bot');
      }
    } catch (err) {
      console.error('[RAG Widget Error]', err);
      removeTypingIndicator();
      appendMessage(
        "I'm currently unable to reach the knowledge base. Please make sure the backend server is running on http://127.0.0.1:8000.",
        'bot'
      );
    } finally {
      isTyping = false;
      inputEl.focus();
    }
  }

  sendBtn.addEventListener('click', () => handleSend(inputEl.value));
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputEl.value);
    }
  });

  window.__ragSendSuggestion = function (text) {
    handleSend(text);
  };

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
  }

  // Auto-fetch remote configuration if available
  fetch(`${config.apiUrl}/api/v1/widget/${config.publicKey}/config`)
    .then(r => r.ok ? r.json() : null)
    .then(remoteCfg => {
      if (remoteCfg) {
        if (remoteCfg.bot_title) {
          const titleEl = document.getElementById('ragBotTitle');
          if (titleEl) titleEl.innerText = remoteCfg.bot_title;
        }
      }
    })
    .catch(() => {});

  console.log('[RAG Chatbot] Liquid Glass Widget loaded for public key:', config.publicKey);
})();
