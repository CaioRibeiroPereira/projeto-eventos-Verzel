FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Migration é sempre obrigatória (sem tabela não tem app). O seed só roda
# se RUN_SEED=true — ligado no docker-compose.yml pra dev local, desligado
# em produção (Render): lá, se o seed rodasse toda vez que a tabela de
# eventos estivesse vazia (ex: depois de uma limpeza manual), reseedaria
# sozinho sem avisar ninguém. Falha no seed (ex: TMDb fora do ar num boot
# pontual) não pode impedir o servidor de subir de qualquer jeito. $PORT
# vem de plataformas como o Render, que definem a porta em runtime;
# localmente (docker compose, sem essa variável) cai no fallback 8000.
CMD ["sh", "-c", "alembic upgrade head && if [ \"$RUN_SEED\" = \"true\" ]; then python -m app.seed || true; fi && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
