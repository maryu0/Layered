"""
Settings service for managing application configuration.
In-memory storage for MVP (no persistence).
"""
from app.models.settings_schemas import AppSettings


class SettingsService:
    """Manages application settings (in-memory for MVP)."""
    
    _instance = None
    _settings: AppSettings = AppSettings()
    
    def __new__(cls):
        """Singleton pattern for global settings."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def get_settings(self) -> AppSettings:
        """Get current settings."""
        return self._settings
    
    def update_settings(self, new_settings: AppSettings) -> AppSettings:
        """Update settings and return new configuration."""
        self._settings = new_settings
        return self._settings
    
    def reset_settings(self) -> AppSettings:
        """Reset to default settings."""
        self._settings = AppSettings()
        return self._settings


# Global settings instance
settings_service = SettingsService()
