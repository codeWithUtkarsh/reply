import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface VideoSegment {
  start_time: number;
  end_time: number;
  text: string;
}

export interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  video_segment: VideoSegment;
  difficulty: string;
}

export interface FlashCard {
  question: Question;
  show_at_timestamp: number;
}

export interface VideoProcessResponse {
  video_id: string;
  title: string;
  duration: number;
  transcript: {
    segments: VideoSegment[];
    full_text: string;
    duration: number;
  };
  flashcards: FlashCard[];
  message: string;
}

export interface QuizResponse {
  quiz_id: string;
  questions: Question[];
  total_questions: number;
}

export interface QuizResult {
  quiz_id: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  details: Array<{
    question_id: string;
    question_text: string;
    selected_answer: number;
    correct_answer: number;
    is_correct: boolean;
    explanation: string;
    video_segment?: VideoSegment;
  }>;
  weak_areas: VideoSegment[];
}

// Enhanced Report Interfaces
export interface WeakConcept {
  concept: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export interface MasteryLevel {
  concept: string;
  accuracy: number;
}

export interface MasteryAnalysis {
  mastered: MasteryLevel[];
  mastered_summary?: string;  // AI-generated summary of mastered concepts
  learning: MasteryLevel[];
  needs_review: MasteryLevel[];
}

export interface Recommendation {
  topic: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface WeakAreas {
  weak_concepts: WeakConcept[];
  mastery_analysis: MasteryAnalysis;
  knowledge_gaps: string[];
  recommendations: Recommendation[];
}

export interface VideoSearchQuery {
  query: string;
  video_type: string;
  youtube_search_url: string;
}

export interface VideoRecommendation {
  concept: string;
  search_queries: VideoSearchQuery[];
  why_helpful: string;
}

export interface LearningPathStep {
  step: number;
  topic: string;
  status: 'completed' | 'in_progress' | 'not_started';
  description: string;
  estimated_time: string;
}

export interface NextStep {
  priority: number;
  topic: string;
  reason: string;
  prerequisites: string[];
}

export interface CircuitNode {
  id: string;
  label: string;
  status: 'mastered' | 'learning' | 'locked';
  connections: string[];
}

export interface LearningPath {
  learning_path: LearningPathStep[];
  next_steps: NextStep[];
  circuit_map: CircuitNode[];
}

export interface ExecutiveSummary {
  overall_score: number;
  status: 'excellent' | 'good' | 'needs_improvement';
  time_spent: number;
  topics_mastered: number;
  topics_in_progress: number;
  topics_to_review: number;
}

export interface LearningReport {
  report_id: string;
  user_id: string;
  video_id: string;
  quiz_id: string;

  // Priority 1: Executive Summary & Key Takeaways
  key_takeaways: string[];
  executive_summary: ExecutiveSummary;

  // Priority 2: Weak Areas & Recommendations
  weak_areas: WeakAreas;

  // Priority 3: Video Recommendations
  video_recommendations: VideoRecommendation[];

  // Priority 4: Learning Path
  learning_path: LearningPath;

  // Priority 5: Performance Stats
  performance_stats: {
    total_attempts: number;
    correct_count: number;
    incorrect_count: number;
    accuracy_rate: number;
    by_question: { [key: string]: any };
  };
  attempt_breakdown: {
    flashcards: {
      total: number;
      correct: number;
      incorrect: number;
      accuracy: number;
    };
    quiz: {
      total: number;
      correct: number;
      incorrect: number;
      accuracy: number;
    };
  };

  // Priority 6: Content Analysis
  word_frequency: { [key: string]: number };
  video_type?: string;
  domain?: string;
  main_topics?: string[];

  // Priority 7: Raw attempts data for study pattern visualization
  attempts_data?: Array<{
    question_id: string;
    question_type: string;
    selected_answer: number;
    correct_answer: number;
    is_correct: boolean;
    attempt_number: number;
    timestamp: number;
    quiz_id?: string;
  }>;

  created_at?: string;
}

export interface CreditInfo {
  transcription_credits: number;
  notes_credits: number;
  role: string;
  has_unlimited: boolean;
}

export interface UserProfile {
  id: string;
  role: string;
  transcription_credits: number;
  notes_credits: number;
  company?: string;
  country?: string;
  currency: string;
  created_at?: string;
  updated_at?: string;
  has_unlimited: boolean;
}

export interface CreditHistoryEntry {
  id: number;
  user_id: string;
  video_id?: string;
  video_title?: string;
  project_id?: string;
  project_name?: string;
  credit_type: 'transcription' | 'notes';
  amount: number;
  operation: 'deduct' | 'add' | 'refund';
  balance_before: number;
  balance_after: number;
  description?: string;
  metadata?: any;
  created_at: string;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


export const videoApi = {
  processVideo: async (videoUrl: string, title?: string, projectId?: string, userId?: string): Promise<VideoProcessResponse> => {
    const response = await api.post('/api/video/process', {
      video_url: videoUrl,
      title,
      project_id: projectId,
      user_id: userId,
    });
    return response.data;
  },

  processVideoAsync: async (videoUrl: string, title?: string, projectId?: string, userId?: string) => {
    const response = await api.post('/api/video/process-async', {
      video_url: videoUrl,
      title,
      project_id: projectId,
      user_id: userId,
    });
    return response.data;
  },

  getVideoStatus: async (videoId: string) => {
    const response = await api.get(`/api/video/${videoId}/status`);
    return response.data;
  },

  getVideo: async (videoId: string) => {
    const response = await api.get(`/api/video/${videoId}`);
    return response.data;
  },

  getDirectUrl: async (videoId: string) => {
    const response = await api.get(`/api/video/${videoId}/direct-url`);
    return response.data;
  },

  deleteVideo: async (videoId: string, projectId?: string) => {
    const params = projectId ? { project_id: projectId } : {};
    const response = await api.delete(`/api/video/${videoId}`, { params });
    return response.data;
  },
};

export const questionsApi = {
  submitAnswer: async (questionId: string, selectedAnswer: number, timestamp: number) => {
    const response = await api.post('/api/questions/answer', {
      question_id: questionId,
      selected_answer: selectedAnswer,
      timestamp,
    });
    return response.data;
  },

  getFlashcards: async (videoId: string) => {
    const response = await api.get(`/api/questions/${videoId}/flashcards`);
    return response.data;
  },
};

export const quizApi = {
  generateQuiz: async (videoId: string, userId?: string): Promise<QuizResponse> => {
    const response = await api.post('/api/quiz/generate', {
      video_id: videoId,
      user_id: userId,
    });
    return response.data;
  },

  submitQuiz: async (quizId: string, answers: Array<{
    question_id: string;
    selected_answer: number;
    timestamp: number;
  }>): Promise<QuizResult> => {
    const response = await api.post('/api/quiz/submit', {
      quiz_id: quizId,
      answers,
    });
    return response.data;
  },

  getQuiz: async (quizId: string) => {
    const response = await api.get(`/api/quiz/${quizId}`);
    return response.data;
  },
};

export const reportsApi = {
  recordAttempt: async (
    userId: string,
    videoId: string,
    questionId: string,
    questionType: string,
    selectedAnswer: number,
    correctAnswer: number,
    timestamp: number = 0,
    quizId?: string
  ) => {
    const response = await api.post('/api/reports/attempt', {
      user_id: userId,
      video_id: videoId,
      question_id: questionId,
      question_type: questionType,
      selected_answer: selectedAnswer,
      correct_answer: correctAnswer,
      timestamp,
      quiz_id: quizId,  // Track which quiz this attempt belongs to
    });
    return response.data;
  },

  generateReport: async (userId: string, videoId: string, quizId: string): Promise<{ success: boolean; report_id: string; report: LearningReport }> => {
    const response = await api.post('/api/reports/generate', {
      user_id: userId,
      video_id: videoId,
      quiz_id: quizId,
    });
    return response.data;
  },

  getReport: async (reportId: string): Promise<LearningReport> => {
    const response = await api.get(`/api/reports/${reportId}`);
    return response.data;
  },

  getUserReports: async (userId: string, videoId?: string) => {
    const url = videoId
      ? `/api/reports/user/${userId}?video_id=${videoId}`
      : `/api/reports/user/${userId}`;
    const response = await api.get(url);
    return response.data;
  },

  getUserAttempts: async (userId: string, videoId: string) => {
    const response = await api.get(`/api/reports/attempts/${userId}/${videoId}`);
    return response.data;
  },
};

export interface NoteVisualization {
  type: 'mermaid' | 'table' | 'list';
  title: string;
  code: string;
  purpose: string;
}

export interface NoteSection {
  heading: string;
  content: string;
  key_concepts?: string[];
  visualizations: NoteVisualization[];
  images?: string[]; // Base64 encoded images
  // Legacy support
  diagrams?: NoteDiagram[];
}

// Legacy diagram interface for backwards compatibility
export interface NoteDiagram {
  type: string;
  code: string;
  caption: string;
}

export interface VideoNotes {
  notes_id: string;
  video_id: string;
  title: string;
  summary?: string;
  sections: NoteSection[];
  review_questions?: string[];
  created_at?: string;
}

export const notesApi = {
  generateNotes: async (videoId: string, userId?: string): Promise<{ message: string; notes: VideoNotes }> => {
    const response = await api.post('/api/notes/generate', {
      video_id: videoId,
      user_id: userId,
    });
    return response.data;
  },

  getNotes: async (videoId: string): Promise<{ notes: VideoNotes }> => {
    const response = await api.get(`/api/notes/${videoId}`);
    return response.data;
  },

  getNotesById: async (notesId: string): Promise<{ notes: VideoNotes }> => {
    const response = await api.get(`/api/notes/by-id/${notesId}`);
    return response.data;
  },

  updateNotes: async (notesId: string, data: { title: string; sections: NoteSection[] }): Promise<{ message: string; notes: VideoNotes }> => {
    const response = await api.put(`/api/notes/${notesId}`, data);
    return response.data;
  },
};

export const projectsApi = {
  deleteProject: async (projectId: string) => {
    const response = await api.delete(`/api/projects/${projectId}`);
    return response.data;
  },
};

export const usersApi = {
  getCredits: async (userId: string): Promise<CreditInfo> => {
    const response = await api.get(`/api/users/${userId}/credits`);
    return response.data;
  },

  getProfile: async (userId: string): Promise<UserProfile> => {
    const response = await api.get(`/api/users/${userId}/profile`);
    return response.data;
  },

  getCreditHistory: async (userId: string, limit: number = 100): Promise<{ history: CreditHistoryEntry[] }> => {
    const response = await api.get(`/api/users/${userId}/credit-history?limit=${limit}`);
    return response.data;
  },
};

export default api;
