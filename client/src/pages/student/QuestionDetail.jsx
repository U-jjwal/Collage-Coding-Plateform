import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Code2, Clock, Cpu, Copy, Check, CheckCircle2,
  AlertCircle, History, Sparkles, Terminal
} from 'lucide-react';
import { studentService } from '../../services';
import toast from 'react-hot-toast';

const QuestionDetail = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await studentService.getQuestion(id);
        setQuestion(res.data.data.question);
        setSubmissions(res.data.data.submissions || []);
      } catch (err) {
        toast.error('Failed to load question details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedIdx(null), 2000);
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

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-400">
        <div className="spinner w-8 h-8 mx-auto mb-2" />
        Loading challenge overview...
      </div>
    );
  }

  if (!question) {
    return (
      <div className="card text-center py-16">
        <h3 className="text-white font-bold text-lg">Question not found</h3>
        <p className="text-zinc-400 text-xs mt-1">This challenge may have been archived or unpublished.</p>
        <Link to="/student/questions" className="btn-secondary mt-4 inline-flex">
          Back to Question List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Back button and quick solve banner */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/student/questions"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to Catalog
        </Link>

        {/* Action Button */}
        <Link
          to={`/student/workspace/${question._id}`}
          className="btn-primary"
        >
          <Terminal size={16} /> Open Code Workspace
        </Link>
      </div>

      {/* Main Question Card */}
      <div className="card space-y-6">
        {/* Title & Metadata */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {getDifficultyBadge(question.difficulty)}
            <div className="flex items-center gap-1 text-zinc-500 text-xs">
              <Clock size={12} /> 5.0s
            </div>
            <div className="flex items-center gap-1 text-zinc-500 text-xs">
              <Cpu size={12} /> 256 MB
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {question.title}
          </h1>

          {question.tags?.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {question.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs bg-zinc-800 border border-zinc-700/80 text-zinc-400 px-2.5 py-0.5 rounded-full"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="divider" />

        {/* Problem Statement */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
            Problem Description
          </h2>
          <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
            {question.description}
          </div>
        </div>

        {/* Input & Output Format */}
        {(question.inputFormat || question.outputFormat) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-800/40 p-4 rounded-xl border border-zinc-800">
            {question.inputFormat && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-zinc-300 uppercase">Input Format</h3>
                <p className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">
                  {question.inputFormat}
                </p>
              </div>
            )}
            {question.outputFormat && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-zinc-300 uppercase">Output Format</h3>
                <p className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">
                  {question.outputFormat}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Constraints */}
        {question.constraints?.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              Constraints
            </h2>
            <ul className="list-disc list-inside space-y-1 text-xs font-mono text-zinc-400 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
              {question.constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Sample Examples */}
        {question.examples?.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              Examples
            </h2>
            <div className="space-y-4">
              {question.examples.map((ex, idx) => (
                <div key={idx} className="bg-zinc-800/40 border border-zinc-700/60 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-400 uppercase">
                      Example {idx + 1}
                    </span>
                    <button
                      onClick={() => copyToClipboard(`Input:\n${ex.input}\n\nOutput:\n${ex.output}`, idx)}
                      className="text-zinc-400 hover:text-white text-xs inline-flex items-center gap-1"
                    >
                      {copiedIdx === idx ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      {copiedIdx === idx ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500 font-semibold block mb-1">Input:</span>
                      <pre className="bg-zinc-900 p-2.5 rounded border border-zinc-800 font-mono text-zinc-200 whitespace-pre-wrap">
                        {ex.input}
                      </pre>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-semibold block mb-1">Output:</span>
                      <pre className="bg-zinc-900 p-2.5 rounded border border-zinc-800 font-mono text-zinc-200 whitespace-pre-wrap">
                        {ex.output}
                      </pre>
                    </div>
                  </div>

                  {ex.explanation && (
                    <div className="text-xs text-zinc-400 pt-1 border-t border-zinc-800">
                      <span className="font-semibold text-zinc-300">Explanation: </span>
                      {ex.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Past Submissions Preview */}
      {submissions.length > 0 && (
        <div className="card space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <History size={16} className="text-blue-400" />
            Your Recent Submissions For This Problem
          </h2>
          <div className="divide-y divide-zinc-800">
            {submissions.map((sub) => (
              <div key={sub._id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      sub.status === 'accepted' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {sub.status === 'accepted' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                    {sub.status}
                  </span>
                  <span className="text-zinc-500 uppercase font-mono">({sub.language})</span>
                </div>
                <span className="text-zinc-500">
                  {new Date(sub.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionDetail;
