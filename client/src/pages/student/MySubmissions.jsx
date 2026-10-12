import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, CheckCircle2, XCircle, AlertCircle, Clock,
  Code2, Eye, X, ChevronLeft, ChevronRight, RefreshCw, MessageSquare
} from 'lucide-react';
import { studentService } from '../../services';
import toast from 'react-hot-toast';

const MySubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const fetchSubmissions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await studentService.getMySubmissions({ page, limit: pagination.limit });
      setSubmissions(res.data.data.submissions || []);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error('Failed to load submissions history.');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchSubmissions(1);
  }, [fetchSubmissions]);

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
        return (
          <span className="badge-pending">
            {status}
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
            <ClipboardList className="text-violet-400" size={26} />
            My Submission History
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Review your previous code submissions, scores, and instructor feedback.
          </p>
        </div>
        <button
          onClick={() => fetchSubmissions(pagination.page)}
          className="btn-secondary btn-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800/60 border-b border-zinc-800 text-xs uppercase text-zinc-400 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Problem</th>
                <th className="px-5 py-3.5">Result</th>
                <th className="px-5 py-3.5">Test Cases</th>
                <th className="px-5 py-3.5">Language</th>
                <th className="px-5 py-3.5">Instructor Review</th>
                <th className="px-5 py-3.5">Submitted</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <div className="spinner w-8 h-8 mx-auto mb-2" />
                    Loading submission records...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <ClipboardList size={36} className="mx-auto mb-2 opacity-30" />
                    No submissions found. Solve a challenge from the catalog to see your attempts here.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/student/questions/${sub.questionId?._id}`}
                        className="font-semibold text-white hover:text-violet-300 transition-colors"
                      >
                        {sub.questionId?.title || 'Unknown Problem'}
                      </Link>
                      <span className="block text-[11px] text-zinc-500 capitalize mt-0.5">
                        {sub.questionId?.difficulty}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-300 font-mono">
                      {sub.evaluation?.passedTests ?? 0} / {sub.evaluation?.totalTests ?? 0}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-400 uppercase font-mono">
                      {sub.language}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {sub.teacherReview?.status === 'reviewed' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <MessageSquare size={13} /> Reviewed
                        </span>
                      ) : (
                        <span className="text-zinc-500">Pending Review</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-400">
                      {new Date(sub.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedSubmission(sub)}
                        className="btn-ghost btn-sm text-xs text-violet-400 hover:text-violet-300"
                      >
                        <Eye size={13} /> Inspect Code
                      </button>
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
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} submissions
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchSubmissions(pagination.page - 1)}
                className="btn-secondary btn-sm disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="px-2 font-medium text-zinc-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchSubmissions(pagination.page + 1)}
                className="btn-secondary btn-sm disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Code Inspection Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-2xl w-full border-zinc-700 shadow-2xl relative animate-slide-up max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedSubmission.questionId?.title}
                </h3>
                <span className="text-xs text-zinc-400 uppercase font-mono">
                  {selectedSubmission.language} • {new Date(selectedSubmission.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {selectedSubmission.teacherReview?.feedback && (
              <div className="mt-3 p-3 bg-blue-950/20 border border-blue-500/20 rounded-lg text-xs text-blue-300">
                <strong>Instructor Feedback: </strong>
                {selectedSubmission.teacherReview.feedback}
              </div>
            )}

            <div className="flex-1 overflow-y-auto mt-4">
              <pre className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {selectedSubmission.sourceCode}
              </pre>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="btn-secondary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySubmissions;
