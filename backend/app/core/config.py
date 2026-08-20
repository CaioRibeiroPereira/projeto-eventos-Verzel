from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5433/eventos"
    jwt_secret: str = "change-me-in-env"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 24
    tmdb_api_key: str = ""
    ticket_secret: str = "change-me-in-env-too"
    # domínio do front-end publicado (ex: https://cine-verzel.vercel.app),
    # liberado no CORS além do localhost — vazio em dev local.
    frontend_url: str = ""

    @field_validator("database_url")
    @classmethod
    def _use_psycopg2_driver(cls, value: str) -> str:
        # provedores como Render/Heroku entregam a connection string como
        # postgres:// ou postgresql://, sem o driver — o SQLAlchemy precisa
        # do +psycopg2 explícito.
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg2://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg2://", 1)
        return value


settings = Settings()
