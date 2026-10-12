import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Build a human-readable page title from the path
const getPageTitle = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 1) return 'Dashboard';
  const last = segments[segments.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
};

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <header className="fixed top-0 left-[260px] right-0 h-16 bg-zinc-950/80 border-b border-zinc-800 z-30 backdrop-blur-md flex items-center justify-between px-6">
      <div>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        <p className="text-xs text-zinc-500 capitalize">{user?.role} portal</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell (placeholder) */}
        <button className="btn-ghost p-2 relative">
          <Bell size={18} />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
          <span className="text-violet-300 text-sm font-semibold">
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
