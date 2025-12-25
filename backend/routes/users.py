from fastapi import APIRouter, HTTPException
from database import db
from models import UserProfile, CreditInfo

router = APIRouter()


@router.get("/{user_id}/credits")
async def get_user_credits(user_id: str):
    """Get user credit information"""
    try:
        user = await db.get_user_profile(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        is_unlimited = user.get('role') == 'developer'

        return CreditInfo(
            transcription_credits=user.get('transcription_credits', 0) if not is_unlimited else float('inf'),
            notes_credits=user.get('notes_credits', 0) if not is_unlimited else float('inf'),
            role=user.get('role', 'user'),
            has_unlimited=is_unlimited
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/profile")
async def get_user_profile(user_id: str):
    """Get complete user profile"""
    try:
        user = await db.get_user_profile(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "id": user.get('id'),
            "role": user.get('role', 'user'),
            "transcription_credits": user.get('transcription_credits', 0),
            "notes_credits": user.get('notes_credits', 0),
            "company": user.get('company'),
            "country": user.get('country'),
            "currency": user.get('currency', 'USD'),
            "created_at": user.get('created_at'),
            "updated_at": user.get('updated_at'),
            "has_unlimited": user.get('role') == 'developer'
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
