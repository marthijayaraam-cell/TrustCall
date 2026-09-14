# TrustCall Dockerfile for Cloud Deployment (Render, Railway, GCP, AWS)
FROM python:3.10-slim

# Install system dependencies including FFmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Low-memory environment variables for PyTorch / OpenBLAS
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV PYTHONUNBUFFERED=1

# Copy backend codebase
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Start TrustCall FastAPI Engine
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
