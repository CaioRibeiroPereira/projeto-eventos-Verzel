FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Aplica migrations e semeia dados de teste (idempotente — seed.py pula o
# que já existe) antes de subir o servidor, pra "docker compose up" deixar
# tudo pronto pra avaliar sem passo manual nenhum. $PORT vem de plataformas
# como o Render, que definem a porta em runtime; localmente (docker
# compose, sem essa variável) cai no fallback 8000.
CMD ["sh", "-c", "alembic upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
