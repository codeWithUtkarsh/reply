from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # OpenAI Configuration
    openai_api_key: str

    # Supabase Configuration
    supabase_url: str
    supabase_service_role_key: str

    # Application Configuration
    backend_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    # Video Processing Configuration
    max_video_duration: int = 3600
    flashcard_interval: int = 120
    questions_per_segment: int = 1
    final_quiz_questions: int = 10

    # Polar Payment Configuration
    polar_access_token: str = ""
    polar_webhook_secret: str = ""
    polar_organization_id: str = ""

    # Product IDs for Polar (these will be created in Polar dashboard)
    polar_student_product_id: str = ""
    polar_professional_product_id: str = ""

    # Pay as You Go Credit Package Product IDs
    polar_credit_starter_product_id: str = ""
    polar_credit_popular_product_id: str = ""
    polar_credit_power_product_id: str = ""
    polar_credit_mega_product_id: str = ""

    # Flexible PAYG Product (accepts any amount)
    polar_payg_flexible_product_id: str = ""

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
