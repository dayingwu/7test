
import React, { useState, useEffect } from 'react';
import { AppState, ExamResult, ExamPaper, MistakeRecord } from './types';
import Dashboard from './components/Dashboard';
import Generator from './components/Generator';
import ExamView from './components/ExamView';
import MistakeBank from './components/MistakeBank';
import { generateExamAnalysis } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState('dashboard');
  const [activePaper, setActivePaper] = useState<ExamPaper | null>(null);
  const [activeResult, setActiveResult] = useState<ExamResult | null>(null);
  const [examAnalysis, setExamAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('aikao_state');
    return saved ? JSON.parse(saved) : {
      user: { id: 'user_1', username: '张同学', email: 'zhang@example.com' },
      examResults: [],
      mistakeBank: []
    };
  });

  useEffect(() => {
    localStorage.setItem('aikao_state', JSON.stringify(state));
  }, [state]);

  const handlePaperGenerated = (paper: ExamPaper) => {
    setActivePaper(paper);
    setActiveResult(null);
    setExamAnalysis(null);
    setView('exam-ongoing');
  };

  const handleExamSubmit = async (result: ExamResult) => {
    if (!activePaper) return;
    
    // 1. Update Persistent State
    setState(prev => {
      const newState = { ...prev, examResults: [...prev.examResults, result] };
      const newMistakeRecords: MistakeRecord[] = [...prev.mistakeBank];
      
      result.answers.forEach(ans => {
        if (!ans.isCorrect) {
          const q = activePaper.questions.find(pq => pq.id === ans.questionId);
          if (q) {
            const existingIdx = newMistakeRecords.findIndex(m => m.question.id === q.id);
            if (existingIdx === -1) {
              newMistakeRecords.push({
                id: `mistake_${Date.now()}_${q.id}`,
                question: q,
                lastAttemptDate: Date.now(),
                incorrectCount: 1
              });
            } else {
              newMistakeRecords[existingIdx].incorrectCount += 1;
              newMistakeRecords[existingIdx].lastAttemptDate = Date.now();
            }
          }
        }
      });
      
      newState.mistakeBank = newMistakeRecords;
      return newState;
    });

    // 2. Transition View
    setActiveResult(result);
    setView('exam-result');

    // 3. Trigger AI Analysis
    setIsAnalyzing(true);
    try {
      const analysis = await generateExamAnalysis(result, activePaper);
      setExamAnalysis(analysis);
    } catch (e) {
      console.error("AI Analysis error:", e);
      setExamAnalysis("由于网络原因，暂时无法获取 AI 深度点评。请查看下方的详细答题情况进行自我总结。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const SidebarItem = ({ id, icon, label }: { id: string; icon: string; label: string }) => (
    <button
      onClick={() => setView(id)}
      className={`flex items-center w-full p-3 mb-2 rounded-xl transition-all ${
        view === id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <i className={`fas ${icon} w-6 text-center mr-3`}></i>
      <span className="font-semibold">{label}</span>
    </button>
  );

  const handleViewResultDetail = (result: ExamResult) => {
    // Note: In a real app, we might need to fetch the paper content too if it's not in history
    // For now, we assume the user just finished or it's recently cached.
    // If not found, we might show a placeholder.
    setActiveResult(result);
    setView('exam-result');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {view !== 'exam-ongoing' && (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
          <div className="p-8">
            <h1 className="text-2xl font-black text-indigo-600 flex items-center">
              <i className="fas fa-brain mr-2"></i> 智考通
            </h1>
          </div>
          <nav className="flex-1 px-4">
            <SidebarItem id="dashboard" icon="fa-th-large" label="学习大盘" />
            <SidebarItem id="generator" icon="fa-plus-circle" label="智能组卷" />
            <SidebarItem id="mistakes" icon="fa-book-open" label="错题本" />
          </nav>
          <div className="p-6 border-t border-slate-100">
            <div className="flex items-center p-3 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3">张</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{state.user?.username}</p>
                <p className="text-xs text-slate-400">青岛七年级</p>
              </div>
            </div>
          </div>
        </aside>
      )}

      <main className="flex-1 overflow-y-auto relative">
        <div className={view === 'exam-ongoing' ? '' : 'p-8 max-w-7xl mx-auto'}>
          {view === 'dashboard' && <Dashboard state={state} onNavigate={(v, d) => {
            if (v === 'exam-result') handleViewResultDetail(d);
            else setView(v);
          }} />}
          {view === 'generator' && <Generator onPaperGenerated={handlePaperGenerated} />}
          
          {view === 'exam-ongoing' && activePaper && (
            <ExamView 
              paper={activePaper} 
              onSubmit={handleExamSubmit} 
              onCancel={() => {
                setActivePaper(null);
                setView('dashboard');
              }} 
            />
          )}

          {view === 'exam-result' && activeResult && (
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between">
                <div className="text-center md:text-left mb-6 md:mb-0">
                  <h2 className="text-2xl font-bold text-slate-800 mb-1">{activeResult.paperTitle}</h2>
                  <p className="text-slate-400">考试完成时间: {new Date(activeResult.endTime).toLocaleString()}</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-6xl font-black text-indigo-600">{activeResult.score}</span>
                  <span className="text-2xl text-slate-300 ml-2">/ {activeResult.totalPoints}</span>
                </div>
              </div>

              <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <i className="fas fa-robot text-8xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <i className="fas fa-magic mr-2"></i> AI 考情深度点评
                </h3>
                {isAnalyzing ? (
                  <div className="flex items-center space-x-3 py-4">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="opacity-80">AI 正在精准分析您的知识点掌握情况...</span>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none whitespace-pre-wrap opacity-90 leading-relaxed">
                    {examAnalysis || "系统正在努力解析中..."}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800">详细答题报告</h3>
                {activePaper?.questions.map((q, idx) => {
                  const userAns = activeResult.answers.find(a => a.questionId === q.id);
                  const isCorrect = userAns?.isCorrect;
                  return (
                    <div key={q.id} className={`bg-white p-6 rounded-2xl border-2 transition-all ${isCorrect ? 'border-green-100' : 'border-red-100'}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {idx + 1}
                          </span>
                          <span className="text-sm font-bold text-slate-400 uppercase">{q.type}</span>
                        </div>
                        <i className={`fas ${isCorrect ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'} text-xl`}></i>
                      </div>
                      <p className="text-slate-800 font-medium mb-4">{q.content}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className={`p-3 rounded-xl ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          <span className="font-bold block mb-1">你的答案</span>
                          {userAns?.userValue || '(未作答)'}
                        </div>
                        <div className="p-3 bg-slate-50 text-slate-700 rounded-xl">
                          <span className="font-bold block mb-1">标准答案</span>
                          {q.answer}
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">解析说明</span>
                        <p className="text-slate-600 text-sm leading-relaxed">{q.explanation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={() => setView('dashboard')}
                  className="px-12 py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 shadow-xl transition-all"
                >
                  返回学习面板
                </button>
              </div>
            </div>
          )}
          {view === 'mistakes' && <MistakeBank state={state} />}
        </div>
      </main>
    </div>
  );
};

export default App;
