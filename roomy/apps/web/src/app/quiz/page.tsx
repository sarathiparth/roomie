'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { QUESTIONS, SECTIONS } from '@roomy/scoring';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuizPage() {
  const router = useRouter();
  const { user } = useAuth(true);
  const updateUser = useAuthStore(s => s.updateUser);
  
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const sectionIds = Object.keys(SECTIONS);
  const currentSectionId = sectionIds[currentSectionIdx];
  const sectionQuestions = QUESTIONS.filter(q => q.section === currentSectionId);

  const handleAnswer = (qId: string, val: unknown) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleMultiSelect = (qId: string, optionId: string) => {
    setAnswers(prev => {
      const current = (prev[qId] as string[]) || [];
      if (optionId === 'none') return { ...prev, [qId]: ['none'] };
      
      const withoutNone = current.filter(x => x !== 'none');
      if (withoutNone.includes(optionId)) {
        return { ...prev, [qId]: withoutNone.filter(x => x !== optionId) };
      } else {
        return { ...prev, [qId]: [...withoutNone, optionId] };
      }
    });
  };

  const isSectionComplete = () => {
    return sectionQuestions.every(q => answers[q.id] !== undefined && (Array.isArray(answers[q.id]) ? (answers[q.id] as any[]).length > 0 : true));
  };

  const nextSection = async () => {
    if (!isSectionComplete()) {
      toast.error('Please complete all questions in this section');
      return;
    }

    if (currentSectionIdx < sectionIds.length - 1) {
      setCurrentSectionIdx(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Submit
      setSubmitting(true);
      try {
        await api.post('/quiz/answers', { answers });
        updateUser({ quizCompleted: true });
        toast.success("Quiz completed! Let's find matches.");
        router.push('/discover');
      } catch (err) {
        toast.error('Failed to save answers');
        setSubmitting(false);
      }
    }
  };

  if (!user) return null;

  const sectionProgress = Math.round(((currentSectionIdx) / sectionIds.length) * 100);

  return (
    <div className="min-h-screen pb-24 max-w-2xl mx-auto px-4 pt-12">
      {/* Header & Progress */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md z-40 py-4 -mx-4 px-4 border-b border-text/10 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold tracking-tight">{SECTIONS[currentSectionId as keyof typeof SECTIONS]}</h1>
          <span className="text-sm font-medium text-text-muted">
            {currentSectionIdx + 1} / {sectionIds.length}
          </span>
        </div>
        <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-text/5">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${sectionProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSectionId}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-12"
        >
          {sectionQuestions.map((q) => (
            <div key={q.id} className="space-y-4">
              <h3 className="text-lg font-medium leading-snug">{q.text}</h3>
              
              {q.type === 'slider' && (
                <div className="space-y-6 bg-surface p-6 rounded-2xl border border-text/5">
                  <input
                    type="range"
                    min={q.min}
                    max={q.max}
                    step={1}
                    value={(answers[q.id] as number) ?? (q.max! - q.min!) / 2 + q.min!}
                    className="w-full accent-primary h-2 bg-text/10 rounded-lg appearance-none cursor-pointer"
                    onChange={(e) => handleAnswer(q.id, Number(e.target.value))}
                  />
                  <div className="flex justify-between text-xs font-medium text-text-muted uppercase tracking-wider">
                    <span>{q.labels?.[q.min!]}</span>
                    <span>{q.labels?.[q.max!]}</span>
                  </div>
                </div>
              )}

              {q.type === 'mcq_single' && (
                <div className="grid gap-3">
                  {q.options?.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleAnswer(q.id, opt.id)}
                      className={`text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                        answers[q.id] === opt.id 
                          ? 'border-primary bg-primary/10 text-text ring-1 ring-primary' 
                          : 'border-text/10 bg-surface hover:bg-surface/80 text-text-muted hover:text-text'
                      }`}
                    >
                      <span className="font-medium">{opt.text}</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[q.id] === opt.id ? 'border-primary' : 'border-text/20'}`}>
                        {answers[q.id] === opt.id && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'mcq_multi' && (
                <div className="grid gap-3">
                  {q.options?.map((opt) => {
                    const isSelected = ((answers[q.id] as string[]) || []).includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleMultiSelect(q.id, opt.id)}
                        className={`text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-text ring-1 ring-primary' 
                            : 'border-text/10 bg-surface hover:bg-surface/80 text-text-muted hover:text-text'
                        }`}
                      >
                        <span className="font-medium">{opt.text}</span>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'border-primary bg-primary text-white' : 'border-text/20'}`}>
                          {isSelected && <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5"><path d="M11.6667 3.5L5.25001 9.91667L2.33334 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'scenario_choice' && (
                <div className="grid gap-3">
                  {q.options?.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleAnswer(q.id, opt.id)}
                      className={`text-left p-5 rounded-2xl border transition-all duration-200 ${
                        answers[q.id] === opt.id 
                          ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                          : 'border-text/10 bg-surface hover:bg-surface/80'
                      }`}
                    >
                      <span className="font-medium block mb-1 text-text">{opt.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-lg border-t border-text/10 z-50">
        <div className="max-w-2xl mx-auto flex gap-4">
          {currentSectionIdx > 0 && (
            <button
              onClick={() => setCurrentSectionIdx(prev => prev - 1)}
              className="px-6 py-4 rounded-2xl font-medium border border-text/10 bg-surface hover:bg-white/5 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <button
            onClick={nextSection}
            disabled={submitting}
            className={`flex-1 py-4 bg-primary text-black font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary-dark transition-all ${
               !isSectionComplete() ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : (currentSectionIdx === sectionIds.length - 1 ? 'Complete Quiz' : 'Next Section')}
            {!submitting && <ArrowRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
