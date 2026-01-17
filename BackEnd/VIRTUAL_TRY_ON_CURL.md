# Virtual Try-On API Curl Commands

## Reference Curl Command (Exact Format)

```bash
curl --location 'https://us-central1-aiplatform.googleapis.com/v1/projects/fashify-484620/locations/us-central1/publishers/google/models/virtual-try-on-preview-08-04:predict?key=AIzaSyBMaNJweJZPNW6qPeV2jD6aXdAEM-5D9k0' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN_HERE' \
--header 'Content-Type: application/json' \
--data '{
    "instances": [
        {
            "personImage": {
                "image": {
                    "bytesBase64Encoded": "BASE64_PERSON_IMAGE_HERE"
                }
            },
            "productImages": [
                {
                    "image": {
                        "bytesBase64Encoded": "BASE64_PRODUCT_IMAGE_HERE"
                    }
                }
            ]
        }
    ],
    "parameters": {
        "sampleCount": 1,
        "personGeneration": "allow_adult"
    }
}'
```

## Basic Curl Command (Without Bearer Token)

```bash
curl --location 'https://us-central1-aiplatform.googleapis.com/v1/projects/fashify-484620/locations/us-central1/publishers/google/models/virtual-try-on-preview-08-04:predict?key=AIzaSyBMaNJweJZPNW6qPeV2jD6aXdAEM-5D9k0' \
--header 'Content-Type: application/json' \
--data '{
  "instances": [
    {
      "personImage": {
        "image": {
          "bytesBase64Encoded": "BASE64_PERSON_IMAGE_HERE"
        }
      },
      "productImages": [
        {
          "image": {
            "bytesBase64Encoded": "BASE64_PRODUCT_IMAGE_HERE"
          }
        }
      ]
    }
  ],
  "parameters": {
    "sampleCount": 1,
    "personGeneration": "allow_adult"
  }
}'
```

## With Authorization Bearer Token

```bash
curl --location 'https://us-central1-aiplatform.googleapis.com/v1/projects/fashify-484620/locations/us-central1/publishers/google/models/virtual-try-on-preview-08-04:predict?key=AIzaSyBMaNJweJZPNW6qPeV2jD6aXdAEM-5D9k0' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN_HERE' \
--header 'Content-Type: application/json' \
--data '{
  "instances": [
    {
      "personImage": {
        "image": {
          "bytesBase64Encoded": "BASE64_PERSON_IMAGE_HERE"
        }
      },
      "productImages": [
        {
          "image": {
            "bytesBase64Encoded": "BASE64_PRODUCT_IMAGE_HERE"
          }
        }
      ]
    }
  ],
  "parameters": {
    "sampleCount": 1,
    "addWatermark": false
  }
}'
```

## Example with Real Base64 Images

To use this with actual images, you need to:

1. **Convert person image to base64:**
```bash
# On macOS/Linux
PERSON_IMAGE=$(base64 -i path/to/person.jpg)

# Or using Python
python3 -c "import base64; print(base64.b64encode(open('path/to/person.jpg', 'rb').read()).decode())"
```

2. **Convert product image to base64:**
```bash
PRODUCT_IMAGE=$(base64 -i path/to/product.jpg)
```

3. **Use in curl:**
```bash
curl --location 'https://us-central1-aiplatform.googleapis.com/v1/projects/fashify-484620/locations/us-central1/publishers/google/models/virtual-try-on-preview-08-04:predict?key=AIzaSyBMaNJweJZPNW6qPeV2jD6aXdAEM-5D9k0' \
--header 'Content-Type: application/json' \
--data "{
  \"instances\": [
    {
      \"personImage\": {
        \"image\": {
          \"bytesBase64Encoded\": \"$PERSON_IMAGE\"
        }
      },
      \"productImages\": [
        {
          \"image\": {
            \"bytesBase64Encoded\": \"$PRODUCT_IMAGE\"
          }
        }
      ]
    }
  ],
  \"parameters\": {
    \"sampleCount\": 1,
    \"addWatermark\": false
  }
}"
```

## Parameters

- **sampleCount**: Number of output images (1-4)
- **addWatermark**: Boolean, whether to add watermark
- **baseSteps**: Integer > 0, default 32 (optional)
- **personGeneration**: "dont_allow", "allow_adult", "allow_all" (optional)
- **safetySetting**: "block_low_and_above", "block_medium_and_above", "block_only_high", "block_none" (optional)

## Response Format

```json
{
  "predictions": [
    {
      "bytesBase64Encoded": "BASE64_IMAGE_BYTES",
      "mimeType": "image/png"
    }
  ]
}
```

## Notes

- Replace `BASE64_PERSON_IMAGE_HERE` with actual base64-encoded person image
- Replace `BASE64_PRODUCT_IMAGE_HERE` with actual base64-encoded product image
- The API key is in the URL query parameter
- Authorization Bearer token is optional if using API key
- Person image should be a full-body photo
- Product images should be clothing items to try on
