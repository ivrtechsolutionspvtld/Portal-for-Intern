'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import {
  HelpCircle,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  Check,
  Send,
} from 'lucide-react';

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Quiz State
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [quizDetails, setQuizDetails] = useState<any | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/quizzes');
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

  // Timer countdown effect
  useEffect(() => {
    if (!quizDetails || timeLeftSeconds <= 0 || quizResult) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [quizDetails, timeLeftSeconds, quizResult]);

  const startQuiz = async (quizId: string) => {
    setActiveQuizId(quizId);
    setQuizLoading(true);
    setQuizError(null);
    setQuizResult(null);
    setAnswers({});
    setCurrentQuestionIdx(0);
    try {
      const res = await fetch(`/api/student/quizzes/${quizId}`);
      const data = await res.json();
      if (!res.ok) {
        setQuizError(data.error || 'Failed to start quiz');
      } else {
        setQuizDetails(data.quiz);
        setTimeLeftSeconds((data.quiz.durationMinutes || 20) * 60);
      }
    } catch {
      setQuizError('Network error loading quiz.');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, optionIdx: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleAutoSubmit = async () => {
    await handleSubmitQuiz();
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuizId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/student/quizzes/${activeQuizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuizResult(data.attempt);
        await loadQuizzes();
      } else {
        alert(data.error || 'Failed to submit quiz.');
      }
    } catch {
      alert('Error submitting quiz responses.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quizzes &amp; Assessments</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#5B21B6] border border-purple-200">
                Knowledge Checks
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Take timed module quizzes to test your understanding and unlock your internship certificate eligibility.
            </p>
          </div>
        </div>

        {/* Quizzes List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading quizzes...</div>
          ) : quizzes.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-xl">
              No technical quizzes scheduled for your cohort yet.
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
                    {q.latestAttempt ? (
                      <Badge variant={q.latestAttempt.passed ? 'success' : 'danger'}>
                        {q.latestAttempt.passed ? 'Passed' : 'Needs Review'}
                      </Badge>
                    ) : (
                      <Badge variant="default">Available</Badge>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{q.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {q.description || 'Comprehensive technical assessment.'}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {q.durationMinutes} mins
                    </span>
                    <span className="flex items-center gap-1 text-purple-800 font-bold">
                      <Award className="w-3 h-3 text-[#5B21B6]" />
                      Pass: {q.passScore}%
                    </span>
                  </div>

                  {q.latestAttempt && (
                    <div className="mt-2 p-2.5 bg-slate-50 rounded-lg text-xs flex items-center justify-between">
                      <span className="text-slate-500">Your Score:</span>
                      <span className="font-bold text-slate-900">
                        {q.latestAttempt.score}/{q.latestAttempt.maxScore} ({q.latestAttempt.percentage}%)
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  {q.canAttempt ? (
                    <button
                      type="button"
                      onClick={() => startQuiz(q.id)}
                      className="btn-ivr-primary w-full text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {q.attemptsCount > 0 ? 'Retake Quiz' : 'Start Assessment'}
                    </button>
                  ) : (
                    <div className="text-center text-xs text-slate-400 font-semibold py-1">
                      Attempt limit reached ({q.maxAttempts}/{q.maxAttempts})
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Interactive Quiz Taking Modal */}
      {activeQuizId && (
        <Modal
          isOpen={!!activeQuizId}
          onClose={() => {
            if (!quizResult && !confirm('Are you sure you want to exit? Your progress may be lost.')) return;
            setActiveQuizId(null);
            setQuizDetails(null);
            setQuizResult(null);
          }}
          title={quizDetails ? quizDetails.title : 'Assessment'}
          maxWidth="2xl"
        >
          {quizLoading ? (
            <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading secure assessment questions...</span>
            </div>
          ) : quizError ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
              <p className="text-xs text-red-700 font-bold">{quizError}</p>
            </div>
          ) : quizResult ? (
            /* Quiz Result Screen */
            <div className="p-6 text-center space-y-4 text-xs">
              <div
                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                  quizResult.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}
              >
                {quizResult.passed ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {quizResult.passed ? 'Assessment Passed!' : 'Assessment Completed'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {quizResult.passed
                    ? 'Great technical understanding demonstrated.'
                    : 'Review the curriculum lessons and practice to improve your understanding.'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-xs mx-auto space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total Score:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {quizResult.score} / {quizResult.maxScore}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Percentage:</span>
                  <span className="font-black text-[#5B21B6] text-sm">{quizResult.percentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Result:</span>
                  <Badge variant={quizResult.passed ? 'success' : 'danger'}>
                    {quizResult.passed ? 'PASSED' : 'FAILED'}
                  </Badge>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveQuizId(null);
                  setQuizDetails(null);
                  setQuizResult(null);
                }}
                className="btn-ivr-primary px-6 py-2 rounded-lg font-bold text-xs"
              >
                Back to Quizzes
              </button>
            </div>
          ) : quizDetails ? (
            /* Question Interface */
            <div className="space-y-4 text-xs">
              {/* Timer Bar */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                <span className="font-bold text-[#5B21B6]">
                  Question {currentQuestionIdx + 1} of {quizDetails.questions.length}
                </span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-purple-900">
                  <Clock className="w-4 h-4 text-[#5B21B6]" />
                  <span>Time Remaining: {formatTimer(timeLeftSeconds)}</span>
                </div>
              </div>

              {/* Question Statement */}
              {quizDetails.questions[currentQuestionIdx] && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 leading-relaxed">
                    {quizDetails.questions[currentQuestionIdx].question}
                  </h4>

                  <div className="space-y-2 pt-2">
                    {quizDetails.questions[currentQuestionIdx].options.map(
                      (opt: string, optIdx: number) => {
                        const qId = quizDetails.questions[currentQuestionIdx].id;
                        const isSelected = answers[qId] === optIdx;
                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleSelectAnswer(qId, optIdx)}
                            className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-purple-50 border-[#5B21B6] text-purple-950 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-[#5B21B6] bg-[#5B21B6] text-white' : 'border-slate-400'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span>{opt}</span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx((p) => Math.max(p - 1, 0))}
                  className="px-3.5 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {currentQuestionIdx < quizDetails.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                    className="btn-ivr-primary px-4 py-2 font-bold rounded-lg flex items-center gap-1"
                  >
                    Next Question
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitQuiz}
                    className="btn-ivr-primary px-5 py-2 font-bold rounded-lg flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </Modal>
      )}
    </DashboardLayout>
  );
}

