#!/bin/bash

# Configuration
APP_ID="d38dd3tnbrw6vz"
REGION="eu-north-1" # Change if your app is in a different region

echo "AWS Amplify App Updater"
echo "-----------------------"
echo "App ID: $APP_ID"
echo ""

read -p "Enter your Main Backend API URL (e.g. https://api.jury-ai.com/api): " MAIN_API_URL
read -p "Enter your Chatbot Backend API URL (e.g. https://chatbot.jury-ai.com): " CHATBOT_API_URL
read -p "Enter your Contract Review API URL (e.g. https://contracts.jury-ai.com): " CONTRACT_API_URL

if [ -z "$MAIN_API_URL" ] || [ -z "$CHATBOT_API_URL" ] || [ -z "$CONTRACT_API_URL" ]; then
    echo "Error: All URLs must be provided!"
    exit 1
fi

echo ""
echo "Updating AWS Amplify App..."

# Use jq to safely construct the custom rules JSON string
CUSTOM_RULES=$(jq -n --arg main_url "$MAIN_API_URL" '
[
    {
        "source": "/api/<*>",
        "target": ($main_url + "/<*>"),
        "status": "200",
        "condition": null
    },
    {
        "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>",
        "target": "/index.html",
        "status": "200",
        "condition": null
    }
]
')

# Update Amplify App with env vars and custom rewrite rules
aws amplify update-app \
    --app-id "$APP_ID" \
    --region "$REGION" \
    --environment-variables "REACT_APP_API_URL=$MAIN_API_URL,REACT_APP_CHATBOT_API_URL=$CHATBOT_API_URL,REACT_APP_CONTRACT_REVIEW_API_URL=$CONTRACT_API_URL" \
    --custom-rules "$CUSTOM_RULES"

if [ $? -eq 0 ]; then
    echo "✅ Success! Amplify configuration updated."
    echo "You must trigger a new build in the Amplify Console for the environment variables to take effect in the frontend."
else
    echo "❌ Failed to update Amplify configuration. Check your AWS credentials and region."
fi
