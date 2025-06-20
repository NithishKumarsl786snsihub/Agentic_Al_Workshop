# Voice Website Generator Backend

A powerful Python backend powered by FastAPI, Gemini AI, and LangGraph agents for voice-controlled website generation and editing.

## 🚀 Features

- **AI Website Generation**: Generate complete HTML websites from text prompts using Gemini AI
- **Voice-Controlled Editing**: Edit websites using natural language voice commands
- **Session Management**: Track user sessions with undo/redo functionality
- **File Storage**: Local file system storage for generated websites
- **Vector Search**: ChromaDB integration for semantic search across sessions
- **RESTful API**: Complete REST API with automatic OpenAPI documentation

## 🛠️ Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **Gemini AI**: Google's generative AI for website generation and editing
- **LangGraph**: Agent workflow management
- **ChromaDB**: Vector database for session storage and search
- **BeautifulSoup**: HTML parsing and validation
- **Pydantic**: Data validation and settings management

## 📋 Prerequisites

- Python 3.8 or higher
- Gemini API key (from Google AI Studio)
- Git

## 🔧 Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd Day-10/Final\ Hackathon/backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   # Try main requirements (includes LangGraph)
   pip install -r requirements.txt
   
   # If you get dependency conflicts, use simplified version:
   pip install -r requirements_simple.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp env_example .env
   ```
   
   Edit `.env` file and configure your settings:
   ```
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   AI_MODEL=gemini-1.5-flash
   AI_TEMPERATURE=0.1
   ENABLE_MULTI_AGENT=true
   DEBUG=true
   ```

## 🚀 Quick Start

### Option 1: Use the startup script (Recommended)
```bash
python start_server.py
```

### Option 2: Direct start
```bash
uvicorn main:app --reload
```

The server will start on `http://localhost:8000`

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔌 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info and health check |
| POST | `/generate` | Generate website from prompt |
| POST | `/edit` | Edit website with voice command |
| POST | `/save` | Save website to file |
| POST | `/undo` | Undo last change |
| POST | `/redo` | Redo last undone change |

### Session Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sessions/{session_id}/history` | Get session history |
| GET | `/download/{session_id}/{filename}` | Download saved HTML file |

## 🎯 Usage Examples

### Generate a Website
```bash
curl -X POST "http://localhost:8000/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a modern portfolio website with dark theme"
  }'
```

### Edit a Website
```bash
curl -X POST "http://localhost:8000/edit" \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<html>...</html>",
    "edit_command": "change header color to blue",
    "session_id": "session-123"
  }'
```

## 🏗️ Project Structure

```
backend/
├── core/
│   ├── __init__.py
│   └── config.py          # Configuration management
├── services/
│   ├── __init__.py
│   ├── website_generator.py    # AI website generation
│   ├── html_editor.py          # Voice-controlled editing
│   └── session_manager.py      # Session and file management
├── user_files/            # Generated HTML files (created automatically)
├── chroma_db/             # ChromaDB storage (created automatically)
├── main.py                # FastAPI application
├── start_server.py        # Startup script
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
└── README.md             # This file
```

## 🧠 LangGraph Agents

The system uses LangGraph agents for intelligent processing:

1. **Website Generator Agent**: Analyzes prompts and generates HTML
2. **HTML Editor Agent**: Processes voice commands and modifies HTML
3. **Validation Agent**: Ensures generated HTML is valid and functional

## 💾 Storage Systems

### File Storage
- Generated websites saved in `user_files/{session_id}/`
- Organized by session for easy management
- Automatic cleanup of old sessions

### Vector Storage (ChromaDB)
- Semantic search across all generated content
- Session history and metadata storage
- Fast similarity search for related websites

## 🔧 Configuration

Key configuration options in `.env`:

```env
# Required
GEMINI_API_KEY=your_api_key_here

# Optional (with defaults)
HOST=localhost
PORT=8000
CORS_ORIGINS=http://localhost:3000
USER_FILES_DIR=./user_files
CHROMA_DB_DIR=./chroma_db
```

## 🐛 Troubleshooting

### Common Issues

1. **"No module named 'google.generativeai'"**
   - Solution: `pip install google-generativeai`

2. **"Gemini API key not found"**
   - Solution: Check your `.env` file and ensure `GEMINI_API_KEY` is set

3. **"ChromaDB connection error"**
   - Solution: Ensure write permissions in the project directory

4. **"Import error: langgraph"**
   - Solution: `pip install langgraph`

### Getting Help

1. Check the logs in the terminal
2. Visit the API documentation at `/docs`
3. Ensure all environment variables are set correctly

## 🚀 Production Deployment

For production deployment:

1. **Use a production WSGI server**:
   ```bash
   pip install gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

2. **Set environment variables**:
   ```bash
   export GEMINI_API_KEY=your_key
   export HOST=0.0.0.0
   export PORT=8000
   ```

3. **Use a reverse proxy** (nginx recommended)

4. **Enable HTTPS** in production

## 📄 License

This project is part of the Agentic AI Workshop.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Need help?** Check the API documentation at `http://localhost:8000/docs` when the server is running! 