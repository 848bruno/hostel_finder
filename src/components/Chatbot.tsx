import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const quickActions = [
  "🏠 How do I book a hostel?",
  "💰 What payment methods?",
  "❌ How to cancel a booking?",
  "🛏️ Room types available",
  "📍 Hostels near my campus",
  "📶 What amenities are common?",
];

const getSimulatedResponse = (input: string): string => {
  const lower = input.toLowerCase();

  if (lower.includes("book") || lower.includes("reserve")) {
    return "To book a hostel:\n\n1. Browse hostels from the **Search** page\n2. Click on a hostel to view details\n3. Select your preferred room type\n4. Click **Book Now** and choose your stay duration\n5. Pay the deposit + first month's rent to confirm\n\nNeed help finding a specific hostel?";
  }
  if (lower.includes("payment") || lower.includes("pay") || lower.includes("mpesa")) {
    return "We accept the following payment methods:\n\n• **M-Pesa** (Safaricom)\n• **Airtel Money**\n• **Bank Transfer**\n• **Visa/Mastercard**\n\nA **refundable deposit** (equal to 1 month's rent) plus the **first month's rent** is required to secure your booking. Service fee is 2%.";
  }
  if (lower.includes("cancel") || lower.includes("refund")) {
    return "To cancel a booking:\n\n1. Go to **My Bookings**\n2. Find the booking you want to cancel\n3. Click **Cancel Booking**\n\n**Refund Policy:**\n• Cancel within 24hrs → Full refund\n• Cancel within 7 days → 80% refund\n• After 7 days → Deposit forfeited\n\nDeposits are refundable upon move-out inspection.";
  }
  if (lower.includes("room") || lower.includes("type") || lower.includes("single") || lower.includes("double") || lower.includes("shared")) {
    return "We offer several room types:\n\n🛏️ **Single Room** – Private room for one person\n👥 **Double Room** – Shared by two people\n🏠 **Bedsitter** – Self-contained with kitchenette\n🏢 **Studio** – Open-plan with separate bathroom\n\nEach hostel may offer different configurations. Check the hostel details page for available rooms, amenities, and pricing.";
  }
  if (lower.includes("amenit") || lower.includes("wifi") || lower.includes("water") || lower.includes("electric")) {
    return "Common amenities include:\n\n• 📶 **Wi-Fi** – Available in most hostels\n• 💧 **Water** – 24/7 supply (some have backup tanks)\n• ⚡ **Electricity** – With backup generator\n• 🔒 **Security** – CCTV, guards, gated access\n• 🧹 **Cleaning** – Common areas cleaned daily\n\nCheck each hostel's detail page for specific amenities.";
  }
  if (lower.includes("location") || lower.includes("near") || lower.includes("close to") || lower.includes("university") || lower.includes("campus")) {
    return "You can filter hostels by proximity to your university! Use the **Search** page and select your institution from the dropdown. We list hostels near major universities across Kenya including UoN, KU, JKUAT, Moi, Kirinyaga University, and more.\n\nYou can also switch to **Map View** to see hostels plotted near your campus gate.";
  }
  if (lower.includes("complaint") || lower.includes("issue") || lower.includes("problem") || lower.includes("report")) {
    return "Sorry to hear you're having an issue! Here's how to get help:\n\n1. **Maintenance issues** → Contact your hostel owner through the booking details\n2. **Payment disputes** → Go to **Settings > Help & Support**\n3. **Safety concerns** → Call our emergency line or report through the app\n\nWe aim to resolve all complaints within 48 hours.";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("howdy")) {
    return "Hey there! 👋 Welcome to Smart Hostel Finder! I'm your assistant and I can help you with:\n\n🏠 Finding and booking hostels\n💰 Payment questions\n📋 Booking management\n🔧 Support & troubleshooting\n\nWhat would you like help with?";
  }
  if (lower.includes("thank") || lower.includes("thanks")) {
    return "You're welcome! 😊 Feel free to ask if you need anything else. Happy hostel hunting! 🏠";
  }
  if (lower.includes("compare")) {
    return "You can compare up to **3 hostels** side by side! Go to the **Compare** page from the sidebar, select the hostels you want to compare, and see them compared on:\n\n• Price\n• Distance from campus\n• Amenities\n• Student ratings\n\nIt's the best way to make an informed decision!";
  }

  return "I can help you with:\n\n🏠 **Hostel search & booking** – Finding the perfect place\n💰 **Payments** – Methods, deposits, and fees\n📋 **Booking management** – Cancellations and changes\n🔧 **Support** – Complaints and issues\n📊 **Compare** – Side-by-side hostel comparison\n\nTry asking something specific, or tap one of the quick actions!";
};

// Simple markdown-like renderer
const renderContent = (content: string) => {
  return content.split('\n').map((line, lineIdx) => {
    if (line.trim() === '') return <br key={lineIdx} />;

    // Process bold markers
    const parts = line.split(/(\*\*.*?\*\*)/);
    const rendered = parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );

    // Bullet points
    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
      return <div key={lineIdx} className="pl-1">{rendered}</div>;
    }
    // Numbered lists
    if (/^\d+\./.test(line.trim())) {
      return <div key={lineIdx} className="pl-1">{rendered}</div>;
    }

    return <div key={lineIdx}>{rendered}</div>;
  });
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi there! 👋 I'm your Smart Hostel Finder assistant. I can help with hostel search, bookings, payments, and more.\n\nWhat would you like help with?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getSimulatedResponse(text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Chat Button */}
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
              className="flex items-center justify-center h-14 w-14 rounded-full gradient-hero shadow-hero hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="h-6 w-6 text-primary-foreground" />
            </button>
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent border-2 border-background animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] max-h-[600px] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 gradient-hero">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-sm text-primary-foreground">Smart Hostel Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <p className="text-xs text-primary-foreground/70">Online · Instant replies</p>
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

            {/* Messages */}
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

                {/* Typing indicator */}
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
                        <span className="text-xs text-muted-foreground ml-1">Typing...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Quick Actions</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickActions.map((action) => (
                    <button
                      key={action}
                      onClick={() => sendMessage(action)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border bg-background text-foreground hover:bg-secondary hover:border-primary/20 transition-all"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
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
                disabled={!input.trim() || isTyping}
                className="h-10 w-10 flex items-center justify-center rounded-full gradient-hero shrink-0 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 text-primary-foreground" />
              </button>
            </form>

            {/* Footer branding */}
            <div className="px-4 py-2 border-t border-border bg-secondary/30 text-center">
              <p className="text-[10px] text-muted-foreground">
                Powered by <span className="font-semibold text-foreground">Smart Hostel Finder</span> · AI version coming soon
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
