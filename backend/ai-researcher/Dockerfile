# Multi-stage build for AI Researcher Python service
FROM python:3.11-slim as base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create output directory for research workspaces
RUN mkdir -p grant_research_output

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV TOKENIZERS_PARALLELISM=false

# Expose port if needed (optional, for future API endpoints)
# EXPOSE 8000

# Default command (can be overridden)
CMD ["python", "grant_research_bridge.py", "--help"]
