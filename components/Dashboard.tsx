
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { SUBJECT_INFO } from '../constants';
import { Subject, AppState } from '../types';

interface Props {
  state: AppState;
  onNavigate: (view: string, data?: any) => void;
}

const Dashboard: React.FC<Props> = ({ state, onNavigate }) => {
  const recentResults = [...state.examResults].sort((a, b) => b.endTime - a.endTime).slice(0, 5);
  
  const trendData = state.examResults.map(r => ({
    date: new Date(r.endTime).toLocaleDateString(),
    score: (r.score / r.totalPoints) * 100
  })).slice(-10);

  const radarData = Object.values(Subject).map(s => {
    const subResults = state.examResults.filter(r => r.subject === s);
    const avg = subResults.length ? subResults.reduce((a, b) => a + (b.score/b.totalPoints)*100, 0) / subResults.length : 0;
    return { subject: s, A: avg };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">累计考试</span>
            <i className="fas fa-edit text-blue-500"></i>
          </div>
          <div className="text-2xl font-bold">{state.examResults.length} 次</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">掌握均分</span>
            <i className="fas fa-chart-line text-green-500"></i>
          </div>
          <div className="text-2xl font-bold">
            {state.examResults.length ? (state.examResults.reduce((a,b) => a + (b.score/b.totalPoints)*100, 0) / state.examResults.length).toFixed(1) : 0}%
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">错题数量</span>
            <i className="fas fa-times-circle text-red-500"></i>
          </div>
          <div className="text-2xl font-bold">{state.mistakeBank.length} 道</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">活跃天数</span>
            <i className="fas fa-calendar-check text-indigo-500"></i>
          </div>
          <div className="text-2xl font-bold">12 天</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-6">成绩趋势图</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-6">能力雷达图</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                <Radar name="能力值" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold mb-4">最近考试</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-slate-500 border-b border-slate-100">
              <tr>
                <th className="pb-3 font-semibold">考试科目</th>
                <th className="pb-3 font-semibold">试卷标题</th>
                <th className="pb-3 font-semibold">分数</th>
                <th className="pb-3 font-semibold">时间</th>
                <th className="pb-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentResults.map(r => (
                <tr key={r.id}>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${SUBJECT_INFO[r.subject].bgColor} ${SUBJECT_INFO[r.subject].color}`}>
                      {r.subject}
                    </span>
                  </td>
                  <td className="py-4 font-medium">{r.paperTitle}</td>
                  <td className="py-4 font-bold text-blue-600">{r.score}/{r.totalPoints}</td>
                  <td className="py-4 text-slate-500 text-sm">{new Date(r.endTime).toLocaleDateString()}</td>
                  <td className="py-4">
                    <button 
                      onClick={() => onNavigate('exam-result', r)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
              {recentResults.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    暂无考试记录，快去生成试卷吧！
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
