/**
 * Runtime configuration for the chat widget
 * 
 * This module centralizes environment-aware config:
 * - API endpoint (from env var or fallback)
 * - Widget version for cache busting and tracking
 * - Default font stack (no external dependencies)
 */

// Default system font stack - no external requests
export const DEFAULT_FONT_FAMILY =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Ubuntu", sans-serif';

export const API_CONFIG = {
  // API base URL - override via VITE_API_BASE_URL environment variable
  // Falls back to production URL if not configured
  // Normalized: a missing "https://" makes fetch() treat it as a path on the host page,
  // and a trailing "/" produces "//api/..." (404)
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL || "https://api.yourdomain.com")
    .trim()
    .replace(/^(?!https?:\/\/)/, "https://")
    .replace(/\/+$/, ""),

  // Widget version for cache busting and tracking
  // Override via VITE_WIDGET_VERSION environment variable
  WIDGET_VERSION: import.meta.env.VITE_WIDGET_VERSION || "1.0.0",

  // Request timeout (milliseconds)
  REQUEST_TIMEOUT: 10_000,

  // Chat API timeout (longer due to LLM processing)
  CHAT_API_TIMEOUT: 30_000,

  // Number of retries for config fetch (not for chat API)
  CONFIG_FETCH_RETRIES: 1,

  // Retry delay (milliseconds)
  RETRY_DELAY: 1_000,
} as const;
