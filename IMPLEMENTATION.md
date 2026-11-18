# ChatBot Widget - Production-Ready Implementation

A secure, lightweight React widget for embedding AI chatbot support on merchant websites. Built with Vite, TypeScript, and production security best practices.

## Architecture

**Distribution Model:**
- Widget script (`chat-assistant.iife.js`) is distributed via CDN/GitHub
- Merchants embed the script tag in their website with their `storeId`
- Backend validates `storeId` against merchant database and provides configuration
- System prompts and sensitive data remain on the backend exclusively

```html
<!-- Merchant integration example -->
<script src="https://cdn.yourdomain.com/chat-assistant.iife.js?storeId=store_123" async></script>
```

## Key Features

### 1. **Security & Validation**
- ✅ Runtime schema validation for backend responses using `zod`
- ✅ CSS injection prevention with strict color/font sanitization
- ✅ Request timeout and retry logic to prevent hanging
- ✅ React error boundary for graceful error handling
- ✅ Secrets and system prompts remain on backend only

### 2. **Environment Configuration**
- ✅ Build-time API URL configuration via environment variables
- ✅ Separate `.env.development` and `.env.production` configs
- ✅ No hardcoded secrets or dev URLs in the distributed bundle

### 3. **Performance**
- ✅ Minimal bundle size (384 KB gzipped with all dependencies)
- ✅ System font stack (no external font downloads)
- ✅ Memoized CSS variable generation
- ✅ Efficient message history management

### 4. **Developer Experience**
- ✅ TypeScript for type safety
- ✅ ESLint configuration
- ✅ Well-documented code with inline comments
- ✅ Modular architecture with separated concerns

## Setup & Configuration

### Environment Variables

**Development** (`.env.development`):
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_WIDGET_VERSION=1.0.0-dev
```

**Production** (`.env.production`):
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WIDGET_VERSION=1.0.0
```

### Build

```bash
# Install dependencies
npm install

# Development build (uses .env.development)
npm run dev

# Production build (uses .env.production)
npm run build

# Lint
npm run lint

# Preview built output
npm run preview
```

## Project Structure

```
src/
├── api/
│   └── fetchWithTimeout.ts    # Fetch wrapper with timeout & retry
├── components/
│   └── ErrorBoundary.tsx      # React error boundary for graceful failures
├── schemas/
│   └── config.ts              # Zod schemas for validation
├── utils/
│   └── css.ts                 # CSS sanitization helpers
├── ChatApiService.ts          # Chat API integration
├── ChatWidget.tsx             # Main widget component
├── config.ts                  # Runtime configuration
├── main.tsx                   # Widget initialization & mounting
└── types.ts                   # TypeScript type definitions
```

## Validation & Safety

### Store Config Validation
```typescript
// Automatically validates backend /api/config/{storeId} response
import { storeConfigSchema } from "./schemas/config";

const config = storeConfigSchema.parse(data);
```

**Validated fields:**
- Colors: strict hex validation (#abc, #abcdef)
- Font: alphanumeric only, max 100 chars
- Strings: max length constraints
- Unknown properties: rejected

### Chat Response Validation
```typescript
// Ensures LLM response matches expected shape
const response = chatResponseSchema.parse(data);
```

### CSS Sanitization
```typescript
// Prevents CSS injection attacks
import { sanitizeHexColor, sanitizeFontFamily } from "./utils/css";

const primary = sanitizeHexColor(cfg.primaryColor); // Must be valid hex
const font = sanitizeFontFamily(cfg.fontFamily);    // Limited character set
```

## Network Reliability

### Timeout & Retry
```typescript
// Config fetch: 8 second timeout, 1 retry
await fetchWithTimeout(`${API_BASE_URL}/api/config/${storeId}`, {
  timeout: 8_000,
  retries: 1,
});

// Chat API: 30 second timeout, no retries (stateful)
await fetchWithTimeout(chatApiUrl, {
  timeout: 30_000,
  retries: 0,
});
```

**Benefits:**
- Widget never hangs on slow backends
- Graceful fallback on network failures
- Error messages displayed to users

## Error Handling

**Error Boundary** catches React rendering errors:
```typescript
<ErrorBoundary>
  <ChatWidget config={config} />
</ErrorBoundary>
```

Shows user-friendly message instead of blank widget on crash.

## Backend Requirements

Your backend must implement:

1. **Store Configuration Endpoint**
   ```
   GET /api/config/{storeId}
   
   Returns: {
     name?: string,
     logoUrl?: string,
     primaryColor?: string,      // hex color
     secondaryColor?: string,    // hex color
     backgroundColor?: string,   // hex color
     textColor?: string,         // hex color
     fontFamily?: string,        // font family
     welcomeMessage?: string,
     inputPlaceholder?: string,
     headerSubtitle?: string,
     poweredByLabel?: string,
     position?: "left" | "right",
     openOnInit?: boolean
   }
   ```

2. **Chat Endpoint**
   ```
   POST /api/chat
   
   Body: {
     storeId: string,
     messages: [{ role: "user" | "model", content: string }]
   }
   
   Returns: {
     reply?: string,
     message?: string
   }
   ```

3. **Validation**
   - ✅ Verify `storeId` exists and is active
   - ✅ Verify request `origin` matches merchant's allowed domains
   - ✅ Implement rate limiting per `storeId`
   - ✅ Keep system prompts on backend (never send to frontend)

4. **Security Headers**
   ```
   Access-Control-Allow-Origin: {merchant-domain}
   Access-Control-Allow-Methods: GET, POST, OPTIONS
   Content-Security-Policy: default-src 'self'
   Strict-Transport-Security: max-age=31536000
   ```

## Development Workflow

1. **Local Development:**
   ```bash
   npm run dev
   # Widget connects to http://localhost:3000
   ```

2. **Testing:**
   - Open `test.html` in browser
   - Widget loads from local dist build

3. **Production Build:**
   ```bash
   npm run build
   # Generates dist/chat-assistant.iife.js with production API URL
   # File is ready to upload to CDN
   ```

4. **Versioning:**
   - Update `VITE_WIDGET_VERSION` in `.env.production`
   - Each build creates a new version
   - Merchants can pin to specific versions

## Performance Metrics

- **Bundle size:** 384 KB (gzipped: 116 KB)
- **Initial load time:** < 1s on 4G
- **Config fetch:** 8s timeout with 1 retry
- **Chat response:** 30s timeout
- **System fonts:** No external requests

## Browser Compatibility

- Chrome/Edge: ✅ Latest 2 versions
- Firefox: ✅ Latest 2 versions
- Safari: ✅ Latest 2 versions
- Mobile browsers: ✅ iOS Safari, Chrome Mobile

## Troubleshooting

### Widget not loading
1. Check `storeId` parameter in script tag
2. Verify backend is accessible and returning 200
3. Check browser console for error messages
4. Verify CORS headers are correct

### Config not applying
1. Ensure backend response matches schema
2. Check console for validation errors
3. Verify colors are valid hex (#abc or #abcdef)
4. Font family should only contain alphanumeric and spaces

### Chat not responding
1. Verify chat API endpoint is accessible
2. Check network tab for request/response
3. Ensure `storeId` is sent correctly in request body
4. Verify response includes `reply` or `message` field

## Contributing

All code follows TypeScript strict mode and ESLint rules. Before committing:

```bash
npm run lint
npm run build
```

## License

Proprietary - All rights reserved
