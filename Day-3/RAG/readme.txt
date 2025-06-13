# 🤖 RAG System with Gemini AI

A lightweight **Retrieval-Augmented Generation (RAG)** system powered by **Google Gemini 1.5 Flash** and **ChromaDB**, designed to extract insights from research paper PDFs.
 
## 📂 Project Structure
 
rag_system.py
.env                ← 🔐 Stores your Gemini API key
DatasetCollections/ ← 📁 Folder containing your PDF research papers
 

## 🚀 Features

- ✅ PDF chunking and metadata extraction
- ✅ Semantic search using ChromaDB and Sentence Transformers
- ✅ Context-aware answer generation with Google Gemini AI
- ✅ Professional, source-cited answers
- ✅ Console-based interactive querying system
 

## 🛠️ Installation

### 1️⃣ Install Dependencies

Run the following command in your terminal (preferably in a virtual environment):
pip install --user chromadb PyMuPDF google-generativeai python-dotenv tqdm sentence-transformers
 

### 2️⃣ Create `.env` File

In your root directory, create a file named `.env` and add the following line:
GOOGLE_API_KEY=your_gemini_api_key_here
 

### 3️⃣ 📥 Get Your Google Gemini API Key

1. Visit 👉 [Gemini API Key Console](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Generate your API key
4. Paste it into your `.env` file as shown above


### 4️⃣ Add PDF Files

Add all your `.pdf` research documents to the `DatasetCollections/` directory:

DatasetCollections/
├── transformer_paper.pdf
├── attention_mechanism.pdf
└── gpt3_overview.pdf

## ▶️ Running the RAG System

Run the script with the following command: 
python rag_system.py
 
 