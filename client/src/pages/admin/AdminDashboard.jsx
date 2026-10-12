import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Shield, Users, Upload, GraduationCap, UserCheck,
  ChevronRight, ArrowUpRight, Sparkles, RefreshCw
} from 'lucide-react';
import ManageEmails from './ManageEmails';
import ManageUsers from './ManageUsers';
import { adminService } from '../../services';
import toast from 'react-hot-toast';

const AdminHome = () => {
  const [stats, setStats] = useState({
    totalAuthorized: 0,
    activeAuthorized: 0,
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
  });
  const [recentEmails, setRecentEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, emailsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getAuthorizedEmails({ limit: 5 }),
      ]);
      setStats(statsRes.data.data);
      setRecentEmails(emailsRes.data.data.authorizedEmails || []);
    } catch (err) {
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/40 via-purple-900/20 to-zinc-900 border border-violet-500/20 p-6 md:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-3">
            <Sparkles size={13} /> Platform Administration
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Admin Management Console
          </h2>
          <p className="text-zinc-300 text-sm mt-2 leading-relaxed">
            Manage who is authorized to join the platform, invite faculty and student cohorts via CSV,
            and monitor platform participation.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link to="/admin/emails" className="btn-primary">
              <Shield size={16} /> Manage Allowlist
            </Link>
            <Link to="/admin/users" className="btn-secondary">
              <Users size={16} /> View All Users
            </Link>
            <button
              onClick={loadDashboardData}
              className="btn-ghost text-zinc-400 hover:text-zinc-200"
              title="Refresh stats"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Ambient background blur */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Authorized',
            value: stats.totalAuthorized,
            subtitle: `${stats.activeAuthorized} active accounts`,
            icon: Shield,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10 border-violet-500/20',
          },
          {
            label: 'Registered Users',
            value: stats.totalUsers,
            subtitle: 'Activated user logins',
            icon: UserCheck,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
          },
          {
            label: 'Faculty & Teachers',
            value: stats.totalTeachers,
            subtitle: 'Course question creators',
            icon: GraduationCap,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/20',
          },
          {
            label: 'Enrolled Students',
            value: stats.totalStudents,
            subtitle: 'Coding participants',
            icon: Users,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
          },
        ].map(({ label, value, subtitle, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="stat-label font-medium">{label}</span>
              <div className={`w-9 h-9 rounded-xl ${bg} border flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
            </div>
            <div className="stat-value">{loading ? '...' : value}</div>
            <p className="text-xs text-zinc-500">{subtitle}</p>
          </div>
        ))}
      </div>

      {/* Quick Action Cards & Recent Allowlist Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Action Highlights */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-base font-semibold text-white">Administrative Actions</h3>

          <Link
            to="/admin/emails"
            className="card-hover flex items-center justify-between p-4 group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0">
                <Upload size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
                  Bulk CSV Import
                </p>
                <p className="text-xs text-zinc-400">Upload spreadsheet of email IDs</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-500 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            to="/admin/emails"
            className="card-hover flex items-center justify-between p-4 group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <Shield size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                  Authorize Email
                </p>
                <p className="text-xs text-zinc-400">Add faculty or student manually</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-500 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            to="/admin/users"
            className="card-hover flex items-center justify-between p-4 group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Users size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  User Directory
                </p>
                <p className="text-xs text-zinc-400">Review all registered accounts</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-500 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Recently Added Allowlist Table */}
        <div className="lg:col-span-2 card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Recently Authorized Emails</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Most recent accounts approved for registration</p>
            </div>
            <Link
              to="/admin/emails"
              className="text-xs text-violet-400 hover:text-violet-300 font-medium inline-flex items-center gap-1"
            >
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {recentEmails.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-500 text-xs">
                      No emails authorized yet.
                    </td>
                  </tr>
                ) : (
                  recentEmails.map((item) => (
                    <tr key={item._id} className="text-xs hover:bg-zinc-800/30">
                      <td className="py-2.5 px-3 font-medium text-white">{item.fullName}</td>
                      <td className="py-2.5 px-3 font-mono text-zinc-300">{item.email}</td>
                      <td className="py-2.5 px-3">
                        <span className={`capitalize font-medium ${
                          item.role === 'admin'
                            ? 'text-violet-400'
                            : item.role === 'teacher'
                            ? 'text-blue-400'
                            : 'text-emerald-400'
                        }`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          item.isActive ? 'text-emerald-400' : 'text-zinc-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route path="/" element={<AdminHome />} />
      <Route path="/emails" element={<ManageEmails />} />
      <Route path="/users" element={<ManageUsers />} />
      <Route path="/*" element={<AdminHome />} />
    </Routes>
  </DashboardLayout>
);

export default AdminDashboard;
