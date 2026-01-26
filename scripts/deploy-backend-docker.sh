#!/bin/bash

# Docker-based Backend Deployment Script
# Usage: ./scripts/deploy-backend-docker.sh [deployment-type] [environment]
# Deployment types: local, ecr, ecs, eb
# Example: ./scripts/deploy-backend-docker.sh ecr production

set -e

DEPLOYMENT_TYPE=${1:-local}
ENVIRONMENT=${2:-production}
APP_NAME="fashify-backend"
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REPOSITORY=${ECR_REPOSITORY:-${APP_NAME}}
IMAGE_TAG=${IMAGE_TAG:-latest}

cd BackEnd

echo "🐳 Docker Backend Deployment"
echo "   Type: ${DEPLOYMENT_TYPE}"
echo "   Environment: ${ENVIRONMENT}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t ${APP_NAME}:${IMAGE_TAG} -t ${APP_NAME}:latest .

if [ "$DEPLOYMENT_TYPE" = "local" ]; then
    echo ""
    echo "🚀 Running container locally..."
    echo "   Make sure MongoDB is running or use docker-compose up"
    echo ""
    docker run -d \
        --name ${APP_NAME} \
        -p 3000:3000 \
        --env-file .env \
        ${APP_NAME}:${IMAGE_TAG}
    
    echo "✅ Container started. Check logs with: docker logs ${APP_NAME}"
    echo "   Health check: curl http://localhost:3000/health"
    echo "   Stop container: docker stop ${APP_NAME}"

elif [ "$DEPLOYMENT_TYPE" = "ecr" ]; then
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi

    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    if [ -z "$AWS_ACCOUNT_ID" ]; then
        echo "❌ Failed to get AWS account ID. Check your AWS credentials."
        exit 1
    fi

    ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    ECR_IMAGE="${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"

    echo ""
    echo "📦 Pushing to ECR..."
    echo "   Registry: ${ECR_REGISTRY}"
    echo "   Repository: ${ECR_REPOSITORY}"
    echo "   Tag: ${IMAGE_TAG}"
    echo ""

    # Create ECR repository if it doesn't exist
    aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} --region ${AWS_REGION} &>/dev/null || {
        echo "📝 Creating ECR repository..."
        aws ecr create-repository \
            --repository-name ${ECR_REPOSITORY} \
            --region ${AWS_REGION} \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256
    }

    # Login to ECR
    echo "🔐 Logging in to ECR..."
    aws ecr get-login-password --region ${AWS_REGION} | \
        docker login --username AWS --password-stdin ${ECR_REGISTRY}

    # Tag and push image
    docker tag ${APP_NAME}:${IMAGE_TAG} ${ECR_IMAGE}
    docker tag ${APP_NAME}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
    
    echo "📤 Pushing image to ECR..."
    docker push ${ECR_IMAGE}
    docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest

    echo ""
    echo "✅ Image pushed to ECR successfully!"
    echo "   Image URI: ${ECR_IMAGE}"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Deploy to ECS: Use the image URI in your ECS task definition"
    echo "   2. Deploy to Elastic Beanstalk: Use 'eb' deployment type"
    echo "   3. Deploy to ECS Fargate: Update your ECS service with the new image"

elif [ "$DEPLOYMENT_TYPE" = "eb" ]; then
    # Deploy to Elastic Beanstalk using Docker
    if ! command -v eb &> /dev/null; then
        echo "❌ EB CLI is not installed. Installing..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install awsebcli
        else
            pip install awsebcli
        fi
    fi

    # First, ensure image is pushed to ECR
    echo "📦 Ensuring image is in ECR..."
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
    if [ -z "$AWS_ACCOUNT_ID" ]; then
        echo "❌ Failed to get AWS account ID. Check your AWS credentials."
        exit 1
    fi

    ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    ECR_IMAGE="${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
    
    # Check if image exists in ECR, if not, build and push
    if ! aws ecr describe-images --repository-name ${ECR_REPOSITORY} --image-ids imageTag=${IMAGE_TAG} --region ${AWS_REGION} &>/dev/null; then
        echo "📤 Image not in ECR, building and pushing..."
        docker build -t ${APP_NAME}:${IMAGE_TAG} -t ${APP_NAME}:latest .
        aws ecr get-login-password --region ${AWS_REGION} | \
            docker login --username AWS --password-stdin ${ECR_REGISTRY}
        docker tag ${APP_NAME}:${IMAGE_TAG} ${ECR_IMAGE}
        docker tag ${APP_NAME}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
        docker push ${ECR_IMAGE}
        docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
    else
        echo "✅ Image already exists in ECR"
    fi

    # Create/update Dockerrun.aws.json with full ECR image URI
    echo "📝 Creating/updating Dockerrun.aws.json..."
    cat > Dockerrun.aws.json <<EOF
{
  "AWSEBDockerrunVersion": "1",
  "Image": {
    "Name": "${ECR_IMAGE}",
    "Update": "true"
  },
  "Ports": [
    {
      "ContainerPort": "3000"
    }
  ],
  "Environment": [
    {
      "Name": "NODE_ENV",
      "Value": "production"
    },
    {
      "Name": "PORT",
      "Value": "3000"
    }
  ]
}
EOF

    # Initialize EB if needed (without --non-interactive flag)
    if [ ! -d ".elasticbeanstalk" ]; then
        echo "📦 Initializing Elastic Beanstalk..."
        echo "   Note: This may prompt for interactive input"
        eb init "${APP_NAME}" \
            --platform "docker" \
            --region "${AWS_REGION}" || {
            echo "⚠️  EB init may require manual setup. Continuing..."
        }
    fi

    # Deploy
    echo "📤 Deploying to Elastic Beanstalk..."
    eb deploy "${ENVIRONMENT}"

    echo ""
    echo "✅ Deployed to Elastic Beanstalk!"
    eb status "${ENVIRONMENT}"

elif [ "$DEPLOYMENT_TYPE" = "ecs" ]; then
    echo "📋 ECS deployment requires:"
    echo "   1. ECS cluster and service already configured"
    echo "   2. Task definition updated with new image URI"
    echo "   3. Service updated to use new task definition"
    echo ""
    echo "   After pushing to ECR, update your ECS service:"
    echo "   aws ecs update-service --cluster <cluster-name> --service <service-name> --force-new-deployment"
    echo ""
    echo "   Or use the ECR image URI in your task definition:"
    echo "   ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"

else
    echo "❌ Unknown deployment type: ${DEPLOYMENT_TYPE}"
    echo "   Supported types: local, ecr, eb, ecs"
    exit 1
fi

cd ..

echo ""
echo "✅ Deployment completed!"
