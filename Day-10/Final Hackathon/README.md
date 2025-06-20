# 🎤 Voice Website Generator - Final Hackathon Project

A complete full-stack application that generates and edits websites using voice commands and AI. Built with Next.js frontend and Python FastAPI backend, powered by Gemini AI and LangGraph agents.

## 🌟 Demo Overview

This application enables users to:

1. **Generate Websites**: Speak or type a description to generate a complete HTML website
2. **Voice Editing**: Edit the generated website in real-time using natural voice commands
3. **Live Preview**: See changes instantly in a live preview window
4. **Session Management**: Save, load, and manage multiple website projects
5. **Export**: Download or save websites locally

## 🏗️ Architecture

```
Voice Website Generator/
├── 🎨 Frontend (Next.js)          # User interface and voice recognition
│   ├── Page 1: Generator          # Voice/text input → AI generation
│   └── Page 2: Editor             # Live preview + voice editing
│
├── 🧠 Backend (Python/FastAPI)    # AI processing and API
│   ├── Gemini AI Integration      # Website generation and editing
│   ├── LangGraph Agents           # Intelligent workflow management
│   ├── Session Management         # User sessions and history
│   └── ChromaDB Storage           # Vector database for search
│
└── 🔄 Data Flow
    Voice → Speech-to-Text → AI Processing → HTML Generation → Live Preview
```

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js 18+** (for frontend)
- **Python 3.8+** (for backend)
- **Gemini API Key** (from Google AI Studio)
- **Modern browser** with microphone support

### 1. Setup Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env_example .env
# Edit .env and add your GEMINI_API_KEY and other settings
python start_server.py
```

### 2. Setup Frontend
```bash
cd frontend
npm install
cp env_local_example .env.local
# Windows
start.bat
# macOS/Linux
chmod +x start.sh && ./start.sh
```

### 3. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🎯 How It Works

### Step 1: Generate Website (Page 1)
1. Click the 🎤 microphone button or type your idea
2. Say: *"Create a modern portfolio website with dark theme"*
3. AI generates complete HTML with styling
4. Automatically redirected to editor

### Step 2: Edit with Voice (Page 2)
1. See live preview of your website
2. Click 🎤 and give editing commands:
   - *"Change header color to blue"*
   - *"Make the text bigger"*
   - *"Add a contact form"*
   - *"Center the content"*
3. Changes appear instantly in preview
4. Save or download when ready

## 🛠️ Technical Features

### Frontend (Next.js)
- ✅ **Web Speech API** - Real-time voice recognition
- ✅ **React Hooks** - Custom voice and storage management
- ✅ **TypeScript** - Full type safety
- ✅ **Tailwind CSS** - Modern responsive design
- ✅ **Local Storage** - Session persistence
- ✅ **Real-time Preview** - Iframe-based live updates

### Backend (Python)
- ✅ **FastAPI** - Modern async web framework
- ✅ **Gemini AI** - Advanced language model for generation
- ✅ **LangGraph** - Agent workflow management
- ✅ **ChromaDB** - Vector database for semantic search
- ✅ **Session Management** - Multi-user support with undo/redo
- ✅ **File Storage** - Local HTML file management

### AI Capabilities
- ✅ **Website Generation** - Complete HTML with inline CSS
- ✅ **Natural Language Processing** - Understanding voice commands
- ✅ **Code Modification** - Safe HTML/CSS editing
- ✅ **Intent Recognition** - Parsing user editing intentions
- ✅ **Validation** - Ensuring generated code quality

## 🎨 Design System

### Color Palette
- **Rich Black** (`#001B1A`) - Primary background
- **Caribbean Green** (`#00D881`) - Voice buttons and accents
- **Bangladesh Green** (`#09624C`) - Action buttons
- **Mountain Meadow** (`#2CC5A9`) - Hover states
- **Anti-Flash White** (`#F1F7F6`) - Text and contrast

### Typography
- **Font**: Inter (fallback for AxiForma)
- **Weights**: Regular (400), Medium (500), Semi Bold (600)

## 📱 Browser Support

### Recommended
- ✅ **Chrome/Chromium** - Full feature support
- ✅ **Microsoft Edge** - Full feature support

### Limited Support  
- ⚠️ **Safari** - Voice recognition may be limited
- ⚠️ **Firefox** - Experimental Speech API support

## 🔧 Development

### Project Structure
```
Day-10/Final Hackathon/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── services/            # AI and business logic
│   ├── core/                # Configuration
│   ├── requirements.txt     # Python dependencies
│   └── README.md           # Backend documentation
│
├── frontend/
│   ├── src/app/            # Next.js pages
│   ├── src/components/     # React components
│   ├── src/hooks/          # Custom hooks
│   ├── src/services/       # API integration
│   ├── package.json        # Node dependencies
│   └── README.md          # Frontend documentation
│
└── README.md              # This file
```

### Key Components

#### Voice Recognition Hook
```typescript
const { isListening, transcript, startListening } = useVoiceRecognition();
```

#### Session Management
```typescript
const { currentSession, saveSession } = useSessionStorage();
```

#### API Integration
```typescript
const response = await apiService.generateWebsite({ prompt });
const editResult = await apiService.editWebsite({ html_content, edit_command });
```

## 🚀 Deployment

### Development
1. Start backend: `cd backend && python start_server.py`
2. Start frontend: `cd frontend && npm run dev`

### Production
- **Backend**: Use Gunicorn with Uvicorn workers
- **Frontend**: Deploy to Vercel, Netlify, or similar
- **Environment**: Ensure HTTPS for voice recognition

## 🐛 Troubleshooting

### Common Issues

1. **Voice not working**
   - Check microphone permissions
   - Use Chrome/Edge browser
   - Ensure HTTPS in production

2. **API connection failed**
   - Verify backend is running on port 8000
   - Check CORS configuration
   - Confirm API URL in frontend .env

3. **Gemini API errors**
   - Verify API key in backend .env
   - Check API quota and billing

4. **Dependency conflict errors**
   - Try: `pip install -r requirements_simple.txt` instead
   - This uses a simplified version without LangGraph
   - Core functionality remains the same

## 🎯 Example Use Cases

### Personal Projects
- Portfolio websites
- Personal blogs
- Landing pages

### Business Applications
- Company websites
- Product landing pages
- Marketing pages

### Creative Projects
- Art portfolios
- Photography sites
- Creative showcases

## 📈 Future Enhancements

- 🔄 **Multi-language support** for voice commands
- 📱 **Mobile app** with native speech recognition
- 🎨 **Advanced design templates** and themes
- 🤝 **Collaborative editing** with multiple users
- 🔍 **SEO optimization** suggestions
- 📊 **Analytics integration** for generated sites

## 📄 License

This project is part of the Agentic AI Workshop Final Hackathon.

## 🤝 Team & Acknowledgments

Built during the Agentic AI Workshop using:
- **Gemini AI** for language processing
- **LangGraph** for agent workflows
- **Next.js** for modern React development
- **FastAPI** for high-performance APIs

---

**🎉 Ready to create your voice-controlled website? Start with the Quick Start Guide above!** 