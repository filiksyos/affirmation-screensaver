const axios = require('axios');
require('dotenv').config();

/**
 * Generate affirmation prompts using OpenRouter
 * @param {Array} goals - User's personal goals
 * @param {Array} areas - Confidence areas to improve
 * @returns {Array} - Array of affirmation image prompts
 */
async function generateAffirmations(goals = [], areas = []) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not found in environment variables');
  }
  
  const goalsText = goals.join(', ');
  const areasText = areas.join(', ');
  
  const systemPrompt = `You are an expert affirmation coach. Generate powerful, personalized affirmation image prompts based on the user's goals and confidence areas.

User wants to improve in: ${areasText}
User's goals: ${goalsText}

Generate 3 different affirmation image prompts. Each prompt should:
1. Include a short, powerful affirmation text (5-8 words max)
2. Describe a beautiful, uplifting visual scene optimized for 16:9 widescreen aspect ratio (PC wallpaper format)
3. Specify where the affirmation text should appear in the image
4. Use inspiring, motivational imagery that works well in landscape/widescreen format
5. IMPORTANT: The image must be generated in 16:9 aspect ratio (1920x1080 or similar widescreen dimensions) suitable for desktop wallpaper

Format each prompt as:
"[AFFIRMATION TEXT]: [Visual scene description with text placement, optimized for 16:9 widescreen wallpaper format]"

Example: "I Am Confident and Capable: A serene mountain peak at sunrise with golden light spanning across a wide 16:9 landscape, the affirmation text elegantly overlaid in the sky in bold white letters, perfect for desktop wallpaper"

Generate 3 unique prompts now:`;
  
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: systemPrompt
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/yourusername/affirmation-screensaver',
          'X-Title': 'Affirmation Screensaver'
        }
      }
    );
    
    const content = response.data.choices[0].message.content;
    
    // Parse the prompts from response
    const prompts = content
      .split('\n')
      .filter(line => line.trim().length > 0 && /^\d+\.|^-/.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*|^-\s*/, '').trim())
      .filter(p => p.length > 10);
    
    if (prompts.length === 0) {
      // Fallback if parsing fails
      return [
        `I Am Confident: Beautiful sunrise over calm ocean, affirmation text in elegant white typography centered in the sky`,
        `I Believe in Myself: Majestic forest with rays of light, affirmation text glowing in golden letters above the trees`,
        `I Am Growing Every Day: Blooming flower garden in vibrant colors, affirmation text in bold script at the bottom`
      ];
    }
    
    return prompts.slice(0, 3);
    
  } catch (error) {
    console.error('Error generating affirmations:', error.response?.data || error.message);
    
    // Fallback prompts
    return [
      `I Am Worthy of Success: Stunning mountain landscape at golden hour with the affirmation text in bold white letters across the sky`,
      `Every Day I Grow Stronger: Peaceful zen garden with cherry blossoms, affirmation text in elegant calligraphy floating above`,
      `I Trust My Journey: Winding path through beautiful autumn forest, affirmation text in warm orange tones along the path`
    ];
  }
}

module.exports = { generateAffirmations };
