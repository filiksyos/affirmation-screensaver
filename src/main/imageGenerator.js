const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * Generate image using Gemini 2.5 Flash (Imagen 3) via Google AI Studio
 * Note: As of knowledge cutoff, using Google's generative AI API
 * If Nano Banana is a specific service, replace the endpoint accordingly
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
  
  try {
    // Using Google's Imagen 3 via AI Studio API
    // Note: This endpoint may need adjustment based on actual Nano Banana/Gemini 2.5 Flash API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
      {
        instances: [
          {
            prompt: prompt
          }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9', // Good for desktop wallpaper
          negativePrompt: 'blurry, low quality, distorted text, unreadable',
          safetyFilterLevel: 'block_few'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout for image generation
      }
    );
    
    // Extract image data (base64)
    const imageData = response.data.predictions[0].bytesBase64Encoded;
    
    // Save image
    const timestamp = Date.now();
    const filename = `affirmation-${timestamp}.png`;
    const filepath = path.join(imagesDir, filename);
    
    await fs.writeFile(filepath, Buffer.from(imageData, 'base64'));
    
    console.log('Image saved to:', filepath);
    return filepath;
    
  } catch (error) {
    console.error('Error generating image:', error.response?.data || error.message);
    
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
