
import React, { useState } from 'react';
import { AppState, MistakeRecord } from '../types';
import { analyzeMistakes } from '../services/geminiService';

interface Props {
  state: AppState;
}

const MistakeBank: React.FC<Props> = ({ state }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const handleAIAnalysis = async () => {
    if (state.mistakeBank.length === 0) return;
    setIsAnalyzing(true);
    try {
      const summary = state.mistakeBank.map(m => `${m.question.subject}: ${m.question.content.slice(0, 50)}...`).join('\n');
      const res = await analyzeMistakes(summary);
      setAnalysis(res);
    } catch (e) {
      setAnalysis("分析失败，请稍后重试。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">我的错题本</h2>
          <p className="text-slate-500">自动记录考试中的错误，助你查漏补缺</p>
        </div>
        <button 
          onClick={handleAIAnalysis}
          disabled={isAnalyzing || state.mistakeBank.length === 0}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center hover:bg-indigo-700 disabled:bg-slate-300 transition-all"
        >
          {isAnalyzing ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-robot mr-2"></i>}
          AI 知识点深度分析
        </button>
      </div>

      {analysis && (
        <div className="bg-white p-8 rounded-2xl border-2 border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <i className="fas fa-magic text-indigo-100 text-6xl"></i>
          </div>
          <h3 className="text-lg font-bold text-indigo-600 mb-4 flex items-center">
             <i className="fas fa-lightbulb mr-2"></i> AI 学习建议
          </h3>
          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
            {analysis}
          </div>
          <button onClick={() => setAnalysis(null)} className="mt-6 text-sm text-slate-400 hover:text-slate-600">关闭建议</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {state.mistakeBank.map((record) => (
          <div key={record.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-red-100 text-red-600 rounded-md text-xs font-bold uppercase">
                  {record.question.subject}
                </span>
                <span className="text-xs text-slate-400">最后出错: {new Date(record.lastAttemptDate).toLocaleDateString()}</span>
              </div>
              <span className="text-xs font-bold text-red-400">错误次数: {record.incorrectCount}</span>
            </div>
            
            <div className="text-slate-800 mb-6 font-medium leading-relaxed">
              {record.question.content}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2">
              <div className="text-sm font-bold text-slate-500 mb-1">解析</div>
              <div className="text-sm text-slate-600 italic mb-2">正确答案：{record.question.answer}</div>
              <p className="text-sm text-slate-500 leading-relaxed">{record.question.explanation}</p>
            </div>
            
            <div className="flex justify-end mt-4">
               <button className="px-4 py-2 text-indigo-600 text-sm font-bold hover:bg-indigo-50 rounded-lg">
                 再次尝试
               </button>
            </div>
          </div>
        ))}

        {state.mistakeBank.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              <i className="fas fa-folder-open"></i>
            </div>
            <p className="text-slate-400 font-medium">还没有错题记录，继续保持！</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MistakeBank;
