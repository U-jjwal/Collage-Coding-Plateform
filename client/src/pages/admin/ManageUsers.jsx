import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Filter, RefreshCw, CheckCircle, Clock,
  ChevronLeft, ChevronRight, GraduationCap, Shield, User as UserIcon
} from 'lucide-react';
import { adminService } from '../../services';
import toast from 'react-hot-toast';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', role: '', isActive: '' });

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        search: filters.search || undefined,
        role: filters.role || undefined,
        isActive: filters.isActive !== '' ? filters.isActive : undefined,
      };
      const res = await adminService.getUsers(params);
      setUsers(res.data.data.users || []);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="badge-role-admin inline-flex items-center gap-1">
            <Shield size={12} /> Admin
          </span>
        );
      case 'teacher':
        return (
          <span className="badge-role-teacher inline-flex items-center gap-1">
            <GraduationCap size={12} /> Teacher
          </span>
        );
      default:
        return (
          <span className="badge-role-student inline-flex items-center gap-1">
            <UserIcon size={12} /> Student
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Users className="text-blue-400" size={26} />
            Registered Users Directory
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            View registered student and faculty accounts that have completed registration.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search registered users by name, email, or roll number..."
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            className="input pl-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium pl-1">
            <Filter size={14} /> Filter:
          </div>

          <select
            value={filters.role}
            onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))}
            className="input py-2 text-xs w-auto cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={filters.isActive}
            onChange={(e) => setFilters((p) => ({ ...p, isActive: e.target.value }))}
            className="input py-2 text-xs w-auto cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>

          <button
            onClick={() => fetchUsers(pagination.page)}
            className="btn-ghost p-2 text-zinc-400 hover:text-zinc-200"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800/60 border-b border-zinc-800 text-xs uppercase text-zinc-400 font-semibold">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Roll No</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Verification</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5">Last Login</th>
                <th className="px-5 py-3.5">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <div className="spinner w-8 h-8 mx-auto mb-2" />
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <Users size={36} className="mx-auto mb-2 opacity-30" />
                    No registered users found matching the query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center justify-center font-bold text-xs">
                          {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-white">{u.fullName}</p>
                          <p className="text-xs text-zinc-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-zinc-300 text-xs">
                      {u.rollNumber || <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.isEmailVerified ? (
                        <span className="badge-accepted">
                          <CheckCircle size={12} /> Verified
                        </span>
                      ) : (
                        <span className="badge-pending">
                          <Clock size={12} /> Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">
                      {u.lastLoginAt ? (
                        new Date(u.lastLoginAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      ) : (
                        <span className="text-zinc-600">Never</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400">
            <div>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} registered users
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchUsers(pagination.page - 1)}
                className="btn-secondary btn-sm disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="px-2 font-medium text-zinc-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchUsers(pagination.page + 1)}
                className="btn-secondary btn-sm disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
