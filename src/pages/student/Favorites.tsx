import { Heart, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';

export function Favorites() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Favorites</h1>
          <p className="mt-1 text-gray-600">
            Saved hostels will appear here once we wire this feature to the backend.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Heart size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">No saved hostels yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-gray-600">
            You&apos;ll be able to save hostels for later comparison and quick access from this
            page once the backend support is connected.
          </p>
          <Link
            to="/student/search"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <Search size={18} />
            Browse Hostels
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
