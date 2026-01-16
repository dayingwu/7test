
export enum Subject {
  Math = '数学',
  Chinese = '语文',
  English = '英语',
  History = '历史',
  Geography = '地理',
  Biology = '生物',
  Ethics = '道德与法治'
}

export enum Difficulty {
  Easy = '简单',
  Medium = '中等',
  Hard = '困难'
}

export enum QuestionType {
  SingleChoice = '单选题',
  MultiChoice = '多选题',
  FillIn = '填空题',
  Subjective = '简答题'
}

export interface QuestionSource {
  title: string;
  uri: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[];
  answer: string;
  explanation: string;
  points: number;
  subject: Subject;
  chapter: string;
  difficulty: Difficulty;
}

export interface ExamPaper {
  id: string;
  title: string;
  subject: Subject;
  difficulty: Difficulty;
  questions: Question[];
  duration: number; // in minutes
  totalPoints: number;
  sources?: QuestionSource[];
}

export interface UserAnswer {
  questionId: string;
  userValue: string;
  isCorrect?: boolean;
}

export interface ExamResult {
  id: string;
  paperId: string;
  paperTitle: string;
  subject: Subject;
  score: number;
  totalPoints: number;
  startTime: number;
  endTime: number;
  answers: UserAnswer[];
}

export interface MistakeRecord {
  id: string;
  question: Question;
  lastAttemptDate: number;
  incorrectCount: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AppState {
  user: User | null;
  examResults: ExamResult[];
  mistakeBank: MistakeRecord[];
}
