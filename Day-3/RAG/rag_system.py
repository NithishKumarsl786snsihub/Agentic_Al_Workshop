import os
import fitz
import chromadb
from chromadb.utils import embedding_functions
import google.generativeai as genai
from typing import List, Dict, Tuple
from dotenv import load_dotenv
from tqdm import tqdm

# Load environment variables
load_dotenv()

class RAGSystem:
    def __init__(self, model_name: str = "gemini-1.5-flash"):
        # Initialize Gemini
        print("🔧 Initializing Gemini AI model...")
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        self.model = genai.GenerativeModel(model_name)
        
        # Initialize ChromaDB
        print("🗄️ Setting up ChromaDB vector store...")
        self.client = chromadb.Client()
        self.collection = self.client.create_collection(
            name="research_papers",
            embedding_function=embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name="all-MiniLM-L6-v2"
            )
        )
        
        # Store document metadata
        self.documents_metadata = {}
        print("✅ RAG System initialized successfully!")

    def process_document(self, file_path: str) -> List[Dict]:
        """Process a PDF document and return chunks with metadata."""
        print(f"📄 Processing document: {os.path.basename(file_path)}")
        doc = fitz.open(file_path)
        chunks = []
        
        for page_num in tqdm(range(len(doc)), desc=f"🔍 Analyzing {os.path.basename(file_path)}"):
            page = doc[page_num]
            text = page.get_text()
            
            # Get section titles (headers) from the page
            headers = self._extract_headers(page)
            
            # Split text into chunks (approximately 1000 characters with overlap)
            chunk_size = 1000
            overlap = 200
            
            for i in range(0, len(text), chunk_size - overlap):
                chunk = text[i:i + chunk_size]
                if not chunk.strip():
                    continue
                    
                # Find the most relevant header for this chunk
                relevant_header = self._find_relevant_header(chunk, headers)
                
                chunks.append({
                    "text": chunk,
                    "metadata": {
                        "paper_title": os.path.basename(file_path),
                        "page_number": page_num + 1,
                        "section_title": relevant_header
                    }
                })
        
        print(f"✅ Processed {len(chunks)} chunks from {os.path.basename(file_path)}")
        return chunks

    def _extract_headers(self, page) -> List[str]:
        """Extract headers from a page using font size and style."""
        headers = []
        blocks = page.get_text("dict")["blocks"]
        
        for block in blocks:
            if "lines" in block:
                for line in block["lines"]:
                    for span in line["spans"]:
                        # Check if text is likely a header (larger font, bold, etc.)
                        if span["size"] > 12 and span["flags"] & 16:  # 16 is bold flag
                            headers.append(span["text"])
        
        return headers

    def _find_relevant_header(self, chunk: str, headers: List[str]) -> str:
        """Find the most relevant header for a chunk of text."""
        if not headers:
            return "Introduction"
            
        # Simple heuristic: use the last header found before this chunk
        # In a real system, you might want to use more sophisticated methods
        return headers[-1] if headers else "Introduction"

    def add_documents(self, directory: str):
        """Add all PDF documents from a directory to the vector store."""
        print(f"📁 Scanning directory: {directory}")
        
        pdf_files = [f for f in os.listdir(directory) if f.endswith(".pdf")]
        if not pdf_files:
            print("⚠️ No PDF files found in the directory!")
            return
            
        print(f"📚 Found {len(pdf_files)} PDF files to process")
        
        for filename in pdf_files:
            file_path = os.path.join(directory, filename)
            chunks = self.process_document(file_path)
            
            # Add chunks to ChromaDB
            print(f"💾 Adding {len(chunks)} chunks to vector store...")
            self.collection.add(
                documents=[chunk["text"] for chunk in chunks],
                metadatas=[chunk["metadata"] for chunk in chunks],
                ids=[f"{filename}_{i}" for i in range(len(chunks))]
            )
            
        print("🎉 All documents processed and added to the knowledge base!")

    def query(self, question: str, n_results: int = 3) -> Tuple[str, List[Dict]]:
        """Query the system and generate an answer."""
        print(f"🔍 Searching for relevant information...")
        
        # Retrieve relevant chunks
        results = self.collection.query(
            query_texts=[question],
            n_results=n_results
        )
        
        print(f"📊 Found {len(results['documents'][0])} relevant chunks")
        
        # Prepare context for the model
        context = "\n\n".join([
            f"From {meta['paper_title']} (Page {meta['page_number']}, {meta['section_title']}):\n{text}"
            for text, meta in zip(results["documents"][0], results["metadatas"][0])
        ])
        
        print("🤖 Generating AI response...")
        
        # Generate answer
        prompt = f"""Based on the following context from research papers, please answer the question.
        If the answer cannot be found in the context, say so.
        
        Context:
        {context}
        
        Question: {question}
        
        Please provide a detailed answer and cite the sources using the paper titles, page numbers, and section titles provided."""
        
        response = self.model.generate_content(prompt)
        
        return response.text, results["metadatas"][0]

def main():
    print("🚀 Starting RAG System...")
    print("=" * 50)
    
    # Initialize RAG system
    rag = RAGSystem()
    
    # Add documents
    print("\n📋 Processing documents...")
    rag.add_documents("DatasetCollecions")
    
    # Interactive query loop
    print("\n" + "=" * 50)
    print("🎯 RAG System Ready! Type 'quit' to exit.")
    print("💡 Ask any question about your research papers!")
    print("=" * 50)
    
    while True:
        try:
            question = input("\n❓ Enter your question: ")
            if question.lower() in ['quit', 'exit', 'q']:
                print("👋 Thank you for using the RAG System!")
                break
            
            if not question.strip():
                print("⚠️ Please enter a valid question.")
                continue
                
            print("\n🔄 Processing your query...")
            answer, sources = rag.query(question)
            
            print("\n" + "=" * 50)
            print("🎯 Answer:")
            print("-" * 50)
            print(answer)
            
            print("\n📚 Sources:")
            print("-" * 50)
            for i, source in enumerate(sources, 1):
                print(f"{i}. 📄 {source['paper_title']} (Page {source['page_number']}, Section: {source['section_title']})")
            print("=" * 50)
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error occurred: {str(e)}")
            print("🔧 Please try again or contact support.")

if __name__ == "__main__":
    main()