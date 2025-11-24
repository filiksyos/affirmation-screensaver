const path = require('path');

// Lazy load wallpaper module (ES Module)
let wallpaperModule = null;
async function getWallpaperModule() {
  if (!wallpaperModule) {
    wallpaperModule = await import('wallpaper');
  }
  return wallpaperModule;
}

/**
 * Sets the desktop wallpaper to the specified image
 * @param {string} imagePath - Absolute path to the image file
 * @returns {Promise<boolean>} - Success status
 */
async function setWallpaper(imagePath) {
  try {
    const wallpaper = await getWallpaperModule();
    
    // Ensure we have an absolute path
    const absolutePath = path.isAbsolute(imagePath) 
      ? imagePath 
      : path.resolve(imagePath);
    
    console.log('Setting wallpaper to:', absolutePath);
    
    await wallpaper.setWallpaper(absolutePath, { scale: 'fill' });
    
    console.log('Wallpaper set successfully!');
    return true;
  } catch (error) {
    console.error('Error setting wallpaper:', error);
    return false;
  }
}

/**
 * Gets the current wallpaper path
 * @returns {Promise<string>} - Current wallpaper path
 */
async function getCurrentWallpaper() {
  try {
    const wallpaper = await getWallpaperModule();
    return await wallpaper.getWallpaper();
  } catch (error) {
    console.error('Error getting current wallpaper:', error);
    return null;
  }
}

module.exports = {
  setWallpaper,
  getCurrentWallpaper
};

