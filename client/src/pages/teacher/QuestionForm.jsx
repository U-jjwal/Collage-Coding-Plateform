import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  BookOpen, Plus, Trash2, ArrowLeft, Save, Eye, EyeOff,
  Code2, Clock, Cpu, Sparkles, Check
} from 'lucide-react';
import { teacherService } from '../../services';
import toast from 'react-hot-toast';

const DEFAULT_JAVA_STARTER = `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your solution here
    }
}`;

const DEFAULT_PYTHON_STARTER = `# Write your solution here
import sys

def main():
    pass

if __name__ == "__main__":
    main()`;

const DEFAULT_CPP_STARTER = `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}`;

const QuestionForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [activeLang, setActiveLang] = useState('java');

  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'Easy',
    status: 'published',
    tagsInput: '',
    description: '',
    inputFormat: '',
    outputFormat: '',
    constraints: ['1 <= n <= 10^5'],
    examples: [
      {
        input: '4\n2 7 11 15\n9',
        output: '0 1',
        explanation: 'nums[0] + nums[1] = 2 + 7 = 9',
      },
    ],
    testCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
      { input: '3\n3 2 4\n6', expectedOutput: '1 2', isHidden: true },
    ],
    starterCode: {
      java: DEFAULT_JAVA_STARTER,
      python: DEFAULT_PYTHON_STARTER,
      cpp: DEFAULT_CPP_STARTER,
      c: '',
    },
    timeLimitMs: 5000,
    memoryLimitKb: 262144,
  });

  useEffect(() => {
    if (isEditing) {
      const fetchQuestion = async () => {
        try {
          const res = await teacherService.getQuestion(id);
          const q = res.data.data;
          setFormData({
            title: q.title || '',
            difficulty: q.difficulty || 'Easy',
            status: q.status || 'published',
            tagsInput: (q.tags || []).join(', '),
            description: q.description || '',
            inputFormat: q.inputFormat || '',
            outputFormat: q.outputFormat || '',
            constraints: q.constraints?.length ? q.constraints : [''],
            examples: q.examples?.length ? q.examples : [{ input: '', output: '', explanation: '' }],
            testCases: q.testCases?.length ? q.testCases : [{ input: '', expectedOutput: '', isHidden: false }],
            starterCode: {
              java: q.starterCode?.java || DEFAULT_JAVA_STARTER,
              python: q.starterCode?.python || DEFAULT_PYTHON_STARTER,
              cpp: q.starterCode?.cpp || DEFAULT_CPP_STARTER,
              c: q.starterCode?.c || '',
            },
            timeLimitMs: q.timeLimitMs || 5000,
            memoryLimitKb: q.memoryLimitKb || 262144,
          });
        } catch (err) {
          toast.error('Failed to load question details.');
          navigate('/teacher/questions');
        } finally {
          setLoading(false);
        }
      };
      fetchQuestion();
    }
  }, [id, isEditing, navigate]);

  // Handlers for dynamic lists
  const handleAddConstraint = () => {
    setFormData((p) => ({ ...p, constraints: [...p.constraints, ''] }));
  };

  const handleConstraintChange = (idx, val) => {
    setFormData((p) => {
      const updated = [...p.constraints];
      updated[idx] = val;
      return { ...p, constraints: updated };
    });
  };

  const handleRemoveConstraint = (idx) => {
    setFormData((p) => ({ ...p, constraints: p.constraints.filter((_, i) => i !== idx) }));
  };

  const handleAddExample = () => {
    setFormData((p) => ({
      ...p,
      examples: [...p.examples, { input: '', output: '', explanation: '' }],
    }));
  };

  const handleExampleChange = (idx, field, val) => {
    setFormData((p) => {
      const updated = [...p.examples];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...p, examples: updated };
    });
  };

  const handleRemoveExample = (idx) => {
    setFormData((p) => ({ ...p, examples: p.examples.filter((_, i) => i !== idx) }));
  };

  const handleAddTestCase = () => {
    setFormData((p) => ({
      ...p,
      testCases: [...p.testCases, { input: '', expectedOutput: '', isHidden: true }],
    }));
  };

  const handleTestCaseChange = (idx, field, val) => {
    setFormData((p) => {
      const updated = [...p.testCases];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...p, testCases: updated };
    });
  };

  const handleRemoveTestCase = (idx) => {
    setFormData((p) => ({ ...p, testCases: p.testCases.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (overrideStatus) => {
    if (!formData.title.trim()) {
      toast.error('Please enter a question title.');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please write a question description.');
      return;
    }

    setSubmitting(true);
    const tags = formData.tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      title: formData.title.trim(),
      difficulty: formData.difficulty,
      status: overrideStatus || formData.status,
      tags,
      description: formData.description.trim(),
      inputFormat: formData.inputFormat.trim(),
      outputFormat: formData.outputFormat.trim(),
      constraints: formData.constraints.map((c) => c.trim()).filter(Boolean),
      examples: formData.examples.filter((e) => e.input && e.output),
      testCases: formData.testCases.filter((tc) => tc.input && tc.expectedOutput),
      starterCode: formData.starterCode,
      timeLimitMs: Number(formData.timeLimitMs) || 5000,
      memoryLimitKb: Number(formData.memoryLimitKb) || 262144,
    };

    try {
      if (isEditing) {
        await teacherService.updateQuestion(id, payload);
        toast.success('Question updated successfully!');
      } else {
        await teacherService.createQuestion(payload);
        toast.success('Question created successfully!');
      }
      navigate('/teacher/questions');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save question.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-400">
        <div className="spinner w-8 h-8 mx-auto mb-2" />
        Loading question form...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
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
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="text-violet-400" size={24} />
              {isEditing ? 'Edit Coding Question' : 'Create New Coding Question'}
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              Specify problem details, constraints, examples, and test cases for evaluation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('draft')}
            className="btn-secondary text-xs"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('published')}
            className="btn-primary text-xs"
          >
            <Save size={14} />
            {isEditing ? 'Save Changes' : 'Publish Question'}
          </button>
        </div>
      </div>

      {/* Main Form Sections */}
      <div className="space-y-6">
        {/* Basic Info Card */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
            1. Problem Overview
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 form-group">
              <label className="label">Question Title <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Reverse Linked List"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData((p) => ({ ...p, difficulty: e.target.value }))}
                className="input cursor-pointer font-medium"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. arrays, two-pointers, hash-table"
                value={formData.tagsInput}
                onChange={(e) => setFormData((p) => ({ ...p, tagsInput: e.target.value }))}
                className="input text-xs"
              />
            </div>

            <div className="form-group">
              <label className="label">Publication Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                className="input cursor-pointer"
              >
                <option value="published">Published (Visible to all students)</option>
                <option value="draft">Draft (Private to creator)</option>
                <option value="archived">Archived (Closed)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Problem Description & Statement <span className="text-red-400">*</span></label>
            <textarea
              rows={6}
              required
              placeholder="Describe the problem, input specifications, and expected behavior in detail..."
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              className="input font-sans text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Input/Output Formats & Constraints */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
            2. Input / Output & Constraints
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Input Format</label>
              <textarea
                rows={3}
                placeholder="e.g. First line contains an integer T, the number of test cases..."
                value={formData.inputFormat}
                onChange={(e) => setFormData((p) => ({ ...p, inputFormat: e.target.value }))}
                className="input text-xs"
              />
            </div>

            <div className="form-group">
              <label className="label">Output Format</label>
              <textarea
                rows={3}
                placeholder="e.g. For each test case, print the result on a new line..."
                value={formData.outputFormat}
                onChange={(e) => setFormData((p) => ({ ...p, outputFormat: e.target.value }))}
                className="input text-xs"
              />
            </div>
          </div>

          {/* Constraints List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Constraints</label>
              <button
                type="button"
                onClick={handleAddConstraint}
                className="text-violet-400 hover:text-violet-300 text-xs font-medium inline-flex items-center gap-1"
              >
                <Plus size={13} /> Add Constraint
              </button>
            </div>

            <div className="space-y-2">
              {formData.constraints.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 1 <= nums.length <= 10^4"
                    value={c}
                    onChange={(e) => handleConstraintChange(idx, e.target.value)}
                    className="input font-mono text-xs py-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveConstraint(idx)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 rounded transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Examples Section */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              3. Sample Examples (Visible in problem statement)
            </h3>
            <button
              type="button"
              onClick={handleAddExample}
              className="text-violet-400 hover:text-violet-300 text-xs font-medium inline-flex items-center gap-1"
            >
              <Plus size={14} /> Add Example
            </button>
          </div>

          <div className="space-y-4">
            {formData.examples.map((ex, idx) => (
              <div key={idx} className="p-4 bg-zinc-800/40 border border-zinc-700/80 rounded-xl space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-violet-400 uppercase">
                    Example {idx + 1}
                  </span>
                  {formData.examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExample(idx)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="text-xs text-zinc-400">Input</label>
                    <textarea
                      rows={2}
                      placeholder="Sample Input"
                      value={ex.input}
                      onChange={(e) => handleExampleChange(idx, 'input', e.target.value)}
                      className="input font-mono text-xs"
                    />
                  </div>
                  <div className="form-group">
                    <label className="text-xs text-zinc-400">Output</label>
                    <textarea
                      rows={2}
                      placeholder="Sample Output"
                      value={ex.output}
                      onChange={(e) => handleExampleChange(idx, 'output', e.target.value)}
                      className="input font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="text-xs text-zinc-400">Explanation (Optional)</label>
                  <input
                    type="text"
                    placeholder="Brief explanation of this case..."
                    value={ex.explanation}
                    onChange={(e) => handleExampleChange(idx, 'explanation', e.target.value)}
                    className="input text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Cases (For Automated Evaluation) */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                4. Test Cases & Hidden Tests
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                Evaluated by the code judge. Hidden test cases are never leaked to students.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTestCase}
              className="text-violet-400 hover:text-violet-300 text-xs font-medium inline-flex items-center gap-1"
            >
              <Plus size={14} /> Add Test Case
            </button>
          </div>

          <div className="space-y-4">
            {formData.testCases.map((tc, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  tc.isHidden
                    ? 'bg-zinc-900 border-zinc-700/80'
                    : 'bg-emerald-950/15 border-emerald-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-300">
                      Test Case #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTestCaseChange(idx, 'isHidden', !tc.isHidden)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        tc.isHidden
                          ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {tc.isHidden ? (
                        <><EyeOff size={11} /> Hidden Test Case</>
                      ) : (
                        <><Eye size={11} /> Visible Test Case</>
                      )}
                    </button>
                  </div>

                  {formData.testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTestCase(idx)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="text-xs text-zinc-400">Standard Input (stdin)</label>
                    <textarea
                      rows={3}
                      placeholder="Standard input fed to the student's program"
                      value={tc.input}
                      onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)}
                      className="input font-mono text-xs"
                    />
                  </div>
                  <div className="form-group">
                    <label className="text-xs text-zinc-400">Expected Output (stdout)</label>
                    <textarea
                      rows={3}
                      placeholder="Exact stdout expected"
                      value={tc.expectedOutput}
                      onChange={(e) => handleTestCaseChange(idx, 'expectedOutput', e.target.value)}
                      className="input font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Starter Code Templates */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
            <Code2 size={16} className="text-violet-400" />
            5. Starter Code Template
          </h3>

          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            {['java', 'python', 'cpp'].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveLang(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase transition-colors ${
                  activeLang === lang
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <div className="form-group">
            <textarea
              rows={8}
              value={formData.starterCode[activeLang] || ''}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  starterCode: { ...p.starterCode, [activeLang]: e.target.value },
                }))
              }
              className="input font-mono text-xs leading-relaxed"
            />
          </div>
        </div>

        {/* Execution Limits */}
        <div className="card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-violet-400" />
            <span>Time Limit: <strong>5.0s</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-blue-400" />
            <span>Memory Limit: <strong>256 MB</strong></span>
          </div>
        </div>
      </div>

      {/* Floating Bottom Actions */}
      <div className="sticky bottom-4 z-20 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 rounded-xl p-4 flex items-center justify-between shadow-2xl">
        <Link to="/teacher/questions" className="btn-ghost text-xs">
          Discard & Back
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('draft')}
            className="btn-secondary text-xs"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('published')}
            className="btn-primary text-xs"
          >
            <Save size={14} />
            {isEditing ? 'Save Changes' : 'Publish Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;
