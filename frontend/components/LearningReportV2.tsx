'use client';

import { LearningReport } from '@/lib/api';
import CelebrationSection from './report-v2/CelebrationSection';

interface LearningReportV2Props {
  report: LearningReport;
}

export default function LearningReportV2({ report }: LearningReportV2Props) {

  // Transform data for celebration section - mastered knowledge areas
  const masteredTopics = report.weak_areas?.mastery_analysis?.mastered || [];

  // Transform data for action plan - focus on weaker knowledge areas
  const actionItems = (report.weak_areas?.recommendations || []).slice(0, 3).map((rec, index) => {
    // Find the first video recommendation for this topic
    const videoRec = report.video_recommendations?.find(v =>
      v.concept.toLowerCase().includes(rec.topic.toLowerCase())
    );

    const searchQuery = videoRec?.search_queries?.[0];

    return {
      priority: (index + 1) as 1 | 2 | 3,
      topic: rec.topic,
      why: rec.reason,
      videoTitle: searchQuery?.query || `${rec.topic} Tutorial`,
      videoUrl: searchQuery?.youtube_search_url || `https://www.youtube.com/results?search_query=${rec.topic.replace(' ', '+')}`,
      estimatedTime: '20 min',
      impact: rec.priority === 'high' ? 'high' as const : 'medium' as const
    };
  });

  // Transform data for strengths and growth
  const strengths = (report.weak_areas?.mastery_analysis?.mastered || []).slice(0, 5).map(item => ({
    concept: item.concept,
    accuracy: item.accuracy,
    evidence: `You consistently answer questions correctly on this topic`
  }));

  const growthAreas = (report.weak_areas?.mastery_analysis?.learning || [])
    .concat(report.weak_areas?.mastery_analysis?.needs_review || [])
    .slice(0, 5)
    .map(item => ({
      concept: item.concept,
      accuracy: item.accuracy,
      evidence: `Practice this to strengthen your foundation`,
      start_time: item.start_time,
      end_time: item.end_time
    }));

  const wordCloudData = Object.entries(report.word_frequency || {}).map(([text, value]) => ({
    text,
    value,
  }));

  // Debug: Log word cloud data to check if it's populated
  console.log('Word Cloud Data:', wordCloudData);
  console.log('Word Frequency:', report.word_frequency);

  return (
    <div className="w-full space-y-8">
      <CelebrationSection
        masteredTopics={masteredTopics}
        overallScore={report.executive_summary?.overall_score || report.performance_stats.accuracy_rate}
        totalAttempts={report.performance_stats.total_attempts}
        correctAnswers={report.performance_stats.correct_count}
        growthAreas={growthAreas}
        actionItems={actionItems}
        wordCloudData={wordCloudData}
        attemptsData={report.attempts_data || []}
        videoType={report.video_type}
        domain={report.domain}
        mainTopics={report.main_topics}
      />
    </div>
  );
}
