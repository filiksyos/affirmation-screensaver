const cron = require('node-cron');

let scheduledTask = null;

function initScheduler(schedule) {
  // Validate cron expression
  if (!cron.validate(schedule)) {
    console.error('Invalid cron schedule:', schedule);
    return;
  }
  
  // Stop existing task if any
  stopScheduler();
  
  console.log('Initializing scheduler with:', schedule);
  
  scheduledTask = cron.schedule(schedule, async () => {
    console.log('Scheduled affirmation generation triggered');
    const { ipcMain } = require('electron');
    
    // Trigger affirmation generation
    try {
      // Import main's generation function
      const mainModule = require('./main');
      if (mainModule.handleGenerateAffirmation) {
        await mainModule.handleGenerateAffirmation();
      }
    } catch (error) {
      console.error('Error in scheduled generation:', error);
    }
  });
  
  console.log('Scheduler started successfully');
}

function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('Scheduler stopped');
  }
}

module.exports = { initScheduler, stopScheduler };
