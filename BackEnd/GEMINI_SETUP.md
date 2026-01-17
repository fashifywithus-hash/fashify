# Gemini Nano Banana API Setup

This guide explains how to set up Gemini's Nano Banana API for generating outfit suggestions.

## What is Nano Banana?

Nano Banana is Gemini's native image generation capability. It can generate images from text prompts, making it perfect for creating personalized outfit suggestions based on user preferences.

## Setup Instructions

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Add API Key to Environment Variables

Add the following to your `BackEnd/.env` file:

```env
GEMINI_API_KEY=your_api_key_here
```

### 3. How It Works

The integration:
- Takes user preferences (gender, body type, height, style preferences)
- Optionally uses the user's uploaded photo for personalized suggestions
- Generates 6 different outfit suggestions with various styles:
  - Casual everyday outfit
  - Smart casual for work
  - Weekend relaxed outfit
  - Evening social event outfit
  - Active/sporty casual outfit
  - Formal business casual outfit
- Returns base64-encoded images that are displayed in the frontend

### 4. API Endpoint

The integration uses:
- **Model**: `gemini-2.5-flash-image` (fast, efficient model)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`
- **Method**: POST
- **Authentication**: API key via `x-goog-api-key` header

### 5. Image Format

- **Aspect Ratio**: 3:4 (portrait, perfect for full-body outfit shots)
- **Output**: Base64-encoded images
- **Format**: JPEG/PNG (as returned by API)

## Features

- ✅ Generates personalized outfit images based on user data
- ✅ Uses user's photo for better personalization (optional)
- ✅ Multiple style variations
- ✅ Professional e-commerce style images
- ✅ Full-body outfit shots
- ✅ Automatic fallback to default suggestions if API fails

## Rate Limits

- Gemini API has rate limits based on your plan
- The code includes 2-second delays between requests to avoid rate limiting
- For production, consider implementing proper rate limiting and caching

## Cost Considerations

- Image generation uses tokens (see Gemini pricing)
- Each outfit image generation costs tokens
- Monitor your usage in Google AI Studio

## Troubleshooting

### API Key Not Working
- Verify the key is correct in `.env`
- Check that the key has proper permissions
- Ensure the key is not expired

### No Images Generated
- Check API key is set
- Verify network connectivity
- Check backend logs for error messages
- Ensure you have sufficient API quota

### Images Not Displaying
- Verify base64 encoding is correct
- Check image data URL format
- Ensure frontend can handle base64 images

## Documentation

Full documentation: https://ai.google.dev/gemini-api/docs/image-generation
