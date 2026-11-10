FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONPATH=/app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN groupadd --system vectra && useradd --system --gid vectra --home-dir /app vectra \
    && mkdir -p /data/uploads \
    && chown -R vectra:vectra /app /data/uploads
USER vectra
EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && python scripts/seed.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
