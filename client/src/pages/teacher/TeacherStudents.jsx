import { useState, useEffect, useCallback } from 'react';
import { Users, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { teacherService } from '../../services';
import toast from 'react-hot-toast';

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');

  const fetchStudents = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await teacherService.getStudents({ page, limit: pagination.limit, search: search || undefined });
      setStudents(res.data.data.students || []);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error('Failed to load student roster.');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Users className="text-blue-400" size={26} />
            Class Student Roster
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Registered students currently enrolled and active on the platform.
          </p>
        </div>
      </div>

      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search students by name, email, or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <button
          onClick={() => fetchStudents(pagination.page)}
          className="btn-ghost p-2 text-zinc-400 hover:text-zinc-200"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="card p-0 overflow-hidden border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800/60 border-b border-zinc-800 text-xs uppercase text-zinc-400 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Student Name</th>
                <th className="px-5 py-3.5">Roll Number</th>
                <th className="px-5 py-3.5">Email Address</th>
                <th className="px-5 py-3.5">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-400">
                    <div className="spinner w-8 h-8 mx-auto mb-2" />
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-500">
                    <Users size={36} className="mx-auto mb-2 opacity-30" />
                    No students found matching your search.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s._id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                        {s.fullName?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      {s.fullName}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-zinc-300 text-xs">
                      {s.rollNumber || <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-zinc-400 text-xs">{s.email}</td>
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">
                      {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString() : 'Never logged in'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && pagination.total > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400">
            <div>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchStudents(pagination.page - 1)}
                className="btn-secondary btn-sm disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="px-2 font-medium text-zinc-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchStudents(pagination.page + 1)}
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

export default TeacherStudents;
