FROM python:3.12.7-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

RUN apt-get update -o Acquire::Check-Valid-Until=false -o Acquire::Check-Date=false --allow-releaseinfo-change && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY . /app

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
        fastapi==0.141.1 \
        sqlalchemy==2.1.1 \
        uvicorn==0.54.0 \
        psycopg2-binary==2.9.13 \
        redis==8.1.0 \
        alembic==1.20.0 \
        groq==1.7.0 \
        python-dotenv==1.2.3

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"]
