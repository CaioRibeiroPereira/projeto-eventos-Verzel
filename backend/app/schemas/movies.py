from sqlmodel import SQLModel


class MovieResult(SQLModel):
    id: int
    title: str
    poster_path: str | None
    backdrop_path: str | None
    release_date: str | None
