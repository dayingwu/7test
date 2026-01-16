
import { Subject } from './types';

export const SUBJECT_INFO: Record<Subject, { icon: string; color: string; bgColor: string }> = {
  [Subject.Math]: { icon: 'fa-calculator', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  [Subject.Chinese]: { icon: 'fa-book-open', color: 'text-red-600', bgColor: 'bg-red-100' },
  [Subject.English]: { icon: 'fa-language', color: 'text-green-600', bgColor: 'bg-green-100' },
  [Subject.History]: { icon: 'fa-landmark', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  [Subject.Geography]: { icon: 'fa-globe-asia', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  [Subject.Biology]: { icon: 'fa-dna', color: 'text-teal-600', bgColor: 'bg-teal-100' },
  [Subject.Ethics]: { icon: 'fa-balance-scale', color: 'text-indigo-600', bgColor: 'bg-indigo-100' }
};

export const SUBJECTS = Object.values(Subject);

// 细化为山东青岛七年级教材典型章节
export const CHAPTERS_MAP: Record<Subject, string[]> = {
  [Subject.Math]: ['有理数', '整式的加减', '一元一次方程', '几何图形初步', '数据的收集与整理'],
  [Subject.Chinese]: ['散文赏析', '古诗文背诵', '名著导读(朝花夕拾)', '现代文阅读', '基础写作'],
  [Subject.English]: ['Starter Units', 'Unit 1-4 基础语法', '完形填空专项', '阅读理解B篇', '书面表达'],
  [Subject.History]: ['隋唐时期', '辽宋夏金元时期', '明清时期', '中国古代科技文化'],
  [Subject.Geography]: ['地球和地图', '陆地和海洋', '天气与气候', '居民与聚落', '发展与合作'],
  [Subject.Biology]: ['生物和生物圈', '生物体的结构层次', '生物圈中的绿色植物', '人体生理基础'],
  [Subject.Ethics]: ['成长的节拍', '师友结伴同行', '珍爱生命', '法律护我成长']
};
