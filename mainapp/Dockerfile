FROM python:3.11-slim

# Install system dependencies for dlib, face_recognition, and audio processing
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libboost-python-dev \
    libboost-all-dev \
    ffmpeg \
    libsndfile1 \
    libsndfile1-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start FastAPI server
CMD uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}
