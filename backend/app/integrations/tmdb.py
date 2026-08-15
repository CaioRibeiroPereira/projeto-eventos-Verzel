import httpx
from fastapi import HTTPException, status

from app.core.config import settings

BASE_URL = "https://api.themoviedb.org/3"


class TMDbMovie:
    def __init__(self, id: int, title: str, poster_path: str | None, release_date: str | None):
        self.id = id
        self.title = title
        self.poster_path = poster_path
        self.release_date = release_date


def _get(path: str, params: dict) -> dict:
    if not settings.tmdb_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TMDB_API_KEY não configurada no backend",
        )
    response = httpx.get(
        f"{BASE_URL}{path}",
        params={**params, "api_key": settings.tmdb_api_key, "language": "pt-BR"},
        timeout=10,
    )
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Falha ao consultar o TMDb",
        )
    return response.json()


def search_movies(query: str) -> list[TMDbMovie]:
    data = _get("/search/movie", {"query": query})
    return [
        TMDbMovie(
            id=item["id"],
            title=item["title"],
            poster_path=item.get("poster_path"),
            release_date=item.get("release_date") or None,
        )
        for item in data.get("results", [])
    ]


def get_movie(movie_id: int) -> TMDbMovie:
    data = _get(f"/movie/{movie_id}", {})
    return TMDbMovie(
        id=data["id"],
        title=data["title"],
        poster_path=data.get("poster_path"),
        release_date=data.get("release_date") or None,
    )
