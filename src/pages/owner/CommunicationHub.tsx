import { useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { Send, Search, Phone, Mail } from 'lucide-react';

// TODO: Replace with real API data
const mockConversations = [
  { id: 'C001', tenant: 'Brian Ochieng', lastMessage: 'When will the plumber come?', time: '2 min ago', unread: 2, avatar: 'B' },
  { id: 'C002', tenant: 'Faith Wanjiku', lastMessage: 'Thank you for fixing the socket!', time: '1 hr ago', unread: 0, avatar: 'F' },
  { id: 'C003', tenant: 'Kevin Mutua', lastMessage: 'Is the WiFi going to be fixed today?', time: '3 hrs ago', unread: 1, avatar: 'K' },
  { id: 'C004', tenant: 'Mercy Akinyi', lastMessage: 'I sent the rent via M-Pesa', time: 'Yesterday', unread: 0, avatar: 'M' },
  { id: 'C005', tenant: 'Samuel Kiprop', lastMessage: 'Can I move to a bigger room?', time: '2 days ago', unread: 0, avatar: 'S' },
];

export function CommunicationHub() {
  const [selectedChat, setSelectedChat] = useState(mockConversations[0]);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const chatMessages = [
    { sender: 'tenant', text: 'Hello, I have an issue with the plumbing in my room.', time: '9:30 AM' },
    { sender: 'owner', text: 'Hi Brian! Sorry to hear that. Can you describe the issue?', time: '9:35 AM' },
    { sender: 'tenant', text: 'The tap in the bathroom is leaking badly. Water is pooling on the floor.', time: '9:36 AM' },
    { sender: 'owner', text: "I'll send our plumber John right away. He should be there within the hour.", time: '9:40 AM' },
    { sender: 'tenant', text: 'When will the plumber come?', time: '10:15 AM' },
  ];

  const filtered = mockConversations.filter(c => c.tenant.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Communication Hub</h1>
          <p className="text-muted-foreground text-sm mt-1">Chat with your tenants</p>
        </div>

        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden" style={{ height: 'calc(100vh - 240px)' }}>
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-80 border-r border-border flex flex-col shrink-0">
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats..." className="w-full pl-9 pr-4 py-2 rounded-lg bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filtered.map(conv => (
                  <button key={conv.id} onClick={() => setSelectedChat(conv)} className={`w-full p-3 flex items-start gap-3 hover:bg-secondary/50 transition-colors text-left ${selectedChat.id === conv.id ? 'bg-primary/5 border-r-2 border-primary' : ''}`}>
                    <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold shrink-0">{conv.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{conv.tenant}</span>
                        <span className="text-[10px] text-muted-foreground">{conv.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                    {conv.unread > 0 && <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">{conv.unread}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-sm">{selectedChat.avatar}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedChat.tenant}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Online</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg hover:bg-secondary transition-colors"><Phone size={16} className="text-muted-foreground" /></button>
                  <button className="p-2 rounded-lg hover:bg-secondary transition-colors"><Mail size={16} className="text-muted-foreground" /></button>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`flex ${msg.sender === 'owner' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${msg.sender === 'owner' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-secondary text-foreground rounded-tl-sm'}`}>
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender === 'owner' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{msg.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 py-2.5 px-4 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" onKeyDown={e => e.key === 'Enter' && setMessage('')} />
                  <button onClick={() => setMessage('')} className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"><Send size={18} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
