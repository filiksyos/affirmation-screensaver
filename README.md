# 🌟 AI Affirmation Screensaver

An AI-powered desktop screensaver that generates personalized affirmation images to boost your confidence and motivation. Like Windows screensavers, but powered by AI and tailored to your personal growth goals.

## ✨ Features

- **Personalized Onboarding**: Answer questions about areas you want to improve
- **AI-Generated Affirmations**: Uses OpenRouter to create meaningful, contextual affirmations
- **Beautiful Image Generation**: Gemini 2.5 Flash (via Nano Banana) creates stunning visuals with text overlay
- **Auto-Rotation**: Configurable schedule to generate fresh affirmations (daily, hourly, etc.)
- **System Tray Integration**: Minimal, non-intrusive interface
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- OpenRouter API key ([Get one here](https://openrouter.ai/))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/affirmation-screensaver.git
cd affirmation-screensaver

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your API key to .env
# OPENROUTER_API_KEY=your_openrouter_key

# Run the app
npm start
```

### First Run

1. The app will launch in your system tray (look for the ✨ icon)
2. Click the tray icon and select "Setup Preferences"
3. Answer questions about your confidence goals
4. Set your generation schedule (e.g., daily at 6 AM)
5. Click "Generate First Affirmation"

## 🎨 How It Works

1. **Onboarding**: You answer questions about areas you want to improve (career, relationships, health, etc.)
2. **Prompt Generation**: OpenRouter generates multiple affirmation prompts based on your goals
3. **Image Creation**: OpenRouter (Gemini 2.5 Flash Image) creates beautiful images with affirmation text overlays in 16:9 aspect ratio
4. **Auto-Rotation**: New affirmations are generated on your schedule
5. **Display**: Images rotate as your desktop wallpaper/screensaver

## 🛠️ Configuration

### API Keys

Create a `.env` file in the root directory:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Generation Schedule

In the settings window, you can configure:
- **Frequency**: Daily, every 12 hours, every 6 hours, or custom cron
- **Time**: Specific time of day for generation
- **Batch Size**: How many affirmations to generate per session (1-5)

## 📁 Project Structure

```
affirmation-screensaver/
├── src/
│   ├── main/
│   │   ├── main.js              # Electron main process
│   │   ├── tray.js              # System tray logic
│   │   ├── scheduler.js         # Cron job scheduler
│   │   ├── affirmationGenerator.js  # OpenRouter integration
│   │   └── imageGenerator.js    # Gemini 2.5 Flash integration
│   └── renderer/
│       ├── onboarding.html      # First-run setup
│       ├── settings.html        # Settings window
│       ├── screensaver.html     # Fullscreen display
│       └── styles.css           # Shared styles
├── assets/                       # Icons and static files
├── generated-images/             # Cached affirmation images
├── .env.example
├── package.json
└── README.md
```

## 🔧 Development

```bash
# Run in development mode with DevTools
npm run dev

# Build for your platform
npm run build

# Build for specific platforms
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## 📝 API Usage

### OpenRouter

Used for both:
- **Text Generation**: Generate contextual affirmation prompts based on user goals
- **Image Generation**: Generate beautiful images with affirmation text overlays using `google/gemini-2.5-flash-image` model with 16:9 aspect ratio support (1344×768 resolution)

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Credits

- Inspired by [before-dawn](https://github.com/muffinista/before-dawn)
- Powered by OpenRouter (Gemini 2.5 Flash Image model)

---

**Note**: This is an MVP. Future features could include:
- Voice affirmations
- Multi-language support
- Community sharing of affirmations
- Analytics on mood tracking
