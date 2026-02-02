# Hybrid Node.js + Python Dockerfile for Railway (grantgoblin)
FROM python:3.11-slim-bookworm

# 1. Install System Dependencies & Node.js
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Python Setup (Heavy dependencies)
# Copy strict requirements or just the researcher one
COPY ai-researcher/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 3. Node.js Setup
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# 4. Copy Application Source
COPY . .

# 5. Environment & Startup
ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1
EXPOSE 3000

# Start Express Server (which spawns Python scripts)
CMD ["npm", "start"]
