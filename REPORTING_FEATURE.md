# Learning Report Feature

## Overview

After completing the final quiz, users receive a comprehensive learning report that provides insights into their performance and key takeaways from the video.

## Features

### 1. Word Frequency Analysis
- Analyzes the video transcript to identify the most frequently mentioned topics
- Filters out common stop words to focus on meaningful terms
- Displays top 10 words in an interactive bar chart
- Helps users understand the main themes of the video

### 2. Performance Tracking
- **Overall Accuracy**: Shows percentage of correct answers
- **Total Attempts**: Tracks all answer attempts across flashcards and quiz
- **Correct vs Incorrect**: Visual pie chart showing the breakdown
- **By Type Analysis**: Separate statistics for flashcards and quiz questions

### 3. Attempt Breakdown
- Tracks each answer attempt in the database
- Distinguishes between flashcard and quiz attempts
- Shows accuracy rate for each type
- Provides visual comparison via bar charts

### 4. Key Takeaways
- Automatically extracts 5 important sentences from the video
- Uses word frequency to identify content-rich sentences
- Presents key concepts in an easy-to-read list
- Helps with post-video review and retention

### 5. Data Persistence
- All attempts are stored in the `user_attempts` table
- Reports are saved in the `learning_reports` table
- Enables historical analysis and progress tracking over time
- Supports future features like learning analytics dashboards

## Database Schema

### user_attempts Table
```sql
- user_id: Identifier for the user
- video_id: Video being studied
- question_id: Specific question attempted
- question_type: 'flashcard' or 'quiz'
- selected_answer: User's answer choice
- correct_answer: The correct answer
- is_correct: Boolean result
- attempt_number: Tracks multiple attempts on same question
- timestamp: When in the video this occurred
- created_at: When the attempt was recorded
```

### learning_reports Table
```sql
- report_id: Unique report identifier
- user_id: User who completed the video
- video_id: Video that was studied
- quiz_id: Associated quiz
- word_frequency: JSON map of word frequencies
- performance_stats: JSON with accuracy metrics
- attempt_breakdown: JSON with flashcard/quiz breakdown
- key_takeaways: Array of important sentences
- created_at: Report generation timestamp
```

## API Endpoints

### Record Attempt
```
POST /api/reports/attempt
Body: {
  user_id, video_id, question_id, question_type,
  selected_answer, correct_answer, timestamp
}
```

### Generate Report
```
POST /api/reports/generate
Body: { user_id, video_id, quiz_id }
Returns: Complete learning report with all analytics
```

### Get Report
```
GET /api/reports/{report_id}
Returns: Previously generated report
```

### Get User Reports
```
GET /api/reports/user/{user_id}?video_id={optional}
Returns: All reports for a user
```

### Get User Attempts
```
GET /api/reports/attempts/{user_id}/{video_id}
Returns: All attempts for a specific video
```

## Frontend Integration

### Components

**LearningReport Component** (`frontend/components/LearningReport.tsx`)
- Displays comprehensive report with visualizations
- Uses recharts library for interactive charts
- Responsive design with Tailwind CSS
- Shows word frequency, performance, and takeaways

### Usage Flow

1. **User watches video** → Flashcards appear at intervals
2. **User answers flashcard** → Attempt recorded in database
3. **User completes video** → Takes final quiz
4. **User submits quiz** → All quiz attempts recorded
5. **System generates report** → Word frequency + performance analysis
6. **User views report** → Interactive charts and insights displayed

## Implementation Details

### Word Frequency Algorithm
1. Tokenize transcript text
2. Remove stop words (the, a, and, etc.)
3. Filter words shorter than 4 characters
4. Count frequency of remaining words
5. Return top 30 words (top 10 shown in chart)

### Key Takeaways Extraction
1. Split transcript into sentences
2. Score sentences based on presence of high-frequency words
3. Select sentences with 2+ key words
4. Return top 5 sentences as takeaways

### Performance Calculation
```python
accuracy_rate = (correct_answers / total_attempts) * 100
```

Calculated separately for:
- Overall (all questions)
- Flashcards only
- Quiz only

## Future Enhancements

- [ ] User authentication for personalized tracking
- [ ] Progress dashboard showing improvement over time
- [ ] Compare performance across multiple videos
- [ ] Export reports as PDF
- [ ] Email summary after completing video
- [ ] Recommended review topics based on weak areas
- [ ] Spaced repetition reminders
- [ ] Social sharing of achievements

## Testing the Feature

### Manual Test Steps

1. **Process a video** with meaningful content
2. **Watch and answer flashcards** (at least 3-4)
3. **Complete the final quiz** (answer all 10 questions)
4. **View the generated report** with:
   - Accuracy statistics
   - Performance charts
   - Word frequency analysis
   - Key takeaways list

### Expected Results

- Report shows correct attempt counts
- Accuracy percentages match actual performance
- Word frequency highlights main video topics
- Key takeaways contain meaningful sentences
- All data persists in database

### Database Verification

```sql
-- Check attempts were recorded
SELECT * FROM user_attempts WHERE video_id = 'your_video_id';

-- Check report was generated
SELECT * FROM learning_reports WHERE video_id = 'your_video_id';
```

## Technical Requirements

### Backend
- FastAPI
- Supabase (PostgreSQL)
- Python 3.9+

### Frontend
- Next.js 14
- React 18
- Recharts 2.10.3
- TypeScript

## Configuration

No additional configuration needed beyond standard setup. The feature uses existing environment variables for database and API connections.

## Troubleshooting

**Issue**: Report not generating
- **Check**: Backend logs for errors in report generation
- **Verify**: All attempts were recorded in database
- **Solution**: Ensure quiz was fully submitted before requesting report

**Issue**: Word frequency shows generic words
- **Check**: Stop words list in `report_generator.py`
- **Solution**: Add more stop words to filter list

**Issue**: Charts not displaying
- **Check**: Browser console for errors
- **Verify**: Recharts library is installed (`npm install`)
- **Solution**: Clear cache and rebuild frontend

## Performance Considerations

- Word frequency analysis: O(n) where n = transcript length
- Report generation: ~100-500ms for typical video
- Database queries: Indexed on user_id and video_id
- Frontend rendering: Charts lazy-load for better performance

## Privacy & Data

- User attempts stored indefinitely for progress tracking
- Reports can be deleted via database query
- No personally identifiable information beyond user_id
- Compliant with standard data retention policies

---

**Version**: 1.0.0
**Last Updated**: 2025-11-03
**Author**: Claude AI Assistant
