import axios from 'axios';
import https from 'https';
import { logger } from './logger';
import OpenAI from 'openai';

/**
 * API utility functions for Gemini Nano Banana (Image Generation) API
 * Documentation: https://ai.google.dev/gemini-api/docs/image-generation
 */

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-2.5-flash-image'; // Fast model for outfit generation
const GEMINI_TEXT_MODEL = 'gemini-2.0-flash-exp'; // Free text model for descriptions

// Virtual Try-On API Configuration
const VIRTUAL_TRY_ON_API_URL = 'https://us-central1-aiplatform.googleapis.com/v1/projects/fashify-484620/locations/us-central1/publishers/google/models/virtual-try-on-preview-08-04:predict';
const VIRTUAL_TRY_ON_API_KEY = 'AIzaSyBMaNJweJZPNW6qPeV2jD6aXdAEM-5D9k0';
const VIRTUAL_TRY_ON_ACCESS_TOKEN = process.env.VIRTUAL_TRY_ON_ACCESS_TOKEN || null; // Optional Bearer token

// OpenAI Configuration for DALL-E image generation
// Initialize lazily to ensure dotenv has loaded
let openaiClient: OpenAI | null = null;

const getOpenAIClient = (): OpenAI | null => {
  logger.debug('Getting OpenAI client', {
    alreadyInitialized: !!openaiClient
  }, 'API_UTIL');

  if (openaiClient) {
    logger.debug('Returning existing OpenAI client', null, 'API_UTIL');
    return openaiClient;
  }

  logger.info('Initializing OpenAI client', null, 'API_UTIL');
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  logger.debug('Checking OpenAI API key', {
    hasKey: !!openaiApiKey,
    keyLength: openaiApiKey ? openaiApiKey.length : 0,
    keyPrefix: openaiApiKey ? openaiApiKey.substring(0, 15) + '...' : 'N/A',
    isPlaceholder: openaiApiKey === 'your_openai_api_key_here',
    isEmpty: !openaiApiKey || openaiApiKey.trim() === ''
  }, 'API_UTIL');

  if (openaiApiKey && openaiApiKey !== 'your_openai_api_key_here' && openaiApiKey.trim() !== '') {
    try {
      logger.info('Creating OpenAI client instance', {
        keyLength: openaiApiKey.length,
        keyPrefix: openaiApiKey.substring(0, 10) + '...'
      }, 'API_UTIL');
      
      openaiClient = new OpenAI({
        apiKey: openaiApiKey.trim(),
      });
      
      logger.info('✅ OpenAI client initialized successfully', {
        keyPrefix: openaiApiKey.substring(0, 10) + '...',
        keyLength: openaiApiKey.length
      }, 'API_UTIL');
      return openaiClient;
    } catch (error: any) {
      logger.error('❌ Failed to initialize OpenAI client', {
        error: error.message,
        stack: error.stack
      }, 'API_UTIL');
      return null;
    }
  } else {
    logger.warn('⚠️ OpenAI API key not configured or invalid', {
      hasKey: !!openaiApiKey,
      isEmpty: !openaiApiKey || openaiApiKey.trim() === '',
      isPlaceholder: openaiApiKey === 'your_openai_api_key_here',
      keyValue: openaiApiKey ? openaiApiKey.substring(0, 20) + '...' : 'undefined'
    }, 'API_UTIL');
    return null;
  }
};

/**
 * Analyzes user photo using OpenAI Vision API to extract visual characteristics
 * This helps create more accurate outfit suggestions based on the user's appearance
 */
const analyzeUserPhotoForPrompt = async (userPicBase64?: string): Promise<string> => {
  if (!userPicBase64) {
    return '';
  }

  // Extract base64 data if it's a data URL
  let imageData = userPicBase64;
  if (imageData.startsWith('data:image/')) {
    imageData = imageData.split(',')[1];
  }

  // Try to use OpenAI Vision API to analyze the photo
  const client = getOpenAIClient();
  if (client) {
    try {
      logger.info('🔍 Analyzing user photo with OpenAI Vision API', {
        photoSize: `${(imageData.length / 1024).toFixed(2)}KB`
      }, 'API_UTIL');

      const response = await client.chat.completions.create({
        model: 'gpt-4o', // or 'gpt-4-vision-preview' for vision capabilities
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this full-body photo and describe the person\'s appearance in detail, focusing on: body type, height proportions, skin tone, hair color/length, current clothing style, and any distinctive features. Be specific but concise. This will be used to generate personalized outfit suggestions.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: userPicBase64.startsWith('data:') ? userPicBase64 : `data:image/jpeg;base64,${imageData}`
                }
              }
            ]
          }
        ],
        max_tokens: 200
      });

      if (response.choices?.[0]?.message?.content) {
        const analysis = response.choices[0].message.content;
        logger.info('✅ Photo analysis completed', {
          analysisLength: analysis.length,
          analysisPreview: analysis.substring(0, 100) + '...'
        }, 'API_UTIL');
        
        return `Based on the person's appearance: ${analysis}. The outfit should be personalized to match their body type, proportions, and natural features.`;
      }
    } catch (error: any) {
      logger.warn('⚠️ Failed to analyze photo with Vision API, using basic context', {
        error: error.message,
        code: error.code
      }, 'API_UTIL');
    }
  }

  // Fallback: Basic context without Vision API analysis
  logger.debug('Using basic photo context (Vision API not available or failed)', null, 'API_UTIL');
  return 'The outfit should be personalized to match the person\'s appearance, body type, and proportions shown in their photo.';
};

/**
 * Builds a prompt for outfit design (clothing only, no person)
 * Used for generating product images for Virtual Try-On
 */
const buildOutfitDesignPrompt = async (userInfo: {
  name?: string;
  gender?: string;
  bodyType?: string;
  height?: string;
  goToStyle?: string;
  userPic?: string;
}, styleVariant?: string): Promise<string> => {
  const bodyType = userInfo.bodyType ? ` for ${userInfo.bodyType} body type` : '';
  const height = userInfo.height ? `, suitable for ${userInfo.height} height` : '';

  // Map style preferences
  let styleDescription = '';
  if (userInfo.goToStyle) {
    const styleLower = userInfo.goToStyle.toLowerCase();
    if (styleLower.includes('casual') || styleLower.includes('relaxed')) {
      styleDescription = 'casual, comfortable, and effortlessly stylish';
    } else if (styleLower.includes('formal') || styleLower.includes('business')) {
      styleDescription = 'professional, polished, and sophisticated';
    } else if (styleLower.includes('sporty') || styleLower.includes('active')) {
      styleDescription = 'athletic, functional, and modern';
    } else if (styleLower.includes('elegant') || styleLower.includes('classic')) {
      styleDescription = 'timeless, refined, and elegant';
    } else {
      styleDescription = 'fashionable and well-coordinated';
    }
  } else {
    styleDescription = 'fashionable and well-coordinated';
  }

  // Get photo-based personalization
  const photoContext = await analyzeUserPhotoForPrompt(userInfo.userPic);

  let mainDescription = `A complete ${styleDescription} outfit${bodyType}${height}`;
  if (styleVariant) {
    mainDescription += ` styled for ${styleVariant.toLowerCase()}`;
  }
  mainDescription += '.';

  let prompt = `${mainDescription}

The outfit consists of:
- A stylish top or shirt designed${bodyType}
- A matching bottom piece (pants, skirt, or shorts) that complements the top
- Appropriate footwear that completes the look
- Subtle accessories that enhance the overall style

${photoContext ? photoContext + ' ' : ''}The outfit should be well-fitted and flattering for the intended body type and proportions.

Photography style:
- Professional product photography on a clean white background
- Flat lay or ghost mannequin style showing the complete outfit
- High resolution, sharp focus on clothing details
- Even lighting that shows fabric textures and colors clearly
- The clothing should be displayed in a way that shows how it would look when worn

The image should look like a high-quality fashion catalog product photo, with the outfit pieces clearly visible and well-arranged.`;

  return prompt;
};

/**
 * Builds an optimized prompt for outfit generation based on user information
 * Uses DALL-E best practices for fashion photography and outfit visualization
 * Now includes user photo context for personalized suggestions
 */
const buildOutfitPrompt = async (userInfo: {
  name?: string;
  gender?: string;
  bodyType?: string;
  height?: string;
  goToStyle?: string;
  userPic?: string;
}, styleVariant?: string): Promise<string> => {
  const gender = userInfo.gender || 'person';
  const bodyType = userInfo.bodyType ? ` with ${userInfo.bodyType} body type` : '';
  const height = userInfo.height ? `, height ${userInfo.height}` : '';
  const hasUserPhoto = !!userInfo.userPic;

  // Build detailed, descriptive prompt following DALL-E best practices
  // Use narrative description rather than keyword lists for better results
  // DALL-E works best with scene descriptions, not keyword lists
  
  // Map style preferences to more descriptive terms for better image generation
  let styleDescription = '';
  if (userInfo.goToStyle) {
    const styleLower = userInfo.goToStyle.toLowerCase();
    if (styleLower.includes('casual') || styleLower.includes('relaxed')) {
      styleDescription = 'casual, comfortable, and effortlessly stylish';
    } else if (styleLower.includes('formal') || styleLower.includes('business')) {
      styleDescription = 'professional, polished, and sophisticated';
    } else if (styleLower.includes('sporty') || styleLower.includes('active')) {
      styleDescription = 'athletic, functional, and modern';
    } else if (styleLower.includes('elegant') || styleLower.includes('classic')) {
      styleDescription = 'timeless, refined, and elegant';
    } else {
      styleDescription = 'fashionable and well-coordinated';
    }
  } else {
    styleDescription = 'fashionable and well-coordinated';
  }
  
  // Get photo-based personalization (async - uses Vision API if available)
  const photoContext = await analyzeUserPhotoForPrompt(userInfo.userPic);
  
  // Build the main description with style variant if provided
  let mainDescription = `A professional full-body fashion photograph of a ${gender}${bodyType}${height} wearing a ${styleDescription} outfit`;
  
  if (styleVariant) {
    mainDescription += ` styled for ${styleVariant.toLowerCase()}`;
  }
  
  mainDescription += '.';
  
  // Build personalized prompt
  let prompt = `${mainDescription}

The person is wearing a complete, well-coordinated outfit that includes a stylish top or shirt that fits their body type perfectly, a matching bottom piece (pants, skirt, or shorts) that complements the top, appropriate footwear that completes the look, and subtle accessories that enhance the overall style.`;

  // Add photo-based personalization if user provided a photo
  if (hasUserPhoto) {
    prompt += `\n\n${photoContext} The outfit should complement their natural features, body proportions, and personal style as shown in their reference photo.`;
    logger.debug('Including user photo context in prompt', {
      photoSize: userInfo.userPic ? `${(userInfo.userPic.length / 1024).toFixed(2)}KB` : 'N/A'
    }, 'API_UTIL');
  }

  prompt += `

The photograph is taken in a professional studio setting with a clean, neutral background (white or light gray). The lighting is soft and even, highlighting the clothing details and textures. The image is a full-body shot from head to toe, captured with a slightly elevated camera angle to show the complete outfit clearly. The person stands in a natural, confident pose${hasUserPhoto ? ', matching the pose and proportions from their reference photo' : ''}.

The outfit features a modern and fashionable design with a well-coordinated color palette. The fit is appropriate for the body type, and the overall aesthetic is professional yet approachable. The clothing has clean lines and quality fabrics that are clearly visible in the photograph.

The final image should look like a high-quality fashion catalog or e-commerce product photo, with the outfit being the clear focal point. The style is ${styleDescription}, making it suitable for everyday wear while maintaining a polished appearance.`;

  return prompt;
};

/**
 * Generates outfit using Virtual Try-On API
 * This API requires a person image and product images to try on
 * Reference: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/virtual-try-on-api
 * 
 * @param personImageBase64 - Base64 encoded person image (full body photo)
 * @param productImagesBase64 - Array of base64 encoded product images (clothing items)
 * @returns Base64 encoded image data URL or null if failed
 */
export const generateVirtualTryOn = async (
  personImageBase64: string,
  productImagesBase64: string[] = []
): Promise<string | null> => {
  try {
    // Virtual Try-On API requires OAuth2 Bearer token, not API key
    const accessToken = VIRTUAL_TRY_ON_ACCESS_TOKEN;
    if (!accessToken) {
      logger.warn('⚠️ Virtual Try-On requires VIRTUAL_TRY_ON_ACCESS_TOKEN (OAuth2 Bearer token), but none provided', null, 'API_UTIL');
      logger.warn('Please set VIRTUAL_TRY_ON_ACCESS_TOKEN in your .env file', null, 'API_UTIL');
      logger.warn('To get the token:', null, 'API_UTIL');
      logger.warn('  1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install', null, 'API_UTIL');
      logger.warn('  2. Run: gcloud auth application-default login', null, 'API_UTIL');
      logger.warn('  3. Run: gcloud auth print-access-token', null, 'API_UTIL');
      logger.warn('  4. Copy the token and add to .env: VIRTUAL_TRY_ON_ACCESS_TOKEN=<token>', null, 'API_UTIL');
      logger.warn('  Note: Token expires after 1 hour. For production, use service account.', null, 'API_UTIL');
      return null;
    }

    // Extract base64 data if it's a data URL
    let personImageData = personImageBase64;
    if (personImageData.startsWith('data:image/')) {
      personImageData = personImageData.split(',')[1];
    }

    // If no product images provided, we can't use virtual try-on
    if (productImagesBase64.length === 0) {
      logger.warn('Virtual Try-On requires product images, but none provided', null, 'API_UTIL');
      return null;
    }

    // Prepare product images
    const productImages = productImagesBase64.map(img => {
      let imgData = img;
      if (imgData.startsWith('data:image/')) {
        imgData = imgData.split(',')[1];
      }
      return {
        image: {
          bytesBase64Encoded: imgData
        }
      };
    });

    // Request payload matching the reference curl format
    const requestPayload = {
      instances: [
        {
          personImage: {
            image: {
              bytesBase64Encoded: personImageData
            }
          },
          productImages: productImages
        }
      ],
      parameters: {
        sampleCount: 1,
        personGeneration: 'allow_adult' // As per reference curl
      }
    };

    const httpsAgent = new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    });

    // Prepare headers with OAuth2 Bearer token (required)
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };

    // Note: API key in URL is optional for Virtual Try-On, but we include it if available
    const apiUrl = VIRTUAL_TRY_ON_API_KEY 
      ? `${VIRTUAL_TRY_ON_API_URL}?key=${VIRTUAL_TRY_ON_API_KEY}`
      : VIRTUAL_TRY_ON_API_URL;

    logger.info('🔄 Calling Virtual Try-On API', {
      hasAccessToken: !!accessToken,
      hasApiKey: !!VIRTUAL_TRY_ON_API_KEY,
      personImageSize: `${(personImageData.length / 1024).toFixed(2)}KB`,
      productImageCount: productImages.length
    }, 'API_UTIL');

    const response = await axios.post(
      apiUrl,
      requestPayload,
      {
        headers: headers,
        timeout: 120000, // 120 seconds timeout for virtual try-on
        httpsAgent: httpsAgent
      }
    );

    // Extract image from response
    if (response.data?.predictions?.[0]?.bytesBase64Encoded) {
      const mimeType = response.data.predictions[0].mimeType || 'image/png';
      const imageDataUrl = `data:${mimeType};base64,${response.data.predictions[0].bytesBase64Encoded}`;
      logger.info('Virtual Try-On generated successfully', {
        mimeType,
        imageSize: `${(imageDataUrl.length / 1024).toFixed(2)}KB`
      }, 'API_UTIL');
      return imageDataUrl;
    }

    logger.warn('Virtual Try-On response missing image data', {
      responseKeys: Object.keys(response.data || {})
    }, 'API_UTIL');
    return null;
  } catch (error: any) {
    logger.error('Failed to generate virtual try-on', {
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    }, 'API_UTIL');
    return null;
  }
};

/**
 * Generates a single outfit image using Gemini Nano Banana API
 * Includes retry logic with exponential backoff for rate limiting
 */
const generateSingleOutfit = async (
  apiKey: string,
  prompt: string,
  userPicBase64?: string,
  retryCount: number = 0,
  maxRetries: number = 1
): Promise<string | null> => {
  try {
    const requestPayload: any = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '3:4' // Portrait orientation for full-body outfits
        }
      }
    };

    // If user has a photo, include it for personalized suggestions
    if (userPicBase64) {
      // Extract base64 data if it's a data URL
      let imageData = userPicBase64;
      if (imageData.startsWith('data:image/')) {
        imageData = imageData.split(',')[1];
      }

      requestPayload.contents[0].parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: imageData
        }
      });
    }

    // Create HTTPS agent - allow self-signed certs in development only
    // In production, this should be set to true for security
    const httpsAgent = new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    });

    const response = await axios.post(
      `${GEMINI_API_BASE_URL}/models/${GEMINI_MODEL}:generateContent`,
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        timeout: 60000, // 60 seconds timeout
        httpsAgent: httpsAgent
      }
    );

    // Extract image from response
    if (response.data?.candidates?.[0]?.content?.parts) {
      for (const part of response.data.candidates[0].content.parts) {
        if (part.inline_data && part.inline_data.mime_type?.startsWith('image/')) {
          // Convert base64 to data URL
          const imageDataUrl = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
          return imageDataUrl;
        }
      }
    }

    return null;
  } catch (error: any) {
    const status = error.response?.status;
    const statusCode = error.response?.status || error.response?.data?.error?.code;
    const isRateLimit = status === 429 || statusCode === 429;
    const isQuotaExceeded = statusCode === 429 && error.response?.data?.error?.status === 'RESOURCE_EXHAUSTED';
    const isRetryable = isRateLimit && retryCount < maxRetries && !isQuotaExceeded;

    if (isRetryable) {
      // Check for Retry-After header (in seconds) or use exponential backoff
      const retryAfterHeader = error.response?.headers?.['retry-after'];
      let backoffDelay: number;
      
      if (retryAfterHeader) {
        // Use the server's suggested retry time (convert seconds to milliseconds)
        backoffDelay = parseInt(retryAfterHeader, 10) * 1000;
        logger.warn(`Rate limited, server suggests retry after ${retryAfterHeader}s`, {
          retryCount: retryCount + 1,
          maxRetries,
          status,
          retryAfter: retryAfterHeader,
        }, 'API_UTIL');
      } else {
        // Exponential backoff with longer delays: 10s, 20s, 40s
        backoffDelay = Math.pow(2, retryCount) * 10000;
        logger.warn(`Rate limited, retrying after ${backoffDelay/1000}s`, {
          retryCount: retryCount + 1,
          maxRetries,
          status,
        }, 'API_UTIL');
      }
      
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      return generateSingleOutfit(apiKey, prompt, userPicBase64, retryCount + 1, maxRetries);
    }

    // Check if it's a quota exceeded error (free tier doesn't support image generation)
    if (isQuotaExceeded) {
      logger.error('Quota exceeded - Free tier does not support image generation. Please upgrade your API plan.', {
        error: error.response?.data?.error?.message,
        status: statusCode,
      }, 'API_UTIL');
    } else {
      logger.warn('Failed to generate single outfit', {
        error: error.message,
        status: status || statusCode,
        retryCount,
        isRateLimit,
        retryAfter: error.response?.headers?.['retry-after'] || error.response?.data?.error?.details?.[0]?.retryDelay,
      }, 'API_UTIL');
    }
    return null;
  }
};

/**
 * Generates text-based outfit description using free Gemini text model
 * This is a fallback when image generation is not available (free tier)
 */
const generateTextOutfitDescription = async (
  apiKey: string,
  userInfo: {
    name?: string;
    gender?: string;
    bodyType?: string;
    height?: string;
    goToStyle?: string;
  }
): Promise<string | null> => {
  try {
    const prompt = `Create a detailed outfit description for a ${userInfo.gender || 'person'}${userInfo.bodyType ? ` with ${userInfo.bodyType} body type` : ''}${userInfo.height ? `, height ${userInfo.height}` : ''}${userInfo.goToStyle ? `, preferred style: ${userInfo.goToStyle}` : ''}.

Generate a complete, stylish casual everyday outfit description that includes:
- Specific top/shirt details (color, style, fabric)
- Bottom details (pants/skirt/shorts - color, style, fit)
- Shoe recommendations (type, color, style)
- Optional accessories (if any)

Make it specific and actionable. Format as a clear, concise description suitable for a fashion app.`;

    const httpsAgent = new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    });

    const response = await axios.post(
      `${GEMINI_API_BASE_URL}/models/${GEMINI_TEXT_MODEL}:generateContent`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        timeout: 30000,
        httpsAgent: httpsAgent
      }
    );

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.data.candidates[0].content.parts[0].text;
    }
    return null;
  } catch (error: any) {
    logger.warn('Failed to generate text outfit description', {
      error: error.message,
      status: error.response?.status,
    }, 'API_UTIL');
    return null;
  }
};

/**
 * Returns default wardrobe suggestions when API is unavailable
 */
const getDefaultWardrobe = (): {
  title: string;
  description: string;
  wardrobe: Array<{ image: string }>;
} => {
  return {
    title: 'Suggested Wardrobe',
    description: 'Based on your personal information, we have suggested a wardrobe for you',
    wardrobe: []
  };
};

/**
 * Generates outfit image using OpenAI DALL-E
 * @param prompt - Text prompt describing the outfit (includes user photo context if provided)
 * @param userPicBase64 - Optional user photo (used to enhance prompt personalization)
 * @returns Base64 encoded image data URL or null if failed
 * 
 * Note: DALL-E 3 doesn't support direct image input, but we use the photo
 * to create a more personalized prompt that describes the user's appearance
 */
const generateDalleImage = async (prompt: string, userPicBase64?: string): Promise<string | null> => {
  logger.info('🎨 Starting DALL-E image generation', {
    promptLength: prompt.length,
    promptPreview: prompt.substring(0, 100) + '...',
    hasUserPhoto: !!userPicBase64,
    photoSize: userPicBase64 ? `${(userPicBase64.length / 1024).toFixed(2)}KB` : 'N/A'
  }, 'API_UTIL');

  try {
    const client = getOpenAIClient();
    if (!client) {
      logger.error('❌ OpenAI client not available, cannot generate image', {
        reason: 'OPENAI_API_KEY not set or invalid'
      }, 'API_UTIL');
      return null;
    }

    logger.info('📤 Sending request to DALL-E API', {
      model: 'dall-e-3',
      size: '1024x1024',
      promptLength: prompt.length
    }, 'API_UTIL');

    const startTime = Date.now();
    // DALL-E 3 parameters optimized for fashion photography
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024', // Square format works well for full-body shots
      quality: 'standard', // 'standard' or 'hd' - using standard for faster generation
      response_format: 'b64_json', // Get base64 response
    });

    const duration = Date.now() - startTime;
    logger.info('📥 Received response from DALL-E API', {
      duration: `${duration}ms`,
      hasData: !!response.data,
      dataLength: response.data?.length || 0
    }, 'API_UTIL');

    if (response.data && response.data[0]?.b64_json) {
      const imageSize = response.data[0].b64_json.length;
      const imageDataUrl = `data:image/png;base64,${response.data[0].b64_json}`;
      
      logger.info('✅ DALL-E image generated successfully', {
        imageSize: `${(imageSize / 1024).toFixed(2)}KB`,
        imageSizeBytes: imageSize,
        duration: `${duration}ms`,
        dataUrlLength: imageDataUrl.length
      }, 'API_UTIL');
      
      return imageDataUrl;
    }

    logger.warn('⚠️ DALL-E response missing image data', {
      hasResponse: !!response,
      hasData: !!response.data,
      dataLength: response.data?.length || 0,
      firstItem: response.data?.[0] ? Object.keys(response.data[0]) : []
    }, 'API_UTIL');
    return null;
  } catch (error: any) {
    logger.error('❌ Failed to generate DALL-E image', {
      error: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      response: error.response?.data,
      stack: error.stack?.substring(0, 200)
    }, 'API_UTIL');
    return null;
  }
};

/**
 * Generates outfit images using Gemini Nano Banana API
 * @param userInfo - User personal information including user picture
 * @returns Promise resolving to wardrobe suggestions with generated images
 */
export const getOutfitSuggestions = async (userInfo: {
  name?: string;
  gender?: string;
  location?: string;
  bodyType?: string;
  height?: string;
  goToStyle?: string;
  userPic?: string;
}): Promise<{
  title: string;
  description: string;
  wardrobe: Array<{ image: string }>;
}> => {
  logger.info('🚀 Starting outfit suggestions generation', {
    userName: userInfo.name,
    gender: userInfo.gender,
    bodyType: userInfo.bodyType,
    height: userInfo.height,
    style: userInfo.goToStyle,
    hasPhoto: !!userInfo.userPic,
    photoSize: userInfo.userPic ? `${(userInfo.userPic.length / 1024).toFixed(2)}KB` : 'N/A',
  }, 'API_UTIL');

  try {
    // Check if OpenAI is configured (primary method)
    logger.debug('Checking OpenAI configuration', null, 'API_UTIL');
    const openaiClientInstance = getOpenAIClient();
    if (!openaiClientInstance) {
      logger.warn('⚠️ OpenAI not configured, OPENAI_API_KEY required for image generation', null, 'API_UTIL');
      logger.warn('Please add OPENAI_API_KEY to your .env file', null, 'API_UTIL');
    } else {
      logger.info('✅ OpenAI client available for image generation', null, 'API_UTIL');
    }
    
    const apiKey = process.env.GEMINI_API_KEY; // For fallback text descriptions only
    logger.debug('Checking Gemini API key for fallback', {
      hasGeminiKey: !!apiKey,
      geminiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'N/A'
    }, 'API_UTIL');

    logger.service('APIUtil', 'Generating outfit suggestions with OpenAI DALL-E', {
      hasPhoto: !!userInfo.userPic,
      photoSize: userInfo.userPic ? `${(userInfo.userPic.length / 1024).toFixed(2)}KB` : 'N/A',
      gender: userInfo.gender,
      bodyType: userInfo.bodyType,
      style: userInfo.goToStyle,
      hasOpenAI: !!openaiClientInstance,
      hasGemini: !!apiKey
    });

    // Prepare base64 image data if available
    let userPicBase64: string | undefined;
    if (userInfo.userPic) {
      userPicBase64 = userInfo.userPic.startsWith('data:image/')
        ? userInfo.userPic
        : `data:image/jpeg;base64,${userInfo.userPic}`;
    }

    // Generate outfit suggestions
    // Note: Gemini API free tier has very strict rate limits (often 1 request per minute)
    // Generating just 1 outfit to minimize rate limit issues
    const styleVariants = [
      'Casual everyday outfit'
    ];
    
    const wardrobe: Array<{ image: string }> = [];

    // If user has a photo, use Virtual Try-On API to show them wearing the outfit
    // Strategy: Generate outfit design image first, then use it as product image for virtual try-on
    if (userPicBase64) {
      logger.info('👤 User has photo - will use Virtual Try-On to show them wearing the outfit', {
        photoSize: `${(userPicBase64.length / 1024).toFixed(2)}KB`
      }, 'API_UTIL');

      try {
        // Step 1: Generate outfit design image using DALL-E (this will be our "product" image)
        const dalleClient = getOpenAIClient();
        if (dalleClient) {
          logger.info('🎨 Step 1: Generating outfit design with DALL-E', null, 'API_UTIL');
          
          // Build prompt for outfit design (just the clothing, no person)
          const outfitDesignPrompt = await buildOutfitDesignPrompt(userInfo, styleVariants[0]);
          
          const outfitImage = await generateDalleImage(outfitDesignPrompt);
          
          if (outfitImage) {
            logger.info('✅ Outfit design generated, proceeding to Virtual Try-On', {
              outfitImageSize: `${(outfitImage.length / 1024).toFixed(2)}KB`
            }, 'API_UTIL');

            // Step 2: Use Virtual Try-On to show user wearing the outfit
            logger.info('👔 Step 2: Using Virtual Try-On to show user wearing the outfit', null, 'API_UTIL');
            
            const tryOnResult = await generateVirtualTryOn(userPicBase64, [outfitImage]);
            
            if (tryOnResult) {
              wardrobe.push({ image: tryOnResult });
              logger.info('✅ Virtual Try-On successful - user can see themselves wearing the outfit!', {
                imageSize: `${(tryOnResult.length / 1024).toFixed(2)}KB`
              }, 'API_UTIL');
            } else {
              logger.warn('⚠️ Virtual Try-On failed, falling back to generated outfit image', null, 'API_UTIL');
              // Fallback: Use the generated outfit image directly
              wardrobe.push({ image: outfitImage });
            }
          } else {
            logger.warn('⚠️ Failed to generate outfit design, will try direct generation', null, 'API_UTIL');
          }
        }
      } catch (error: any) {
        logger.error('❌ Error in Virtual Try-On flow', {
          error: error.message,
          stack: error.stack?.substring(0, 300)
        }, 'API_UTIL');
        // Continue to fallback methods below
      }
    }

    // If Virtual Try-On wasn't used (no user photo or it failed), generate outfit directly
    // Use OpenAI DALL-E for image generation (primary method)
    logger.info('🎯 Attempting image generation with DALL-E', {
      style: styleVariants[0],
      totalStyles: styleVariants.length
    }, 'API_UTIL');

    const dalleClient = getOpenAIClient();
    if (!dalleClient) {
      logger.warn('⚠️ OpenAI client not available, OPENAI_API_KEY not set or invalid', null, 'API_UTIL');
      logger.warn('Skipping DALL-E generation, will try fallback methods', null, 'API_UTIL');
    } else {
      try {
        logger.info('📝 Building outfit prompt', {
          style: styleVariants[0],
          userInfo: {
            gender: userInfo.gender,
            bodyType: userInfo.bodyType,
            height: userInfo.height,
            style: userInfo.goToStyle,
            hasPhoto: !!userPicBase64
          }
        }, 'API_UTIL');

        // Build prompt with user photo context (async - may use Vision API)
        const prompt = await buildOutfitPrompt({
          ...userInfo,
          userPic: userPicBase64
        }, styleVariants[0]);
        logger.debug('Generated prompt', {
          promptLength: prompt.length,
          promptPreview: prompt.substring(0, 150) + '...'
        }, 'API_UTIL');
        
        logger.info('🔄 Calling DALL-E image generation', {
          promptLength: prompt.length,
          hasUserPhoto: !!userPicBase64
        }, 'API_UTIL');
        
        const dalleImage = await generateDalleImage(prompt, userPicBase64);
        if (dalleImage) {
          wardrobe.push({ image: dalleImage });
          logger.info('✅ Successfully added DALL-E generated outfit to wardrobe', {
            imageSize: `${(dalleImage.length / 1024).toFixed(2)}KB`,
            wardrobeCount: wardrobe.length
          }, 'API_UTIL');
        } else {
          logger.warn('⚠️ DALL-E did not return an image, will try fallback', null, 'API_UTIL');
        }
      } catch (error: any) {
        logger.error('❌ DALL-E generation failed with exception', {
          error: error.message,
          status: error.status,
          code: error.code,
          type: error.type,
          stack: error.stack?.substring(0, 300)
        }, 'API_UTIL');
      }
    }

    // If image generation failed, try text-based fallback (using Gemini text model)
    if (wardrobe.length === 0) {
      logger.warn('⚠️ No images generated, attempting text-based fallback', {
        wardrobeCount: wardrobe.length,
        hasGeminiKey: !!apiKey
      }, 'API_UTIL');
      
      if (apiKey) {
        logger.info('📝 Trying Gemini text model for outfit description', null, 'API_UTIL');
        try {
          const textDescription = await generateTextOutfitDescription(apiKey, userInfo);
          
          if (textDescription) {
            logger.info('✅ Generated text-based outfit description', { 
              descriptionLength: textDescription.length,
              descriptionPreview: textDescription.substring(0, 100) + '...'
            }, 'API_UTIL');
            
            // Return text description in a format that can be displayed
            // Note: Frontend may need updates to display text descriptions
            return {
              title: 'Your Personalized Outfit Suggestion',
              description: textDescription,
              wardrobe: [] // Empty wardrobe since we have text description instead
            };
          } else {
            logger.warn('⚠️ Gemini text model did not return description', null, 'API_UTIL');
          }
        } catch (error: any) {
          logger.error('❌ Text-based fallback also failed', { 
            error: error.message,
            status: error.response?.status
          }, 'API_UTIL');
        }
      } else {
        logger.warn('⚠️ No Gemini API key available for text fallback', null, 'API_UTIL');
      }
      
      logger.warn('⚠️ No outfits generated, returning default suggestions', {
        triedDalle: !!dalleClient,
        triedGemini: !!apiKey,
        wardrobeCount: wardrobe.length
      }, 'API_UTIL');
      return getDefaultWardrobe();
    }

    logger.service('APIUtil', '✅ Outfit generation completed successfully', {
      wardrobeItems: wardrobe.length,
      method: wardrobe.length > 0 ? 'DALL-E' : 'None',
      userName: userInfo.name
    });

    const result = {
      title: 'Your Personalized Outfit Suggestions',
      description: `Based on your preferences${userInfo.name ? `, ${userInfo.name}` : ''}, we've generated ${wardrobe.length} outfit suggestion${wardrobe.length !== 1 ? 's' : ''} tailored just for you.`,
      wardrobe
    };

    logger.info('📦 Returning outfit suggestions result', {
      title: result.title,
      descriptionLength: result.description.length,
      wardrobeCount: result.wardrobe.length,
      hasImages: result.wardrobe.length > 0
    }, 'API_UTIL');

    return result;
  } catch (error: any) {
    logger.error('❌ Error generating outfit suggestions', {
      error: error.message,
      status: error.status || error.response?.status,
      statusText: error.response?.statusText,
      code: error.code,
      type: error.type,
      data: error.response?.data,
      stack: error.stack?.substring(0, 400)
    }, 'API_UTIL');
    
    logger.warn('⚠️ Returning default wardrobe due to error', null, 'API_UTIL');
    // Return default response if API call fails
    return getDefaultWardrobe();
  }
};
