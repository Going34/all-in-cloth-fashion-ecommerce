# Google Cloud Deployment Guide

This guide will help you deploy the All-in-Cloth e-commerce application to Google Cloud Platform.

## Prerequisites

1. Google Cloud SDK installed and configured
2. Docker installed (for local testing)
3. A Google Cloud project with billing enabled
4. Environment variables configured (Supabase credentials, etc.)

## Option 1: Deploy to Cloud Run (Recommended)

### Step 1: Build and test locally (optional)

```bash
# Build the Docker image
docker build -t all-in-cloth .

# Run locally to test
docker run -p 8080:8080 --env-file .env.local all-in-cloth
```

### Step 2: Deploy to Cloud Run

```bash
# Set your project ID
export PROJECT_ID=your-project-id
gcloud config set project $PROJECT_ID

# Build and deploy to Cloud Run
gcloud run deploy all-in-cloth \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars="NODE_ENV=production"
```

### Step 3: Set Environment Variables

After deployment, set your environment variables in Cloud Run:

```bash
gcloud run services update all-in-cloth \
  --update-env-vars="NEXT_PUBLIC_SUPABASE_URL=your-url,NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key" \
  --region us-central1
```

Or use the Google Cloud Console:
1. Go to Cloud Run → all-in-cloth → Edit & Deploy New Revision
2. Go to Variables & Secrets tab
3. Add your environment variables

## Option 2: Deploy using Cloud Build

### Step 1: Create cloudbuild.yaml

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/all-in-cloth', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/all-in-cloth']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'all-in-cloth'
      - '--image'
      - 'gcr.io/$PROJECT_ID/all-in-cloth'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--port'
      - '8080'
```

### Step 2: Submit build

```bash
gcloud builds submit --config cloudbuild.yaml
```

## Environment Variables Required

Make sure to set these environment variables in Cloud Run:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)
- Any other environment variables your application needs

## Notes

- The Dockerfile uses multi-stage builds for optimal image size
- Port 8080 is used (Cloud Run default)
- The application runs in production mode
- Make sure your Supabase database allows connections from Cloud Run IPs

## Troubleshooting

1. **Build fails**: Check that all dependencies are in package.json
2. **Runtime errors**: Check Cloud Run logs: `gcloud run services logs read all-in-cloth`
3. **Database connection issues**: Verify Supabase connection settings and network access

