#!/bin/bash
# Tail all logs in real-time from CloudWatch
# Usage: ./tail-api-logs.sh [environment-name]

ENVIRONMENT=${1:-production}
REGION=${AWS_REGION:-us-east-1}
LOG_GROUP="/aws/elasticbeanstalk/$ENVIRONMENT/var/log/eb-docker/containers/eb-current-app/stdouterr.log"

echo "🔍 Tailing all logs from CloudWatch for: $ENVIRONMENT"
echo "📡 Log Group: $LOG_GROUP"
echo "Press Ctrl+C to stop"
echo "----------------------------------------"
echo ""

# Check if log group exists (using prefix search)
LOG_GROUPS=$(aws logs describe-log-groups \
    --log-group-name-prefix "/aws/elasticbeanstalk/$ENVIRONMENT/var/log/eb-docker" \
    --region $REGION \
    --query 'logGroups[*].logGroupName' \
    --output text 2>/dev/null)

# Check if our specific log group exists
LOG_GROUP_EXISTS=$(echo "$LOG_GROUPS" | grep -F "$LOG_GROUP" || echo "")

if [ -z "$LOG_GROUP_EXISTS" ]; then
    # Try to find any matching log group with stdouterr
    ALTERNATIVE_LOG_GROUP=$(echo "$LOG_GROUPS" | grep -i "stdouterr" | head -1)
    
    if [ -n "$ALTERNATIVE_LOG_GROUP" ]; then
        echo "⚠️  Using alternative log group: $ALTERNATIVE_LOG_GROUP"
        LOG_GROUP="$ALTERNATIVE_LOG_GROUP"
    else
        # Use the first available docker log group
        ALTERNATIVE_LOG_GROUP=$(echo "$LOG_GROUPS" | head -1)
        if [ -n "$ALTERNATIVE_LOG_GROUP" ]; then
            echo "⚠️  Using available log group: $ALTERNATIVE_LOG_GROUP"
            LOG_GROUP="$ALTERNATIVE_LOG_GROUP"
        else
            echo "❌ No Docker log groups found for environment: $ENVIRONMENT"
            echo ""
            echo "💡 Available log groups:"
            aws logs describe-log-groups \
                --log-group-name-prefix "/aws/elasticbeanstalk/$ENVIRONMENT" \
                --region $REGION \
                --query 'logGroups[*].logGroupName' \
                --output text 2>/dev/null | tr '\t' '\n' | head -10
            echo ""
            echo "💡 Make sure CloudWatch Logs are enabled:"
            echo "   ./enable-cloudwatch-logs.sh $ENVIRONMENT"
            exit 1
        fi
    fi
fi

echo "✅ Found log group. Tailing all logs in real-time..."
echo ""

# Tail the log group and show all logs
aws logs tail "$LOG_GROUP" \
    --follow \
    --region $REGION \
    --format short
