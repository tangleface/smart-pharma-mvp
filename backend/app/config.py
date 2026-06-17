from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


LOCAL_FRONTEND_ORIGINS = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
)


class Settings(BaseSettings):
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")
    database_url: str = Field(default="sqlite:///./pharma_intel.db", alias="DATABASE_URL")
    frontend_origin: str = Field(
        default=",".join(LOCAL_FRONTEND_ORIGINS),
        alias="FRONTEND_ORIGIN",
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def frontend_origins(self) -> list[str]:
        origins = [origin.strip() for origin in self.frontend_origin.split(",") if origin.strip()]
        return origins or list(LOCAL_FRONTEND_ORIGINS)


@lru_cache
def get_settings() -> Settings:
    return Settings()
