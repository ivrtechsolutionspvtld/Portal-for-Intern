'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {
  HelpCircle,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
  Eye,
  Award,
  Users,
  Search,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function MentorQuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Quiz Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [passScore, setPassScore] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [status, setStatus] = useState('PUBLISHED');
  const [questions, setQuestions] = useState<any[]>([
    {
      question: '',
      type: 'MCQ',
      options: ['', '', '', ''],
      correctIndex: 0,
      points: 1,
    },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // View Attempts Modal
  const [viewingQuiz, setViewingQuiz] = useState<any | null>(null);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mentor/quizzes');
      if (res.ok) {
        const d = await res.json();
        setQuizzes(d.quizzes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: '',
        type: 'MCQ',
        options: ['', '', '', ''],
        correctIndex: 0,
        points: 1,
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestionText = (idx: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, question: text } : q))
    );
  };

  const updateOptionText = (qIdx: number, optIdx: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOpts = [...q.options];
        newOpts[optIdx] = text;
        return { ...q, options: newOpts };
      })
    );
  };

  const updateCorrectIndex = (qIdx: number, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, correctIndex: optIdx } : q))
    );
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || questions.some((q) => !q.question.trim())) {
      alert('Please fill out all question prompts.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/mentor/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          durationMinutes,
          passScore,
          maxAttempts,
          status,
          questions,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        setQuestions([
          {
            question: '',
            type: 'MCQ',
            options: ['', '', '', ''],
            correctIndex: 0,
            points: 1,
          },
        ]);
        await loadQuizzes();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create quiz');
      }
    } catch {
      alert('Error creating quiz');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="MENTOR">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Technical Quizzes &amp; Assessments</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
                Knowledge Evaluation
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Build MCQ, true/false, and technical skill assessments. Track completion, review attempts, and analyze cohort pass rates.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-ivr-primary text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Technical Quiz
          </button>
        </div>

        {/* Quizzes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading quizzes...</div>
          ) : quizzes.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-xl">
              No quizzes created yet. Click &quot;Create Technical Quiz&quot; above to launch your first assessment.
            </div>
          ) : (
            quizzes.map((q) => (
              <div
                key={q.id}
                className="ivr-card p-5 bg-white border border-slate-200 rounded-xl flex flex-col justify-between space-y-4 shadow-2xs hover:border-purple-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold">
                      {q.questionCount} Questions
                    </span>
                    <Badge variant={q.status === 'PUBLISHED' ? 'success' : 'default'}>
                      {q.status}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{q.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {q.description || 'Comprehensive assessment covering technical fundamentals.'}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {q.durationMinutes} mins
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-purple-800">
                      <Award className="w-3 h-3 text-[#5B21B6]" />
                      Pass: {q.passScore}%
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Users className="w-3 h-3" />
                      {q.attemptsCount} Attempts ({q.passRate}% pass)
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setViewingQuiz(q)}
                    className="btn-ivr-secondary w-full text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect Questions &amp; Attempts
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Quiz Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Technical Quiz"
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateQuiz} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-800 font-bold mb-1">Quiz Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Assessment 1: Asynchronous JavaScript & RESTful APIs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-slate-800 font-bold mb-1">Description / Instructions</label>
            <textarea
              rows={2}
              placeholder="Explain the topics tested, instructions, and rules..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-800 font-bold mb-1">Timer (Minutes)</label>
              <input
                type="number"
                min={5}
                max={120}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-1">Passing Score (%)</label>
              <input
                type="number"
                min={30}
                max={100}
                value={passScore}
                onChange={(e) => setPassScore(parseInt(e.target.value, 10))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-1">Allowed Attempts</label>
              <input
                type="number"
                min={1}
                max={5}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(parseInt(e.target.value, 10))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          {/* Questions Builder */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Quiz Questions ({questions.length})
              </h4>
              <button
                type="button"
                onClick={addQuestion}
                className="text-xs font-bold text-[#5B21B6] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Question
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#5B21B6]">Question {qIdx + 1}</span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIdx)}
                        className="text-slate-400 hover:text-rose-600"
                        title="Remove question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Enter question statement..."
                    value={q.question}
                    onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#7C3AED]"
                  />

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-bold block">
                      Options (Select the correct radio button):
                    </span>
                    {q.options.map((opt: string, optIdx: number) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct_${qIdx}`}
                          checked={q.correctIndex === optIdx}
                          onChange={() => updateCorrectIndex(qIdx, optIdx)}
                          className="text-[#5B21B6] focus:ring-[#7C3AED]"
                          title="Mark as correct answer"
                        />
                        <input
                          type="text"
                          required
                          placeholder={`Option ${optIdx + 1}`}
                          value={opt}
                          onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                          className={`w-full text-xs p-1.5 rounded-md border ${
                            q.correctIndex === optIdx
                              ? 'border-emerald-500 bg-emerald-50/30'
                              : 'border-slate-200'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-ivr-primary px-5 py-2 font-bold rounded-lg flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {submitting ? 'Creating...' : 'Publish Quiz'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Inspect Quiz & Attempts Modal */}
      {viewingQuiz && (
        <Modal
          isOpen={!!viewingQuiz}
          onClose={() => setViewingQuiz(null)}
          title={`Quiz Analytics: ${viewingQuiz.title}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-[10px] uppercase font-bold text-[#5B21B6]">Questions</span>
                <p className="text-base font-black text-slate-900 mt-0.5">{viewingQuiz.questionCount}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800">Pass Rate</span>
                <p className="text-base font-black text-emerald-900 mt-0.5">{viewingQuiz.passRate}%</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500">Total Attempts</span>
                <p className="text-base font-black text-slate-900 mt-0.5">{viewingQuiz.attemptsCount}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
                Fellow Attempt Submissions
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {viewingQuiz.attempts?.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">No attempts recorded yet.</div>
                ) : (
                  viewingQuiz.attempts?.map((a: any) => (
                    <div key={a.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900">{a.studentName}</span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(a.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-800">
                          {a.score}/{a.maxScore} ({a.percentage}%)
                        </span>
                        <Badge variant={a.passed ? 'success' : 'danger'}>
                          {a.passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

