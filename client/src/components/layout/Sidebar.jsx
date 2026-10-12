import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Code2, LayoutDashboard, Users, BookOpen, ClipboardList,
  LogOut, Settings, ChevronRight, Shield, GraduationCap, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = {
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/admin/emails', icon: Shield, label: 'Authorized Emails' },
    { to: '/admin/users', icon: Users, label: 'Registered Users' },
  ],
  teacher: [
    { to: '/teacher', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/teacher/questions', icon: BookOpen, label: 'My Questions' },
    { to: '/teacher/students', icon: Users, label: 'Students' },
  ],
  student: [
    { to: '/student', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/student/questions', icon: BookOpen, label: 'Questions' },
    { to: '/student/submissions', icon: ClipboardList, label: 'My Submissions' },
  ],
};

const ROLE_ICONS = { admin: Shield, teacher: GraduationCap, student: User };
const ROLE_COLORS = {
  admin: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  teacher: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  student: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = NAV_ITEMS[user?.role] || [];
  const RoleIcon = ROLE_ICONS[user?.role] || User;

  const isActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login', { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-zinc-900/95 border-r border-zinc-800 flex flex-col z-40 backdrop-blur-md">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center shadow-md shadow-violet-500/30 flex-shrink-0">
          <Code2 size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white leading-none">College</p>
          <p className="text-[10px] text-violet-400 font-medium">Coding Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-3 mb-2 mt-1">
          Navigation
        </p>
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <li key={to}>
              <Link
                to={to}
                className={isActive(to, exact) ? 'nav-item-active' : 'nav-item'}
              >
                <Icon size={17} className="flex-shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {isActive(to, exact) && <ChevronRight size={14} className="opacity-60" />}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User profile + logout */}
      <div className="p-3 border-t border-zinc-800">
        {/* User card */}
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${ROLE_COLORS[user?.role]} mb-1`}>
          <div className="flex-shrink-0">
            <RoleIcon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
            <p className="text-[10px] text-zinc-500 truncate capitalize">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-0.5"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
