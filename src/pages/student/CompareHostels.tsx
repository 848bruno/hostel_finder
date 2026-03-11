import { ArrowRightLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';

export function CompareHostels() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compare Hostels</h1>
          <p className="mt-1 text-gray-600">
            This route is ready. We&apos;ll connect the actual compare workflow to backend data next.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
              <ArrowRightLeft size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Comparison Flow Placeholder</h2>
              <p className="mt-2 text-sm text-gray-600">
                The compare experience from repo B needs student-selected hostels and shared
                state. The route now exists in A, and we can wire the full behavior once you
                want to continue with that feature.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {['Choose hostels', 'Review side-by-side', 'Decide faster'].map((step, index) => (
              <div key={step} className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Step 0{index + 1}
                </p>
                <h3 className="mt-2 font-semibold text-gray-900">{step}</h3>
              </div>
            ))}
          </div>

          <Link
            to="/student/search"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <Search size={18} />
            Go to Search
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
