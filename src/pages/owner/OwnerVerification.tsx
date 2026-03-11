import { useState } from 'react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Upload, FileCheck, AlertCircle, CheckCircle2, Clock, User, Building2, FileText, ChevronRight } from 'lucide-react';

type VerifStep = 'identity' | 'business' | 'documents' | 'review';

const steps: { id: VerifStep; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'identity', label: 'Identity', icon: User, description: 'Personal identification' },
  { id: 'business', label: 'Business', icon: Building2, description: 'Business registration' },
  { id: 'documents', label: 'Documents', icon: FileText, description: 'Upload supporting docs' },
  { id: 'review', label: 'Review', icon: CheckCircle2, description: 'Submit for review' },
];

export function OwnerVerification() {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState<VerifStep>('identity');
  const [completedSteps, setCompletedSteps] = useState<VerifStep[]>([]);
  const [identity, setIdentity] = useState({ fullName: profile?.username || '', idNumber: '', phone: '' });
  const [business, setBusiness] = useState({ name: '', regNumber: '', kraPin: '' });

  const completeStep = (step: VerifStep) => {
    if (!completedSteps.includes(step)) setCompletedSteps(prev => [...prev, step]);
    const nextIndex = steps.findIndex(s => s.id === step) + 1;
    if (nextIndex < steps.length) setCurrentStep(steps[nextIndex].id);
  };

  const handleSubmit = () => {
    setCompletedSteps([...steps.map(s => s.id)]);
    alert('Verification submitted! We\'ll review your documents within 24-48 hours.');
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">Owner Verification</h1>
          <p className="text-muted-foreground mt-1">Complete all steps to verify your identity and business</p>
        </div>

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-warning/10 border border-warning/30 rounded-2xl p-5 mb-8 flex items-start gap-3">
          <AlertCircle size={20} className="text-warning mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-foreground">Verification Required</p>
            <p className="text-sm text-muted-foreground mt-1">Your hostels can't be published until verification is complete. This usually takes 24-48 hours.</p>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 bg-card rounded-2xl p-4 shadow-card border border-border">
          {steps.map((step, i) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const StepIcon = step.icon;
            return (
              <div key={step.id} className="flex items-center">
                <button onClick={() => setCurrentStep(step.id)} className="flex flex-col items-center gap-1.5 group">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                    isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={20} /> : <StepIcon size={20} />}
                  </div>
                  <span className={`text-[11px] font-medium hidden sm:block ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>{step.label}</span>
                </button>
                {i < steps.length - 1 && <div className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 ${isCompleted ? 'bg-green-500' : 'bg-border'}`} />}
              </div>
            );
          })}
        </div>

        {/* Identity Step */}
        {currentStep === 'identity' && (
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border space-y-6">
            <div className="flex items-center gap-3 pb-5 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><User size={20} className="text-primary" /></div>
              <div><h2 className="font-heading font-bold text-foreground">Personal Identity</h2><p className="text-sm text-muted-foreground">Confirm your personal details</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
                <input value={identity.fullName} onChange={e => setIdentity(p => ({ ...p, fullName: e.target.value }))} className="w-full py-3 px-4 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">National ID Number *</label>
                <input value={identity.idNumber} onChange={e => setIdentity(p => ({ ...p, idNumber: e.target.value }))} placeholder="e.g. 12345678" className="w-full py-3 px-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Phone Number *</label>
                <input value={identity.phone} onChange={e => setIdentity(p => ({ ...p, phone: e.target.value }))} placeholder="+254 7XX XXX XXX" className="w-full py-3 px-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Upload ID (Front & Back)</label>
                <div className="border-2 border-dashed border-input rounded-xl p-6 text-center hover:border-primary/30 transition-colors cursor-pointer">
                  <Upload size={28} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Click to upload your National ID</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => completeStep('identity')} className="px-6 py-3 gradient-hero text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 shadow-hero flex items-center gap-2">
                Save & Continue <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Business Step */}
        {currentStep === 'business' && (
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border space-y-6">
            <div className="flex items-center gap-3 pb-5 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><Building2 size={20} className="text-accent" /></div>
              <div><h2 className="font-heading font-bold text-foreground">Business Information</h2><p className="text-sm text-muted-foreground">Your registered business details</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Business Name *</label>
                <input value={business.name} onChange={e => setBusiness(p => ({ ...p, name: e.target.value }))} className="w-full py-3 px-4 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Registration Number</label>
                <input value={business.regNumber} onChange={e => setBusiness(p => ({ ...p, regNumber: e.target.value }))} placeholder="e.g. PVT-12345" className="w-full py-3 px-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">KRA PIN</label>
                <input value={business.kraPin} onChange={e => setBusiness(p => ({ ...p, kraPin: e.target.value }))} placeholder="e.g. A012345678Z" className="w-full py-3 px-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => setCurrentStep('identity')} className="px-5 py-3 border border-input rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors">← Back</button>
              <button onClick={() => completeStep('business')} className="px-6 py-3 gradient-hero text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 shadow-hero flex items-center gap-2">Save & Continue <ChevronRight size={16} /></button>
            </div>
          </motion.div>
        )}

        {/* Documents Step */}
        {currentStep === 'documents' && (
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border space-y-6">
            <div className="flex items-center gap-3 pb-5 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center"><FileText size={20} className="text-warning" /></div>
              <div><h2 className="font-heading font-bold text-foreground">Supporting Documents</h2><p className="text-sm text-muted-foreground">Upload business and property documents</p></div>
            </div>
            {[
              { label: 'Business License / Registration Certificate', desc: 'Official document proving your business is registered' },
              { label: 'KRA Tax Compliance Certificate', desc: 'Current tax compliance certificate' },
              { label: 'Property Ownership / Lease Agreement', desc: 'Proof that you own or lease the hostel property' },
            ].map((doc, i) => (
              <div key={i} className="border-2 border-dashed border-input rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <Upload size={20} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{doc.desc}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2">
              <button onClick={() => setCurrentStep('business')} className="px-5 py-3 border border-input rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors">← Back</button>
              <button onClick={() => completeStep('documents')} className="px-6 py-3 gradient-hero text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 shadow-hero flex items-center gap-2">Save & Continue <ChevronRight size={16} /></button>
            </div>
          </motion.div>
        )}

        {/* Review Step */}
        {currentStep === 'review' && (
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border space-y-6">
            <div className="flex items-center gap-3 pb-5 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><CheckCircle2 size={20} className="text-green-600 dark:text-green-400" /></div>
              <div><h2 className="font-heading font-bold text-foreground">Review & Submit</h2><p className="text-sm text-muted-foreground">Review your details before submitting</p></div>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Full Name', value: identity.fullName },
                { label: 'National ID', value: identity.idNumber || 'Not provided' },
                { label: 'Phone', value: identity.phone || 'Not provided' },
                { label: 'Business Name', value: business.name || 'Not provided' },
                { label: 'Registration No.', value: business.regNumber || 'Not provided' },
                { label: 'KRA PIN', value: business.kraPin || 'Not provided' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="bg-primary/5 rounded-xl p-4 flex items-start gap-3">
              <Clock size={18} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Verification Timeline</p>
                <p className="text-xs text-muted-foreground mt-0.5">Once submitted, our team will review your documents within 24-48 hours.</p>
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => setCurrentStep('documents')} className="px-5 py-3 border border-input rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors">← Back</button>
              <button onClick={handleSubmit} className="px-8 py-3 gradient-hero text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 shadow-hero flex items-center gap-2">
                <FileCheck size={18} /> Submit for Verification
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
