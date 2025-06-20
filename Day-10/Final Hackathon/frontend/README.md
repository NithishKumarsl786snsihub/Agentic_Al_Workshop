# Voice Website Generator - Frontend

A modern Next.js frontend for generating and editing websites using voice commands and AI. Built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Voice Recognition**: Real-time speech-to-text using Web Speech API
- **AI Website Generation**: Generate complete websites from text/voice prompts
- **Live Voice Editing**: Edit websites in real-time using voice commands
- **Visual Preview**: Live iframe preview with instant updates
- **Session Management**: Local storage for session persistence
- **Modern UI**: Custom design with AxiForma font and dark theme
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS v4** - Utility-first CSS framework
- **Web Speech API** - Native browser speech recognition
- **Lucide React** - Beautiful icon library
- **Custom Hooks** - Reusable voice recognition and storage logic

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Modern browser with Web Speech API support (Chrome, Edge, Firefox)
- Backend API running (see backend README)

## 🔧 Installation

1. **Navigate to frontend directory**:
   ```bash
   cd Day-10/Final\ Hackathon/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp env_local_example .env.local
   ```

4. **Configure environment** (edit `.env.local`):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   NEXT_PUBLIC_DEBUG=true
   ```

## 🚀 Quick Start

### Option 1: Use startup scripts

**Windows:**
```bash
start.bat
```

**macOS/Linux:**
```bash
chmod +x start.sh
./start.sh
```

### Option 2: Manual start
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📱 Pages Overview

### Page 1: Website Generator (`/`)
- **Voice Input**: Click microphone button to speak your website idea
- **Text Input**: Type your website description
- **AI Generation**: Powered by Gemini AI through backend API
- **Examples**: Quick-start templates for common website types

### Page 2: Live Editor (`/editor`)
- **Live Preview**: Real-time iframe showing your website
- **Voice Editing**: Speak commands to modify the website
- **Code View**: Toggle to see/edit raw HTML
- **Undo/Redo**: Full history management
- **Save/Download**: Export your website

## 🎤 Voice Commands

### Generation Commands (Page 1)
- "Create a modern portfolio website with dark theme"
- "Build a landing page for a tech startup"
- "Make a restaurant website with menu"
- "Design a blog homepage"

### Editing Commands (Page 2)
- "Change header color to blue"
- "Make the text bigger"
- "Add a contact form"
- "Center the content"
- "Add animations to the buttons"
- "Make it more responsive"

## 🏗️ Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── editor/        # Page 2: Live editor
│   │   │   └── page.tsx
│   │   ├── globals.css    # Global styles and CSS variables
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Page 1: Generator
│   ├── components/        # Reusable React components
│   │   └── VoiceButton.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useVoiceRecognition.ts
│   │   └── useSessionStorage.ts
│   └── services/          # API and external services
│       └── api.ts
├── .env.local.example     # Environment template
├── start.bat              # Windows startup script
├── start.sh               # Unix startup script
└── README.md              # This file
```

## �� Design System

### Color Palette
- **Rich Black** (`#001B1A`) - Background
- **Dark Green** (`#032221`) - Alternate background, cards
- **Bangladesh Green** (`#09624C`) - CTA buttons, highlights
- **Mountain Meadow** (`#2CC5A9`) - Accent, hover states
- **Caribbean Green** (`#00D881`) - Voice button, icons
- **Anti-Flash White** (`#F1F7F6`) - Main text

### Typography
- **Font Family**: Inter (fallback for AxiForma)
- **Headings**: Semi Bold (600)
- **Subheadings/Buttons**: Medium (500)
- **Body Text**: Regular (400)

## 🔌 API Integration

The frontend communicates with the Python backend through these endpoints:

- `POST /generate` - Generate website from prompt
- `POST /edit` - Edit website with voice command
- `POST /save` - Save website to file
- `POST /undo` - Undo last change
- `POST /redo` - Redo last undone change

## 🌐 Browser Support

### Web Speech API Support
- ✅ Chrome/Chromium (recommended)
- ✅ Microsoft Edge
- ✅ Safari (limited)
- ⚠️ Firefox (experimental)

### Fallback Behavior
- Voice button becomes disabled if Speech API is not supported
- Users can still use text input for all functionality

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Custom Hooks

#### `useVoiceRecognition`
Handles Web Speech API integration:
- Real-time speech recognition
- Transcript management
- Error handling
- Browser compatibility

#### `useSessionStorage`
Manages local storage for sessions:
- Session persistence
- History tracking
- Data synchronization

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000  # Backend API URL
```

### Tailwind Configuration
The project uses Tailwind CSS v4 with custom CSS variables for theming.

## 🐛 Troubleshooting

### Common Issues

1. **Voice recognition not working**
   - Ensure you're using a supported browser (Chrome recommended)
   - Check microphone permissions
   - Try HTTPS in production

2. **API connection errors**
   - Verify backend is running on correct port
   - Check CORS configuration
   - Confirm API URL in environment variables

3. **Build errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Update Node.js to latest LTS version

### Development Tips

1. **Enable verbose logging**:
   ```bash
   npm run dev -- --verbose
   ```

2. **Check network requests** in browser DevTools

3. **Test voice recognition** in browser console:
   ```javascript
   // Test if Speech Recognition is available
   console.log('Speech Recognition:', window.SpeechRecognition || window.webkitSpeechRecognition);
   ```

## 🚀 Production Deployment

### Build Optimization
```bash
npm run build
npm start
```

### Environment Setup
- Set `NEXT_PUBLIC_API_URL` to production backend URL
- Ensure HTTPS for voice recognition in production
- Configure proper CORS on backend

### Recommended Hosting
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Docker** with nginx

## 📄 License

This project is part of the Agentic AI Workshop.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Need help?** 
- Check browser console for error messages
- Ensure backend API is running
- Test voice recognition permissions
- Review network requests in DevTools
