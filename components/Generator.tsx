
import React, { useState } from 'react';
import { Subject, Difficulty, ExamPaper } from '../types';
import { SUBJECT_INFO, CHAPTERS_MAP } from '../constants';
import { generateExamPaper } from '../services/geminiService';

interface Props {
  onPaperGenerated: (paper: ExamPaper) => void;
}

const Generator: React.FC<Props> = ({ onPaperGenerated }) => {
  const [subject, setSubject] = useState<Subject>(Subject.Math);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Medium);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const handleGenerate = async () => {
    if (selectedChapters.length === 0) {
      setError("请至少选择一个章节");
      return;
    }
    setError(null);
    setIsGenerating(true);
    setStatusMsg("正在通过 Google Search 检索青岛考纲信息...");
    
    try {
      setTimeout(() => setStatusMsg("正在分析 dearedu.com 相关试题规则..."), 3000);
      setTimeout(() => setStatusMsg("AI 正在根据当地教材版本智能组卷..."), 7000);
      
      const paper = await generateExamPaper(subject, selectedChapters, difficulty);
      onPaperGenerated(paper);
    } catch (e) {
      setError("AI生成试卷失败，可能是网络波动。请重试。");
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleChapter = (chapter: string) => {
    setSelectedChapters(prev => 
      prev.includes(chapter) ? prev.filter(c => c !== chapter) : [...prev, chapter]
    );
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-indigo-600 p-8 text-white relative">
        <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
          Region: Qingdao, Shandong
        </div>
        <h2 className="text-2xl font-bold mb-2">青岛专版·智能组卷系统</h2>
        <p className="opacity-80 italic">精准对齐青岛七年级教学大纲，实时检索最新试题规则</p>
      </div>

      <div className="p-8 space-y-8">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-4">选择科目</label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(SUBJECT_INFO).map(([key, info]) => (
              <button
                key={key}
                onClick={() => {
                  setSubject(key as Subject);
                  setSelectedChapters([]);
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  subject === key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <i className={`fas ${info.icon} text-2xl mb-2`}></i>
                <span className="text-sm font-medium">{key}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center">
            选择章节 (七年级) <i className="fas fa-info-circle ml-2 text-slate-300" title="基于当地典型教材版本"></i>
          </label>
          <div className="flex flex-wrap gap-2">
            {CHAPTERS_MAP[subject].map(chapter => (
              <button
                key={chapter}
                onClick={() => toggleChapter(chapter)}
                className={`px-4 py-2 rounded-full border text-sm transition-all ${
                  selectedChapters.includes(chapter) 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {chapter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-4">难度设置</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {Object.values(Difficulty).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                    difficulty === d ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm flex items-center">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-all flex flex-col items-center justify-center"
        >
          {isGenerating ? (
            <>
              <div className="flex items-center mb-1">
                <i className="fas fa-spinner fa-spin mr-3"></i>
                正在组卷...
              </div>
              <span className="text-xs font-normal opacity-70">{statusMsg}</span>
            </>
          ) : (
            '立即生成青岛版 AI 试卷'
          )}
        </button>
      </div>
    </div>
  );
};

export default Generator;
