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
  logger.info('Getting OpenAI client', {
    alreadyInitialized: !!openaiClient
  }, 'API_UTIL');

  if (openaiClient) {
    logger.info('Returning existing OpenAI client', null, 'API_UTIL');
    return openaiClient;
  }

  logger.info('Initializing OpenAI client', null, 'API_UTIL');
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  logger.info('Checking OpenAI API key', {
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
    logger.info('⚠️ OpenAI API key not configured or invalid', {
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
                text: 'Analyze this full-body photo in EXTREME DETAIL. You are describing this person so accurately that an AI image generator can recreate them exactly. Include: 1) EXACT body type and build (slim/thin, athletic/muscular, curvy/hourglass, plus-size, petite, tall, etc.), 2) Precise body proportions (shoulder width relative to hips, waist-to-hip ratio, leg length relative to torso, arm length, etc.), 3) Height/build estimate (short/petite, average, tall, etc.), 4) Skin tone (very specific - light/medium/dark with undertones if visible), 5) Hair details (exact color, length, texture, style - straight/curly/wavy, bangs, etc.), 6) Facial features (face shape - round/oval/square/heart, eye color if visible, distinctive features), 7) Current pose and stance (how they are standing, arm position, etc.), 8) Any distinctive physical characteristics (tattoos, piercings, etc. if visible). Be EXTREMELY specific and detailed - this description will be used to generate an outfit image showing THIS EXACT SAME PERSON. The AI must be able to recreate this person\'s appearance precisely from your description.'
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
        max_tokens: 600 // Increased significantly for extremely detailed analysis
      });

      if (response.choices?.[0]?.message?.content) {
        const analysis = response.choices[0].message.content;
        logger.info('✅ Photo analysis completed', {
          analysisLength: analysis.length,
          analysisPreview: analysis.substring(0, 100) + '...'
        }, 'API_UTIL');
        
        return `CRITICAL: The generated image MUST show THIS EXACT PERSON from the reference photo. Person appearance details: ${analysis}. The generated outfit image must preserve ALL of these characteristics: exact same body type, body proportions, height/build, skin tone, hair color and style, facial features, and physical appearance. This is the SAME person, just wearing different clothes.`;
      }
    } catch (error: any) {
      logger.info('⚠️ Failed to analyze photo with Vision API, using basic context', {
        error: error.message,
        code: error.code
      }, 'API_UTIL');
    }
  }

  // Fallback: Basic context without Vision API analysis
  logger.info('Using basic photo context (Vision API not available or failed)', null, 'API_UTIL');
  return 'CRITICAL: Generate the outfit on the EXACT SAME PERSON from the reference photo. The generated image must show this specific person wearing the suggested outfit, preserving their exact body type, proportions, height, build, skin tone, hair, facial features, and all physical characteristics. This is the same person, just with new clothes.';
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
  
  // Build comprehensive prompt incorporating all user personal info
  let prompt = '';
  
  if (hasUserPhoto) {
    // When user has a photo - generate outfit ON that specific person
    prompt = `Generate a professional full-body fashion photograph showing the EXACT SAME PERSON from the user's uploaded reference photo. 

PERSON DETAILS FROM REFERENCE PHOTO:
${photoContext}

USER PREFERENCES FOR OUTFIT:
- Gender: ${gender}
- Body Type: ${bodyType || 'standard'}
- Height: ${height || 'average'}
- Style Preference: ${styleDescription}

OUTFIT REQUIREMENTS:
The person is wearing a complete, well-coordinated ${styleDescription} outfit that includes:
- A stylish top or shirt that fits their ${bodyType || 'body type'} perfectly
- A matching bottom piece (pants, skirt, or shorts) that complements the top and suits their ${height || 'height'} and proportions
- Appropriate footwear that completes the look
- Subtle accessories that enhance the overall ${styleDescription} style

CRITICAL REQUIREMENTS - THE PERSON MUST BE IDENTICAL:
- The person in the generated image MUST be the EXACT SAME person from the user's uploaded photo
- Preserve their EXACT body type, body proportions, height, build, and physical frame
- Match their EXACT skin tone, hair color, hair style, and facial features
- Maintain their same pose, stance, and body positioning
- The outfit should be shown on THIS SPECIFIC PERSON, not a generic model or different person
- The generated image should look like the user's photo but with the new ${styleDescription} outfit
- The clothing should fit their body type (${bodyType || 'standard'}) and height (${height || 'average'}) perfectly`;
    
    logger.info('Including user photo context in prompt - generating outfit ON user photo', {
      photoSize: userInfo.userPic ? `${(userInfo.userPic.length / 1024).toFixed(2)}KB` : 'N/A',
      gender,
      bodyType,
      height,
      style: styleDescription
    }, 'API_UTIL');
  } else {
    // No photo - generate based on personal info only
    prompt = `A professional full-body fashion photograph of a ${gender}${bodyType}${height} wearing a ${styleDescription} outfit.

The person is wearing a complete, well-coordinated outfit that includes:
- A stylish top or shirt that fits their ${bodyType || 'body type'} perfectly
- A matching bottom piece (pants, skirt, or shorts) that complements the top and suits their ${height || 'height'}
- Appropriate footwear that completes the look
- Subtle accessories that enhance the overall ${styleDescription} style

The outfit should be designed specifically for:
- Body Type: ${bodyType || 'standard'}
- Height: ${height || 'average'}
- Style: ${styleDescription}`;
  }
  
  if (styleVariant) {
    prompt += `\n\nStyle variant: ${styleVariant.toLowerCase()}`;
  }

  prompt += `

PHOTOGRAPHY STYLE:
- Professional studio setting with clean, neutral background (white or light gray)
- Soft, even lighting highlighting clothing details and textures
- Full-body shot from head to toe
- Slightly elevated camera angle showing the complete outfit clearly
${hasUserPhoto ? '- Person stands in the SAME pose and stance as their reference photo' : '- Person stands in a natural, confident pose'}

OUTFIT DESIGN:
- Modern and fashionable design with well-coordinated color palette
- Perfect fit for ${bodyType || 'their'} body type
- Appropriate for ${height || 'their'} height and proportions
- Professional yet approachable aesthetic
- Clean lines and quality fabrics clearly visible
- Style: ${styleDescription}, suitable for everyday wear while maintaining a polished appearance

FINAL IMAGE QUALITY:
- High-quality fashion catalog or e-commerce product photo
- Outfit is the clear focal point
- Professional photography standards
${hasUserPhoto ? '- The person must be recognizable as the SAME person from the reference photo' : ''}`;

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
      logger.info('ℹ️ Virtual Try-On not available (VIRTUAL_TRY_ON_ACCESS_TOKEN not set). Falling back to direct outfit generation.', {
        setupInstructions: 'To enable: 1) Install gcloud SDK, 2) Run: gcloud auth application-default login, 3) Run: gcloud auth print-access-token, 4) Add token to .env as VIRTUAL_TRY_ON_ACCESS_TOKEN'
      }, 'API_UTIL');
      return null;
    }

    // Extract base64 data if it's a data URL
    let personImageData = personImageBase64;
    if (personImageData.startsWith('data:image/')) {
      personImageData = personImageData.split(',')[1];
    }

    // If no product images provided, we can't use virtual try-on
    if (productImagesBase64.length === 0) {
      logger.info('Virtual Try-On requires product images, but none provided', null, 'API_UTIL');
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

    logger.info('Virtual Try-On response missing image data', {
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
        logger.info(`Rate limited, server suggests retry after ${retryAfterHeader}s`, {
          retryCount: retryCount + 1,
          maxRetries,
          status,
          retryAfter: retryAfterHeader,
        }, 'API_UTIL');
      } else {
        // Exponential backoff with longer delays: 10s, 20s, 40s
        backoffDelay = Math.pow(2, retryCount) * 10000;
        logger.info(`Rate limited, retrying after ${backoffDelay/1000}s`, {
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
      logger.info('Failed to generate single outfit', {
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
    logger.info('Failed to generate text outfit description', {
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
    promptPreview: prompt.substring(0, 200) + '...',
    hasUserPhoto: !!userPicBase64,
    photoSize: userPicBase64 ? `${(userPicBase64.length / 1024).toFixed(2)}KB` : 'N/A',
    promptContainsUserDetails: prompt.includes('EXACT SAME PERSON') || prompt.includes('reference photo')
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
      
      // Validate the generated image
      if (!imageDataUrl.startsWith('data:image/')) {
        logger.error('❌ Generated image data URL is invalid', {
          dataUrlPrefix: imageDataUrl.substring(0, 20)
        }, 'API_UTIL');
        return null;
      }
      
      logger.info('✅ DALL-E image generated successfully', {
        imageSize: `${(imageSize / 1024).toFixed(2)}KB`,
        imageSizeBytes: imageSize,
        duration: `${duration}ms`,
        dataUrlLength: imageDataUrl.length,
        isValidFormat: imageDataUrl.startsWith('data:image/png;base64,'),
        preview: imageDataUrl.substring(0, 50) + '...'
      }, 'API_UTIL');
      
      return imageDataUrl;
    }

    logger.info('⚠️ DALL-E response missing image data', {
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
    logger.info('Checking OpenAI configuration', null, 'API_UTIL');
    const openaiClientInstance = getOpenAIClient();
    if (!openaiClientInstance) {
      logger.info('⚠️ OpenAI not configured, OPENAI_API_KEY required for image generation', null, 'API_UTIL');
      logger.info('Please add OPENAI_API_KEY to your .env file', null, 'API_UTIL');
    } else {
      logger.info('✅ OpenAI client available for image generation', null, 'API_UTIL');
    }
    
    const apiKey = process.env.GEMINI_API_KEY; // For fallback text descriptions only
    logger.info('Checking Gemini API key for fallback', {
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
      // Validate and normalize the image data
      const originalLength = userInfo.userPic.length;
      userPicBase64 = userInfo.userPic.startsWith('data:image/')
        ? userInfo.userPic
        : `data:image/jpeg;base64,${userInfo.userPic}`;
      
      logger.info('✅ User photo prepared for processing', {
        originalLength,
        normalizedLength: userPicBase64.length,
        hasDataPrefix: userPicBase64.startsWith('data:image/'),
        photoSize: `${(userPicBase64.length / 1024).toFixed(2)}KB`,
        preview: userPicBase64.substring(0, 50) + '...'
      }, 'API_UTIL');
    } else {
      logger.info('ℹ️ No user photo provided', null, 'API_UTIL');
    }

    // Generate outfit suggestions
    // Note: Gemini API free tier has very strict rate limits (often 1 request per minute)
    // Generating just 1 outfit to minimize rate limit issues
    const styleVariants: string[] = [];
    
    const wardrobe: Array<{ image: string }> = [];

    // PRIORITY: If user has a photo, ALWAYS try Virtual Try-On first (this is the ONLY way to use the actual user photo)
    // Strategy: Generate outfit design image first, then use it as product image for virtual try-on
    if (userPicBase64) {
      logger.info('👤 User has photo - PRIORITIZING Virtual Try-On to show them wearing the outfit', {
        photoSize: `${(userPicBase64.length / 1024).toFixed(2)}KB`,
        hasVirtualTryOnToken: !!VIRTUAL_TRY_ON_ACCESS_TOKEN
      }, 'API_UTIL');

      // Check if Virtual Try-On is available
      if (!VIRTUAL_TRY_ON_ACCESS_TOKEN) {
        logger.info('⚠️ Virtual Try-On token not configured - DALL-E cannot use images directly, so results may not match user photo', {
          warning: 'For best results, configure VIRTUAL_TRY_ON_ACCESS_TOKEN to use the actual user photo'
        }, 'API_UTIL');
      }

      try {
        // Step 1: Generate outfit design image using DALL-E (this will be our "product" image)
        const dalleClient = getOpenAIClient();
        if (dalleClient) {
          logger.info('🎨 Step 1: Generating outfit design with DALL-E for Virtual Try-On', null, 'API_UTIL');
          
          // Build prompt for outfit design (just the clothing, no person) - personalized to user's body type and style
          const outfitDesignPrompt = await buildOutfitDesignPrompt(userInfo, styleVariants[0] || undefined);
          
          const outfitImage = await generateDalleImage(outfitDesignPrompt);
          
          if (outfitImage) {
            logger.info('✅ Outfit design generated, proceeding to Virtual Try-On', {
              outfitImageSize: `${(outfitImage.length / 1024).toFixed(2)}KB`
            }, 'API_UTIL');

            // Step 2: Use Virtual Try-On to show user wearing the outfit (THIS USES THE ACTUAL USER PHOTO)
            logger.info('👔 Step 2: Using Virtual Try-On API with user photo', {
              userPhotoSize: `${(userPicBase64.length / 1024).toFixed(2)}KB`,
              outfitImageSize: `${(outfitImage.length / 1024).toFixed(2)}KB`
            }, 'API_UTIL');
            
            const tryOnResult = await generateVirtualTryOn(userPicBase64, [outfitImage]);
            
            if (tryOnResult) {
              wardrobe.push({ image: tryOnResult });
              logger.info('✅ Virtual Try-On successful - user can see themselves wearing the outfit!', {
                imageSize: `${(tryOnResult.length / 1024).toFixed(2)}KB`,
                note: 'This image shows the ACTUAL user from their uploaded photo wearing the suggested outfit'
              }, 'API_UTIL');
              // Virtual Try-On succeeded - we're done, don't fall through to DALL-E generation
              // Return early with the Virtual Try-On result
            } else {
              logger.info('⚠️ Virtual Try-On failed or not available - falling back to DALL-E with enhanced prompt', {
                reason: !VIRTUAL_TRY_ON_ACCESS_TOKEN ? 'No access token configured' : 'Virtual Try-On API returned no result',
                note: 'DALL-E will use text description of user from photo analysis, but cannot use the actual image'
              }, 'API_UTIL');
              // Don't add outfitImage here - let it fall through to DALL-E generation with user photo context
            }
          } else {
            logger.info('⚠️ Failed to generate outfit design, will try direct DALL-E generation with user photo context', null, 'API_UTIL');
          }
        }
      } catch (error: any) {
        logger.error('❌ Error in Virtual Try-On flow', {
          error: error.message,
          stack: error.stack?.substring(0, 300)
        }, 'API_UTIL');
        // Continue to fallback methods below - DALL-E with enhanced prompt
      }
    }

    // If Virtual Try-On wasn't used or failed, generate outfit with DALL-E
    // NOTE: DALL-E 3 cannot use images directly - it only works with text prompts
    // If user has photo, we use Vision API to analyze it and create a detailed text description
    // This is a fallback - Virtual Try-On is preferred as it uses the actual user photo
    if (wardrobe.length === 0) {
      logger.info('🎯 Attempting DALL-E image generation', {
        style: styleVariants[0] || 'default',
        totalStyles: styleVariants.length,
        hasUserPhoto: !!userPicBase64,
        note: userPicBase64 ? 'Using Vision API analysis of user photo to create detailed prompt (DALL-E cannot use images directly)' : 'No user photo - generating generic outfit'
      }, 'API_UTIL');

      const dalleClient = getOpenAIClient();
    if (!dalleClient) {
      logger.info('⚠️ OpenAI client not available, OPENAI_API_KEY not set or invalid', null, 'API_UTIL');
      logger.info('Skipping DALL-E generation, will try fallback methods', null, 'API_UTIL');
    } else {
      try {
        logger.info('📝 Building outfit prompt', {
          style: styleVariants[0] || 'default',
          userInfo: {
            gender: userInfo.gender,
            bodyType: userInfo.bodyType,
            height: userInfo.height,
            style: userInfo.goToStyle,
            hasPhoto: !!userPicBase64
          }
        }, 'API_UTIL');

        // Build prompt with user photo context (async - uses Vision API to analyze photo)
        // IMPORTANT: DALL-E cannot use images directly, so we analyze the photo with Vision API
        // and create a very detailed text description that DALL-E can use
        const prompt = await buildOutfitPrompt({
          ...userInfo,
          userPic: userPicBase64
        }, styleVariants[0] || undefined);
        logger.info('Generated DALL-E prompt', {
          promptLength: prompt.length,
          hasUserPhotoContext: !!userPicBase64,
          containsUserDetails: prompt.includes('EXACT SAME PERSON') || prompt.includes('reference photo'),
          promptPreview: prompt.substring(0, 500) + '...'
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
          logger.info('⚠️ DALL-E did not return an image, will try fallback', null, 'API_UTIL');
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
    }

    // If image generation failed, try text-based fallback (using Gemini text model)
    if (wardrobe.length === 0) {
      logger.info('⚠️ No images generated, attempting text-based fallback', {
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
            logger.info('⚠️ Gemini text model did not return description', null, 'API_UTIL');
          }
        } catch (error: any) {
          logger.error('❌ Text-based fallback also failed', { 
            error: error.message,
            status: error.response?.status
          }, 'API_UTIL');
        }
      } else {
        logger.info('⚠️ No Gemini API key available for text fallback', null, 'API_UTIL');
      }
      
      logger.info('⚠️ No outfits generated, returning default suggestions', {
        triedDalle: !!openaiClientInstance,
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
    
    logger.info('⚠️ Returning default wardrobe due to error', null, 'API_UTIL');
    // Return default response if API call fails
    return getDefaultWardrobe();
  }
};
