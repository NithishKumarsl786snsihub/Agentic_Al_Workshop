# 🧠 Multi-Agent RAG System with LangGraph

A sophisticated research and summarization system that intelligently routes queries between web search, retrieval-augmented generation (RAG), and large language model (LLM) reasoning using LangGraph.

## 🌟 Features

- **Intelligent Query Routing**: Automatically determines the best approach for each query
- **Multi-Agent Architecture**: Specialized agents for different types of information retrieval
- **Web Search Integration**: Real-time information gathering using DuckDuckGo
- **RAG Implementation**: Document-based knowledge retrieval with FAISS vector store
- **LLM Reasoning**: General knowledge queries handled by Gemini AI
- **Smart Summarization**: Structured response generation with source attribution
- **Modern UI**: Clean, responsive Streamlit interface

## 🏗️ Architecture

### Agents Overview

1. **Router Agent** 🎯
   - Analyzes incoming queries
   - Routes to appropriate specialized agent
   - Uses intelligent decision-making logic

2. **Web Research Agent** 🌐
   - Handles queries requiring current information
   - Performs real-time web searches
   - Extracts and processes relevant information

3. **RAG Agent** 📚
   - Processes document-based queries
   - Uses FAISS vector similarity search
   - Retrieves relevant context from knowledge base

4. **LLM Agent** 🤖
   - Handles general knowledge questions
   - Uses Gemini AI for reasoning tasks
   - Provides comprehensive explanations

5. **Summarization Agent** 📝
   - Synthesizes responses from other agents
   - Structures final output
   - Adds source attribution

### Workflow

```
User Query → Router Agent → [Web/RAG/LLM Agent] → Summarization Agent → Final Response
```

## 🚀 Setup Instructions

### Prerequisites

- Python 3.8+
- Google AI API key (for Gemini)

### Installation

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd multi-agent-rag-system
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Google AI API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Create documents folder**
   ```bash
   mkdir my_docs
   ```

5. **Add your documents**
   - Place PDF, TXT, or DOCX files in the `my_docs` folder
   - The system will automatically process them into the knowledge base


## 📖 Usage Guide

### Adding Documents

1. Place your documents (PDF, TXT, DOCX) in the `my_docs` folder
2. Click "🔄 Rebuild Knowledge Base" in the sidebar
3. The system will process and index your documents

### Query Examples

**Web Search Queries:**
- "What's the latest news about artificial intelligence?"
- "Current stock price of Tesla"
- "Recent developments in quantum computing"

**RAG Queries (Document-based):**
- "Summarize the key findings in my research papers"
- "What does the document say about [specific topic]?"
- "Find information about [topic] in the uploaded files"

**LLM Queries (General Knowledge):**
- "Explain how neural networks work"
- "What is the difference between supervised and unsupervised learning?"
- "How does blockchain technology work?"

## 🛠️ Configuration

### Model Settings

The system uses the following default configurations:

- **LLM**: Gemini 1.5 Flash (temperature: 0.3)
- **Embeddings**: Google Generative AI Embeddings (embedding-001)
- **Text Splitting**: 1000 character chunks with 100 character overlap
- **Vector Store**: FAISS with cosine similarity

### Customization

You can modify the configuration in the `Config` class:

```python
class Config:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash", 
            temperature=0.3  # Adjust creativity vs consistency
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,    # Adjust chunk size
            chunk_overlap=100   # Adjust overlap
        )
```

## 🧪 Testing

### Test the Router Agent

```python
# Test with different query types
queries = [
    "What's today's weather?",  # Should route to web
    "Explain photosynthesis",   # Should route to llm
    "What's in document X?"     # Should route to rag
]
```

### Verify Knowledge Base

The sidebar will show the status of your knowledge base and number of processed document chunks.

## 📁 Project Structure

```
multi-agent-rag-system/
├── app.py                 # Main application file
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── README.md             # This file
├── my_docs/              # Document storage folder
│   ├── example.pdf
│   ├── document.txt
│   └── research.docx
└── .gitignore           # Git ignore file
```


**Enjoy your Multi-Agent Research and Summarization System!** 