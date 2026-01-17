# Gemini API Rate Limits

## Current Configuration

The integration is configured to handle Gemini API rate limits, which can be very strict on the free tier.

### Free Tier Limits
- **Typical limit**: 1 request per 60 seconds
- **Daily quota**: Varies by account
- **Concurrent requests**: Usually not allowed

### Current Implementation

1. **Retry Logic**: Automatically retries up to 3 times with exponential backoff (10s, 20s, 40s)
2. **Request Delays**: 60 seconds between outfit generation requests
3. **Outfit Count**: Generates 2 outfits per user (reduced from 6 to avoid rate limits)
4. **Rate Limit Detection**: Stops generating more outfits if rate limited on first attempt

### Improving Rate Limit Handling

#### Option 1: Upgrade API Plan
- Upgrade to a paid Gemini API plan for higher rate limits
- Check your current limits at: https://aistudio.google.com/app/apikey

#### Option 2: Reduce Outfit Count
- Currently generates 2 outfits
- Can reduce to 1 outfit for faster response times
- Edit `styleVariants` array in `src/utils/api.util.ts`

#### Option 3: Implement Queue System
- Queue outfit generation requests
- Process them sequentially with proper delays
- Better for handling multiple users

#### Option 4: Generate On-Demand
- Generate outfits one at a time as user requests them
- Instead of generating all at once during onboarding
- Better user experience and respects rate limits

### Configuration

To adjust rate limit handling, edit `src/utils/api.util.ts`:

```typescript
// Change delay between requests (in milliseconds)
const delay = 60000; // 60 seconds (free tier)
// const delay = 10000; // 10 seconds (paid tier)

// Change number of outfits
const styleVariants = [
  'Casual everyday outfit',
  'Smart casual for work or meetings'
  // Add more styles if you have higher rate limits
];
```

### Monitoring

Check backend logs for rate limit warnings:
```
[API_UTIL] Rate limited, retrying after 10s
[API_UTIL] Rate limited, stopping outfit generation
```

### Best Practices

1. **Test with your API key** to understand your specific rate limits
2. **Monitor usage** in Google AI Studio dashboard
3. **Implement caching** to avoid regenerating outfits for same user
4. **Consider async processing** - generate outfits in background and notify user when ready
