import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { ApiError, api } from "../lib/api";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type ChatbotResponse = {
  sessionId?: string | null;
  reply: string;
  model: string;
  provider: string;
  usedStub: boolean;
  suggestions?: string[];
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

const quickActions = [
  "🏠 How do I book a hostel?",
  "💰 What payment methods?",
  "❌ How to cancel a booking?",
  "🛏️ Room types available",
  "📍 Hostels near Kirinyaga University",
  "📶 What amenities are common?",
];

const createMessageId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const buildAssistantMessage = (content: string): Message => ({
  id: createMessageId(),
  role: "assistant",
  content,
  timestamp: new Date(),
});

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

  const sendMessage = async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const userMsg: Message = {
      id: createMessageId(),
      role: "user",
      content: trimmedText,
      timestamp: new Date(),
    };

    const history = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSuggestions([]);
    setIsTyping(true);

    try {
      const response = await api.post<ChatbotResponse>(
        "/chatbot/message",
        {
          sessionId,
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

      const nextSessionId = response.sessionId ?? sessionId;
      setSessionId(nextSessionId);
      if (nextSessionId) {
        localStorage.setItem(CHATBOT_SESSION_KEY, nextSessionId);
      }
      setSuggestions(response.suggestions ?? []);
      setMessages((prev) => [...prev, buildAssistantMessage(response.reply)]);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "The chatbot is unavailable right now. Please try again in a moment.";

      setMessages((prev) => [
        ...prev,
        buildAssistantMessage(`I couldn't complete that request right now.\n\n${message}`),
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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
              className="flex items-center justify-center h-14 w-14 rounded-full gradient-hero shadow-hero hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="h-6 w-6 text-primary-foreground" />
            </button>
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent border-2 border-background animate-pulse" />
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
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] max-h-[600px] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 gradient-hero">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-sm text-primary-foreground">Smart Hostel Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <p className="text-xs text-primary-foreground/70">Online · Live backend replies</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
                aria-label="Close Chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 max-h-[380px] overflow-y-auto" ref={scrollRef}>
              <div className="p-4 space-y-4">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={idx > 0 ? { opacity: 0, y: 8 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className="relative flex shrink-0 overflow-hidden rounded-full h-7 w-7 mt-0.5">
                      <div
                        className={`flex h-full w-full items-center justify-center rounded-full ${
                          msg.role === "assistant"
                            ? "bg-primary/10 text-primary"
                            : "bg-accent/10 text-accent/80"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <Bot className="h-3.5 w-3.5" />
                        ) : (
                          <User className="h-3.5 w-3.5" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 max-w-[78%]">
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "gradient-hero text-primary-foreground rounded-br-md"
                            : "bg-secondary text-secondary-foreground rounded-bl-md"
                        }`}
                      >
                        {renderContent(msg.content)}
                      </div>
                      <span className={`text-[10px] text-muted-foreground ${msg.role === "user" ? "text-right" : ""}`}>
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
                    <div className="relative flex shrink-0 overflow-hidden rounded-full h-7 w-7">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                        <span className="text-xs text-muted-foreground ml-1">Thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Quick Actions</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickActions.map((action) => (
                    <button
                      key={action}
                      onClick={() => void sendMessage(action)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border bg-background text-foreground hover:bg-secondary hover:border-primary/20 transition-all"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="px-4 pb-2">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Suggestions</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => void sendMessage(suggestion)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border bg-background text-foreground hover:bg-secondary hover:border-primary/20 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-card flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about hostels, payments, bookings..."
                className="flex-1 rounded-full text-sm h-10 border border-input bg-background px-4 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:border-primary/50"
                disabled={isTyping}
              />
              <button
                type="submit"
                aria-label="Send Message"
                disabled={!input.trim() || isTyping}
                className="h-10 w-10 flex items-center justify-center rounded-full gradient-hero shrink-0 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 text-primary-foreground" />
              </button>
            </form>

            <div className="px-4 py-2 border-t border-border bg-secondary/30 text-center">
              <p className="text-[10px] text-muted-foreground">
                Powered by <span className="font-semibold text-foreground">Smart Hostel Finder</span> · Live AI assistant
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
