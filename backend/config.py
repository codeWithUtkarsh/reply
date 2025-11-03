from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # OpenAI Configuration
    openai_api_key: str

    # Supabase Configuration
    supabase_url: str
    supabase_key: str

    # Application Configuration
    backend_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    # Video Processing Configuration
    max_video_duration: int = 3600
    flashcard_interval: int = 120
    questions_per_segment: int = 1
    final_quiz_questions: int = 10

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
