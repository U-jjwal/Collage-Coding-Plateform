import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Code2, CheckCircle2, Clock, Sparkles, BookOpen,
  ArrowRight, RefreshCw, Trophy, ArrowUpRight
} from 'lucide-react';
import StudentQuestionList from './StudentQuestionList';
import QuestionDetail from './QuestionDetail';
import MySubmissions from './MySubmissions';
import { studentService } from '../../services';
import toast from 'react-hot-toast';

const StudentHome = () => {
  const [questions, setQuestions] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await studentService.getQuestions({ limit: 6 });
      const qList = res.data.data.questions || [];
      setQuestions(qList);
      setTotalQuestions(res.data.data.pagination?.total || 0);

      // Count solved vs attempted from user status
      const solved = qList.filter((q) => q.userStatus === 'accepted').length;
      const attempted = qList.filter((q) => q.userStatus === 'attempted').length;
      setSolvedCount(solved);
      setAttemptedCount(attempted);
    } catch (err) {
      toast.error('Failed to load student dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    <div className="space-y-8 animate-fade-in">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/50 via-zinc-900 to-zinc-900 border border-emerald-500/20 p-6 md:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-3">
            <Sparkles size={13} /> Assessment Workspace
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Student Assessment Portal
          </h2>
          <p className="text-zinc-300 text-sm mt-2 leading-relaxed">
            Welcome to the online coding platform. Write, run, and submit programming solutions
            in the browser. Track evaluation results instantly.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link to="/student/questions" className="btn-primary">
              <Code2 size={16} /> Explore Questions Catalog
            </Link>
            <button
              onClick={loadData}
              className="btn-ghost text-zinc-400 hover:text-zinc-200"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Available Challenges</span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <BookOpen size={18} className="text-violet-400" />
            </div>
          </div>
          <div className="stat-value">{loading ? '...' : totalQuestions}</div>
          <p className="text-xs text-zinc-500">Published by instructors</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Problems Solved</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-400" />
            </div>
          </div>
          <div className="stat-value text-emerald-400">{loading ? '...' : solvedCount}</div>
          <p className="text-xs text-zinc-500">All test cases passed</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Attempted</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Clock size={18} className="text-amber-400" />
            </div>
          </div>
          <div className="stat-value">{loading ? '...' : attemptedCount}</div>
          <p className="text-xs text-zinc-500">Submissions evaluated</p>
        </div>
      </div>

      {/* Featured Questions Section */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Recommended Challenges</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Start practicing with available problems</p>
          </div>
          <Link
            to="/student/questions"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
          >
            Browse all catalog <ArrowUpRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-400 text-xs">
            <div className="spinner w-6 h-6 mx-auto mb-2" />
            Loading challenges...
          </div>
        ) : questions.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            No published problems yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {questions.map((q) => (
              <Link
                key={q._id}
                to={`/student/questions/${q._id}`}
                className="p-4 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {getDifficultyBadge(q.difficulty)}
                    <span className="text-[11px] text-zinc-500">
                      {q.tags?.[0] || 'algorithm'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                    {q.title}
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {q.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-zinc-800/80 mt-3 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">5s time limit</span>
                  <span className="text-emerald-400 group-hover:text-emerald-300 font-medium inline-flex items-center gap-1">
                    Open <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StudentDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route path="/" element={<StudentHome />} />
      <Route path="/questions" element={<StudentQuestionList />} />
      <Route path="/questions/:id" element={<QuestionDetail />} />
      <Route path="/submissions" element={<MySubmissions />} />
      <Route path="/*" element={<StudentHome />} />
    </Routes>
  </DashboardLayout>
);

export default StudentDashboard;
