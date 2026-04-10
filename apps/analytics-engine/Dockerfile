# 1. Base Image
FROM python:3.11-slim

# 2. Workspace
WORKDIR /app

# 3. System Dependencies
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

# 4. Install Dependencies
# Pointing to the specific path within the monorepo context
COPY apps/analytics-engine/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy Source
# Copy the specific processor and create the data directory
COPY apps/analytics-engine/processor.py .
RUN mkdir -p /app/data

# 6. Environment
ENV PYTHONUNBUFFERED=1

# 7. Execute
CMD ["python", "processor.py"]