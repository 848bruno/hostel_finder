import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Settings, Bell, Shield, Palette, Save, Check } from 'lucide-react';
import { THEME_COLOR_OPTIONS, saveThemeSelection } from '../../lib/theme';

export function AdminSettings() {
  const [activeSection, setActiveSection] = useState('general');
  const [selectedTheme, setSelectedTheme] = useState('');

  useEffect(() => {
    setSelectedTheme(localStorage.getItem('shf_theme_primary') || THEME_COLOR_OPTIONS[0].value);
  }, []);

  const handleThemeChange = (colorValue: string) => {
    setSelectedTheme(colorValue);
    saveThemeSelection(colorValue);
  };

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Admin Settings</h1><p className="text-muted-foreground text-sm mt-1">Configure platform settings</p></div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-56 shrink-0">
            <div className="bg-card rounded-2xl shadow-card border border-border p-2 space-y-1">
              {sections.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeSection === s.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
                  <s.icon size={16} />{s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-card rounded-2xl shadow-card border border-border p-6">
            {activeSection === 'general' && (
              <div className="space-y-6">
                <h2 className="font-heading font-bold text-lg text-foreground">General Settings</h2>
                {[{ label: 'Platform Name', value: 'Smart Hostel Finder', type: 'text' }, { label: 'Support Email', value: 'support@smarthostel.ke', type: 'email' }, { label: 'Default Currency', value: 'KES', type: 'text' }].map(f => (
                  <div key={f.label}><label className="block text-sm font-medium text-foreground mb-2">{f.label}</label><input type={f.type} defaultValue={f.value} className="w-full py-3 px-4 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" /></div>
                ))}
              </div>
            )}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h2 className="font-heading font-bold text-lg text-foreground">Notification Settings</h2>
                {['Email notifications for new registrations', 'SMS alerts for urgent reports', 'Push notifications for system events', 'Weekly summary reports'].map(label => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <span className="text-sm text-foreground">{label}</span>
                    <div className="w-10 h-6 rounded-full bg-primary relative cursor-pointer"><div className="w-5 h-5 rounded-full bg-white shadow absolute top-0.5 right-0.5" /></div>
                  </div>
                ))}
              </div>
            )}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <h2 className="font-heading font-bold text-lg text-foreground">Security Settings</h2>
                {[{ label: 'Two-Factor Authentication', desc: 'Require 2FA for admin logins' }, { label: 'Session Timeout', desc: 'Auto-logout after 30 minutes of inactivity' }, { label: 'IP Whitelist', desc: 'Restrict admin access to specific IPs' }].map(item => (
                  <div key={item.label} className="flex items-start justify-between py-3 border-b border-border last:border-0">
                    <div><p className="text-sm font-medium text-foreground">{item.label}</p><p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p></div>
                    <div className="w-10 h-6 rounded-full bg-muted-foreground/30 relative cursor-pointer"><div className="w-5 h-5 rounded-full bg-white shadow absolute top-0.5 left-0.5" /></div>
                  </div>
                ))}
              </div>
            )}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <h2 className="font-heading font-bold text-lg text-foreground">Global Color Theme</h2>
                <p className="text-sm text-muted-foreground">Select a primary color to instantly rebrand the platform. This affects buttons, gradients, icons, and charts globally.</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {THEME_COLOR_OPTIONS.map((themeOption) => (
                    <button
                      key={themeOption.label}
                      onClick={() => handleThemeChange(themeOption.value)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                        selectedTheme === themeOption.value
                          ? 'border-primary bg-primary/5 shadow-md scale-105'
                          : 'border-border bg-card hover:bg-secondary hover:border-primary/30'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full mb-3 flex items-center justify-center shadow-inner"
                        style={{ backgroundColor: themeOption.value }}
                      >
                        {selectedTheme === themeOption.value && (
                          <Check className="text-white drop-shadow-md" size={18} strokeWidth={3} />
                        )}
                      </div>
                      <span className="text-xs font-medium text-foreground text-center">
                        {themeOption.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-8 pt-6 border-t border-border flex justify-end">
              <button className="flex items-center gap-2 px-6 py-3 gradient-hero text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90"><Save size={16} />Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
