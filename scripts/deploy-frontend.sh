#!/bin/bash

# Frontend Deployment Script for AWS S3 + CloudFront
# Usage: ./scripts/deploy-frontend.sh [environment]

set -e

ENVIRONMENT=${1:-production}
BUCKET_NAME="fashify-frontend-${ENVIRONMENT}"
REGION=${AWS_REGION:-us-east-1}

echo "🚀 Deploying Frontend to ${ENVIRONMENT} environment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if bucket exists, create if not
if ! aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "✅ Bucket ${BUCKET_NAME} already exists"
else
    echo "📦 Creating S3 bucket ${BUCKET_NAME}..."
    aws s3 mb "s3://${BUCKET_NAME}" --region "${REGION}"
    
    # Disable Block Public Access (required for static website hosting)
    echo "🔓 Disabling Block Public Access settings..."
    aws s3api put-public-access-block \
        --bucket "${BUCKET_NAME}" \
        --public-access-block-configuration \
        "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
    
    # Enable static website hosting
    echo "🌐 Configuring static website hosting..."
    aws s3 website "s3://${BUCKET_NAME}" \
        --index-document index.html \
        --error-document index.html
    
    # Set bucket policy for public read (if not using CloudFront)
    echo "🔓 Setting bucket policy..."
    cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }
  ]
}
EOF
    aws s3api put-bucket-policy --bucket "${BUCKET_NAME}" --policy file:///tmp/bucket-policy.json
    rm /tmp/bucket-policy.json
fi

# Build frontend
echo "🔨 Building frontend..."
cd FrontEnd
npm install
npm run build

# Upload to S3
echo "📤 Uploading files to S3..."
aws s3 sync dist/ "s3://${BUCKET_NAME}" \
    --delete \
    --region "${REGION}" \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --exclude "*.json"

# Upload HTML files with no cache
aws s3 sync dist/ "s3://${BUCKET_NAME}" \
    --delete \
    --region "${REGION}" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --include "*.html" \
    --include "*.json"

echo "✅ Frontend deployed successfully!"
echo "🌐 Website URL: http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com"

# Invalidate CloudFront if distribution ID is set
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "🔄 Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*"
    echo "✅ CloudFront cache invalidated"
fi

cd ..
