/**
 * Chatin AI Embeddable Chat Widget (Vanilla JS Loader)
 * Injects a floating action button (FAB) and interactive chat iframe on external websites.
 */

(function () {
  const scriptTag = document.currentScript || document.querySelector("script[data-agent-key]");
  if (!scriptTag) return;

  const agentKey = scriptTag.getAttribute("data-agent-key") || "pk_live_support_12345";
  const theme = scriptTag.getAttribute("data-theme") || "light";
  const position = scriptTag.getAttribute("data-position") || "bottom-right";
  const baseUrl = scriptTag.src ? new URL(scriptTag.src).origin : "http://127.0.0.1:3000";

  // Create Container
  const container = document.createElement("div");
  container.id = "chatin-widget-container";
  container.style.position = "fixed";
  container.style.zIndex = "999999";
  container.style.fontFamily = "system-ui, -apple-system, sans-serif";

  if (position === "bottom-left") {
    container.style.bottom = "24px";
    container.style.left = "24px";
  } else {
    container.style.bottom = "24px";
    container.style.right = "24px";
  }

  // Create Iframe Window
  const iframe = document.createElement("iframe");
  iframe.id = "chatin-chat-frame";
  iframe.src = `${baseUrl}/widget/${agentKey}?theme=${theme}`;
  iframe.style.width = "380px";
  iframe.style.height = "580px";
  iframe.style.border = "none";
  iframe.style.borderRadius = "24px";
  iframe.style.boxShadow = "0 20px 40px -15px rgba(0, 0, 0, 0.25)";
  iframe.style.marginBottom = "16px";
  iframe.style.display = "none";
  iframe.style.transition = "all 0.3s ease";

  // Create Launcher Floating Action Button
  const launcher = document.createElement("button");
  launcher.id = "chatin-launcher-btn";
  launcher.style.width = "60px";
  launcher.style.height = "60px";
  launcher.style.borderRadius = "30px";
  launcher.style.backgroundColor = "#6366F1";
  launcher.style.color = "#FFFFFF";
  launcher.style.border = "none";
  launcher.style.boxShadow = "0 10px 25px -5px rgba(99, 102, 241, 0.5)";
  launcher.style.cursor = "pointer";
  launcher.style.display = "flex";
  launcher.style.alignItems = "center";
  launcher.style.justifyContent = "center";
  launcher.style.transition = "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)";
  launcher.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;

  let isOpen = false;
  launcher.onclick = function () {
    isOpen = !isOpen;
    if (isOpen) {
      iframe.style.display = "block";
      launcher.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    } else {
      iframe.style.display = "none";
      launcher.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
    }
  };

  container.appendChild(iframe);
  container.appendChild(launcher);
  document.body.appendChild(container);
})();
