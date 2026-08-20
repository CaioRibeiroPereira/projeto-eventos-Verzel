import httpx
from fastapi import HTTPException, status

from app.core.config import settings

BASE_URL = "https://api.themoviedb.org/3"


class CastMember:
    def __init__(self, name: str, character: str | None, profile_path: str | None):
        self.name = name
        self.character = character
        self.profile_path = profile_path


class TMDbMovie:
    def __init__(
        self,
        id: int,
        title: str,
        poster_path: str | None,
        backdrop_path: str | None,
        release_date: str | None,
        overview: str | None = None,
        genres: list[str] | None = None,
        runtime: int | None = None,
        director: str | None = None,
        cast: list[CastMember] | None = None,
        tagline: str | None = None,
        vote_average: float | None = None,
        youtube_key: str | None = None,
    ):
        self.id = id
        self.title = title
        self.poster_path = poster_path
        self.backdrop_path = backdrop_path
        self.release_date = release_date
        self.overview = overview
        self.genres = genres or []
        self.runtime = runtime
        self.director = director
        self.cast = cast or []
        self.tagline = tagline
        self.vote_average = vote_average
        self.youtube_key = youtube_key


def _get(path: str, params: dict) -> dict:
    if not settings.tmdb_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TMDB_API_KEY não configurada no backend",
        )
    response = httpx.get(
        f"{BASE_URL}{path}",
        params={**params, "api_key": settings.tmdb_api_key, "language": "pt-BR"},
        timeout=15,
    )
    if response.status_code != 200:
        # o motivo real (chave inválida, rate limit, etc.) só importa nos
        # logs do servidor — pro cliente da API basta saber que falhou.
        print(f"TMDb respondeu {response.status_code} em {path}: {response.text[:300]}")
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
            backdrop_path=item.get("backdrop_path"),
            release_date=item.get("release_date") or None,
            overview=item.get("overview") or None,
        )
        for item in data.get("results", [])
    ]


def _best_trailer_key(data: dict) -> str | None:
    """Escolhe o melhor trailer do YouTube: prioriza trailer oficial,
    depois qualquer trailer, depois qualquer vídeo do YouTube."""
    videos = [v for v in data.get("videos", {}).get("results", []) if v.get("site") == "YouTube"]
    if not videos:
        return None

    def score(video: dict) -> tuple[bool, bool]:
        return (video.get("type") == "Trailer", video.get("official", False))

    best = max(videos, key=score)
    return best["key"]


def get_movie(movie_id: int) -> TMDbMovie:
    data = _get(f"/movie/{movie_id}", {"append_to_response": "credits,videos"})

    credits = data.get("credits", {})
    director = next(
        (c["name"] for c in credits.get("crew", []) if c.get("job") == "Director"),
        None,
    )
    cast = [
        CastMember(
            name=c["name"],
            character=c.get("character") or None,
            profile_path=c.get("profile_path"),
        )
        for c in credits.get("cast", [])[:8]
    ]

    return TMDbMovie(
        id=data["id"],
        title=data["title"],
        poster_path=data.get("poster_path"),
        backdrop_path=data.get("backdrop_path"),
        release_date=data.get("release_date") or None,
        overview=data.get("overview") or None,
        genres=[g["name"] for g in data.get("genres", [])],
        runtime=data.get("runtime") or None,
        director=director,
        cast=cast,
        tagline=data.get("tagline") or None,
        vote_average=data.get("vote_average") or None,
        youtube_key=_best_trailer_key(data),
    )
