FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    libxcb1 \
    libxcb-shm0 \
    libxcb-xfixes0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD python -c "import os,uvicorn; uvicorn.run('app.main:app', host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))"
