# LangGraph Math & Q&A Agent

## Overview

This project implements an intelligent conversational agent that can:
- **Answer general knowledge questions** using Google's Gemini 1.5 Flash LLM.
- **Perform mathematical calculations** (addition, subtraction, multiplication, division) using custom-defined tools.
- **Route queries** between general Q&A and math operations using LangGraph's workflow engine.
- **Provide a professional, shareable web interface** using Gradio.

---

## Features

- **General Q&A**: Handles open-ended questions using Gemini 1.5 Flash.
- **Math Tools**: Four robust tools for addition, subtraction, multiplication, and division (with zero-division protection).
- **LangGraph Workflow**: Orchestrates tool usage and LLM responses.
- **Automatic Testing**: Runs sample queries to verify agent functionality.
- **Gradio UI**: Clean, modern chat interface with public sharing.
- **Error Handling**: Graceful management of tool errors and user input issues.
- **Colab-Ready**: Designed for easy use in Google Colab, including API key management.

---

## Installation & Setup

### 1. Install Required Packages

In your Colab notebook, run:

```python
!pip install -q langgraph
!pip install -q langchain
!pip install -q langchain-google-genai
!pip install -q langchain-community
!pip install -q python-dotenv
!pip install -q gradio
```

### 2. Restart Runtime

**Important:** After installing, go to `Runtime > Restart runtime` in Colab to ensure all packages are loaded.

### 3. Set Up Google API Key

- **Recommended:** Use Colab secrets.
  - Click the 🔑 key icon on the left sidebar.
  - Add a new secret:  
    - Name: `GOOGLE_API_KEY`
    - Value: *your Gemini API key*
- **Alternative:** Enter your API key directly when prompted (less secure).

The notebook will automatically configure the environment variable.

---

## How It Works

### 1. **LLM Initialization**

- Uses `ChatGoogleGenerativeAI` with the Gemini 1.5 Flash model.
- API key is securely loaded from Colab secrets or user input.

### 2. **Tool Definitions**

- Four math tools are defined using the `@tool` decorator:
  - `plus(a, b)`: Addition
  - `subtract(a, b)`: Subtraction
  - `multiply(a, b)`: Multiplication
  - `divide(a, b)`: Division (with zero-division error handling)

### 3. **Agent Creation**

- A system prompt instructs the agent to:
  - Use tools for all math operations.
  - Use LLM knowledge for general questions.
  - Explain calculations and handle errors clearly.
- The agent is created with `create_tool_calling_agent` and wrapped in an `AgentExecutor` for robust execution.

### 4. **LangGraph Workflow**

- Defines a stateful workflow using `StateGraph`.
- The agent node processes user input, maintains chat history, and returns responses.
- The workflow is compiled and ready for invocation.

### 5. **Testing**

- The agent is automatically tested with six sample queries (math and general knowledge).
- Results are printed in the notebook for verification.

### 6. **Gradio Interface**

- A `ChatInterface` class manages chat history and message processing.
- The Gradio UI provides:
  - Markdown instructions and examples.
  - A chat window for conversation.
  - A textbox for user input.
  - A button to clear chat history.
- The interface is launched with a public sharing link.

---

## Usage

1. **Run all cells in order** in the notebook.
2. **Test the agent** using the provided sample queries or your own.
3. **Access the Gradio web UI** via the public link (displayed after launch).
4. **Ask questions** or request math calculations in natural language.

---

## Example Queries

- "What is the capital of France?"
- "What is 15 plus 27?"
- "Calculate 144 divided by 12"
- "Tell me about machine learning"
- "What is 8 times 7?"

---

## Example Output

```
🧪 Testing the agent with sample queries...
🔸 Test 1: What is 5 plus 3?
🔧 Tool called: plus(5.0, 3.0) = 8.0
🤖 Response: The result of 5 plus 3 is 8.

🔸 Test 2: Tell me about artificial intelligence
🤖 Response: Artificial intelligence (AI) is a branch of computer science...
```

---

## Technical Stack

- **Python** (Colab/Jupyter)
- **LangGraph** (workflow orchestration)
- **LangChain** (agent and tool integration)
- **Google Gemini 1.5 Flash** (LLM)
- **Gradio** (web UI)
- **Colab Secrets** (API key management)

---

## Security Notes

- **API Key**: Prefer using Colab secrets for API key management.
- **Public Sharing**: The Gradio interface is shared via a public link; do not share sensitive information in chat.

---

## Troubleshooting

- **Module Import Errors**: Ensure you have restarted the runtime after installing packages.
- **API Key Issues**: Double-check that your API key is valid and correctly set in Colab secrets.
- **Gradio Link Not Working**: Re-run the last cell to relaunch the interface.

---

## Credits

- Built with [LangGraph](https://github.com/langchain-ai/langgraph), [LangChain](https://github.com/langchain-ai/langchain), [Gradio](https://gradio.app/), and [Google Gemini](https://ai.google.dev/).
- Project structure and code by the Agentic AI Workshop.

---

**Enjoy your intelligent Math & Q&A Agent!** 