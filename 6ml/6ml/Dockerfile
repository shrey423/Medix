FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip uninstall -y numpy && pip install --no-cache-dir numpy


COPY . .

CMD gunicorn server:app \
    --workers 2 \
    --worker-class uvicorn.workers.UvicornWorker \
    --timeout 300 \
    --bind 0.0.0.0:$PORT \
    --preload 