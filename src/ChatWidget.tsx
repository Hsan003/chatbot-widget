import { useState, useRef, useEffect, useMemo } from "react";
import { X, Send, MessageCircle, SquarePen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { WidgetConfig, Message } from "./types";
import chatApi from "./ChatApiService";
import { sanitizeHexColor, sanitizeFontFamily, hexToRgb } from "./utils/css";
import { DEFAULT_FONT_FAMILY } from "./config";

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */

function buildCssVars(cfg: WidgetConfig): string {
  const primary = sanitizeHexColor(cfg.primaryColor);
  const secondary = sanitizeHexColor(cfg.secondaryColor, primary);
  const bg = sanitizeHexColor(cfg.backgroundColor, "#f5f7fb");
  const font = sanitizeFontFamily(cfg.fontFamily, DEFAULT_FONT_FAMILY);
  const rgb = hexToRgb(primary);

  return `
    --cw-primary: ${primary};
    --cw-primary-rgb: ${rgb};
    --cw-secondary: ${secondary};
    --cw-bg: ${bg};
    --cw-font: ${font};
  `;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function formatDateLabel(date: Date) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatMessageTimestamp(current: Date, previous?: Date) {
  const timeLabel = formatTimeLabel(current);
  if (!previous) {
    return `${formatDateLabel(current)} · ${timeLabel}`;
  }

  const gapMs = current.getTime() - previous.getTime();
  const sameDay = isSameDay(current, previous);
  const needsDate = !sameDay;
  const needsTime = gapMs >= 10 * 60 * 1000 || !sameDay;

  if (needsDate) {
    return `${formatDateLabel(current)} · ${timeLabel}`;
  }
  if (needsTime) {
    return timeLabel;
  }
  return null;
}

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const css = `
  .cw-root * { box-sizing: border-box; font-family: var(--cw-font); }

  /* FAB */
  .cw-fab {
    position: fixed;
    bottom: 24px;
    width: 56px; height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--cw-primary), color-mix(in srgb, var(--cw-primary) 70%, #000 30%));
    color: #fff;
    border: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(var(--cw-primary-rgb), 0.45);
    transition: transform 200ms cubic-bezier(.34,1.56,.64,1), box-shadow 200ms ease;
    z-index: 999999;
  }
  .cw-fab.pos-right { right: 24px; }
  .cw-fab.pos-left  { left: 24px; }

  .cw-fab:hover { transform: scale(1.1); box-shadow: 0 8px 30px rgba(var(--cw-primary-rgb), 0.55); }
  .cw-fab:active { transform: scale(0.95); }

  .cw-fab-icon { transition: transform 300ms cubic-bezier(.34,1.56,.64,1), opacity 200ms ease; }
  .cw-fab-icon.hidden  { transform: rotate(90deg) scale(0); opacity: 0; position: absolute; }
  .cw-fab-icon.visible { transform: rotate(0deg) scale(1);  opacity: 1; }

  /* WIDGET */
  .cw-widget {
    position: fixed;
    bottom: 90px;
    width: 376px; height: 560px;
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.18);
    display: flex; flex-direction: column;
    overflow: hidden;
    z-index: 999999;
    transform-origin: bottom right;
    animation: cw-pop-in 300ms cubic-bezier(.34,1.56,.64,1) forwards;
  }
  .cw-widget.pos-right { right: 24px; transform-origin: bottom right; }
  .cw-widget.pos-left  { left: 24px;  transform-origin: bottom left; }

  @keyframes cw-pop-in {
    from { opacity: 0; transform: scale(0.85) translateY(12px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }

  /* HEADER */
  .cw-header {
    padding: 18px 16px 14px;
    background: linear-gradient(145deg, var(--cw-primary) 0%, color-mix(in srgb, var(--cw-primary) 70%, #000 30%) 100%);
    color: #fff;
    position: relative; overflow: hidden;
  }
  .cw-header::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 80% 0%, rgba(255,255,255,0.12) 0%, transparent 60%);
  }

  .cw-header-top { display: flex; justify-content: space-between; align-items: flex-start; position: relative; }
  .cw-header-left { display: flex; align-items: center; gap: 10px; }

  .cw-avatar {
    width: 38px; height: 38px;
    border-radius: 12px;
    background: rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 16px;
    border: 1.5px solid rgba(255,255,255,0.3);
    backdrop-filter: blur(4px);
    overflow: hidden;
  }
  .cw-avatar img { width: 100%; height: 100%; object-fit: cover; }

  .cw-header-info { display: flex; flex-direction: column; gap: 2px; }
  .cw-name { font-size: 16px; font-weight: 600; letter-spacing: -0.01em; }
  @keyframes cw-pulse {
    0%, 100% { box-shadow: 0 0 0 2px rgba(74,222,128,0.3); }
    50%       { box-shadow: 0 0 0 4px rgba(74,222,128,0.15); }
  }

  .cw-header-actions { display: flex; gap: 4px; }
  .cw-icon-btn {
    width: 32px; height: 32px;
    border-radius: 8px;
    background: transparent; border: none;
    color: rgba(255,255,255,0.75); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 150ms ease, color 150ms ease;
  }
  .cw-icon-btn:hover { background: rgba(255,255,255,0.18); color: #fff; }
  .cw-icon-btn:active { background: rgba(255,255,255,0.1); }

  .cw-header-sub { margin-top: 10px; font-size: 12px; opacity: 0.75; font-weight: 400; position: relative; letter-spacing: 0.01em; }

  /* BODY */
  .cw-body {
    flex: 1;
    padding: 14px 12px;
    overflow-y: auto;
    background: var(--cw-bg);
    scroll-behavior: smooth;
  }
  .cw-body::-webkit-scrollbar { width: 4px; }
  .cw-body::-webkit-scrollbar-track { background: transparent; }
  .cw-body::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }

  /* MESSAGES */
  .cw-msg-row { display: flex; margin-bottom: 6px; animation: cw-msg-in 200ms ease forwards; }
  @keyframes cw-msg-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .cw-msg-row.user { justify-content: flex-end; }
  .cw-msg-row.bot  { justify-content: flex-start; }

  .cw-bubble {
    padding: 10px 14px;
    border-radius: 18px;
    font-size: 13.5px; line-height: 1.5;
    max-width: 78%;
    word-break: break-word;
  }
  .cw-bubble.user {
    background: linear-gradient(135deg, var(--cw-primary), color-mix(in srgb, var(--cw-primary) 70%, #000 30%));
    color: #fff;
    border-bottom-right-radius: 4px;
    box-shadow: 0 2px 8px rgba(var(--cw-primary-rgb), 0.25);
  }
  .cw-bubble.bot {
    background: #fff; color: #1e293b;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);
  }
  .cw-bubble.error { background: #fff0f0; color: #991b1b; border: 1px solid #fecaca; }
  .cw-bubble p { margin: 0; }
  .cw-bubble p + p { margin-top: 6px; }

  /* TYPING DOTS */
  .cw-typing {
    display: flex; align-items: center; gap: 4px;
    padding: 10px 14px;
    background: #fff;
    border-radius: 18px; border-bottom-left-radius: 4px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);
    width: fit-content; margin-bottom: 6px;
    animation: cw-msg-in 200ms ease forwards;
  }
  .cw-typing span {
    width: 7px; height: 7px;
    border-radius: 50%; background: #94a3b8;
    animation: cw-bounce 1.2s ease infinite;
  }
  .cw-typing span:nth-child(2) { animation-delay: 0.18s; }
  .cw-typing span:nth-child(3) { animation-delay: 0.36s; }
  @keyframes cw-bounce {
    0%, 60%, 100% { transform: translateY(0);   background: #94a3b8; }
    30%           { transform: translateY(-5px); background: #64748b; }
  }

  /* DATE CHIP */
  .cw-date { text-align: center; font-size: 11px; color: #94a3b8; font-weight: 500; margin: 8px 0; letter-spacing: 0.02em; }

  /* INPUT BAR */
  .cw-input-bar { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #fff; border-top: 1px solid #f0f0f0; }
  .cw-input {
    flex: 1; padding: 10px 14px;
    border-radius: 22px; border: 1.5px solid #e2e8f0;
    background: #f8fafc; outline: none;
    font-size: 13.5px; color: #1e293b;
    transition: border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
    font-family: inherit;
  }
  .cw-input::placeholder { color: #94a3b8; }
  .cw-input:focus {
    border-color: var(--cw-primary);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(var(--cw-primary-rgb), 0.1);
  }

  .cw-send {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--cw-primary), color-mix(in srgb, var(--cw-primary) 70%, #000 30%));
    color: #fff; border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0;
    transition: transform 200ms cubic-bezier(.34,1.56,.64,1), box-shadow 200ms ease, opacity 150ms ease;
    box-shadow: 0 2px 8px rgba(var(--cw-primary-rgb), 0.35);
  }
  .cw-send:hover { transform: scale(1.08); box-shadow: 0 4px 16px rgba(var(--cw-primary-rgb), 0.4); }
  .cw-send:active { transform: scale(0.93); }
  .cw-send:disabled { opacity: 0.45; transform: none; cursor: default; }

  /* FOOTER */
  .cw-footer { text-align: center; padding: 6px 12px 10px; font-size: 10.5px; color: #cbd5e1; background: #fff; letter-spacing: 0.01em; }
  .cw-footer strong { color: #94a3b8; font-weight: 600; }
`;

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export default function ChatWidget({ config }: { config: WidgetConfig }) {
  const botName   = config.name            || "Support";
  const position  = config.position        || "right";
  const placeholder = config.inputPlaceholder || "Ask something…";
  const subtitle  = config.headerSubtitle  || "Typically replies instantly";
  const poweredBy = config.poweredByLabel  !== undefined ? config.poweredByLabel : "YourBrand";
  const logoUrl   = config.logoUrl;
  const [isOpen,  setIsOpen]  = useState(config.openOnInit || false);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: config.welcomeMessage || `Hi there 👋 I'm **${botName}**. How can I help you today?`,
      sender: "bot",
      timestamp: new Date(),
    },
  ]);

  const endRef = useRef<HTMLDivElement>(null);

  // Memoize CSS vars to avoid rebuilding on every render
  const cssVars = useMemo(() => buildCssVars(config), [config]);

  // Auto-scroll to latest message when messages update or loading state changes
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      text: input.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Don not include the "welcome" (first message) message in the history sent to the backend
      const filteredMessages = messages.filter(m => m.id !== "welcome");
      const history = [...filteredMessages, userMsg].map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        content: m.text,
      }));
      const chatApiUrl = config.apiUrl + "/api/chat";
      
      const data = await chatApi(chatApiUrl, config.storeId, history);

      setMessages((m) => [
        ...m,
        {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          text: data.reply ?? data.message ?? "Sorry, I didn't get that.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          text: "⚠️ Couldn't reach the server. Please try again.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([{
      id: "welcome",
      text: config.welcomeMessage || `Hi there 👋 I'm **${botName}**. How can I help you today?`,
      sender: "bot",
      timestamp: new Date(),
    }]);
  };

  return (
    <div className="cw-root" style={{ [("--cw-vars" as any)]: cssVars } as React.CSSProperties}>
      {/* Inject styles + CSS vars */}
      <style>{`
        ${css}
        .cw-root { ${cssVars} }
      `}</style>

      {/* FAB */}
      <button
        className={`cw-fab pos-${position}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Toggle chat"
      >
        <MessageCircle
          size={22}
          className={`cw-fab-icon ${isOpen ? "hidden" : "visible"}`}
          style={{ position: isOpen ? "absolute" : "relative" }}
        />
        <X
          size={20}
          className={`cw-fab-icon ${isOpen ? "visible" : "hidden"}`}
          style={{ position: !isOpen ? "absolute" : "relative" }}
        />
      </button>

      {/* WIDGET */}
      {isOpen && (
        <div className={`cw-widget pos-${position}`}>
          {/* HEADER */}
          <div className="cw-header">
            <div className="cw-header-top">
              <div className="cw-header-left">
                <div className="cw-avatar">
                  {logoUrl
                    ? <img src={logoUrl} alt={botName} />
                    : botName[0].toUpperCase()}
                </div>
                <div className="cw-header-info">
                  <div className="cw-name">{botName}</div>
                  
                </div>
              </div>
              <div className="cw-header-actions">
                <button
                  className="cw-icon-btn"
                  onClick={clearConversation}
                  title="New Conversation"
                  aria-label="Clear conversation and start new chat"
                >
                  <SquarePen size={15} />
                </button>
                <button
                  className="cw-icon-btn"
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  aria-label="Close chat"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="cw-header-sub" role="doc-subtitle" aria-label={`Status: ${subtitle}`}>{subtitle}</div>
          </div>

          {/* MESSAGES */}
          <div className="cw-body">
            {messages.map((m, index) => {
              const previous = index > 0 ? messages[index - 1].timestamp : undefined;
              const timestamp = formatMessageTimestamp(m.timestamp, previous);
              return (
                <div key={m.id}>
                  {timestamp && <div className="cw-date" role="status" aria-live="polite">{timestamp}</div>}
                  <div className={`cw-msg-row ${m.sender}`} role="article" aria-label={`${m.sender === 'user' ? 'Your' : `${botName}'s`} message`}>
                    <div className={`cw-bubble ${m.sender}`}>
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="cw-typing" role="status" aria-label="Bot is typing..." aria-live="polite">
                <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* INPUT */}
          <form className="cw-input-bar" onSubmit={sendMessage}>
            <input
              className="cw-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
              aria-label="Message input"
            />
            <button
              className="cw-send"
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>

          {/* FOOTER */}
          {poweredBy && (
            <div className="cw-footer">
              Powered by <strong>{poweredBy}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}