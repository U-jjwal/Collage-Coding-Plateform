import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  ArrowLeft, Users, CheckCircle2, XCircle, AlertCircle, Clock,
  MessageSquare, Eye, X, Send, RefreshCw, ChevronLeft, ChevronRight,
  TrendingUp, BookOpen, UserCheck, UserX, FileCode2
} from 'lucide-react';
import { teacherService } from '../../services';
import toast from 'react-hot-toast';

const QuestionDashboard = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submitted'); // submitted | pending | log

  // Review modal states
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [submissionDetails, setSubmissionDetails] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teacherService.getQuestionDashboard(id);
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load question dashboard.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Open review modal
  const handleOpenReview = async (submissionId) => {
    setSelectedSubmissionId(submissionId);
    setReviewLoading(true);
    try {
      const res = await teacherService.getSubmission(submissionId);
      setSubmissionDetails(res.data.data);
      setFeedback(res.data.data.teacherReview?.feedback || '');
    } catch (err) {
      toast.error('Failed to load submission details.');
      setSelectedSubmissionId(null);
    } finally {
      setReviewLoading(false);
    }
  };

  // Submit teacher review
  const handleSubmitReview = async () => {
    if (!selectedSubmissionId) return;
    setSubmittingReview(true);
    try {
      await teacherService.reviewSubmission(selectedSubmissionId, {
        feedback,
        status: 'reviewed',
      });
      toast.success('Review and feedback saved successfully!');
      setSelectedSubmissionId(null);
      fetchDashboard();
    } catch (err) {
      toast.error('Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="badge-accepted">
            <CheckCircle2 size={12} /> Accepted
          </span>
        );
      case 'wrong_answer':
        return (
          <span className="badge-wrong-answer">
            <XCircle size={12} /> Wrong Answer
          </span>
        );
      case 'compile_error':
        return (
          <span className="badge-error">
            <AlertCircle size={12} /> Compile Error
          </span>
        );
      case 'time_limit_exceeded':
        return (
          <span className="badge-medium">
            <Clock size={12} /> TLE
          </span>
        );
      default:
        return <span className="badge-pending">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-400">
        <div className="spinner w-8 h-8 mx-auto mb-2" />
        Loading question analytics and submission data...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card text-center py-16">
        <h3 className="text-white font-bold text-lg">Question not found</h3>
        <Link to="/teacher/questions" className="btn-secondary mt-4 inline-flex">
          Back to Questions
        </Link>
      </div>
    );
  }

  const { question, metrics, submittedStudents, pendingStudents } = data;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/teacher/questions"
            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`badge ${
                question.difficulty === 'Easy' ? 'badge-easy' : question.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'
              }`}>
                {question.difficulty}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize font-medium ${
                question.status === 'published' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
              }`}>
                {question.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {question.title} — Submissions & Monitoring
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="btn-secondary btn-sm"
            title="Refresh analytics"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link
            to={`/teacher/questions/${question._id}/edit`}
            className="btn-primary btn-sm"
          >
            Edit Question
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Enrolled Cohort</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Users size={16} className="text-blue-400" />
            </div>
          </div>
          <div className="stat-value">{metrics.totalStudents}</div>
          <p className="text-xs text-zinc-500">Total registered students</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Submitted</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <UserCheck size={16} className="text-emerald-400" />
            </div>
          </div>
          <div className="stat-value text-emerald-400">{metrics.submittedCount}</div>
          <p className="text-xs text-zinc-500">{metrics.submissionRate}% completion rate</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Pending Submissions</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <UserX size={16} className="text-amber-400" />
            </div>
          </div>
          <div className="stat-value text-amber-400">{metrics.pendingCount}</div>
          <p className="text-xs text-zinc-500">Students yet to submit</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">Acceptance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <TrendingUp size={16} className="text-violet-400" />
            </div>
          </div>
          <div className="stat-value text-violet-400">{metrics.acceptanceRate}%</div>
          <p className="text-xs text-zinc-500">{metrics.acceptedCount} students solved</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-300 font-semibold">Cohort Submission Progress</span>
          <span className="text-zinc-400">
            {metrics.submittedCount} of {metrics.totalStudents} submitted ({metrics.submissionRate}%)
          </span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-violet-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${metrics.submissionRate}%` }}
          />
        </div>
      </div>

      {/* Tabs Section */}
      <div className="card p-0 overflow-hidden border-zinc-800">
        <div className="flex items-center border-b border-zinc-800 bg-zinc-900/80 px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('submitted')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'submitted'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserCheck size={14} className="text-emerald-400" />
            Submitted Students ({submittedStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserX size={14} className="text-amber-400" />
            Pending / Not Submitted ({pendingStudents.length})
          </button>
        </div>

        {/* Tab 1: Submitted Students Table */}
        {activeTab === 'submitted' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-800/60 border-b border-zinc-800 text-xs uppercase text-zinc-400 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Roll Number</th>
                  <th className="px-5 py-3.5">Attempts</th>
                  <th className="px-5 py-3.5">Latest Status</th>
                  <th className="px-5 py-3.5">Review Status</th>
                  <th className="px-5 py-3.5">Submitted At</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {submittedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500 text-xs">
                      No students have submitted code for this challenge yet.
                    </td>
                  </tr>
                ) : (
                  submittedStudents.map((item) => (
                    <tr key={item.student._id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">{item.student.fullName}</div>
                        <div className="text-xs text-zinc-500 font-mono">{item.student.email}</div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-zinc-300 text-xs">
                        {item.student.rollNumber || <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-zinc-300">
                        {item.submissionsCount} attempt(s)
                      </td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(item.latestStatus)}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        {item.reviewStatus === 'reviewed' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle2 size={13} /> Reviewed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                            <Clock size={13} /> Needs Review
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400 text-xs">
                        {new Date(item.lastSubmittedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenReview(item.latestSubmissionId)}
                          className="btn-primary btn-sm text-xs"
                        >
                          <FileCode2 size={13} /> Inspect & Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Pending Students Table */}
        {activeTab === 'pending' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-800/60 border-b border-zinc-800 text-xs uppercase text-zinc-400 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Student Name</th>
                  <th className="px-5 py-3.5">Roll Number</th>
                  <th className="px-5 py-3.5">Email Address</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {pendingStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-emerald-400 text-xs">
                      🎉 100% submission rate! Every registered student has submitted this question.
                    </td>
                  </tr>
                ) : (
                  pendingStudents.map((s) => (
                    <tr key={s._id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-white">{s.fullName}</td>
                      <td className="px-5 py-3.5 font-mono text-zinc-300 text-xs">
                        {s.rollNumber || <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-zinc-400 text-xs">{s.email}</td>
                      <td className="px-5 py-3.5">
                        <span className="badge-pending text-[11px]">
                          Pending Submission
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Code Review Modal */}
      {selectedSubmissionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-4xl w-full border-zinc-700 shadow-2xl relative animate-slide-up max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCode2 size={18} className="text-violet-400" />
                  Student Code Review
                </h3>
                {submissionDetails && (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    <strong>{submissionDetails.studentId?.fullName}</strong> ({submissionDetails.studentId?.rollNumber || submissionDetails.studentId?.email}) •{' '}
                    <span className="uppercase font-mono">{submissionDetails.language}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedSubmissionId(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            {reviewLoading ? (
              <div className="py-24 text-center text-zinc-400">
                <div className="spinner w-8 h-8 mx-auto mb-2" />
                Loading student code...
              </div>
            ) : submissionDetails ? (
              <div className="flex-1 overflow-y-auto space-y-4 py-4">
                {/* Score & Evaluation Bar */}
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 font-semibold">Evaluation Status:</span>
                    {getStatusBadge(submissionDetails.status)}
                  </div>
                  <div className="text-zinc-300 font-mono">
                    Tests Passed: <strong>{submissionDetails.evaluation?.passedTests || 0}</strong> /{' '}
                    {submissionDetails.evaluation?.totalTests || 0}
                  </div>
                  {submissionDetails.evaluation?.executionTimeMs && (
                    <div className="text-zinc-400">
                      Runtime: {submissionDetails.evaluation.executionTimeMs}ms
                    </div>
                  )}
                </div>

                {/* Read-Only Monaco Editor for Student Code */}
                <div className="border border-zinc-800 rounded-xl overflow-hidden h-72">
                  <Editor
                    height="100%"
                    language={submissionDetails.language || 'java'}
                    value={submissionDetails.sourceCode || ''}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      fontSize: 13,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    }}
                  />
                </div>

                {/* Teacher Feedback Section */}
                <div className="space-y-2">
                  <label className="label flex items-center gap-1.5 text-white">
                    <MessageSquare size={14} className="text-violet-400" />
                    Instructor Feedback & Code Review Comments
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide constructive feedback on code structure, time complexity, readability, or edge cases..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="input text-xs leading-relaxed"
                  />
                </div>
              </div>
            ) : null}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedSubmissionId(null)}
                className="btn-secondary btn-sm"
                disabled={submittingReview}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                className="btn-primary btn-sm"
                disabled={submittingReview || reviewLoading}
              >
                <Send size={13} className={submittingReview ? 'animate-spin' : ''} />
                {submittingReview ? 'Saving Feedback...' : 'Save Review Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionDashboard;
