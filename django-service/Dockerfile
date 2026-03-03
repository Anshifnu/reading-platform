# 1. Base image
FROM python:3.12-slim

# 2. Environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Working directory
WORKDIR /app

# 4. Install system dependencies (REQUIRED for Pillow)
RUN apt-get update && apt-get install -y \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

# 5. Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# 6. Copy project files
COPY . .

# 7. Expose port
EXPOSE 8000

# 8. Run server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
