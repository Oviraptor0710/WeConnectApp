FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev gcc pkg-config curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/uploads/avatars /app/uploads/covers /app/uploads/events /app/static

# Railway healthcheck: đảm bảo app đã sẵn sàng trước khi expose traffic.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Dùng port 8001 cố định (giống bản 06b9b56 đã ổn định trên Railway).
# Railway auto-detect port; không cần dùng $PORT.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
