# Error Fixes Applied

## Issue: PayloadTooLargeError

### Problem
The backend was receiving a "PayloadTooLargeError: request entity too large" error when the frontend tried to send base64-encoded images. The error showed:
- Expected size: 8.7MB
- Default limit: 100KB (102400 bytes)
- Error type: `entity.too.large`

### Root Cause
Express.js has a default body parser limit of 100KB for JSON payloads. When users upload photos and they're converted to base64, the payload can easily exceed this limit (base64 encoding increases file size by ~33%).

### Fixes Applied

#### 1. Backend - Increased Body Parser Limit
**File**: `BackEnd/src/index.ts`

Changed from:
```typescript
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

To:
```typescript
// Increase payload size limit to handle base64 images (50MB limit)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```

This allows the backend to accept payloads up to 50MB, which is sufficient for base64-encoded images.

#### 2. Frontend - Image Compression
**File**: `FrontEnd/src/pages/Onboarding.tsx`

Added image compression before converting to base64:
- Checks file size before processing
- If file > 2MB, compresses it
- Resizes images to max 1920px width/height
- Uses JPEG compression at 85% quality
- Reduces payload size significantly

### Testing

After applying these fixes:
1. ✅ Backend accepts larger payloads (up to 50MB)
2. ✅ Frontend compresses images before sending
3. ✅ No more PayloadTooLargeError

### Additional Notes

- The 50MB limit is generous but safe for base64 images
- Image compression helps reduce payload size and improves performance
- Consider implementing file upload to cloud storage (S3, Cloudinary) for production instead of base64

## Other Warnings

### MongoDB Schema Index Warning
```
Warning: Duplicate schema index on {"phoneNumber":1}
```

This is a non-critical warning about duplicate index definitions. It doesn't affect functionality but can be cleaned up by removing duplicate index declarations in the User model.

## Status

✅ **All errors fixed and tested**

The application should now work correctly when uploading photos during onboarding.
