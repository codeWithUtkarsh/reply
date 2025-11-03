# Deployment Guide

This guide covers deploying the Preply Video Learning Platform to production.

## Deployment Architecture

```
Frontend (Vercel) → Backend (Railway/Fly.io) → Supabase (Database)
                              ↓
                         OpenAI API
```

## Prerequisites

- GitHub account
- Vercel account (free)
- Railway or Fly.io account (free tier available)
- Production Supabase project
- OpenAI API key with production credits

---

## Option 1: Railway + Vercel (Recommended)

### Part A: Deploy Backend to Railway

Railway offers easy deployment with good free tier.

#### 1. Prepare Repository

```bash
# Ensure .gitignore includes .env
git add .
git commit -m "Prepare for deployment"
git push origin main
```

#### 2. Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway will auto-detect the Python app

#### 3. Configure Environment Variables

In Railway dashboard:
1. Go to your project
2. Click on the service
3. Go to "Variables" tab
4. Add these variables:

```env
OPENAI_API_KEY=sk-your-production-key
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_KEY=your-prod-anon-key
BACKEND_PORT=8000
CORS_ORIGINS=https://your-frontend-domain.vercel.app
MAX_VIDEO_DURATION=3600
FLASHCARD_INTERVAL=120
FINAL_QUIZ_QUESTIONS=10
```

#### 4. Configure Build Settings

Railway might auto-detect settings, but verify:

- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### 5. Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Copy the generated URL (e.g., `https://your-app.railway.app`)

#### 6. Test Backend

```bash
curl https://your-app.railway.app/health
# Should return: {"status":"healthy"}
```

### Part B: Deploy Frontend to Vercel

#### 1. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### 2. Configure Environment Variables

In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add these variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
```

#### 3. Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Your app will be live at `https://your-project.vercel.app`

#### 4. Update CORS

Go back to Railway and update `CORS_ORIGINS` environment variable:

```env
CORS_ORIGINS=https://your-project.vercel.app,https://your-project-*.vercel.app
```

Redeploy the Railway service.

---

## Option 2: Docker Deployment

### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - CORS_ORIGINS=http://localhost:3000
    env_file:
      - ./backend/.env

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_KEY}
    depends_on:
      - backend

```

### Deploy with Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Option 3: AWS Deployment

### Backend on AWS ECS Fargate

1. Create ECR repository
2. Build and push Docker image
3. Create ECS cluster
4. Create task definition
5. Create service with load balancer

### Frontend on AWS Amplify

1. Connect GitHub repository
2. Configure build settings
3. Add environment variables
4. Deploy

---

## Production Checklist

### Security

- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (automatic with Railway/Vercel)
- [ ] Configure CORS properly
- [ ] Review Supabase RLS policies
- [ ] Rotate API keys regularly
- [ ] Set up API rate limiting

### Performance

- [ ] Enable CDN for static assets (Vercel does this)
- [ ] Configure caching headers
- [ ] Monitor API response times
- [ ] Set up database indexes
- [ ] Implement query optimization

### Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Monitor API costs (OpenAI dashboard)
- [ ] Set up alerts for failures

### Backup

- [ ] Enable Supabase automatic backups
- [ ] Document backup restoration procedure
- [ ] Test disaster recovery

---

## Environment-Specific Configuration

### Development
```env
OPENAI_API_KEY=sk-dev-key
SUPABASE_URL=https://dev-project.supabase.co
CORS_ORIGINS=http://localhost:3000
```

### Staging
```env
OPENAI_API_KEY=sk-staging-key
SUPABASE_URL=https://staging-project.supabase.co
CORS_ORIGINS=https://staging.yourapp.com
```

### Production
```env
OPENAI_API_KEY=sk-prod-key
SUPABASE_URL=https://prod-project.supabase.co
CORS_ORIGINS=https://yourapp.com,https://www.yourapp.com
```

---

## Cost Optimization

### OpenAI API
- Use GPT-4o-mini instead of GPT-4
- Cache generated questions
- Implement request throttling
- Monitor usage in OpenAI dashboard

### Hosting
- Railway free tier: 500 hours/month
- Vercel free tier: 100GB bandwidth/month
- Supabase free tier: 500MB database, 2GB bandwidth

### Expected Costs (Monthly)

**Low Usage** (100 videos):
- OpenAI: ~$20
- Railway: $0 (free tier)
- Vercel: $0 (free tier)
- Supabase: $0 (free tier)
**Total: ~$20**

**Medium Usage** (1000 videos):
- OpenAI: ~$200
- Railway: $20
- Vercel: $0
- Supabase: $25
**Total: ~$245**

---

## Rollback Strategy

### Railway
1. Go to deployments
2. Click on previous successful deployment
3. Click "Redeploy"

### Vercel
1. Go to deployments
2. Find previous deployment
3. Click "Promote to Production"

---

## Troubleshooting Production Issues

### Backend Not Responding

1. Check Railway logs
2. Verify environment variables
3. Check database connectivity
4. Review error tracking

### Frontend Build Fails

1. Check Vercel build logs
2. Verify environment variables
3. Test build locally: `npm run build`
4. Check Node.js version compatibility

### CORS Errors

1. Verify `CORS_ORIGINS` includes frontend domain
2. Check protocol (http vs https)
3. Include www and non-www variants

### Database Connection Issues

1. Check Supabase project status
2. Verify connection credentials
3. Check IP allowlisting
4. Review connection pooling settings

---

## Scaling Considerations

### Horizontal Scaling

Railway and Vercel automatically scale based on demand.

### Database Scaling

- Monitor Supabase performance metrics
- Upgrade Supabase plan if needed
- Implement read replicas for heavy read workloads
- Consider Redis for caching

### CDN

- Use Vercel's built-in CDN
- Configure caching headers
- Optimize images and videos

---

## Maintenance

### Regular Tasks

- **Weekly**: Review error logs
- **Monthly**: Analyze API costs
- **Quarterly**: Update dependencies
- **Yearly**: Rotate API keys

### Dependency Updates

```bash
# Backend
cd backend
pip list --outdated
pip install -r requirements.txt --upgrade

# Frontend
cd frontend
npm outdated
npm update
```

---

## Support & Resources

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- OpenAI Docs: https://platform.openai.com/docs
