const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * Generate image using Gemini 3 Pro Image Preview via Google AI Studio
 * Uses proper imageConfig for aspect ratio control
 * @param {string} prompt - Image generation prompt with affirmation
 * @returns {string} - Path to saved image
 */
async function generateImage(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment variables');
  }
  
  // Create generated-images directory if it doesn't exist
  const imagesDir = path.join(process.cwd(), 'generated-images');
  await fs.mkdir(imagesDir, { recursive: true });
  
  // Use Gemini 3 Pro Image Preview model with proper aspect ratio configuration
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;
  
  // Format request with proper imageConfig for 16:9 aspect ratio
  const payload = {
    contents: [{
      parts: [
        { text: prompt }
      ],
    }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: '16:9',
        imageSize: '2K' // Options: '1K', '2K', '4K' - 2K gives good quality for wallpapers
      }
    },
  };

  let response;
  // Retry logic similar to nano-banana-wardrobe
  for (let i = 0; i < 3; i++) {
    try {
      response = await axios.post(
        apiUrl,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout for image generation
        }
      );
      
      if (response.status === 200) {
        break;
      } else if (response.status === 429) {
        // Rate limit - exponential backoff
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      if (i === 2) {
        // Last retry failed
        console.error('Error generating image after retries:', error.response?.data || error.message);
        // Fallback: Create a simple placeholder image with text
        return await createFallbackImage(prompt, imagesDir);
      }
      // Continue to retry
      if (error.response?.status === 429) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Check if we have a valid response
  if (!response || !response.data) {
    console.error('No valid response received after retries');
    return await createFallbackImage(prompt, imagesDir);
  }

  try {
    // Parse response similar to nano-banana-wardrobe
    const result = response.data;
    const base64Data = result?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData?.data;

    if (!base64Data) {
      throw new Error('No image data in response');
    }
    
    // Save image
    const timestamp = Date.now();
    const filename = `affirmation-${timestamp}.png`;
    const filepath = path.join(imagesDir, filename);
    
    await fs.writeFile(filepath, Buffer.from(base64Data, 'base64'));
    
    console.log('Image saved to:', filepath);
    return filepath;
    
  } catch (error) {
    console.error('Error processing image response:', error.message);
    // Fallback: Create a simple placeholder image with text
    return await createFallbackImage(prompt, imagesDir);
  }
}

/**
 * Create a fallback image when API fails
 * This creates a simple colored background with the affirmation text
 */
async function createFallbackImage(prompt, imagesDir) {
  // Extract affirmation text from prompt (before the colon)
  const affirmationMatch = prompt.match(/^([^:]+)/);
  const affirmationText = affirmationMatch ? affirmationMatch[1].trim() : 'I Am Confident';
  
  // Create a simple SVG image
  const svgContent = `
    <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#grad)"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="72" font-weight="bold" 
            fill="white" text-anchor="middle" dominant-baseline="middle">
        ${affirmationText}
      </text>
    </svg>
  `;
  
  const timestamp = Date.now();
  const filename = `affirmation-fallback-${timestamp}.svg`;
  const filepath = path.join(imagesDir, filename);
  
  await fs.writeFile(filepath, svgContent);
  
  console.log('Fallback image created:', filepath);
  return filepath;
}

module.exports = { generateImage };
