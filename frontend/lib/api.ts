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

export interface LearningReport {
  report_id: string;
  user_id: string;
  video_id: string;
  quiz_id: string;
  word_frequency: { [key: string]: number };
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
  key_takeaways: string[];
  created_at?: string;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const videoApi = {
  processVideo: async (videoUrl: string, title?: string): Promise<VideoProcessResponse> => {
    const response = await api.post('/api/video/process', {
      video_url: videoUrl,
      title,
    });
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
  generateQuiz: async (videoId: string): Promise<QuizResponse> => {
    const response = await api.post('/api/quiz/generate', {
      video_id: videoId,
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
    timestamp: number = 0
  ) => {
    const response = await api.post('/api/reports/attempt', {
      user_id: userId,
      video_id: videoId,
      question_id: questionId,
      question_type: questionType,
      selected_answer: selectedAnswer,
      correct_answer: correctAnswer,
      timestamp,
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

export default api;
