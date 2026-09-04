// ─────────────────────────────────────────────
//  CHATBOT BUILDER PLATFORM — CORE TYPE SYSTEM
// ─────────────────────────────────────────────

// ─── Archetype IDs ───────────────────────────
export type ChatbotArchetype =
  | "liquid-glass"
  | "ai-companion"
  | "editorial-grid"
  | "obsidian-glow"
  | "pastel-lifestyle"
  | "commerce-pro"
  | "support-hub"
  // Legacy presets kept for backwards compat
  | "chatia-mobile"
  | "split-canvas";

export type DeviceFrame = "website" | "widget" | "mobile" | "tablet" | "fullscreen";

export type FontFamily =
  | "Plus Jakarta Sans"
  | "Outfit"
  | "Inter"
  | "Playfair Display"
  | "JetBrains Mono"
  | "Space Grotesk"
  | "DM Sans";

// ─── Rich Chat Block System ───────────────────

export interface TextBlock {
  type: "text";
  content: string;
}

export interface MarkdownBlock {
  type: "markdown";
  content: string;
}

export interface QuickActionsBlock {
  type: "quick-actions";
  items: { label: string; prompt: string; icon?: string }[];
}

export interface CategoryPillsBlock {
  type: "category-pills";
  pills: { label: string; active?: boolean }[];
}

export interface ProductCardBlock {
  type: "product-card";
  products: {
    id: string;
    image: string;
    title: string;
    price: string;
    originalPrice?: string;
    rating: number;
    ratingCount?: number;
    badge?: string;
    ctaLabel: string;
  }[];
}

export interface ProductCarouselBlock {
  type: "product-carousel";
  title?: string;
  products: ProductCardBlock["products"];
}

export interface MediaGalleryBlock {
  type: "media-gallery";
  images: { url: string; alt?: string }[];
  overflow?: number;
}

export interface DocumentCardBlock {
  type: "document-card";
  fileName: string;
  fileType: "pdf" | "csv" | "docx" | "xlsx" | "txt" | "other";
  fileSize: string;
  downloadUrl?: string;
}

export interface StatusStepperBlock {
  type: "status-stepper";
  steps: {
    label: string;
    status: "done" | "active" | "pending";
    timestamp?: string;
  }[];
}

export interface ChecklistBlock {
  type: "checklist";
  items: { label: string; done: boolean }[];
}

export interface ToolResultBlock {
  type: "tool-result";
  toolName: string;
  summary: string;
  data?: Record<string, unknown>;
}

export interface WeatherBlock {
  type: "weather";
  temp: string;
  condition: string;
  location: string;
  icon?: string;
}

export type ChatBlock =
  | TextBlock
  | MarkdownBlock
  | QuickActionsBlock
  | CategoryPillsBlock
  | ProductCardBlock
  | ProductCarouselBlock
  | MediaGalleryBlock
  | DocumentCardBlock
  | StatusStepperBlock
  | ChecklistBlock
  | ToolResultBlock
  | WeatherBlock;

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text?: string;
  blocks?: ChatBlock[];
  time: string;
  isTyping?: boolean;
}

export interface ActionCardItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  gradient: string;
  actionPrompt: string;
}

export interface ChatbotThemeConfig {
  id: string;
  name: string;
  archetype: ChatbotArchetype;
  
  description?: string;
  previewColor?: string;

  // ── Glass & Colors ──
  theme: {
    primaryGradient: string;
    accentColor: string;
    backgroundColor: string;
    bgPattern: "none" | "grid" | "dots" | "clouds" | "ambient-mesh";
    userBubbleBg: string;
    userBubbleText: string;
    botBubbleBg: string;
    botBubbleText: string;
    glassBlur: number;
    glassOpacity: number;
    glassSaturation: number;
    borderGlow: boolean;
    cardBg: string;
    shadowIntensity: number;
    launcherBg: string;
    launcherText: string;
    launcherSize: "sm" | "md" | "lg";
    launcherShape: "circle" | "rounded-square" | "pill";
  };

  // ── Typography ──
  typography: {
    fontFamily: FontFamily;
    fontSize: "sm" | "md" | "lg";
    bubbleRadius: number;
    titleWeight: "normal" | "medium" | "bold" | "black";
    lineHeight: "tight" | "normal" | "relaxed";
  };

  // ── Layout ──
  layout: {
    mode: "floating-widget" | "mobile-sheet" | "tablet-split" | "fullscreen-canvas";
    position: "bottom-right" | "bottom-left" | "center";
    width: number;
    height: number;
    showWebsiteCanvas: boolean;
  };

  // ── Modules ──
  modules: {
    welcomeHeader: {
      greeting: string;
      subtitle: string;
      avatar: string;
      avatarType: "emoji" | "icon" | "image";
      showAvatar: boolean;
      statusBadge: string;
      userGreetingName: string;
      showUserGreeting: boolean;
    };
    categoryPills: string[];
    featuredActionCards: ActionCardItem[];
    quickPrompts: string[];
    richWidgets: {
      enableImageCards: boolean;
      enableWeather: boolean;
      enableFileAttachment: boolean;
      enableVoiceInput: boolean;
      enableCopyRetry: boolean;
      enableChecklist: boolean;
      enableProductCards: boolean;
      enableStatusStepper: boolean;
    };
    launcherLabel: string;
    inputPlaceholder: string;
    showTypingDots: boolean;
  };

  // ── Behavior & Model ──
  behavior: {
    agentName: string;
    model: "gemini-2.5-flash" | "gemini-1.5-pro" | "gpt-4o-mini" | "gpt-4o" | string;
    systemPrompt: string;
    ragConfidenceThreshold: number;
    fallbackMessage: string;
    enableShopifyTool: boolean;
    enableSlackEscalation: boolean;
    enableEmailReceipts: boolean;
    enableCustomWebhooks: boolean;
    autoCrawlEnabled?: boolean;
    knowledgeBaseId?: string;
  };
}

export const DEFAULT_ARCHETYPES: Record<ChatbotArchetype, ChatbotThemeConfig> = {
  "liquid-glass": {
    id: "liquid-glass",
    name: "Liquid Glass",
    archetype: "liquid-glass",
    description: "Apple-inspired translucent frosted glass interface with depth and refraction.",
    previewColor: "#6366f1",
    theme: {
      primaryGradient: "linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.85) 50%, rgba(6, 182, 212, 0.85) 100%)",
      accentColor: "#8b5cf6",
      backgroundColor: "rgba(18, 20, 38, 0.65)",
      bgPattern: "ambient-mesh",
      userBubbleBg: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      userBubbleText: "#ffffff",
      botBubbleBg: "rgba(255, 255, 255, 0.12)",
      botBubbleText: "#f8fafc",
      glassBlur: 28,
      glassOpacity: 65,
      glassSaturation: 190,
      borderGlow: true,
      cardBg: "rgba(255, 255, 255, 0.08)",
      shadowIntensity: 85,
      launcherBg: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      launcherText: "#ffffff",
      launcherSize: "md",
      launcherShape: "circle",
    },
    typography: {
      fontFamily: "Plus Jakarta Sans",
      fontSize: "md",
      bubbleRadius: 20,
      titleWeight: "bold",
      lineHeight: "relaxed",
    },
    layout: {
      mode: "floating-widget",
      position: "bottom-right",
      width: 400,
      height: 600,
      showWebsiteCanvas: true,
    },
    modules: {
      welcomeHeader: {
        greeting: "Hi there! 👋",
        subtitle: "How can I help you today?",
        avatar: "✦",
        avatarType: "emoji",
        showAvatar: true,
        statusBadge: "Online",
        userGreetingName: "friend",
        showUserGreeting: false,
      },
      categoryPills: ["Product Info", "Shipping", "Returns", "Support"],
      featuredActionCards: [
        { id: "a1", icon: "🛍️", title: "Browse Products", subtitle: "Find what you need", gradient: "from-purple-500 to-indigo-500", actionPrompt: "Show me your best products" },
        { id: "a2", icon: "📦", title: "Track Order", subtitle: "Check order status", gradient: "from-blue-500 to-cyan-500", actionPrompt: "I want to track my order" },
      ],
      quickPrompts: ["What's on sale?", "Track my order", "Return policy", "Contact support"],
      richWidgets: {
        enableImageCards: true,
        enableWeather: false,
        enableFileAttachment: true,
        enableVoiceInput: false,
        enableCopyRetry: true,
        enableChecklist: false,
        enableProductCards: true,
        enableStatusStepper: true,
      },
      launcherLabel: "Need help? ✦",
      inputPlaceholder: "Ask me anything...",
      showTypingDots: true,
    },
    behavior: {
      agentName: "Aria",
      model: "gemini-2.5-flash",
      systemPrompt: "You are a helpful AI assistant. Be concise, friendly and professional.",
      ragConfidenceThreshold: 0.7,
      fallbackMessage: "I don't have information on that. Would you like to connect with a human agent?",
      enableShopifyTool: true,
      enableSlackEscalation: false,
      enableEmailReceipts: false,
      enableCustomWebhooks: false,
    },
  },

  "ai-companion": {
    id: "ai-companion",
    name: "AI Companion",
    archetype: "ai-companion",
    description: "A warm, friendly companion with a soft gradient feel, perfect for personal assistants.",
    previewColor: "#ec4899",
    theme: {
      primaryGradient: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)",
      accentColor: "#ec4899",
      backgroundColor: "#ffffff",
      bgPattern: "none",
      userBubbleBg: "linear-gradient(135deg, #ec4899, #a855f7)",
      userBubbleText: "#ffffff",
      botBubbleBg: "#f3f4f6",
      botBubbleText: "#1f2937",
      glassBlur: 0,
      glassOpacity: 0,
      glassSaturation: 100,
      borderGlow: false,
      cardBg: "#f9fafb",
      shadowIntensity: 30,
      launcherBg: "linear-gradient(135deg, #ec4899, #a855f7)",
      launcherText: "#ffffff",
      launcherSize: "md",
      launcherShape: "circle",
    },
    typography: {
      fontFamily: "Outfit",
      fontSize: "md",
      bubbleRadius: 22,
      titleWeight: "bold",
      lineHeight: "relaxed",
    },
    layout: {
      mode: "floating-widget",
      position: "bottom-right",
      width: 380,
      height: 580,
      showWebsiteCanvas: true,
    },
    modules: {
      welcomeHeader: {
        greeting: "Good morning! ☀️",
        subtitle: "Ready to help you today",
        avatar: "🤖",
        avatarType: "emoji",
        showAvatar: true,
        statusBadge: "Active",
        userGreetingName: "friend",
        showUserGreeting: true,
      },
      categoryPills: ["Content", "Writing", "Research & Analysis"],
      featuredActionCards: [
        { id: "a1", icon: "✍️", title: "Write for Me", subtitle: "Draft emails, posts, content", gradient: "from-pink-500 to-purple-500", actionPrompt: "Help me write something" },
        { id: "a2", icon: "🔍", title: "Research", subtitle: "Dive deep into any topic", gradient: "from-purple-500 to-indigo-500", actionPrompt: "Help me research a topic" },
      ],
      quickPrompts: ["Summarize this", "Write an email", "Give me ideas", "Explain this concept"],
      richWidgets: {
        enableImageCards: true,
        enableWeather: false,
        enableFileAttachment: true,
        enableVoiceInput: true,
        enableCopyRetry: true,
        enableChecklist: true,
        enableProductCards: false,
        enableStatusStepper: false,
      },
      launcherLabel: "Chat with me ✨",
      inputPlaceholder: "Ask me anything...",
      showTypingDots: true,
    },
    behavior: {
      agentName: "Aria",
      model: "gemini-2.5-flash",
      systemPrompt: "You are a warm, helpful AI companion. Be friendly, encouraging and personalized.",
      ragConfidenceThreshold: 0.65,
      fallbackMessage: "Hmm, I'm not sure about that. Let me connect you with someone who can help!",
      enableShopifyTool: false,
      enableSlackEscalation: false,
      enableEmailReceipts: false,
      enableCustomWebhooks: false,
    },
  },

  "editorial-grid": {
    id: "editorial-grid",
    name: "Editorial Grid",
    archetype: "editorial-grid",
    description: "Clean, typographic editorial design with a grid pattern — for content-first brands.",
    previewColor: "#f59e0b",
    theme: {
      primaryGradient: "linear-gradient(135deg, #1c1917 0%, #292524 100%)",
      accentColor: "#f59e0b",
      backgroundColor: "#fafaf9",
      bgPattern: "grid",
      userBubbleBg: "#1c1917",
      userBubbleText: "#fafaf9",
      botBubbleBg: "#ffffff",
      botBubbleText: "#1c1917",
      glassBlur: 0,
      glassOpacity: 0,
      glassSaturation: 100,
      borderGlow: false,
      cardBg: "#ffffff",
      shadowIntensity: 20,
      launcherBg: "#1c1917",
      launcherText: "#f59e0b",
      launcherSize: "md",
      launcherShape: "rounded-square",
    },
    typography: {
      fontFamily: "Playfair Display",
      fontSize: "md",
      bubbleRadius: 8,
      titleWeight: "black",
      lineHeight: "tight",
    },
    layout: {
      mode: "floating-widget",
      position: "bottom-right",
      width: 380,
      height: 600,
      showWebsiteCanvas: true,
    },
    modules: {
      welcomeHeader: {
        greeting: "Hello.",
        subtitle: "Your knowledge companion is ready.",
        avatar: "📖",
        avatarType: "emoji",
        showAvatar: false,
        statusBadge: "Ready",
        userGreetingName: "reader",
        showUserGreeting: false,
      },
      categoryPills: ["Articles", "Research", "Data", "Insights"],
      featuredActionCards: [
        { id: "a1", icon: "📰", title: "Latest News", subtitle: "Stay informed", gradient: "from-stone-800 to-stone-600", actionPrompt: "What's in the news today?" },
        { id: "a2", icon: "📊", title: "Data Insights", subtitle: "Analyze trends", gradient: "from-amber-600 to-orange-500", actionPrompt: "Give me some data insights" },
      ],
      quickPrompts: ["Summarize today's topics", "Deep dive on this", "Find related articles", "Explain simply"],
      richWidgets: {
        enableImageCards: true,
        enableWeather: false,
        enableFileAttachment: true,
        enableVoiceInput: false,
        enableCopyRetry: true,
        enableChecklist: false,
        enableProductCards: false,
        enableStatusStepper: false,
      },
      launcherLabel: "Ask the editor",
      inputPlaceholder: "What would you like to know?",
      showTypingDots: true,
    },
    behavior: {
      agentName: "Sage",
      model: "gpt-4o-mini",
      systemPrompt: "You are an expert research and editorial assistant. Be precise, informative and cite sources.",
      ragConfidenceThreshold: 0.8,
      fallbackMessage: "I don't have enough context on that topic. Could you provide more details?",
      enableShopifyTool: false,
      enableSlackEscalation: false,
      enableEmailReceipts: false,
      enableCustomWebhooks: false,
    },
  },

  "obsidian-glow": {
    id: "obsidian-glow",
    name: "Obsidian Glow",
    archetype: "obsidian-glow",
    description: "Dark obsidian interface with vibrant neon accents — for tech-forward products.",
    previewColor: "#10b981",
    theme: {
      primaryGradient: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0d9488 100%)",
      accentColor: "#10b981",
      backgroundColor: "#030712",
      bgPattern: "none",
      userBubbleBg: "linear-gradient(135deg, #059669, #0d9488)",
      userBubbleText: "#ffffff",
      botBubbleBg: "rgba(255,255,255,0.06)",
      botBubbleText: "#e2e8f0",
      glassBlur: 16,
      glassOpacity: 6,
      glassSaturation: 120,
      borderGlow: true,
      cardBg: "rgba(255,255,255,0.04)",
      shadowIntensity: 70,
      launcherBg: "linear-gradient(135deg, #059669, #0d9488)",
      launcherText: "#ffffff",
      launcherSize: "md",
      launcherShape: "circle",
    },
    typography: {
      fontFamily: "JetBrains Mono",
      fontSize: "sm",
      bubbleRadius: 12,
      titleWeight: "bold",
      lineHeight: "normal",
    },
    layout: {
      mode: "floating-widget",
      position: "bottom-right",
      width: 400,
      height: 620,
      showWebsiteCanvas: true,
    },
    modules: {
      welcomeHeader: {
        greeting: "System ready. 🟢",
        subtitle: "What can I process for you?",
        avatar: "⚡",
        avatarType: "emoji",
        showAvatar: true,
        statusBadge: "Online",
        userGreetingName: "dev",
        showUserGreeting: false,
      },
      categoryPills: ["API Docs", "Debugging", "Deploy", "Monitoring"],
      featuredActionCards: [
        { id: "a1", icon: "🔧", title: "Debug Issue", subtitle: "Analyze error logs", gradient: "from-emerald-800 to-teal-700", actionPrompt: "Help me debug this error" },
        { id: "a2", icon: "🚀", title: "Deploy Guide", subtitle: "Step-by-step deployment", gradient: "from-teal-700 to-cyan-600", actionPrompt: "Walk me through deployment" },
      ],
      quickPrompts: ["Show API docs", "Debug my code", "Check system status", "Generate code snippet"],
      richWidgets: {
        enableImageCards: false,
        enableWeather: false,
        enableFileAttachment: true,
        enableVoiceInput: false,
        enableCopyRetry: true,
        enableChecklist: true,
        enableProductCards: false,
        enableStatusStepper: true,
      },
      launcherLabel: "Support Terminal",
      inputPlaceholder: "> Enter command or question...",
      showTypingDots: true,
    },
    behavior: {
      agentName: "Hex",
      model: "gemini-2.5-flash",
      systemPrompt: "You are a technical AI assistant for developers. Be precise, use code examples, and be concise.",
      ragConfidenceThreshold: 0.75,
      fallbackMessage: "No relevant documentation found. Try rephrasing or open a support ticket.",
      enableShopifyTool: false,
      enableSlackEscalation: true,
      enableEmailReceipts: false,
      enableCustomWebhooks: true,
    },
  },

  "pastel-lifestyle": {
    id: "pastel-lifestyle",
    name: "Pastel Lifestyle",
    archetype: "pastel-lifestyle",
    description: "Soft pastel tones with rounded shapes — ideal for wellness, beauty, or lifestyle brands.",
    previewColor: "#f472b6",
    theme: {
      primaryGradient: "linear-gradient(135deg, #fce7f3 0%, #f9a8d4 50%, #f472b6 100%)",
      accentColor: "#f472b6",
      backgroundColor: "#fdf2f8",
      bgPattern: "dots",
      userBubbleBg: "linear-gradient(135deg, #f472b6, #ec4899)",
      userBubbleText: "#ffffff",
      botBubbleBg: "#ffffff",
      botBubbleText: "#4a1d35",
      glassBlur: 0,
      glassOpacity: 0,
      glassSaturation: 100,
      borderGlow: false,
      cardBg: "#ffffff",
      shadowIntensity: 15,
      launcherBg: "linear-gradient(135deg, #f472b6, #ec4899)",
      launcherText: "#ffffff",
      launcherSize: "md",
      launcherShape: "circle",
    },
    typography: {
      fontFamily: "DM Sans",
      fontSize: "md",
      bubbleRadius: 28,
      titleWeight: "bold",
      lineHeight: "relaxed",
    },
    layout: {
      mode: "floating-widget",
      position: "bottom-right",
      width: 370,
      height: 580,
      showWebsiteCanvas: true,
    },
    modules: {
      welcomeHeader: {
        greeting: "Hey beautiful! 🌸",
        subtitle: "Let's find your perfect look",
        avatar: "🌸",
        avatarType: "emoji",
        showAvatar: true,
        statusBadge: "Here for you",
        userGreetingName: "gorgeous",
        showUserGreeting: false,
      },
      categoryPills: ["Skincare", "Makeup", "Wellness", "Style"],
      featuredActionCards: [
        { id: "a1", icon: "💄", title: "Beauty Tips", subtitle: "Personalized for your skin", gradient: "from-pink-400 to-rose-400", actionPrompt: "Give me skincare tips" },
        { id: "a2", icon: "🧘", title: "Wellness", subtitle: "Mindfulness & self-care", gradient: "from-rose-300 to-pink-300", actionPrompt: "I need some wellness tips" },
      ],
      quickPrompts: ["Best products for me", "Daily routine", "New arrivals", "Style recommendations"],
      richWidgets: {
        enableImageCards: true,
        enableWeather: false,
        enableFileAttachment: false,
        enableVoiceInput: false,
        enableCopyRetry: true,
        enableChecklist: true,
        enableProductCards: true,
        enableStatusStepper: false,
      },
      launcherLabel: "Get personalized tips 💕",
      inputPlaceholder: "Ask about beauty, wellness...",
      showTypingDots: true,
    },
    behavior: {
      agentName: "Luna",
      model: "gemini-2.5-flash",
      systemPrompt: "You are a warm, uplifting beauty and wellness assistant. Be encouraging, personalized and caring.",
      ragConfidenceThreshold: 0.65,
      fallbackMessage: "I'm not sure about that! Let me connect you with one of our experts. 💕",
      enableShopifyTool: true,
      enableSlackEscalation: false,
      enableEmailReceipts: true,
      enableCustomWebhooks: false,
    },
  },

  "commerce-pro": {
    id: "commerce-pro",
    name: "Commerce Pro",
    archetype: "commerce-pro",
    description: "Product-first commerce assistant with rich cards, carousels, and order tracking.",
    previewColor: "#f97316",
    theme: {
      primaryGradient: "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)",
      accentColor: "#f97316",
      backgroundColor: "#ffffff",
      bgPattern: "none",
      userBubbleBg: "linear-gradient(135deg, #ea580c, #f97316)",
      userBubbleText: "#ffffff",
      botBubbleBg: "#f8fafc",
      botBubbleText: "#0f172a",
      glassBlur: 0,
      glassOpacity: 0,
      glassSaturation: 100,
      borderGlow: false,
      cardBg: "#f8fafc",
      shadowIntensity: 25,
      launcherBg: "linear-gradient(135deg, #ea580c, #f97316)",
      launcherText: "#ffffff",
      launcherSize: "lg",
      launcherShape: "pill",
    },
    typography: {
      fontFamily: "Inter",
      fontSize: "md",
      bubbleRadius: 16,
      titleWeight: "bold",
      lineHeight: "normal",
    },
    layout: {
      mode: "floating-widget",
      position: "bottom-right",
      width: 420,
      height: 640,
      showWebsiteCanvas: true,
    },
    modules: {
      welcomeHeader: {
        greeting: "Welcome! 🛍️",
        subtitle: "I'll help you find the perfect product",
        avatar: "🛍️",
        avatarType: "emoji",
        showAvatar: true,
        statusBadge: "Shopping Assistant",
        userGreetingName: "shopper",
        showUserGreeting: false,
      },
      categoryPills: ["New Arrivals", "Best Sellers", "Sale", "Bundles"],
      featuredActionCards: [
        { id: "a1", icon: "🔥", title: "Hot Deals", subtitle: "Up to 50% off today", gradient: "from-orange-500 to-red-500", actionPrompt: "Show me today's best deals" },
        { id: "a2", icon: "📦", title: "My Orders", subtitle: "Track your shipments", gradient: "from-amber-500 to-orange-500", actionPrompt: "Track my recent order" },
      ],
      quickPrompts: ["Show me best sellers", "Do you have this in stock?", "Return policy", "Track my order"],
      richWidgets: {
        enableImageCards: true,
        enableWeather: false,
        enableFileAttachment: false,
        enableVoiceInput: false,
        enableCopyRetry: true,
        enableChecklist: false,
        enableProductCards: true,
        enableStatusStepper: true,
      },
      launcherLabel: "Shop with AI 🛍️",
      inputPlaceholder: "Search products or ask questions...",
      showTypingDots: true,
    },
    behavior: {
      agentName: "Scout",
      model: "gpt-4o-mini",
      systemPrompt: "You are a commerce assistant. Help users find products, check orders, understand policies.",
      ragConfidenceThreshold: 0.7,
      fallbackMessage: "I couldn't find that product. Would you like me to show you similar items?",
      enableShopifyTool: true,
      enableSlackEscalation: false,
      enableEmailReceipts: true,
      enableCustomWebhooks: false,
    },
  },

  "support-hub": {
    id: "support-hub",
    name: "Support Hub",
    archetype: "support-hub",
    description: "Clean, professional support assistant with escalation paths and ticket management.",
    previewColor: "#3b82f6",
    theme: {
      primaryGradient: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)",
      accentColor: "#3b82f6",
      backgroundColor: "#f8fafc",
      bgPattern: "none",
      userBubbleBg: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
      userBubbleText: "#ffffff",
      botBubbleBg: "#ffffff",
      botBubbleText: "#1e293b",
      glassBlur: 0,
      glassOpacity: 0,
      glassSaturation: 100,
      borderGlow: false,
      cardBg: "#ffffff",
      shadowIntensity: 20,
      launcherBg: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
      launcherText: "#ffffff",
      launcherSize: "md",
      launcherShape: "rounded-square",
    },
    typography: {
      fontFamily: "Inter",
      fontSize: "md",
      bubbleRadius: 12,
      titleWeight: "medium",
      lineHeight: "normal",
    },
    layout: {
      mode: "floating-widget",
      position: "bottom-right",
      width: 380,
      height: 600,
      showWebsiteCanvas: true,
    },
    modules: {
      welcomeHeader: {
        greeting: "Hi! How can we help? 💬",
        subtitle: "We typically reply in a few minutes",
        avatar: "💬",
        avatarType: "emoji",
        showAvatar: true,
        statusBadge: "Support Team",
        userGreetingName: "",
        showUserGreeting: false,
      },
      categoryPills: ["Billing", "Account", "Technical", "General"],
      featuredActionCards: [
        { id: "a1", icon: "🎫", title: "Open Ticket", subtitle: "Get help from our team", gradient: "from-blue-600 to-blue-500", actionPrompt: "I need to open a support ticket" },
        { id: "a2", icon: "📚", title: "Knowledge Base", subtitle: "Find answers fast", gradient: "from-blue-500 to-sky-500", actionPrompt: "Search your knowledge base" },
      ],
      quickPrompts: ["Billing issue", "Reset my password", "Cancel subscription", "Talk to human agent"],
      richWidgets: {
        enableImageCards: false,
        enableWeather: false,
        enableFileAttachment: true,
        enableVoiceInput: false,
        enableCopyRetry: true,
        enableChecklist: true,
        enableProductCards: false,
        enableStatusStepper: true,
      },
      launcherLabel: "Get Support",
      inputPlaceholder: "Describe your issue...",
      showTypingDots: true,
    },
    behavior: {
      agentName: "Max",
      model: "gemini-2.5-flash",
      systemPrompt: "You are a customer support assistant. Be empathetic, solution-focused and know when to escalate.",
      ragConfidenceThreshold: 0.75,
      fallbackMessage: "I wasn't able to resolve this automatically. Let me connect you with a support agent.",
      enableShopifyTool: false,
      enableSlackEscalation: true,
      enableEmailReceipts: true,
      enableCustomWebhooks: true,
    },
  },

  // Legacy presets — mapped to closest equivalents
  "chatia-mobile": {
    id: "chatia-mobile",
    name: "Chatia Mobile",
    archetype: "chatia-mobile",
    description: "Legacy AI companion mobile preset.",
    previewColor: "#ec4899",
    theme: {
      primaryGradient: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)",
      accentColor: "#ec4899",
      backgroundColor: "#ffffff",
      bgPattern: "none",
      userBubbleBg: "linear-gradient(135deg, #ec4899, #a855f7)",
      userBubbleText: "#ffffff",
      botBubbleBg: "#f3f4f6",
      botBubbleText: "#1f2937",
      glassBlur: 0,
      glassOpacity: 0,
      glassSaturation: 100,
      borderGlow: false,
      cardBg: "#f9fafb",
      shadowIntensity: 30,
      launcherBg: "linear-gradient(135deg, #ec4899, #a855f7)",
      launcherText: "#ffffff",
      launcherSize: "md",
      launcherShape: "circle",
    },
    typography: { fontFamily: "Outfit", fontSize: "md", bubbleRadius: 22, titleWeight: "bold", lineHeight: "relaxed" },
    layout: { mode: "floating-widget", position: "bottom-right", width: 380, height: 580, showWebsiteCanvas: true },
    modules: {
      welcomeHeader: { greeting: "Good morning! ☀️", subtitle: "Ready to help", avatar: "🤖", avatarType: "emoji", showAvatar: true, statusBadge: "Active", userGreetingName: "friend", showUserGreeting: true },
      categoryPills: ["Content", "Writing", "Research"],
      featuredActionCards: [
        { id: "a1", icon: "✍️", title: "Write for Me", subtitle: "Draft content", gradient: "from-pink-500 to-purple-500", actionPrompt: "Help me write something" },
      ],
      quickPrompts: ["Summarize this", "Write an email", "Give me ideas"],
      richWidgets: { enableImageCards: true, enableWeather: false, enableFileAttachment: true, enableVoiceInput: true, enableCopyRetry: true, enableChecklist: true, enableProductCards: false, enableStatusStepper: false },
      launcherLabel: "Chat with me ✨",
      inputPlaceholder: "Ask me anything...",
      showTypingDots: true,
    },
    behavior: { agentName: "Aria",
      model: "gemini-2.5-flash", systemPrompt: "You are a warm, helpful AI companion.", ragConfidenceThreshold: 0.65, fallbackMessage: "Let me connect you with someone!", enableShopifyTool: false, enableSlackEscalation: false, enableEmailReceipts: false, enableCustomWebhooks: false },
  },

  "split-canvas": {
    id: "split-canvas",
    name: "Split Canvas",
    archetype: "split-canvas",
    description: "Legacy tablet split-view preset.",
    previewColor: "#3b82f6",
    theme: {
      primaryGradient: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)",
      accentColor: "#3b82f6",
      backgroundColor: "#f8fafc",
      bgPattern: "none",
      userBubbleBg: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
      userBubbleText: "#ffffff",
      botBubbleBg: "#ffffff",
      botBubbleText: "#1e293b",
      glassBlur: 0,
      glassOpacity: 0,
      glassSaturation: 100,
      borderGlow: false,
      cardBg: "#ffffff",
      shadowIntensity: 20,
      launcherBg: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
      launcherText: "#ffffff",
      launcherSize: "md",
      launcherShape: "rounded-square",
    },
    typography: { fontFamily: "Inter", fontSize: "md", bubbleRadius: 12, titleWeight: "medium", lineHeight: "normal" },
    layout: { mode: "tablet-split", position: "center", width: 380, height: 600, showWebsiteCanvas: false },
    modules: {
      welcomeHeader: { greeting: "Hi! 💬", subtitle: "How can I help?", avatar: "💬", avatarType: "emoji", showAvatar: true, statusBadge: "Support Team", userGreetingName: "", showUserGreeting: false },
      categoryPills: ["Billing", "Account", "Technical"],
      featuredActionCards: [
        { id: "a1", icon: "🎫", title: "Open Ticket", subtitle: "Get help", gradient: "from-blue-600 to-blue-500", actionPrompt: "Open a support ticket" },
      ],
      quickPrompts: ["Billing issue", "Reset password", "Talk to human"],
      richWidgets: { enableImageCards: false, enableWeather: false, enableFileAttachment: true, enableVoiceInput: false, enableCopyRetry: true, enableChecklist: true, enableProductCards: false, enableStatusStepper: true },
      launcherLabel: "Get Support",
      inputPlaceholder: "Describe your issue...",
      showTypingDots: true,
    },
    behavior: { agentName: "Max",
      model: "gemini-2.5-flash", systemPrompt: "You are a customer support assistant.", ragConfidenceThreshold: 0.75, fallbackMessage: "Let me connect you with a support agent.", enableShopifyTool: false, enableSlackEscalation: true, enableEmailReceipts: true, enableCustomWebhooks: true },
  },
};

export const ARCHETYPE_LIST: ChatbotThemeConfig[] = [
  DEFAULT_ARCHETYPES["liquid-glass"],
  DEFAULT_ARCHETYPES["ai-companion"],
  DEFAULT_ARCHETYPES["editorial-grid"],
  DEFAULT_ARCHETYPES["obsidian-glow"],
  DEFAULT_ARCHETYPES["pastel-lifestyle"],
  DEFAULT_ARCHETYPES["commerce-pro"],
  DEFAULT_ARCHETYPES["support-hub"],
];
