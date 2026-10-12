import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Plus, Search, Filter, RefreshCw, Edit2,
  Trash2, Eye, EyeOff, CheckCircle, Clock, ChevronLeft, ChevronRight, BarChart2
} from 'lucide-react';
import { teacherService } from '../../services';
import toast from 'react-hot-toast';

const TeacherQuestionList = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', status: '', difficulty: '' });

  const fetchQuestions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        search: filters.search || undefined,
        status: filters.status || undefined,
        difficulty: filters.difficulty || undefined,
      };
      const res = await teacherService.getMyQuestions(params);
      setQuestions(res.data.data.questions || []);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to fetch questions.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchQuestions]);

  const handleToggleStatus = async (question) => {
    const nextStatus = question.status === 'published' ? 'draft' : 'published';
    try {
      await teacherService.updateQuestion(question._id, { status: nextStatus });
      toast.success(`Question is now ${nextStatus}.`);
      setQuestions((prev) =>
        prev.map((q) => (q._id === question._id ? { ...q, status: nextStatus } : q))
      );
    } catch (err) {
      toast.error('Failed to change question status.');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete or archive "${title}"?`)) return;
    try {
      const res = await teacherService.deleteQuestion(id);
      if (res.data.data?.archived) {
        toast('Question has submissions and was archived.', { icon: '📦' });
      } else {
        toast.success('Question deleted successfully.');
      }
      fetchQuestions(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete question.');
    }
  };

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'Easy':
        return <span className="badge-easy">Easy</span>;
      case 'Medium':
        return <span className="badge-medium">Medium</span>;
      default:
        return <span className="badge-hard">Hard</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BookOpen className="text-blue-400" size={26} />
            My Question Library
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Create and maintain coding problems, test cases, and problem specifications.
          </p>
        </div>
        <div>
          <Link to="/teacher/questions/new" className="btn-primary">
            <Plus size={16} /> Create Question
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search questions by title or tags..."
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
            value={filters.difficulty}
            onChange={(e) => setFilters((p) => ({ ...p, difficulty: e.target.value }))}
            className="input py-2 text-xs w-auto cursor-pointer"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            className="input py-2 text-xs w-auto cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <button
            onClick={() => fetchQuestions(pagination.page)}
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
                <th className="px-5 py-3.5">Question Title</th>
                <th className="px-5 py-3.5">Difficulty</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Test Cases</th>
                <th className="px-5 py-3.5">Submissions</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <div className="spinner w-8 h-8 mx-auto mb-2" />
                    Loading questions...
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <BookOpen size={36} className="mx-auto mb-2 opacity-30" />
                    No questions found matching your criteria.
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q._id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{q.title}</div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {q.tags?.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {getDifficultyBadge(q.difficulty)}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleStatus(q)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          q.status === 'published'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : q.status === 'draft'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20'
                        }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            q.status === 'published'
                              ? 'bg-emerald-400'
                              : q.status === 'draft'
                              ? 'bg-amber-400'
                              : 'bg-zinc-500'
                          }`}
                        />
                        <span className="capitalize">{q.status}</span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-400">
                      {q.testCases?.length || 0} tests{' '}
                      <span className="text-zinc-500">
                        ({q.testCases?.filter((t) => t.isHidden).length || 0} hidden)
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-zinc-300 text-xs">
                      {q.submissionCount || 0}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/teacher/questions/${q._id}/dashboard`}
                          className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Submissions Dashboard & Code Review"
                        >
                          <BarChart2 size={15} />
                        </Link>
                        <Link
                          to={`/teacher/questions/${q._id}/edit`}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Edit Question"
                        >
                          <Edit2 size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(q._id, q.title)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete / Archive Question"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!loading && pagination.total > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400">
            <div>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} questions
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchQuestions(pagination.page - 1)}
                className="btn-secondary btn-sm disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="px-2 font-medium text-zinc-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchQuestions(pagination.page + 1)}
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

export default TeacherQuestionList;
