export type SupportLevel = 1 | 2 | 3;

export type AppTab =
  | 'assistant'
  | 'lab'
  | 'grading'
  | 'knowledge'
  | 'progress';

export type LabDomain = 'math' | 'physics' | 'chemistry';

export interface InternalModelLink {
  domain: LabDomain;
  id: string;
  label: string;
}

export type CurriculumSubject =
  | 'Toán'
  | 'Vật lý'
  | 'Hóa học'
  | 'Sinh học'
  | 'Tin học'
  | 'Ngữ văn'
  | 'Tiếng Anh'
  | 'Lịch sử'
  | 'Địa lý'
  | 'GDCD';

export interface KnowledgeEntry {
  id: string;
  subject: CurriculumSubject;
  grade: string;
  gradeNumber: number;
  title: string;
  keywords: string[];
  summary: string;
  formulasLatex: string[];
  methodHint: string;
  stepScaffold: string;
  quickExample?: string;
  commonMistake?: string;
  linkedModel?: InternalModelLink;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  level: SupportLevel;
  timestamp: number;
  engineUsed?: 'webllm-local' | 'structured-knowledge-fallback';
  limitationNotice?: string;
  relatedModels?: InternalModelLink[];
  attachedFileName?: string;
}

export type GradingMode = 'analyze' | 'rubric';

export interface RubricCriterion {
  id: string;
  description: string;
  maxScore: number;
  requiredKeywords: string[];
}

export interface RubricEvaluationItem {
  criterionId: string;
  description: string;
  suggestedScore: number | null;
  teacherScore: number | null;
  maxScore: number;
  reason: string;
  requiresTeacherReview: boolean;
}

export interface AnalysisStepFeedback {
  stepNumber: number;
  excerpt: string;
  observation: string;
  status: 'correct' | 'warning' | 'uncertain';
}

export interface GradingResult {
  id: string;
  mode: GradingMode;
  createdAt: number;
  fileName?: string;
  extractedText: string;
  ocrConfidence: number;
  canAutoEvaluate: boolean;
  limitationNotice?: string;
  analysisSteps?: AnalysisStepFeedback[];
  improvementAdvice?: string[];
  rubricItems?: RubricEvaluationItem[];
}
