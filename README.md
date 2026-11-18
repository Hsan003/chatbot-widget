# Chat Assistant Widget

An embeddable AI chat assistant for merchant websites. Merchants add a single script tag to their site, and a branded chat bubble appears that lets their visitors talk to an AI assistant tailored to their store.

```html
<script src="https://<cdn-host>/chat-assistant.iife.js?storeId=store_123" async></script>
```

## How it works

1. The script reads the `storeId` from its own URL.
2. It fetches the store's appearance settings from the backend (`GET /api/config/{storeId}`): name, logo, colors, font, welcome message, position, and similar UI options.
3. The widget mounts inside a Shadow DOM, so the merchant's CSS and the widget's CSS never interfere with each other.
4. Visitor messages are sent with the conversation history to the backend (`POST /api/chat`), which generates the AI reply. System prompts and any other sensitive data stay on the backend; the widget only ever receives display settings and replies.

## Features

- **Single-file distribution:** React and every dependency are bundled into one self-executing file (`dist/chat-assistant.iife.js`), so merchant sites need nothing else installed.
- **Per-store branding:** colors, font, logo, bot name, copy, left/right placement, and open-on-load behavior all come from the store's configuration.
- **Markdown replies:** assistant messages are rendered as Markdown.
- **Chat experience:** typing indicator, message timestamps, and a "new conversation" button to clear the chat.
- **Safe by default:** backend responses are validated with Zod schemas, colors and fonts are sanitized to prevent CSS injection, and an error boundary keeps a crash from breaking the host page.
- **Resilient networking:** requests time out instead of hanging, and the config fetch retries once on failure.
- **Accessible:** ARIA labels and live regions for screen readers.

## Tech stack

React 19, TypeScript, Vite (IIFE library build), Zod, react-markdown, and lucide-react icons. The bundle is hosted on Cloudflare Pages; a Dockerfile and nginx config are included for self-hosting.

## Project structure

```
src/
├── main.tsx                  # Entry point: reads storeId, fetches config, mounts the widget
├── ChatWidget.tsx            # Chat UI and styles
├── ChatApiService.ts         # Calls the chat endpoint
├── config.ts                 # API URL, version, timeouts
├── types.ts                  # Widget and message types
├── api/fetchWithTimeout.ts   # Fetch wrapper with timeout and retry
├── components/ErrorBoundary.tsx
├── schemas/config.ts         # Zod schemas for backend responses
└── utils/css.ts              # Color and font sanitization
```
