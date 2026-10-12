import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  ArrowLeft, Play, Send, RefreshCw, Terminal, CheckCircle2,
  XCircle, AlertCircle, Clock, Cpu, Code2, ChevronUp, ChevronDown,
  Maximize2, RotateCcw, Copy, Check
} from 'lucide-react';
import { studentService } from '../../services';
import toast from 'react-hot-toast';

const CodingWorkspace = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editor states
  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [customInput, setCustomInput] = useState('');

  // Execution states
  const [activeTab, setActiveTab] = useState('problem'); // problem | submissions
  const [bottomTab, setBottomTab] = useState('run'); // run | submit | custom
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submissionsHistory, setSubmissionsHistory] = useState([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  // Load question
  useEffect(() => {
    const fetchQuestion = async () => {
      setLoading(true);
      try {
        const res = await studentService.getQuestion(id);
        const q = res.data.data.question;
        setQuestion(q);
        setSubmissionsHistory(res.data.data.submissions || []);

        // Load starter code
        const initialCode =
          q.starterCode?.[language] ||
          q.starterCode?.java ||
          `public class Solution {\n    public static void main(String[] args) {\n        // Write code here\n    }\n}`;
        setCode(initialCode);

        // Pre-fill sample input from first example if available
        if (q.examples?.length > 0) {
          setCustomInput(q.examples[0].input || '');
        }
      } catch (err) {
        toast.error('Failed to load coding challenge.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [id, language]);

  // Handle language switch
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (question?.starterCode?.[newLang]) {
      setCode(question.starterCode[newLang]);
    }
  };

  // Reset starter code
  const handleResetCode = () => {
    if (window.confirm('Reset code to starter template? Your unsaved changes will be lost.')) {
      if (question?.starterCode?.[language]) {
        setCode(question.starterCode[language]);
      }
      toast.success('Code reset to template.');
    }
  };

  // Run custom input
  const handleRun = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before running.');
      return;
    }
    setRunning(true);
    setRunResult(null);
    setBottomTab('run');
    setIsConsoleOpen(true);

    try {
      const res = await studentService.runCode(id, {
        sourceCode: code,
        language,
        customInput,
      });
      setRunResult(res.data.data);
      if (res.data.data.status === 'compile_error') {
        toast.error('Compilation Error');
      } else if (res.data.data.status === 'runtime_error') {
        toast.error('Runtime Error');
      } else {
        toast.success('Execution completed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Execution failed.');
    } finally {
      setRunning(false);
    }
  };

  // Submit code for grading
  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before submitting.');
      return;
    }
    setSubmitting(true);
    setSubmissionResult(null);
    setBottomTab('submit');
    setIsConsoleOpen(true);

    try {
      const res = await studentService.submitCode(id, {
        sourceCode: code,
        language,
      });
      const data = res.data.data;
      setSubmissionResult(data);

      if (data.status === 'accepted') {
        toast.success(`Accepted! All ${data.totalTests} tests passed! 🎉`);
      } else if (data.status === 'wrong_answer') {
        toast.error(`Wrong Answer (${data.passedTests}/${data.totalTests} passed)`);
      } else {
        toast.error(`Evaluation: ${data.status}`);
      }

      // Refresh history
      const histRes = await studentService.getMySubmissionsForQuestion(id);
      setSubmissionsHistory(histRes.data.data.submissions || []);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Initializing code workspace...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 p-4">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-white font-bold text-lg">Challenge not found</h2>
          <Link to="/student/questions" className="btn-primary mt-4 inline-flex">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Top Workspace Navbar */}
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            to={`/student/questions/${question._id}`}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Back to problem details"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white max-w-xs sm:max-w-md truncate">
              {question.title}
            </h1>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                question.difficulty === 'Easy'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : question.difficulty === 'Medium'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'bg-red-500/15 text-red-400 border border-red-500/20'
              }`}
            >
              {question.difficulty}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Language selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
          >
            <option value="java">Java (OpenJDK 21)</option>
            <option value="python">Python 3.12</option>
            <option value="cpp">C++ (GCC 14)</option>
          </select>

          {/* Reset button */}
          <button
            onClick={handleResetCode}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800 transition-colors"
            title="Reset code template"
          >
            <RotateCcw size={15} />
          </button>

          {/* Run Code */}
          <button
            disabled={running || submitting}
            onClick={handleRun}
            className="btn-secondary btn-sm"
          >
            <Play size={13} className={running ? 'animate-spin' : ''} />
            {running ? 'Running...' : 'Run Code'}
          </button>

          {/* Submit Code */}
          <button
            disabled={running || submitting}
            onClick={handleSubmit}
            className="btn-primary btn-sm bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
          >
            <Send size={13} className={submitting ? 'animate-spin' : ''} />
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </header>

      {/* Main Split-Pane Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Pane: Question Description / Past Submissions */}
        <div className="w-full md:w-[45%] h-full border-r border-zinc-800 flex flex-col bg-zinc-900/40 overflow-hidden">
          {/* Left Tabs Header */}
          <div className="flex items-center border-b border-zinc-800 bg-zinc-900 px-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('problem')}
              className={`py-3 px-3 border-b-2 transition-colors ${
                activeTab === 'problem'
                  ? 'border-violet-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Problem Description
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'submissions'
                  ? 'border-violet-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              My Submissions
              {submissionsHistory.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-zinc-800 text-[10px] flex items-center justify-center">
                  {submissionsHistory.length}
                </span>
              )}
            </button>
          </div>

          {/* Left Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
            {activeTab === 'problem' ? (
              <>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Description
                  </h3>
                  <div className="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {question.description}
                  </div>
                </div>

                {(question.inputFormat || question.outputFormat) && (
                  <div className="space-y-3 bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 text-xs">
                    {question.inputFormat && (
                      <div>
                        <span className="font-semibold text-zinc-300 block mb-1">Input Format:</span>
                        <p className="text-zinc-400 whitespace-pre-wrap">{question.inputFormat}</p>
                      </div>
                    )}
                    {question.outputFormat && (
                      <div className="pt-2 border-t border-zinc-800">
                        <span className="font-semibold text-zinc-300 block mb-1">Output Format:</span>
                        <p className="text-zinc-400 whitespace-pre-wrap">{question.outputFormat}</p>
                      </div>
                    )}
                  </div>
                )}

                {question.constraints?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Constraints
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-xs font-mono text-zinc-400 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      {question.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {question.examples?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Examples
                    </h3>
                    {question.examples.map((ex, idx) => (
                      <div key={idx} className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-2 text-xs">
                        <span className="font-bold text-violet-400 uppercase">Example {idx + 1}</span>
                        <div>
                          <span className="text-zinc-500 font-semibold block mb-0.5">Input:</span>
                          <pre className="bg-zinc-950 p-2 rounded text-zinc-200 font-mono whitespace-pre-wrap">
                            {ex.input}
                          </pre>
                        </div>
                        <div>
                          <span className="text-zinc-500 font-semibold block mb-0.5">Output:</span>
                          <pre className="bg-zinc-950 p-2 rounded text-zinc-200 font-mono whitespace-pre-wrap">
                            {ex.output}
                          </pre>
                        </div>
                        {ex.explanation && (
                          <p className="text-zinc-400 text-[11px] pt-1 border-t border-zinc-800/80">
                            <strong>Explanation: </strong>{ex.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Past Submissions Tab */
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Submission History
                </h3>
                {submissionsHistory.length === 0 ? (
                  <p className="text-zinc-500 text-xs py-6 text-center">
                    No submissions made yet for this question.
                  </p>
                ) : (
                  submissionsHistory.map((sub) => (
                    <div
                      key={sub._id}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold inline-flex items-center gap-1 ${
                            sub.status === 'accepted' ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {sub.status === 'accepted' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                          {sub.status.toUpperCase()}
                        </span>
                        <span className="text-zinc-500 font-mono text-[10px]">
                          {new Date(sub.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>Language: {sub.language}</span>
                        {sub.evaluation && (
                          <span>
                            {sub.evaluation.passedTests}/{sub.evaluation.totalTests} Passed
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Code Editor + Bottom Console Drawer */}
        <div className="w-full md:w-[55%] h-full flex flex-col bg-zinc-950 overflow-hidden">
          {/* Monaco Editor Wrapper */}
          <div className="flex-1 relative overflow-hidden">
            <Editor
              height="100%"
              language={language === 'java' ? 'java' : language === 'python' ? 'python' : 'cpp'}
              value={code}
              theme="vs-dark"
              onChange={(val) => setCode(val || '')}
              options={{
                fontSize,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                padding: { top: 12 },
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            />
          </div>

          {/* Bottom Console Drawer */}
          <div
            className={`border-t border-zinc-800 bg-zinc-900/90 backdrop-blur-md flex flex-col transition-all duration-200 ${
              isConsoleOpen ? 'h-64' : 'h-10'
            }`}
          >
            {/* Console Header Bar */}
            <div className="h-10 bg-zinc-900 px-4 flex items-center justify-between border-b border-zinc-800 text-xs">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { setBottomTab('run'); setIsConsoleOpen(true); }}
                  className={`font-semibold flex items-center gap-1.5 transition-colors ${
                    bottomTab === 'run' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Terminal size={14} /> Console Output
                </button>
                <button
                  onClick={() => { setBottomTab('submit'); setIsConsoleOpen(true); }}
                  className={`font-semibold flex items-center gap-1.5 transition-colors ${
                    bottomTab === 'submit' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <CheckCircle2 size={14} /> Evaluation Results
                </button>
                <button
                  onClick={() => { setBottomTab('custom'); setIsConsoleOpen(true); }}
                  className={`font-semibold flex items-center gap-1.5 transition-colors ${
                    bottomTab === 'custom' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Custom Stdin Input
                </button>
              </div>

              <button
                onClick={() => setIsConsoleOpen((p) => !p)}
                className="text-zinc-400 hover:text-white p-1"
                title={isConsoleOpen ? 'Collapse console' : 'Expand console'}
              >
                {isConsoleOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </div>

            {/* Console Content Area */}
            {isConsoleOpen && (
              <div className="flex-1 p-4 overflow-y-auto text-xs font-mono">
                {bottomTab === 'run' && (
                  <div>
                    {running ? (
                      <div className="text-zinc-400 flex items-center gap-2">
                        <div className="spinner w-4 h-4" /> Running your code...
                      </div>
                    ) : runResult ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-2">
                          <span className="font-semibold text-zinc-200">
                            Status: <strong className="uppercase text-emerald-400">{runResult.status}</strong>
                          </span>
                          {runResult.executionTimeMs && (
                            <span>Time: {runResult.executionTimeMs}ms</span>
                          )}
                        </div>

                        {runResult.stdout && (
                          <div>
                            <span className="text-zinc-500 font-sans block mb-1">Standard Output:</span>
                            <pre className="bg-zinc-950 p-2.5 rounded border border-zinc-800 text-zinc-100 whitespace-pre-wrap">
                              {runResult.stdout}
                            </pre>
                          </div>
                        )}

                        {runResult.stderr && (
                          <div>
                            <span className="text-red-400 font-sans block mb-1">Error Stream:</span>
                            <pre className="bg-red-950/20 p-2.5 rounded border border-red-900/30 text-red-400 whitespace-pre-wrap">
                              {runResult.stderr}
                            </pre>
                          </div>
                        )}

                        {runResult.compile_output && (
                          <div>
                            <span className="text-amber-400 font-sans block mb-1">Compilation Output:</span>
                            <pre className="bg-amber-950/20 p-2.5 rounded border border-amber-900/30 text-amber-400 whitespace-pre-wrap">
                              {runResult.compile_output}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-zinc-500">Click "Run Code" to test execution with your custom input.</p>
                    )}
                  </div>
                )}

                {bottomTab === 'submit' && (
                  <div>
                    {submitting ? (
                      <div className="text-zinc-400 flex items-center gap-2">
                        <div className="spinner w-4 h-4" /> Evaluating all test cases against sandbox...
                      </div>
                    ) : submissionResult ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <span className={`text-sm font-bold uppercase ${
                            submissionResult.status === 'accepted' ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {submissionResult.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-zinc-300 font-semibold">
                            Passed: {submissionResult.passedTests} / {submissionResult.totalTests} Tests
                          </span>
                        </div>

                        {submissionResult.errorMessage && (
                          <pre className="bg-red-950/20 border border-red-900/30 p-2.5 rounded text-red-400 whitespace-pre-wrap">
                            {submissionResult.errorMessage}
                          </pre>
                        )}

                        {/* Test case cards */}
                        <div className="space-y-2 mt-2">
                          {submissionResult.testResults?.map((t) => (
                            <div
                              key={t.testCaseIndex}
                              className={`p-2.5 rounded-lg border flex items-center justify-between ${
                                t.passed
                                  ? 'bg-emerald-950/15 border-emerald-500/20 text-emerald-400'
                                  : 'bg-red-950/15 border-red-500/20 text-red-400'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {t.passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                <span>
                                  Test Case #{t.testCaseIndex} {t.isHidden ? '(Hidden Test)' : '(Visible Test)'}
                                </span>
                              </div>
                              <span className="font-bold text-[11px] uppercase">
                                {t.passed ? 'Passed' : t.error || 'Failed'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-zinc-500">Click "Submit" to evaluate your code against the full test suite.</p>
                    )}
                  </div>
                )}

                {bottomTab === 'custom' && (
                  <div className="space-y-2">
                    <span className="text-zinc-400 font-sans block">Custom Standard Input (stdin):</span>
                    <textarea
                      rows={4}
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter values to feed into standard input..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 font-mono text-xs outline-none focus:border-violet-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingWorkspace;
