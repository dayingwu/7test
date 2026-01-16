
import { GoogleGenAI, Type } from "@google/genai";
import { Subject, Difficulty, ExamPaper, QuestionSource, ExamResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const questionSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Title of the exam paper" },
    subject: { type: Type.STRING },
    duration: { type: Type.NUMBER },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, description: "Must be one of: 单选题, 多选题, 填空题, 简答题" },
          content: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Required for 单选题 and 多选题" },
          answer: { type: Type.STRING, description: "Correct answer(s). For 多选题, use comma separated values like A,C" },
          explanation: { type: Type.STRING },
          points: { type: Type.NUMBER },
          difficulty: { type: Type.STRING },
          chapter: { type: Type.STRING }
        },
        required: ["id", "type", "content", "answer", "explanation", "points", "difficulty", "chapter"]
      }
    }
  },
  required: ["title", "subject", "duration", "questions"]
};

export async function generateExamPaper(
  subject: Subject,
  chapters: string[],
  difficulty: Difficulty,
  count: number = 10
): Promise<ExamPaper> {
  const prompt = `
    First, use Google Search to find the latest 7th grade (Grade 7) curriculum requirements for ${subject} in Qingdao, Shandong province. 
    Then, generate a professional exam paper.
    - Target Chapters: ${chapters.join(', ')}
    - Difficulty: ${difficulty}
    - Total Questions: ${count}
    - IMPORTANT: Each question 'type' field MUST be exactly one of: '单选题', '多选题', '填空题', '简答题'.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: questionSchema,
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 24000 }
    }
  });

  const rawData = JSON.parse(response.text);
  
  const sources: QuestionSource[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title || "教育参考来源",
          uri: chunk.web.uri
        });
      }
    });
  }

  return {
    ...rawData,
    id: `paper_${Date.now()}`,
    totalPoints: rawData.questions.reduce((acc: number, q: any) => acc + q.points, 0),
    sources: sources.slice(0, 5)
  } as ExamPaper;
}

export async function generateExamAnalysis(result: ExamResult, paper: ExamPaper): Promise<string> {
  const mistakeSummary = result.answers
    .filter(a => !a.isCorrect)
    .map(a => {
      const q = paper.questions.find(pq => pq.id === a.questionId);
      return `[${q?.type}] 题目: ${q?.content.slice(0, 50)}... | 你的回答: ${a.userValue} | 正确答案: ${q?.answer}`;
    }).join('\n');

  const prompt = `
    作为青岛中考教研专家，对学生的这次${result.subject}考试表现进行深度点评。
    得分: ${result.score}/${result.totalPoints}。
    错题情况：
    ${mistakeSummary || '全部正确，表现完美！'}
    
    请输出一份鼓励性的、专业的考后分析，包括：
    1. 知识点掌握现状。
    2. 针对错题的具体建议。
    3. 下一阶段复习重点。
    使用中文书写。
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });
  return response.text || "暂时无法生成分析。";
}

export async function analyzeMistakes(mistakes: string): Promise<string> {
  const prompt = `分析错题记录并给出策略：${mistakes}`;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });
  return response.text || "无法生成深度分析。";
}
