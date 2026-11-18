import { createRoot } from "react-dom/client";
import ChatWidget from "./ChatWidget";
import { ErrorBoundary } from "./components/ErrorBoundary";
import type { WidgetConfig } from "./types";
import { API_CONFIG } from "./config";
import { storeConfigSchema } from "./schemas/config";
import { fetchWithTimeout } from "./api/fetchWithTimeout";

/* ─────────────────────────────────────────
   CONFIG
   API_BASE_URL is configured via environment variable (VITE_API_BASE_URL)
   Falls back to production URL if not set
───────────────────────────────────────── */
const API_BASE_URL = API_CONFIG.API_BASE_URL;

/* ─────────────────────────────────────────
   READ storeId FROM SCRIPT TAG
   Looks for the <script src="...?storeId=xxx">
   that the merchant pasted into their site.
───────────────────────────────────────── */
function getStoreId(): string | null {
  // document.currentScript works when the script is first executing
  const current = document.currentScript as HTMLScriptElement | null;
  if (current?.src) {
    const id = new URL(current.src).searchParams.get("storeId");
    if (id) return id;
  }

  // Fallback: currentScript is null in async/deferred scripts,
  // so scan all script tags for the one with our filename
  const fallback = Array.from(document.querySelectorAll("script"))
    .find((s) => (s as HTMLScriptElement).src?.includes("chat-assistant.iife.js")) as HTMLScriptElement | undefined;

  return fallback ? new URL(fallback.src).searchParams.get("storeId") : null;
}

/* ─────────────────────────────────────────
   FETCH BRAND CONFIG FROM YOUR BACKEND
   Returns only safe UI fields (colors, name…)
   system_prompt never leaves your server.
   
   Uses validation to ensure backend response matches expected shape
───────────────────────────────────────── */
async function fetchStoreConfig(storeId: string): Promise<Partial<WidgetConfig>> {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/api/config/${storeId}`,
      {
        timeout: API_CONFIG.REQUEST_TIMEOUT,
        retries: API_CONFIG.CONFIG_FETCH_RETRIES,
      }
    );

    if (!res.ok) {
      throw new Error(`[ChatAssistant] Config fetch failed: ${res.status}`);
    }

    const data = await res.json();
    
    // Validate backend response matches expected schema
    // This prevents crashes from malformed data
    return storeConfigSchema.parse(data);
  } catch (err) {
    console.error("[ChatAssistant] Failed to fetch store config:", err);
    throw err;
  }
}

/* ─────────────────────────────────────────
   MOUNT
   Creates an isolated Shadow DOM so the
   merchant's CSS can't interfere with ours.
   
   Wraps widget in ErrorBoundary to catch React errors.
───────────────────────────────────────── */
function mount(config: WidgetConfig) {
  const host = document.createElement("div");
  host.id = "chat-assistant-root";
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: "open" });

  const container = document.createElement("div");
  shadowRoot.appendChild(container);

  // Base reset inside shadow DOM only
  const style = document.createElement("style");
  style.textContent = `*, *::before, *::after { box-sizing: border-box; } body { margin: 0; }`;
  shadowRoot.appendChild(style);

  createRoot(container).render(
    <ErrorBoundary>
      <ChatWidget config={config} />
    </ErrorBoundary>
  );
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
async function init() {
  const storeId = getStoreId();

  if (!storeId) {
    console.error("[ChatAssistant] No storeId found. Make sure your script tag includes ?storeId=your_id");
    return;
  }

  let remoteConfig: Partial<WidgetConfig> = {};

  try {
    remoteConfig = await fetchStoreConfig(storeId);
  } catch (err) {
    console.warn("[ChatAssistant] Could not load remote config, widget may look unstyled.", err);
  }

  const config: WidgetConfig = {
    ...remoteConfig,          // DB values (colors, name, logo…)
    storeId,                  // always from the script tag
    apiUrl: API_BASE_URL,     // always hardcoded in the bundle
  };

  mount(config);
}

/* ─────────────────────────────────────────
   RUN
   Wait for DOM to be ready before mounting.
───────────────────────────────────────── */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}