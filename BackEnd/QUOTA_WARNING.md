# ⚠️ Important: Gemini API Quota Warning

## Issue

The Gemini API **free tier does NOT support image generation**. The image generation models (`gemini-2.5-flash-image` and `gemini-3-pro-image-preview`) require a **paid API plan**.

## Error Message

When using the free tier, you'll see errors like:
```
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count
limit: 0, model: gemini-2.5-flash-preview-image
```

This means the free tier has **0 quota** for image generation.

## Solutions

### Option 1: Upgrade to Paid Plan (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable billing for your project
3. Upgrade to a paid Gemini API plan
4. Image generation will then work

### Option 2: Use Text-Based Suggestions (Free Alternative)
Instead of generating images, you could:
- Generate detailed outfit descriptions in text
- Use the text model (`gemini-2.0-flash`) which is free
- Display outfit suggestions as text cards instead of images

### Option 3: Use Alternative Image Generation Service
- Use a different image generation API that has a free tier
- Examples: Stable Diffusion API, DALL-E API, etc.

## Current Status

The code is configured to:
- Generate 1 outfit image per user
- Handle quota errors gracefully
- Fall back to default suggestions if image generation fails

## Next Steps

1. **If you want to use Gemini image generation**: Upgrade your API plan
2. **If you want to stay on free tier**: Modify the code to use text-based suggestions instead
3. **Check your quota**: Visit https://ai.dev/rate-limit to see your current limits

## Security Note

⚠️ **IMPORTANT**: If you've shared your API key publicly, revoke it immediately and create a new one at:
https://aistudio.google.com/app/apikey
