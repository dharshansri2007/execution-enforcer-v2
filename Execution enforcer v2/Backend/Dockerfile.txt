# Use a lightweight, official Python runtime
FROM python:3.12-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install dependencies (no-cache keeps the image small and fast)
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code (main.py, agents.py, credentials, etc.)
COPY . .

# Google Cloud Run injects a $PORT environment variable (default 8080). 
# We tell Uvicorn to listen strictly to that port.
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
