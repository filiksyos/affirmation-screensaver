const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

function createTray(callbacks) {
  // Create a simple icon (you can replace with actual icon file)
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFRSURBVDiNpdM9S8NAGMDx/5WkpS1FcHBycRIHwUkQP4GDk4uDgw4ODg4ODrr4AQQHBwcHBwcHBwdBEAcHBwcHBwcHBwcHBwdBEAcHBwcHBwcHBwcHBwcHBwcHQRCHvoR7Q5u0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0SZq0Sf8BvgFz8FLx8L0AAAAASUVORK5CYII='
  );
  
  const tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Affirmation Wallpaper',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Apply Current Wallpaper',
      click: callbacks.onApplyWallpaper
    },
    {
      label: 'Generate New Affirmation',
      click: async () => {
        // Trigger generation which will automatically set as wallpaper
        const result = await require('./main').handleGenerateAffirmation?.();
        console.log('Manual generation triggered:', result);
      }
    },
    { type: 'separator' },
    {
      label: 'Preferences',
      click: callbacks.onSettings
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: callbacks.onQuit
    }
  ]);
  
  tray.setToolTip('Affirmation Wallpaper');
  tray.setContextMenu(contextMenu);
  
  return tray;
}

module.exports = { createTray };
