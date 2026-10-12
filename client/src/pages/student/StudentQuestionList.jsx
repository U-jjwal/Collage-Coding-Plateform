import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Search, Filter, CheckCircle2, AlertCircle,
  Code2, ArrowRight, Sparkles, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { studentService } from '../../services';
import toast from 'react-hot-toast';

const StudentQuestionList = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const fetchQuestions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        search: search || undefined,
        difficulty: difficulty || undefined,
      };
      const res = await studentService.getQuestions(params);
      setQuestions(res.data.data.questions || []);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error('Failed to load coding questions.');
    } finally {
      setLoading(false);
    }
  }, [difficulty, pagination.limit, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchQuestions]);

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

  const getUserStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="badge-accepted">
            <CheckCircle2 size={12} /> Solved
          </span>
        );
      case 'attempted':
        return (
          <span className="badge-medium">
            <AlertCircle size={12} /> Attempted
          </span>
        );
      default:
        return (
          <span className="text-zinc-500 text-xs">
            Not attempted
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
            <Code2 className="text-emerald-400" size={26} />
            Coding Problem Catalog
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Browse all teacher-published problems. Solve challenges in Java and submit for instant evaluation.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search problems by title, keywords, or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Difficulty Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-800/80 p-1 rounded-xl border border-zinc-700">
          {[
            { label: 'All', value: '' },
            { label: 'Easy', value: 'Easy' },
            { label: 'Medium', value: 'Medium' },
            { label: 'Hard', value: 'Hard' },
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => setDifficulty(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                difficulty === tab.value
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => fetchQuestions(pagination.page)}
            className="p-1.5 text-zinc-400 hover:text-white ml-1"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Question Cards Grid */}
      {loading ? (
        <div className="py-24 text-center text-zinc-400">
          <div className="spinner w-8 h-8 mx-auto mb-2" />
          Loading challenges...
        </div>
      ) : questions.length === 0 ? (
        <div className="card text-center py-16 border-zinc-800">
          <BookOpen size={40} className="mx-auto mb-3 text-zinc-600" />
          <h3 className="text-base font-semibold text-white">No questions available</h3>
          <p className="text-zinc-500 text-xs mt-1">
            There are currently no published questions matching your search filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {questions.map((q) => (
            <Link
              key={q._id}
              to={`/student/questions/${q._id}`}
              className="card-hover flex flex-col justify-between group p-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  {getDifficultyBadge(q.difficulty)}
                  {getUserStatusBadge(q.userStatus)}
                </div>

                <h3 className="font-bold text-white text-base group-hover:text-violet-300 transition-colors line-clamp-1">
                  {q.title}
                </h3>

                <p className="text-zinc-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                  {q.description}
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {q.tags?.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700/60"
                    >
                      {t}
                    </span>
                  ))}
                  {q.tags?.length > 2 && (
                    <span className="text-[10px] text-zinc-500">+{q.tags.length - 2}</span>
                  )}
                </div>

                <span className="text-xs font-semibold text-violet-400 group-hover:text-violet-300 inline-flex items-center gap-1">
                  Solve <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.total > 0 && (
        <div className="flex items-center justify-between card p-3 text-xs text-zinc-400">
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
  );
};

export default StudentQuestionList;
