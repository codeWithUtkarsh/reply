from fastapi import APIRouter, HTTPException
from database import db
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import json

router = APIRouter()


@router.get("/user/{user_id}")
async def get_user_analytics(user_id: str):
    """Get comprehensive analytics for a user"""
    try:
        # Get all user reports
        reports = await db.get_user_reports(user_id)

        # Get all user videos
        # We'll need to query attempts to find videos user has interacted with
        all_attempts = []
        video_ids = set()

        # Collect all attempts across all videos
        for report in reports:
            video_id = report['video_id']
            video_ids.add(video_id)
            attempts = await db.get_user_attempts(user_id, video_id)
            all_attempts.extend(attempts)

        # Calculate hero stats
        total_questions = len(all_attempts)
        correct_answers = sum(1 for attempt in all_attempts if attempt['is_correct'])
        overall_accuracy = round((correct_answers / total_questions * 100), 1) if total_questions > 0 else 0
        total_videos = len(video_ids)
        total_quizzes = len([r for r in reports if r.get('quiz_id')])

        # Calculate study streak
        attempt_dates = sorted(set(
            datetime.fromisoformat(attempt['created_at'].replace('Z', '+00:00')).date()
            for attempt in all_attempts
            if attempt.get('created_at')
        ), reverse=True)

        current_streak = 0
        if attempt_dates:
            today = datetime.now(timezone.utc).date()
            current_date = attempt_dates[0]

            # Check if user studied today or yesterday
            if current_date == today or current_date == today - timedelta(days=1):
                current_streak = 1
                for i in range(1, len(attempt_dates)):
                    if attempt_dates[i] == attempt_dates[i-1] - timedelta(days=1):
                        current_streak += 1
                    else:
                        break

        # Learning progress over time (last 30 days)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        daily_stats = defaultdict(lambda: {'questions': 0, 'correct': 0})

        for attempt in all_attempts:
            if attempt.get('created_at'):
                attempt_date = datetime.fromisoformat(attempt['created_at'].replace('Z', '+00:00'))
                if attempt_date >= thirty_days_ago:
                    date_key = attempt_date.strftime('%Y-%m-%d')
                    daily_stats[date_key]['questions'] += 1
                    if attempt['is_correct']:
                        daily_stats[date_key]['correct'] += 1

        progress_data = []
        for i in range(30):
            date = (datetime.now(timezone.utc) - timedelta(days=29-i)).strftime('%Y-%m-%d')
            stats = daily_stats.get(date, {'questions': 0, 'correct': 0})
            accuracy = round((stats['correct'] / stats['questions'] * 100), 1) if stats['questions'] > 0 else 0
            progress_data.append({
                'date': date,
                'questions': stats['questions'],
                'accuracy': accuracy
            })

        # Knowledge proficiency by domain
        domain_stats = defaultdict(lambda: {'correct': 0, 'total': 0})

        for report in reports:
            domain = report.get('domain', 'General')
            # Parse performance stats
            if isinstance(report.get('performance_stats'), str):
                perf_stats = json.loads(report['performance_stats'])
            else:
                perf_stats = report.get('performance_stats', {})

            domain_stats[domain]['correct'] += perf_stats.get('correct_count', 0)
            domain_stats[domain]['total'] += perf_stats.get('total_attempts', 0)

        proficiency_data = [
            {
                'domain': domain,
                'proficiency': round((stats['correct'] / stats['total'] * 100), 1) if stats['total'] > 0 else 0,
                'questions': stats['total']
            }
            for domain, stats in domain_stats.items()
        ]

        # Study activity heatmap (last 90 days)
        ninety_days_ago = datetime.now(timezone.utc) - timedelta(days=90)
        heatmap_data = defaultdict(int)

        for attempt in all_attempts:
            if attempt.get('created_at'):
                attempt_date = datetime.fromisoformat(attempt['created_at'].replace('Z', '+00:00'))
                if attempt_date >= ninety_days_ago:
                    date_key = attempt_date.strftime('%Y-%m-%d')
                    heatmap_data[date_key] += 1

        heatmap = []
        for i in range(90):
            date = datetime.now(timezone.utc) - timedelta(days=89-i)
            date_key = date.strftime('%Y-%m-%d')
            heatmap.append({
                'date': date_key,
                'count': heatmap_data.get(date_key, 0),
                'day': date.strftime('%A')[:3],  # Mon, Tue, etc.
                'week': date.isocalendar()[1]
            })

        # Performance breakdown
        flashcard_attempts = [a for a in all_attempts if a['question_type'] == 'flashcard']
        quiz_attempts = [a for a in all_attempts if a['question_type'] == 'quiz']

        flashcard_accuracy = round((sum(1 for a in flashcard_attempts if a['is_correct']) / len(flashcard_attempts) * 100), 1) if flashcard_attempts else 0
        quiz_accuracy = round((sum(1 for a in quiz_attempts if a['is_correct']) / len(quiz_attempts) * 100), 1) if quiz_attempts else 0

        performance_breakdown = {
            'flashcards': {
                'total': len(flashcard_attempts),
                'accuracy': flashcard_accuracy
            },
            'quizzes': {
                'total': len(quiz_attempts),
                'accuracy': quiz_accuracy
            }
        }

        # Achievements
        achievements = []

        # Streak achievements
        if current_streak >= 7:
            achievements.append({
                'id': 'week_streak',
                'title': '7-Day Streak',
                'description': f'Studied for {current_streak} days in a row!',
                'icon': '🔥',
                'unlocked': True
            })
        if current_streak >= 30:
            achievements.append({
                'id': 'month_streak',
                'title': '30-Day Streak',
                'description': 'A month of consistent learning!',
                'icon': '🏆',
                'unlocked': True
            })

        # Question milestones
        if total_questions >= 100:
            achievements.append({
                'id': 'century',
                'title': 'Century',
                'description': 'Answered 100 questions!',
                'icon': '💯',
                'unlocked': True
            })
        if total_questions >= 500:
            achievements.append({
                'id': 'half_thousand',
                'title': 'Scholar',
                'description': 'Answered 500 questions!',
                'icon': '📚',
                'unlocked': True
            })

        # Perfect score achievements
        perfect_quizzes = sum(1 for report in reports if (
            json.loads(report['performance_stats']) if isinstance(report.get('performance_stats'), str) else report.get('performance_stats', {})
        ).get('accuracy_rate', 0) == 100)

        if perfect_quizzes >= 1:
            achievements.append({
                'id': 'perfectionist',
                'title': 'Perfectionist',
                'description': 'Achieved 100% on a quiz!',
                'icon': '⭐',
                'unlocked': True
            })

        # High accuracy achievement
        if overall_accuracy >= 80:
            achievements.append({
                'id': 'ace',
                'title': 'Ace Student',
                'description': '80%+ overall accuracy!',
                'icon': '🎯',
                'unlocked': True
            })

        # Insights
        insights = []

        # Best performing domain
        if proficiency_data:
            best_domain = max(proficiency_data, key=lambda x: x['proficiency'])
            insights.append({
                'type': 'strength',
                'title': 'Your Strongest Domain',
                'message': f"You excel in {best_domain['domain']} with {best_domain['proficiency']}% accuracy!",
                'icon': '💪'
            })

            # Weakest domain (if exists)
            if len(proficiency_data) > 1:
                weak_domain = min(proficiency_data, key=lambda x: x['proficiency'])
                if weak_domain['proficiency'] < 70:
                    insights.append({
                        'type': 'improvement',
                        'title': 'Growth Opportunity',
                        'message': f"Focus on {weak_domain['domain']} to improve your {weak_domain['proficiency']}% accuracy.",
                        'icon': '📈'
                    })

        # Streak motivation
        if current_streak > 0:
            insights.append({
                'type': 'motivation',
                'title': 'Keep It Up!',
                'message': f"You're on a {current_streak}-day streak. Study today to keep it going!",
                'icon': '🔥'
            })
        elif attempt_dates and (datetime.now(timezone.utc).date() - attempt_dates[0]) > timedelta(days=3):
            insights.append({
                'type': 'motivation',
                'title': 'Welcome Back!',
                'message': "It's been a while. Ready to continue your learning journey?",
                'icon': '👋'
            })

        # Quiz reports table data
        quiz_reports = []
        for report in reports:
            if report.get('quiz_id'):  # Only include quiz reports
                # Get video info
                video = await db.get_video(report['video_id'])

                # Parse performance stats
                if isinstance(report.get('performance_stats'), str):
                    perf_stats = json.loads(report['performance_stats'])
                else:
                    perf_stats = report.get('performance_stats', {})

                quiz_reports.append({
                    'report_id': report['report_id'],
                    'video_id': report['video_id'],
                    'video_title': video.get('title', 'Unknown Video') if video else 'Unknown Video',
                    'project_id': video.get('project_id') if video else None,
                    'project_name': None,  # Will be filled below
                    'score': perf_stats.get('accuracy_rate', 0),
                    'total_questions': perf_stats.get('total_attempts', 0),
                    'correct_answers': perf_stats.get('correct_count', 0),
                    'date_taken': report.get('created_at'),
                    'domain': report.get('domain', 'General'),
                    'video_type': report.get('video_type', 'Unknown')
                })

        # Get project names for each report
        project_ids = set(r['project_id'] for r in quiz_reports if r['project_id'])
        project_names = {}
        for project_id in project_ids:
            try:
                project = await db.get_project(project_id)
                if project:
                    project_names[project_id] = project.get('project_name', 'Unknown Project')
            except:
                project_names[project_id] = 'Unknown Project'

        # Update quiz reports with project names
        for report in quiz_reports:
            if report['project_id']:
                report['project_name'] = project_names.get(report['project_id'], 'Unknown Project')

        # Sort by date (most recent first)
        quiz_reports.sort(key=lambda x: x['date_taken'] or '', reverse=True)

        return {
            'user_id': user_id,
            'hero_stats': {
                'total_questions': total_questions,
                'overall_accuracy': overall_accuracy,
                'total_videos': total_videos,
                'total_quizzes': total_quizzes,
                'current_streak': current_streak
            },
            'progress_data': progress_data,
            'proficiency_data': proficiency_data,
            'heatmap_data': heatmap,
            'performance_breakdown': performance_breakdown,
            'achievements': achievements,
            'insights': insights,
            'quiz_reports': quiz_reports
        }

    except Exception as e:
        print(f"Analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
