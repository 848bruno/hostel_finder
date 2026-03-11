import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Building2,
  Search,
  Shield,
  Star,
  ArrowRight,
  CheckCircle2,
  Home,
  Sun,
  Moon,
  MapPin,
  MessageCircle,
  CreditCard,
  Users,
  ChevronRight,
  Sparkles,
  Navigation,
  Bot,
  GraduationCap,
} from 'lucide-react';

const features = [
  { icon: Shield, title: 'Verified Owners', desc: 'Every hostel owner is document-verified so you can book with total confidence.' },
  { icon: Search, title: 'Smart Search & Filter', desc: 'Sort by distance from your campus gate, price range, amenities, and student ratings.' },
  { icon: Star, title: 'Student Reviews', desc: 'Honest reviews from real students—rate and compare before you commit.' },
  { icon: CreditCard, title: 'Secure M-Pesa Payments', desc: 'Book and pay instantly via M-Pesa or card. No cash, no stress.' },
  { icon: Users, title: 'Side-by-Side Comparison', desc: 'Compare up to 3 hostels on price, distance, amenities, and ratings.' },
  { icon: Building2, title: 'Real-Time Vacancy', desc: 'See live room availability—owners toggle vacancies in real time.' },
];

const stats = [
  { value: '10,000+', label: 'Students Housed' },
  { value: '500+', label: 'Verified Hostels' },
  { value: '50+', label: 'Universities Covered' },
  { value: '98%', label: 'Satisfaction Rate' },
];

const universities = [
  'University of Nairobi', 'Kenyatta University', 'JKUAT', 'Moi University',
  'Kirinyaga University', 'Egerton University', 'Maseno University', 'Dedan Kimathi University',
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Landing() {
  const { theme, setTheme } = useTheme();
  const handleBrandClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <nav className="fixed w-full top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" onClick={handleBrandClick} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center">
                <Home size={18} className="text-primary-foreground" />
              </div>
              <span className="text-xl font-heading font-bold text-foreground">Smart Hostel Finder</span>
            </Link>
            <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#map" className="hover:text-foreground transition-colors">Map</a>
              <a href="#chatbot" className="hover:text-foreground transition-colors">AI Assistant</a>
              <a href="#universities" className="hover:text-foreground transition-colors">Universities</a>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-xl hover:bg-secondary transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} className="text-muted-foreground" /> : <Moon size={18} className="text-muted-foreground" />}
              </button>
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                Login
              </Link>
              <Link to="/register" className="px-5 py-2.5 gradient-hero text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-hero">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 px-4">
        <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.span
                variants={fadeUp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
              >
                <Sparkles size={14} />
                Kenya&apos;s #1 Student Accommodation Platform
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-foreground leading-[1.1] mb-6"
              >
                Find Hostels
                <br />
                <span className="text-gradient">Near Your Campus</span>
                <br />
                In Seconds
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-lg leading-relaxed mb-8">
                Interactive map view, AI-powered chatbot, verified owners, and instant M-Pesa booking—designed for university students across Kenya.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register?role=student"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 gradient-hero text-primary-foreground rounded-2xl text-lg font-semibold hover:opacity-90 transition-opacity shadow-hero"
                >
                  <MapPin size={20} />
                  Explore Hostels
                </Link>
                <Link
                  to="/register?role=owner"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-card text-foreground rounded-2xl text-lg font-semibold border-2 border-border hover:border-primary/40 transition-colors shadow-card"
                >
                  List Your Hostel
                  <ArrowRight size={20} />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="rounded-3xl bg-card border border-border shadow-hero p-6 space-y-4">
                <div className="rounded-2xl border border-primary/20 h-48 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5" />
                  <div className="relative flex flex-col items-center gap-2 text-primary">
                    <Navigation size={32} />
                    <span className="text-sm font-semibold">Interactive Map View</span>
                    <span className="text-xs text-muted-foreground">Hostels near any Kenyan university</span>
                  </div>
                  <div className="absolute top-6 left-12 w-3 h-3 rounded-full bg-accent animate-pulse" />
                  <div className="absolute top-16 right-16 w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <div className="absolute bottom-12 left-1/3 w-3 h-3 rounded-full bg-destructive animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Campus View Hostel', dist: '200m', price: 'KES 8,000/mo', color: 'bg-accent/10 text-accent' },
                    { name: 'Sunrise Apartments', dist: '450m', price: 'KES 6,500/mo', color: 'bg-primary/10 text-primary' },
                  ].map((h) => (
                    <div key={h.name} className="rounded-xl border border-border bg-background p-3 space-y-1">
                      <span className="text-xs font-bold text-foreground">{h.name}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin size={10} /> {h.dist} from gate
                      </div>
                      <span className={`text-xs font-semibold ${h.color}`}>{h.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 border-y border-border bg-card/60">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-heading font-extrabold text-gradient">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              Platform Features
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
              Everything You Need, One Platform
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              From discovering hostels on a live map to booking via M-Pesa—built for university students and hostel owners across Kenya.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="group bg-card rounded-2xl p-7 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border"
              >
                <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <f.icon size={22} className="text-primary-foreground" />
                </div>
                <h3 className="text-base font-heading font-bold text-card-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="map" className="py-24 px-4 bg-card/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider mb-4">
                <MapPin size={12} /> Interactive Map
              </span>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                See Every Hostel Around Your Campus on a Live Map
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our Leaflet-powered map shows every verified hostel near your university&apos;s main gate. Filter by walking distance radius, see vacancy status with color-coded markers, and get directions—all without leaving the app.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Color-coded pins: green = available, red = full',
                  'Radius filter from your campus gate (500m–2km)',
                  'Click any pin for price, rating & quick booking',
                  'Toggle between map and grid views instantly',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 size={16} className="text-accent mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register?role=student"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Try the Map View <ChevronRight size={16} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl border border-border bg-card shadow-hero overflow-hidden"
            >
              <div className="h-80 md:h-96 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5" />
                <div className="relative flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full gradient-accent flex items-center justify-center shadow-lg">
                    <Navigation size={36} className="text-accent-foreground" />
                  </div>
                  <span className="font-heading font-bold text-foreground text-lg">Live Hostel Map</span>
                  <span className="text-xs text-muted-foreground">Works for any campus in Kenya</span>
                </div>
                <div className="absolute top-12 left-16 flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] text-muted-foreground">Available</span>
                </div>
                <div className="absolute top-24 right-20 flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                  <span className="text-[10px] text-muted-foreground">Full</span>
                </div>
                <div className="absolute bottom-16 left-1/4 flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] text-muted-foreground">200m away</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="chatbot" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="order-2 lg:order-1 rounded-3xl border border-border bg-card shadow-hero overflow-hidden"
            >
              <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center">
                  <Bot size={16} className="text-primary-foreground" />
                </div>
                <div>
                  <span className="text-sm font-heading font-bold text-foreground">Smart Hostel Assistant</span>
                  <span className="block text-[10px] text-accent font-medium">● Online</span>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full gradient-hero flex items-center justify-center shrink-0 mt-1">
                    <Bot size={12} className="text-primary-foreground" />
                  </div>
                  <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                    <p className="text-sm text-foreground">Hi! 👋 Which university are you studying at? I&apos;ll find hostels near your campus.</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="gradient-hero rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                    <p className="text-sm text-primary-foreground">I&apos;m at Kenyatta University. Budget under KES 8,000</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full gradient-hero flex items-center justify-center shrink-0 mt-1">
                    <Bot size={12} className="text-primary-foreground" />
                  </div>
                  <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                    <p className="text-sm text-foreground">I found 5 hostels under KES 8,000 near KU! 🏠 Shall I show them on the map?</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="order-1 lg:order-2"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
                <MessageCircle size={12} /> AI-Powered
              </span>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                Ask the Chatbot, Get Instant Answers
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our smart assistant understands natural language. Tell it your university, budget, and preferences—and get accurate, real-time hostel recommendations instantly.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  '"Find hostels near JKUAT under KES 7,000 with WiFi"',
                  '"Which hostels near Moi University have vacancies?"',
                  '"Compare the top-rated hostels near my campus"',
                  'Available 24/7—no waiting for office hours',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register?role=student"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Chat Now <ChevronRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="universities" className="py-24 px-4 bg-card/40">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider mb-4">
              <GraduationCap size={12} /> Growing Network
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Serving Universities Across Kenya
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-12">
              We&apos;re expanding to cover every major university in Kenya. Select your campus when you sign up, and we&apos;ll show you hostels nearby.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {universities.map((uni) => (
              <motion.span
                key={uni}
                variants={fadeUp}
                className="px-5 py-2.5 rounded-full border border-border bg-card text-sm font-medium text-foreground shadow-card hover:border-primary/40 hover:shadow-card-hover transition-all cursor-default"
              >
                {uni}
              </motion.span>
            ))}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm text-muted-foreground"
          >
            Don&apos;t see your university? <Link to="/register" className="text-primary font-semibold hover:underline">Sign up</Link> and we&apos;ll add it.
          </motion.p>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              Simple Process
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-12">
              Book in 3 Easy Steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Search, title: 'Search & Filter', desc: 'Pick your university, then use the map or filters to find hostels by distance, price, and amenities.' },
              { step: '02', icon: Star, title: 'Compare & Review', desc: 'Read student reviews and compare hostels side by side before deciding.' },
              { step: '03', icon: CreditCard, title: 'Book & Pay', desc: 'Reserve your room instantly with secure M-Pesa or card payment.' },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                viewport={{ once: true }}
                className="relative"
              >
                <span className="text-6xl font-heading font-extrabold text-primary/10 absolute -top-4 left-1/2 -translate-x-1/2">
                  {s.step}
                </span>
                <div className="relative pt-8">
                  <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4 shadow-hero">
                    <s.icon size={24} className="text-primary-foreground" />
                  </div>
                  <h3 className="font-heading font-bold text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto gradient-hero rounded-3xl p-12 md:p-16 text-center shadow-hero relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground mb-4">
              Ready to Find Your Home Away from Home?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join thousands of Kenyan university students who already found safe, affordable accommodation through Smart Hostel Finder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register?role=student"
                className="inline-flex items-center gap-2 px-8 py-4 bg-card text-foreground rounded-2xl text-lg font-semibold hover:bg-card/90 transition-colors shadow-lg"
              >
                <MapPin size={20} />
                Find a Hostel
              </Link>
              <Link
                to="/register?role=owner"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-primary-foreground rounded-2xl text-lg font-semibold border border-white/20 hover:bg-white/20 transition-colors"
              >
                List Your Property
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="py-10 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-hero flex items-center justify-center">
              <Home size={14} className="text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-foreground text-sm">Smart Hostel Finder</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 Smart Hostel Finder — Student Accommodation for Kenyan Universities</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
