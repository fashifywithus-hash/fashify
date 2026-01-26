# Deployment Scripts

This directory contains scripts to help deploy Fashify to AWS.

## Scripts

### `setup-aws-infrastructure.sh`

Initial setup script that creates AWS resources:
- S3 bucket for frontend
- Configures static website hosting
- Sets up bucket policies

**Usage:**
```bash
./scripts/setup-aws-infrastructure.sh
```

**Requirements:**
- AWS CLI installed and configured
- Appropriate AWS permissions

---

### `deploy-backend.sh`

Deploys the backend to AWS Elastic Beanstalk.

**Usage:**
```bash
./scripts/deploy-backend.sh [environment]
# Example: ./scripts/deploy-backend.sh production

# For automated deployments (skip prompt):
SKIP_PROMPT=1 ./scripts/deploy-backend.sh production
```

**What it does:**
1. Checks if EB CLI is installed (installs if missing)
2. Initializes Elastic Beanstalk (if needed)
3. Creates environment (if needed)
4. Warns about required environment variables
5. Builds the application (TypeScript → JavaScript)
6. Verifies build was successful
7. Deploys to Elastic Beanstalk
8. Shows deployment status and URL
9. Automatically sets `BACKEND_URL` environment variable
10. Opens backend URL in browser

**Environment Variables:**
- `AWS_REGION` - AWS region (default: us-east-1)
- `SKIP_PROMPT` - Set to 1 to skip the environment variable prompt (for automation)

**Requirements:**
- EB CLI installed (`brew install awsebcli` or `pip install awsebcli`)
- AWS credentials configured
- Required environment variables set in Elastic Beanstalk:
  - `MONGODB_URI` (required)
  - `JWT_SECRET` (required, min 32 chars)
  - `FRONTEND_URL` (required)
  - `BACKEND_URL` (optional, set automatically by script)

---

### `deploy-frontend.sh`

Deploys the frontend to AWS S3 (and optionally invalidates CloudFront).

**Usage:**
```bash
./scripts/deploy-frontend.sh [environment]
# Example: ./scripts/deploy-frontend.sh production
```

**Environment Variables:**
- `AWS_REGION` - AWS region (default: us-east-1)
- `CLOUDFRONT_DISTRIBUTION_ID` - Optional CloudFront distribution ID

**What it does:**
1. Creates S3 bucket (if doesn't exist)
2. Configures static website hosting
3. Sets bucket policy
4. Builds frontend
5. Uploads files to S3 with appropriate cache headers
6. Invalidates CloudFront cache (if configured)

**Requirements:**
- AWS CLI installed and configured
- Frontend dependencies installed (`npm install` in FrontEnd directory)
- `.env.production` file with correct API URL

---

## Manual Deployment

If you prefer to deploy manually:

### Backend

```bash
cd BackEnd
eb init fashify-backend --platform node.js-20 --region us-east-1
eb create production
eb setenv [your environment variables]
eb deploy
```

### Frontend

```bash
cd FrontEnd
npm install
npm run build
aws s3 sync dist/ s3://fashify-frontend-prod --delete
```

---

## Troubleshooting

### Scripts not executable

```bash
chmod +x scripts/*.sh
```

### AWS credentials not found

```bash
aws configure
```

### EB CLI not found

```bash
# macOS
brew install awsebcli

# Linux/Windows
pip install awsebcli
```

### Permission denied errors

Check your AWS IAM permissions. You need:
- S3: CreateBucket, PutObject, PutBucketPolicy, PutBucketWebsite
- Elastic Beanstalk: CreateApplication, CreateEnvironment, UpdateEnvironment
- CloudFront: CreateInvalidation (if using CloudFront)
