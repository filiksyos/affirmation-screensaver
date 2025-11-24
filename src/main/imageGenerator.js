const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * Generate image using OpenRouter with Gemini 2.5 Flash Image model
 * Uses proper imageConfig for aspect ratio control (16:9 for wallpapers)
 * @param {string} prompt - Image generation prompt with affirmation
 * @returns {string} - Path to saved image
 */
async function generateImage(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not found in environment variables');
  }
  
  // Create generated-images directory if it doesn't exist
  const imagesDir = path.join(process.cwd(), 'generated-images');
  await fs.mkdir(imagesDir, { recursive: true });
  
  // Use OpenRouter API with Gemini 2.5 Flash Image model
  const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  
  // Format request with proper image_config for 16:9 aspect ratio
  const payload = {
    model: 'google/gemini-2.5-flash-image',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    image_config: {
      aspect_ratio: '16:9' // 1344×768 resolution, perfect for desktop wallpapers
    }
  };

  let response;
  // Retry logic with exponential backoff
  for (let i = 0; i < 3; i++) {
    try {
      response = await axios.post(
        apiUrl,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/yourusername/affirmation-screensaver',
            'X-Title': 'Affirmation Screensaver'
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
        throw new Error(`Failed to generate image: ${error.response?.data?.error?.message || error.message}`);
      }
      // Continue to retry
      if (error.response?.status === 429) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (error.response?.status >= 400) {
        // Don't retry on client errors
        throw new Error(`API error: ${error.response?.data?.error?.message || error.message}`);
      }
    }
  }

  // Check if we have a valid response
  if (!response || !response.data) {
    throw new Error('No valid response received from OpenRouter API');
  }

  try {
    // Parse OpenRouter response
    const result = response.data;
    
    const message = result?.choices?.[0]?.message;
    if (!message) {
      console.error('API Response:', JSON.stringify(result, null, 2));
      throw new Error('No message in API response');
    }
    
    let base64Data;
    
    // Check for images array (OpenRouter/Gemini image generation format)
    if (message.images && Array.isArray(message.images) && message.images.length > 0) {
      const imageData = message.images[0];
      console.log('Found images array, first item type:', typeof imageData, 'keys:', typeof imageData === 'object' ? Object.keys(imageData) : 'N/A');
      
      // Check if it's a URL string
      if (typeof imageData === 'string') {
        if (imageData.startsWith('http')) {
          console.log('Fetching image from images array URL:', imageData);
          const imageResponse = await axios.get(imageData, { responseType: 'arraybuffer' });
          base64Data = Buffer.from(imageResponse.data).toString('base64');
        } else if (imageData.startsWith('data:image')) {
          // Data URL format
          base64Data = imageData.split(',')[1];
        } else {
          // Might be base64 string
          base64Data = imageData;
        }
      } else if (imageData && typeof imageData === 'object') {
        // Object with image_url property (OpenRouter format)
        if (imageData.image_url) {
          const imageUrl = typeof imageData.image_url === 'string' 
            ? imageData.image_url 
            : imageData.image_url.url;
          console.log('Fetching image from images array image_url:', imageUrl);
          const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          base64Data = Buffer.from(imageResponse.data).toString('base64');
        } else if (imageData.url) {
          // Fallback to url property
          console.log('Fetching image from images array object URL:', imageData.url);
          const imageResponse = await axios.get(imageData.url, { responseType: 'arraybuffer' });
          base64Data = Buffer.from(imageResponse.data).toString('base64');
        } else if (imageData.base64 || imageData.data) {
          // Base64 data directly
          base64Data = imageData.base64 || imageData.data;
        } else if (imageData.inlineData?.data) {
          // Gemini inlineData format
          base64Data = imageData.inlineData.data;
        }
      }
    }
    
    // Check for content array (multimodal response - most common format)
    if (!base64Data && message.content && Array.isArray(message.content)) {
      // Look for image_url in content array
      const imageContent = message.content.find(item => item.type === 'image_url' || item.image_url);
      if (imageContent) {
        const imageUrl = imageContent.image_url?.url || imageContent.url;
        if (imageUrl) {
          console.log('Fetching image from URL:', imageUrl);
          const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          base64Data = Buffer.from(imageResponse.data).toString('base64');
        }
      }
    }
    
    // Check for direct image_url in message
    if (!base64Data && message.image_url) {
      const imageUrl = message.image_url.url || message.image_url;
      console.log('Fetching image from message.image_url:', imageUrl);
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      base64Data = Buffer.from(imageResponse.data).toString('base64');
    }
    
    // Check for content as string (data URL or URL)
    if (!base64Data && message.content && typeof message.content === 'string') {
      const content = message.content;
      
      if (content.startsWith('data:image')) {
        // Data URL format
        base64Data = content.split(',')[1];
      } else if (content.startsWith('http')) {
        // HTTP URL
        console.log('Fetching image from content URL:', content);
        const imageResponse = await axios.get(content, { responseType: 'arraybuffer' });
        base64Data = Buffer.from(imageResponse.data).toString('base64');
      }
    }
    
    // Check for parts array (Gemini-style response)
    if (!base64Data && message.parts && Array.isArray(message.parts)) {
      const imagePart = message.parts.find(part => part.inlineData || part.imageUrl);
      if (imagePart) {
        if (imagePart.inlineData?.data) {
          base64Data = imagePart.inlineData.data;
        } else if (imagePart.imageUrl) {
          const imageUrl = imagePart.imageUrl.url || imagePart.imageUrl;
          console.log('Fetching image from parts:', imageUrl);
          const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          base64Data = Buffer.from(imageResponse.data).toString('base64');
        }
      }
    }

    if (!base64Data) {
      console.error('Response structure:', JSON.stringify({
        hasMessage: !!message,
        messageKeys: message ? Object.keys(message) : [],
        hasImages: !!message?.images,
        imagesLength: message?.images?.length || 0,
        imagesType: message?.images?.[0] ? typeof message?.images[0] : 'none',
        contentType: message?.content ? typeof message.content : 'none',
        contentIsArray: Array.isArray(message?.content),
        hasImageUrl: !!message?.image_url,
        hasParts: !!message?.parts
      }, null, 2));
      throw new Error('No image data found in response. Check console for response structure details.');
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
    throw error; // Re-throw instead of fallback
  }
}

module.exports = { generateImage };
