"""
Settings API endpoints for configuring analysis behavior.
"""
from fastapi import APIRouter, HTTPException
from app.models.settings_schemas import AppSettings
from app.services.settings_service import settings_service

settings_router = APIRouter(prefix="/settings", tags=["settings"])


@settings_router.get("", response_model=AppSettings)
async def get_settings():
    """
    Get current application settings.
    Settings control analysis behavior, visualization, and AI explanations.
    """
    return settings_service.get_settings()


@settings_router.post("", response_model=AppSettings)
async def update_settings(new_settings: AppSettings):
    """
    Update application settings.
    Changes apply immediately to subsequent analyses.
    """
    try:
        updated = settings_service.update_settings(new_settings)
        return updated
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid settings: {str(e)}"
        )


@settings_router.post("/reset", response_model=AppSettings)
async def reset_settings():
    """
    Reset all settings to default values.
    """
    return settings_service.reset_settings()
