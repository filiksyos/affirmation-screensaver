const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { createTray } = require('./tray');
const { initScheduler, stopScheduler } = require('./scheduler');
const { generateAffirmations } = require('./affirmationGenerator');
const { generateImage } = require('./imageGenerator');
const { setWallpaper } = require('./wallpaperSetter');

// Initialize electron-store for persistent settings
const store = new Store();

let mainWindow = null;
let settingsWindow = null;
let tray = null;

// Check if this is first run
const isFirstRun = !store.get('onboardingComplete', false);

function createOnboardingWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    resizable: false,
    minimizable: false
  });

  win.loadFile(path.join(__dirname, '../renderer/onboarding.html'));
  return win;
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    resizable: false
  });

  settingsWindow.loadFile(path.join(__dirname, '../renderer/settings.html'));
  
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

async function applyCurrentWallpaper() {
  const currentImage = store.get('currentImagePath', null);
  if (currentImage) {
    await setWallpaper(currentImage);
  } else {
    console.log('No wallpaper image available yet');
  }
}

app.whenReady().then(() => {
  // Create system tray
  tray = createTray({
    onSettings: createSettingsWindow,
    onApplyWallpaper: applyCurrentWallpaper,
    onQuit: () => {
      stopScheduler();
      app.quit();
    }
  });

  // Check if running in dev mode
  const isDevMode = process.argv.includes('--dev');

  // Show onboarding if first run
  if (isFirstRun) {
    mainWindow = createOnboardingWindow();
  } else {
    // Initialize scheduler with saved settings
    const schedule = store.get('generationSchedule', '0 6 * * *');
    initScheduler(schedule);
    
    // In dev mode, show settings window automatically
    if (isDevMode) {
      createSettingsWindow();
    }
  }
});

// IPC handlers
ipcMain.handle('save-onboarding', async (event, data) => {
  store.set('userGoals', data.goals);
  store.set('confidenceAreas', data.areas);
  store.set('generationSchedule', data.schedule);
  store.set('onboardingComplete', true);
  
  // Generate first affirmation
  await handleGenerateAffirmation();
  
  // Start scheduler
  initScheduler(data.schedule);
  
  return { success: true };
});

ipcMain.handle('get-settings', async () => {
  return {
    goals: store.get('userGoals', []),
    areas: store.get('confidenceAreas', []),
    schedule: store.get('generationSchedule', '0 6 * * *'),
    apiKeys: {
      openrouter: !!process.env.OPENROUTER_API_KEY
    }
  };
});

ipcMain.handle('update-settings', async (event, settings) => {
  store.set('generationSchedule', settings.schedule);
  
  // Restart scheduler with new schedule
  stopScheduler();
  initScheduler(settings.schedule);
  
  return { success: true };
});

ipcMain.handle('generate-now', async () => {
  return await handleGenerateAffirmation();
});

ipcMain.handle('get-current-image', async () => {
  const currentImage = store.get('currentImagePath', null);
  return currentImage;
});

ipcMain.handle('get-image-history', async () => {
  return store.get('imageHistory', []);
});

async function handleGenerateAffirmation() {
  try {
    const goals = store.get('userGoals', []);
    const areas = store.get('confidenceAreas', []);
    
    // Step 1: Generate affirmation prompts using OpenRouter
    console.log('Generating affirmation prompts...');
    const prompts = await generateAffirmations(goals, areas);
    
    // Step 2: Generate image using OpenRouter (Gemini 2.5 Flash Image) for first prompt
    console.log('Generating image with affirmation...');
    const imagePath = await generateImage(prompts[0]);
    
    // Step 3: Save to store
    store.set('currentImagePath', imagePath);
    
    // Step 4: Set as wallpaper automatically
    console.log('Setting as wallpaper...');
    await setWallpaper(imagePath);
    
    // Add to history
    const history = store.get('imageHistory', []);
    history.unshift({
      path: imagePath,
      prompt: prompts[0],
      timestamp: new Date().toISOString()
    });
    // Keep only last 30 images
    store.set('imageHistory', history.slice(0, 30));
    
    return { success: true, imagePath, prompt: prompts[0] };
  } catch (error) {
    console.error('Error generating affirmation:', error);
    return { success: false, error: error.message };
  }
}

// Export for use in other modules
module.exports = { handleGenerateAffirmation };

app.on('window-all-closed', (e) => {
  // Don't quit on window close - run in background
  e.preventDefault();
});

app.on('before-quit', () => {
  stopScheduler();
});
