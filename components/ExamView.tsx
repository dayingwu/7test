
import React, { useState, useEffect, useCallback } from 'react';
import { ExamPaper, UserAnswer, QuestionType, ExamResult } from '../types';

interface Props {
  paper: ExamPaper;
  onSubmit: (result: ExamResult) => void;
  onCancel: () => void;
}

const ExamView: React.FC<Props> = ({ paper, onSubmit, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>(() => 
    paper.questions.map(q => ({ questionId: q.id, userValue: '' }))
  );
  const [timeLeft, setTimeLeft] = useState(paper.duration * 60);
  const [startTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAnswerChange = (val: string) => {
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      const idx = newAnswers.findIndex(a => a.questionId === paper.questions[currentIndex].id);
      if (idx !== -1) {
        newAnswers[idx] = { ...newAnswers[idx], userValue: val };
      }
      return newAnswers;
    });
  };

  const handleMultiChoiceToggle = (label: string) => {
    const currentAns = userAnswers.find(a => a.questionId === paper.questions[currentIndex].id);
    const currentVal = currentAns?.userValue || '';
    const selected = currentVal ? currentVal.split(',').map(s => s.trim()) : [];
    
    let newVal = '';
    if (selected.includes(label)) {
      newVal = selected.filter(s => s !== label).sort().join(',');
    } else {
      newVal = [...selected, label].sort().join(',');
    }
    handleAnswerChange(newVal);
  };

  const handleFinalSubmit = useCallback(() => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let score = 0;
      const gradedAnswers = userAnswers.map(ua => {
        const q = paper.questions.find(pq => pq.id === ua.questionId);
        if (!q) return { ...ua, isCorrect: false };

        const normalize = (s: string) => s?.trim().toUpperCase().replace(/\s+/g, '') || '';
        
        // Basic grading logic
        let isCorrect = false;
        if (q.type === QuestionType.MultiChoice) {
          // Sort multi-choice answers to compare
          const normUser = ua.userValue.split(',').map(s => s.trim().toUpperCase()).sort().join('');
          const normCorrect = q.answer.split(',').map(s => s.trim().toUpperCase()).sort().join('');
          isCorrect = normUser === normCorrect;
        } else {
          isCorrect = normalize(ua.userValue) === normalize(q.answer);
        }

        if (isCorrect) score += q.points;
        return { ...ua, isCorrect };
      });

      const result: ExamResult = {
        id: `res_${Date.now()}`,
        paperId: paper.id,
        paperTitle: paper.title,
        subject: paper.subject,
        score,
        totalPoints: paper.totalPoints,
        startTime,
        endTime: Date.now(),
        answers: gradedAnswers
      };

      onSubmit(result);
    } catch (error) {
      console.error("Submission failed:", error);
      alert("提交失败，请重试。");
      setIsSubmitting(false);
    }
  }, [userAnswers, paper, startTime, onSubmit, isSubmitting]);

  const currentQuestion = paper.questions[currentIndex];
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs.toString().padStart(2, '0')}`;
  };

  const isSelected = (label: string) => {
    const ua = userAnswers.find(a => a.questionId === currentQuestion.id);
    if (!ua) return false;
    if (currentQuestion.type === QuestionType.MultiChoice) {
      return ua.userValue.split(',').includes(label);
    }
    return ua.userValue === label;
  };

  const answeredCount = userAnswers.filter(a => a.userValue !== '').length;

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="bg-white border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => confirm("确定退出考试？进度将不会被保存。") && onCancel()} 
            className="text-slate-400 hover:text-slate-600 p-2"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <div>
            <h2 className="font-bold text-slate-800">{paper.title}</h2>
            <div className="flex items-center space-x-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <span>{paper.subject}</span>
              <span>•</span>
              <span className="text-indigo-500 font-black">Qingdao Junior Edition</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className={`flex items-center px-4 py-1.5 rounded-full font-mono text-lg font-bold border-2 ${timeLeft < 300 ? 'text-red-600 border-red-100 bg-red-50' : 'text-slate-700 border-slate-100 bg-slate-50'}`}>
            <i className="far fa-clock mr-2 opacity-50"></i>
            {formatTime(timeLeft)}
          </div>
          <button 
            onClick={() => confirm(`确定要交卷吗？您已完成 ${answeredCount}/${paper.questions.length} 道题。`) && handleFinalSubmit()}
            disabled={isSubmitting}
            className="px-8 py-2 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:bg-slate-300"
          >
            {isSubmitting ? '正在提交...' : '立即交卷'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 bg-slate-50 border-r border-slate-100 flex flex-col hidden lg:flex">
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">答题进度</span>
              <span className="text-xs font-bold text-indigo-600">{Math.round((answeredCount/paper.questions.length)*100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(answeredCount/paper.questions.length)*100}%` }}></div>
            </div>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
             <div className="grid grid-cols-5 gap-2">
                {paper.questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-full aspect-square rounded-xl text-xs font-bold transition-all border-2 ${
                      currentIndex === idx 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                        : userAnswers.find(a => a.questionId === paper.questions[idx].id)?.userValue 
                          ? 'bg-white border-indigo-100 text-indigo-600' 
                          : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
             </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 md:p-12 relative bg-white">
          <div className="max-w-3xl mx-auto space-y-10 pb-32">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-sm font-black uppercase tracking-widest">
                  题号 {currentIndex + 1}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-400 text-sm font-medium">{currentQuestion.type}</span>
              </div>
              <div className="text-slate-400 font-bold text-sm tracking-wide">{currentQuestion.points} 分</div>
            </div>

            <h3 className="text-2xl font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
              {currentQuestion.content}
            </h3>

            <div className="space-y-4 pt-4">
              {(currentQuestion.type === QuestionType.SingleChoice || currentQuestion.type === QuestionType.MultiChoice) && currentQuestion.options?.map((opt, idx) => {
                const label = String.fromCharCode(65 + idx);
                const active = isSelected(label);
                return (
                  <button 
                    key={idx}
                    onClick={() => currentQuestion.type === QuestionType.SingleChoice ? handleAnswerChange(label) : handleMultiChoiceToggle(label)}
                    className={`w-full flex items-center p-6 rounded-2xl border-2 transition-all group ${
                      active ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-50' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 mr-6 font-bold transition-all ${
                      active ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-100 text-slate-300'
                    }`}>
                      {label}
                    </div>
                    <span className={`text-lg font-medium text-left ${active ? 'text-indigo-900' : 'text-slate-600'}`}>{opt}</span>
                  </button>
                );
              })}

              {(currentQuestion.type === QuestionType.FillIn || currentQuestion.type === QuestionType.Subjective) && (
                <div className="space-y-4">
                  <textarea
                    className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-xl min-h-[250px]"
                    placeholder="请输入您的详细回答..."
                    value={userAnswers.find(a => a.questionId === currentQuestion.id)?.userValue || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 flex items-center justify-between pointer-events-none">
            <button 
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`p-4 rounded-2xl bg-white shadow-xl border border-slate-100 font-bold transition-all pointer-events-auto ${currentIndex === 0 ? 'invisible' : 'text-slate-400 hover:text-indigo-600'}`}
            >
              <i className="fas fa-chevron-left mr-2"></i> 上一题
            </button>
            
            <div className="flex space-x-4 pointer-events-auto">
              {currentIndex === paper.questions.length - 1 ? (
                <button 
                  onClick={() => confirm(`恭喜完成！确认要交卷并获取 AI 深度报告吗？`) && handleFinalSubmit()}
                  disabled={isSubmitting}
                  className="px-10 py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-green-200 hover:bg-green-700 disabled:bg-slate-300 transition-all"
                >
                  {isSubmitting ? '提交中...' : '确认并交卷'}
                </button>
              ) : (
                <button 
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  下一题 <i className="fas fa-arrow-right ml-3"></i>
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExamView;
