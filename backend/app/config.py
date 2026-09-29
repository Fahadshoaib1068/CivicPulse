import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/civicpulse"
    )
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    TRIAGE_PROVIDER: str = os.getenv("TRIAGE_PROVIDER", "rules")
    GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY")


settings = Settings()