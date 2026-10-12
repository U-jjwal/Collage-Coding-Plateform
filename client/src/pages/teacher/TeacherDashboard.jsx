import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  BookOpen, Users, Plus, CheckCircle, ChevronRight,
  Sparkles, RefreshCw, Code2, ArrowUpRight
} from 'lucide-react';
import TeacherQuestionList from './TeacherQuestionList';
import QuestionForm from './QuestionForm';
import TeacherStudents from './TeacherStudents';
import QuestionDashboard from './QuestionDashboard';
import { teacherService } from '../../services';
import toast from 'react-hot-toast';

const TeacherHome = () => {
  const [questions, setQuestions] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qRes, sRes] = await Promise.all([
        teacherService.getMyQuestions({ limit: 5 }),
        teacherService.getStudents({ limit: 1 }),
      ]);
      setQuestions(qRes.data.data.questions || []);
      setStudentCount(sRes.data.data.pagination?.total || 0);
    } catch (err) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const publishedCount = questions.filter((q) => q.status === 'published').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-zinc-900 border border-blue-500/20 p-6 md:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium mb-3">
            <Sparkles size={13} /> Faculty Assessment Suite
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Teacher Workspace
          </h2>
          <p className="text-zinc-300 text-sm mt-2 leading-relaxed">
            Create coding challenges, build automated test suites, and provide feedback on student programming submissions.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link to="/teacher/questions/new" className="btn-primary">
              <Plus size={16} /> Create New Question
            </Link>
            <Link to="/teacher/questions" className="btn-secondary">
              <BookOpen size={16} /> View All Questions
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
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Authored Questions</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <BookOpen size={18} className="text-blue-400" />
            </div>
          </div>
          <div className="stat-value">{loading ? '...' : questions.length}</div>
          <p className="text-xs text-zinc-500">{publishedCount} published live</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Active Students</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Users size={18} className="text-emerald-400" />
            </div>
          </div>
          <div className="stat-value">{loading ? '...' : studentCount}</div>
          <p className="text-xs text-zinc-500">Enrolled platform cohort</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Evaluation Engine</span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Code2 size={18} className="text-violet-400" />
            </div>
          </div>
          <div className="stat-value text-emerald-400 text-2xl font-semibold">Active</div>
          <p className="text-xs text-zinc-500">Automated test evaluation</p>
        </div>
      </div>

      {/* Quick shortcuts & Recent Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-base font-semibold text-white">Course Actions</h3>

          <Link to="/teacher/questions/new" className="card-hover flex items-center justify-between p-4 group">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <Plus size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                  New Challenge
                </p>
                <p className="text-xs text-zinc-400">Add question and test cases</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-500 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link to="/teacher/students" className="card-hover flex items-center justify-between p-4 group">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Users size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  Class Roster
                </p>
                <p className="text-xs text-zinc-400">View enrolled students</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-500 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="lg:col-span-2 card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Recent Questions</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Your recently created challenges</p>
            </div>
            <Link
              to="/teacher/questions"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
            >
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Question</th>
                  <th className="py-2.5 px-3">Difficulty</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500 text-xs">
                      No questions created yet. Click "Create New Question" to begin.
                    </td>
                  </tr>
                ) : (
                  questions.map((q) => (
                    <tr key={q._id} className="text-xs hover:bg-zinc-800/30">
                      <td className="py-2.5 px-3 font-medium text-white">{q.title}</td>
                      <td className="py-2.5 px-3">
                        <span className={`capitalize font-medium ${
                          q.difficulty === 'Easy' ? 'text-emerald-400' : q.difficulty === 'Medium' ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          q.status === 'published' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${q.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {q.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          to={`/teacher/questions/${q._id}/edit`}
                          className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Edit
                        </Link>
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

const TeacherDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route path="/" element={<TeacherHome />} />
      <Route path="/questions" element={<TeacherQuestionList />} />
      <Route path="/questions/new" element={<QuestionForm />} />
      <Route path="/questions/:id/edit" element={<QuestionForm />} />
      <Route path="/questions/:id/dashboard" element={<QuestionDashboard />} />
      <Route path="/students" element={<TeacherStudents />} />
      <Route path="/*" element={<TeacherHome />} />
    </Routes>
  </DashboardLayout>
);

export default TeacherDashboard;
