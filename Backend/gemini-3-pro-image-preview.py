from google import genai
from google.genai import types

# Initialize the client for Vertex AI
client = genai.Client(
    vertexai=True,
    project="fashify-484620",
    location="global"
)

# File paths for your 5 images
image_paths = [
    "images/raghuBody/body.jpeg",      # Image 1: The model
    "images/raghuBody/body.jpeg",      # Image 2: Base layer
    "images/raghuBody/body.jpeg",      # Image 3: Outer layer
    "images/raghuBody/body.jpeg",       # Image 4: Bottoms
    "images/raghuBody/body.jpeg"        # Image 5: Footwear
]

# Helper function to load images into the format Gemini expects
def load_image(path):
    with open(path, "rb") as f:
        return types.Part.from_bytes(
            data=f.read(),
            mime_type="image/jpeg"
        )

contents = [
    load_image(image_paths[0]), # Master Identity (Your Photo)
    load_image(image_paths[1]), # Clothing Item 1
    load_image(image_paths[2]), # Clothing Item 2
    load_image(image_paths[3]), # Clothing Item 3
    load_image(image_paths[4]), # Clothing Item 4
    """
    INSTRUCTION: HIGH-FIDELITY CHARACTER PRESERVATION TRY-ON

    1. MASTER IDENTITY: Use Image 0 as the ABSOLUTE structural reference for the person's
       face, facial features, skin tone, and exact body shape.
       DO NOT blend or average this face with any faces found in the inventory images.

    2. CLOTHING REPLACEMENT:
       - Take ONLY the textures and shapes of the clothing from Images 1, 2, 3, and 4.
       - Discard everything else from those images (people, backgrounds, heads).
       - Wear the Jacket (Image 2) over the T-shirt (Image 1).

    3. POSITIONING:
       - Keep the person in the exact center-frame as seen in Image 0.
       - Match the lighting of the final image to a high-end fashion studio.

    4. CONSTRAINT: If Image 0 has a transparent background, place the final person
       on a clean, neutral studio grey background. Ensure the jawline and eyes
       perfectly match Image 0 at 100% fidelity.
    """
]

# Call the Pro model (Nano Banana Pro)
response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    # model="gemini-2.5-flash-image",
    contents=contents,
    config=types.GenerateContentConfig(
        response_modalities=['IMAGE'],
        # Thinking mode helps the model plan complex layering
        thinking_config=types.ThinkingConfig(thinking_budget=32000)
        # media_resolution="high"
    )
)

# Save the resulting image
for part in response.candidates[0].content.parts:
    if part.inline_data:
        image = part.as_image()
        image.save("outfit_tryon_result.png")
        print("Success: Outfit image generated!")