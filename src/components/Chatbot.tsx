import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Sparkles, ChevronDown, ChevronUp, Copy, Check, PencilLine } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { ApiError, api } from "../lib/api";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  meta?: {
    usedFallback?: boolean;
    fallbackReason?: string | null;
    sources?: string[];
  };
};

type ChatbotResponse = {
  sessionId?: string | null;
  reply: string;
  model: string;
  provider: string;
  usedStub: boolean;
  usedFallback?: boolean;
  fallbackReason?: string | null;
  suggestions?: string[];
  sources?: string[];
};

type StoredSession = {
  sessionId: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
  }>;
};

const CHATBOT_SESSION_KEY = "shf_chatbot_session_id";

const quickActionsByRole = {
  guest: [
    "🏠 How do I book a hostel?",
    "💰 What payment methods?",
    "📍 Hostels near Kirinyaga University",
    "📶 What amenities are common?",
  ],
  student: [
    "🧾 Show my recent booking guidance",
    "💳 Why is my payment pending?",
    "⭐ What are my favorite hostels?",
    "⚖️ Compare two hostels on price and amenities",
  ],
  owner: [
    "🏢 How many hostels do I have?",
    "📉 Which of my hostels have low room availability?",
    "⏳ Which of my hostels are pending approval?",
    "🔓 Show unpaid bookings I can release",
  ],
  admin: [
    "📊 Show admin dashboard stats",
    "🧾 How many pending owners are there?",
    "🏨 How many pending hostels are there?",
    "🛟 What is the current support load?",
  ],
} as const;

const createMessageId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const buildAssistantMessage = (
  content: string,
  meta?: Message["meta"]
): Message => ({
  id: createMessageId(),
  role: "assistant",
  content,
  timestamp: new Date(),
  meta,
});

const copyToClipboard = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

const sourceLabelMap: Record<string, string> = {
  live_platform_snapshot: "live platform data",
  resolved_hostel_match: "live hostel data",
  live_student_context: "your student context",
  recent_bookings: "your bookings",
  favorites: "your favorites",
  payment_methods: "payment rules",
  live_owner_context: "your owner context",
  owner_stats: "owner stats",
  owner_room_stats: "owner room stats",
  admin_dashboard_stats: "admin dashboard data",
  university_coverage: "university coverage",
  city_coverage: "city coverage",
  hostel_details: "hostel details",
  hostel_availability: "room availability",
  hostel_pricing: "hostel pricing",
  hostel_amenities: "hostel amenities",
  hostel_location: "hostel location",
  hostel_rating: "hostel rating",
};

const describeSources = (sources?: string[]) => {
  if (!Array.isArray(sources) || sources.length === 0) return null;

  const labels = [...new Set(
    sources
      .map((source) => sourceLabelMap[source] || source.replace(/_/g, " "))
      .filter(Boolean)
  )].slice(0, 3);

  if (labels.length === 0) return null;

  return `Based on ${labels.join(", ")}.`;
};

const renderContent = (content: string) => {
  return content.split("\n").map((line, lineIdx) => {
    if (line.trim() === "") return <br key={lineIdx} />;

    const parts = line.split(/(\*\*.*?\*\*)/);
    const rendered = parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );

    if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
      return (
        <div key={lineIdx} className="pl-1">
          {rendered}
        </div>
      );
    }

    if (/^\d+\./.test(line.trim())) {
      return (
        <div key={lineIdx} className="pl-1">
          {rendered}
        </div>
      );
    }

    return <div key={lineIdx}>{rendered}</div>;
  });
};

const Chatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi there! 👋 I'm your Smart Hostel Finder assistant. I can help with hostel search, bookings, payments, and more.\n\nWhat would you like help with?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedSessionId = localStorage.getItem(CHATBOT_SESSION_KEY);
    if (!savedSessionId) {
      return;
    }

    let isCancelled = false;

    void api
      .get<StoredSession>(`/chatbot/sessions/${savedSessionId}`, { timeoutMs: 10000 })
      .then((session) => {
        if (isCancelled) {
          return;
        }

        if (!Array.isArray(session.messages) || session.messages.length === 0) {
          setSessionId(session.sessionId);
          return;
        }

        setSessionId(session.sessionId);
        setMessages(
          session.messages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            timestamp: new Date(message.createdAt),
          }))
        );
      })
      .catch(() => {
        if (!isCancelled) {
          localStorage.removeItem(CHATBOT_SESSION_KEY);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, suggestions]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (
    text: string,
    options?: {
      historyOverride?: Array<{ role: "user" | "assistant"; content: string }>;
      replaceFromIndex?: number | null;
      sessionIdOverride?: string | null;
      messageIdOverride?: string;
    }
  ) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const userMsg: Message = {
      id: options?.messageIdOverride ?? createMessageId(),
      role: "user",
      content: trimmedText,
      timestamp: new Date(),
    };

    const history =
      options?.historyOverride ??
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

    const replaceFromIndex = options?.replaceFromIndex;
    const draftSessionId = options?.sessionIdOverride === undefined ? sessionId : options.sessionIdOverride;

    if (replaceFromIndex !== undefined && replaceFromIndex !== null) {
      setMessages((prev) => [...prev.slice(0, replaceFromIndex), userMsg]);
    } else {
      setMessages((prev) => [...prev, userMsg]);
    }

    setInput("");
    setSuggestions([]);
    setShowAllSuggestions(false);
    setEditingMessageId(null);
    setIsTyping(true);

    try {
      const response = await api.post<ChatbotResponse>(
        "/chatbot/message",
        {
          sessionId: draftSessionId,
          message: trimmedText,
          user: user
            ? {
                id: user.id,
                role: user.role,
              }
            : {
                role: "guest",
              },
          history,
          context: {
            app: "Smart Hostel Finder",
            channel: "web-chat-widget",
            primaryUniversity: "Kirinyaga University",
            primaryUniversityNote: "Kirinyaga University is the main test university for this system, but the assistant can still discuss other universities generally.",
            universityAliases: ["KyU", "Kirinyaga University"],
          },
        },
        { timeoutMs: 30000 }
      );

      const nextSessionId = response.sessionId ?? draftSessionId;
      setSessionId(nextSessionId);
      if (nextSessionId) {
        localStorage.setItem(CHATBOT_SESSION_KEY, nextSessionId);
      }
      setSuggestions(response.suggestions ?? []);
      setShowAllSuggestions(false);
      const assistantMessage = buildAssistantMessage(response.reply, {
        usedFallback: response.usedFallback,
        fallbackReason: response.fallbackReason,
        sources: response.sources ?? [],
      });
      if (replaceFromIndex !== undefined && replaceFromIndex !== null) {
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "The chatbot is unavailable right now. Please try again in a moment.";

      const fallbackMessage = buildAssistantMessage(`I couldn't complete that request right now.\n\n${message}`);
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleStartEdit = (messageId: string) => {
    const target = messages.find((message) => message.id === messageId && message.role === "user");
    if (!target || isTyping) {
      return;
    }

    setEditingMessageId(messageId);
    setInput(target.content);
    setSuggestions([]);
    setShowAllSuggestions(false);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await copyToClipboard(content);
      setCopiedMessageId(messageId);
      window.setTimeout(() => {
        setCopiedMessageId((current) => (current === messageId ? null : current));
      }, 1800);
    } catch {
      setCopiedMessageId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingMessageId) {
      const targetIndex = messages.findIndex((message) => message.id === editingMessageId);
      if (targetIndex >= 0) {
        const priorHistory = messages.slice(0, targetIndex).map((message) => ({
          role: message.role,
          content: message.content,
        }));
        setSessionId(null);
        localStorage.removeItem(CHATBOT_SESSION_KEY);
        void sendMessage(input, {
          historyOverride: priorHistory,
          replaceFromIndex: targetIndex,
          sessionIdOverride: null,
          messageIdOverride: editingMessageId,
        });
        return;
      }
    }

    void sendMessage(input);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setInput("");
    inputRef.current?.focus();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const visibleSuggestions = showAllSuggestions ? suggestions : suggestions.slice(0, 2);
  const hiddenSuggestionCount = Math.max(0, suggestions.length - visibleSuggestions.length);
  const userModeLabel =
    user?.role === "owner"
      ? "Owner mode"
      : user?.role === "admin"
        ? "Admin mode"
        : user?.role === "student"
          ? "Student mode"
          : "Guest mode";
  const roleQuickActions =
    user?.role === "owner"
      ? quickActionsByRole.owner
      : user?.role === "admin"
        ? quickActionsByRole.admin
        : user?.role === "student"
          ? quickActionsByRole.student
          : quickActionsByRole.guest;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={() => setIsOpen(true)}
              aria-label="Open Chat"
              className="group relative flex h-16 w-16 items-center justify-center rounded-[1.4rem] gradient-hero shadow-[0_18px_45px_rgba(12,84,72,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(12,84,72,0.38)]"
            >
              <div className="absolute inset-[1px] rounded-[1.28rem] bg-white/10 opacity-70" />
              <MessageCircle className="relative h-6 w-6 text-primary-foreground" />
            </button>
            <div className="pointer-events-none absolute -left-24 top-1/2 hidden -translate-y-1/2 rounded-full border border-border/70 bg-background/95 px-3 py-1 text-[11px] font-medium text-foreground shadow-lg backdrop-blur md:block">
              Ask Smart Hostel
            </div>
            <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-background bg-accent animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 flex max-h-[680px] w-[420px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-background/95 shadow-[0_28px_80px_rgba(15,23,42,0.25)] backdrop-blur-xl"
          >
            <div className="relative overflow-hidden border-b border-white/10 px-5 pb-5 pt-4 gradient-hero">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_42%)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/16 shadow-inner shadow-white/10">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-heading text-sm font-semibold tracking-wide text-primary-foreground">Smart Hostel Assistant</h3>
                      <p className="mt-1 text-xs leading-relaxed text-primary-foreground/78">
                        Hostel search, bookings, payments, and grounded platform help in one thread.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-primary-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                        Live replies
                      </span>
                      <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-primary-foreground/86">
                        {userModeLabel}
                      </span>
                      {sessionId && (
                        <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-primary-foreground/86">
                          Session active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/16 bg-white/10 text-primary-foreground transition-colors hover:bg-white/20"
                  aria-label="Close Chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(244,248,247,0.96),rgba(255,255,255,0.98))]" ref={scrollRef}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.07),transparent_30%)]" />
              <div className="relative space-y-5 px-4 py-5">
                {messages.length <= 1 && (
                  <div className="rounded-[1.6rem] border border-white/75 bg-white/78 p-4 shadow-[0_16px_40px_rgba(148,163,184,0.14)] backdrop-blur">
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                      <Sparkles className="h-3.5 w-3.5" />
                      Quick Start
                    </div>
                    <p className="mb-4 max-w-[32ch] text-sm leading-relaxed text-slate-700">
                      Ask directly, or start with one of these {userModeLabel.toLowerCase()} shortcuts to get grounded answers faster.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {roleQuickActions.map((action) => (
                        <button
                          key={action}
                          onClick={() => void sendMessage(action)}
                          className="rounded-2xl border border-slate-200/80 bg-slate-50/85 px-3 py-3 text-left text-xs font-medium text-slate-700 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:bg-white hover:shadow-sm"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={idx > 0 ? { opacity: 0, y: 8 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-end gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className="relative mt-0.5 flex h-8 w-8 shrink-0 overflow-hidden rounded-2xl">
                      <div
                        className={`flex h-full w-full items-center justify-center rounded-2xl ${
                          msg.role === "assistant"
                            ? "bg-primary/12 text-primary shadow-inner shadow-primary/5"
                            : "bg-slate-900 text-white"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <Bot className="h-3.5 w-3.5" />
                        ) : (
                          <User className="h-3.5 w-3.5" />
                        )}
                      </div>
                    </div>
                    <div className={`flex max-w-[82%] flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className={`rounded-[1.4rem] px-4 py-3 text-sm leading-relaxed shadow-[0_10px_32px_rgba(15,23,42,0.08)] ${
                          msg.role === "user"
                            ? "rounded-br-md gradient-hero text-primary-foreground"
                            : "rounded-bl-md border border-white/90 bg-white/90 text-slate-700"
                        }`}
                      >
                        {renderContent(msg.content)}
                      </div>
                      {msg.role === "assistant" && msg.meta && (
                        <div className="flex flex-wrap items-center gap-1.5 px-1 text-[10px] text-slate-500">
                          {msg.meta.usedFallback ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                              Fallback guidance
                            </span>
                          ) : msg.meta.sources && msg.meta.sources.length > 0 ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                              Grounded reply
                            </span>
                          ) : null}
                          {msg.meta.fallbackReason && (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-600">
                              {msg.meta.fallbackReason.replace(/_/g, " ")}
                            </span>
                          )}
                          {describeSources(msg.meta.sources) && (
                            <span>{describeSources(msg.meta.sources)}</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 px-1 text-[10px] text-slate-400">
                        <button
                          type="button"
                          onClick={() => void handleCopyMessage(msg.id, msg.content)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-2 py-1 font-medium text-slate-500 transition-colors hover:border-primary/20 hover:text-primary"
                          aria-label={`Copy ${msg.role} message`}
                        >
                          {copiedMessageId === msg.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copiedMessageId === msg.id ? "Copied" : "Copy"}
                        </button>
                        {msg.role === "user" && !isTyping && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(msg.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-2 py-1 font-medium text-slate-500 transition-colors hover:border-primary/20 hover:text-primary"
                            aria-label="Edit prompt"
                          >
                            <PencilLine className="h-3 w-3" />
                            Edit
                          </button>
                        )}
                      </div>
                      <span className="px-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2.5"
                  >
                    <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-2xl">
                      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-primary/12 text-primary">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="rounded-[1.35rem] rounded-bl-md border border-white/90 bg-white/88 px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary/35 animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-primary/35 animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-primary/35 animate-bounce [animation-delay:300ms]" />
                        <span className="ml-1 text-xs font-medium text-slate-500">Thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="border-t border-border/70 bg-white/86 px-4 py-3 backdrop-blur">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Try Next</p>
                    <p className="mt-0.5 text-xs text-slate-500">Optional follow-ups based on the last answer.</p>
                  </div>
                  {suggestions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setShowAllSuggestions((prev) => !prev)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-primary/20 hover:text-primary"
                    >
                      {showAllSuggestions ? "Less" : `More ${hiddenSuggestionCount}`}
                      {showAllSuggestions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {visibleSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => void sendMessage(suggestion)}
                      className="shrink-0 rounded-full border border-slate-200 bg-slate-50/90 px-3.5 py-2 text-xs font-medium text-slate-700 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white hover:text-primary"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border/70 bg-white/92 px-4 pb-4 pt-3 backdrop-blur">
              <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-[1.5rem] border border-slate-200/80 bg-slate-50/90 p-2 shadow-[0_12px_32px_rgba(148,163,184,0.12)]">
                <div className="flex-1 px-2">
                  <div className="mb-1 flex items-center gap-2 text-[11px] font-medium text-slate-500">
                    <Sparkles className="h-3.5 w-3.5 text-primary/70" />
                    {editingMessageId ? "Editing your prompt before sending again" : "Ask about hostels, bookings, payments, or support"}
                  </div>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about hostels, payments, bookings..."
                    className="h-10 w-full bg-transparent px-1 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    disabled={isTyping}
                  />
                </div>
                {editingMessageId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="mb-0.5 inline-flex h-11 items-center justify-center rounded-[1.1rem] border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  aria-label={editingMessageId ? "Save Prompt Edit" : "Send Message"}
                  disabled={!input.trim() || isTyping}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] gradient-hero shadow-[0_14px_28px_rgba(12,84,72,0.24)] transition-all hover:-translate-y-0.5 hover:opacity-95 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 text-primary-foreground" />
                </button>
              </form>

              <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-slate-400">
                <p>
                  Powered by <span className="font-semibold text-slate-600">Smart Hostel Finder</span>
                </p>
                <p>Live AI assistant</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
