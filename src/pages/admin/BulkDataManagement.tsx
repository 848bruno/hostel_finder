import { DashboardLayout } from '../../components/layouts/DashboardLayout';
import { Upload, Download, FileText, AlertTriangle } from 'lucide-react';

export function BulkDataManagement() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Bulk Data Management</h1><p className="text-muted-foreground text-sm mt-1">Import and export platform data</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Upload size={20} className="text-primary" /></div><h2 className="font-heading font-bold text-lg text-foreground">Import Data</h2></div>
            <p className="text-sm text-muted-foreground mb-4">Upload CSV files to bulk import users, hostels, or bookings.</p>
            <div className="border-2 border-dashed border-input rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer mb-4">
              <Upload size={32} className="text-muted-foreground mx-auto mb-2" /><p className="text-sm font-medium text-foreground">Drag & drop or click to upload</p><p className="text-xs text-muted-foreground mt-1">CSV, XLSX up to 50MB</p>
            </div>
            <select className="w-full py-2.5 px-4 rounded-xl border border-input bg-background text-foreground text-sm mb-3"><option>Select data type...</option><option>Users</option><option>Hostels</option><option>Bookings</option></select>
            <button className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90">Start Import</button>
          </div>
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><Download size={20} className="text-green-600 dark:text-green-400" /></div><h2 className="font-heading font-bold text-lg text-foreground">Export Data</h2></div>
            <p className="text-sm text-muted-foreground mb-4">Download platform data as CSV files for reporting.</p>
            <div className="space-y-3">
              {['All Users', 'All Hostels', 'All Bookings', 'Payment Records', 'Audit Logs'].map(item => (
                <button key={item} className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border hover:bg-secondary transition-colors text-left">
                  <div className="flex items-center gap-3"><FileText size={16} className="text-muted-foreground" /><span className="text-sm font-medium text-foreground">{item}</span></div>
                  <Download size={16} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
          <div><p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Caution</p><p className="text-xs text-yellow-700 dark:text-yellow-400/80 mt-0.5">Bulk operations cannot be undone. Please review data before importing.</p></div>
        </div>
      </div>
    </DashboardLayout>
  );
}
